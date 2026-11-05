"""Hybrid Playbook Retriever combining 1536-d dense vector similarity with BM25 lexical scoring."""

import math

from src.domain.entities import PlaybookRule
from src.domain.entities.playbook_search import MatchedPlaybookRule, PlaybookSearchQuery
from src.domain.ports.playbook_ports import (
    EmbeddingGeneratorPort,
    PlaybookRepositoryPort,
    PlaybookRetrieverPort,
)
from src.infrastructure.vector.embedding_service import (
    format_playbook_rule_for_embedding,
    stem_legal_token,
    tokenize_legal_text,
)


def compute_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two equal-length vectors, scaled into [0.0, 1.0]."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b, strict=True))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    raw_cosine = dot_product / (norm_a * norm_b)
    return max(0.0, min(1.0, raw_cosine))


class HybridPlaybookRetriever(PlaybookRetrieverPort):
    """Retrieve and rank company PlaybookRules using weighted dense vector + BM25 hybrid search."""

    def __init__(
        self,
        repository: PlaybookRepositoryPort,
        embedding_generator: EmbeddingGeneratorPort,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3,
    ) -> None:
        self._repository = repository
        self._embedding_generator = embedding_generator
        self._vector_weight = vector_weight
        self._keyword_weight = keyword_weight

    @staticmethod
    def _extract_stemmed_tokens(text: str) -> list[str]:
        tokens = tokenize_legal_text(text)
        return [stem_legal_token(t) for t in tokens]

    @classmethod
    def _compute_bm25_scores(
        cls,
        query_text: str,
        rules: list[PlaybookRule],
        k1: float = 1.5,
        b: float = 0.75,
    ) -> list[float]:
        """Compute normalized BM25 + lexical overlap scores in [0.0, 1.0] across candidate rules."""
        if not rules:
            return []

        query_stems = cls._extract_stemmed_tokens(query_text)
        if not query_stems:
            return [0.0] * len(rules)

        query_stem_set = set(query_stems)
        corpus_docs: list[list[str]] = []
        doc_freqs: dict[str, int] = dict.fromkeys(query_stem_set, 0)

        for rule in rules:
            canonical_text = format_playbook_rule_for_embedding(
                category=rule.category,
                standard_position=rule.standard_position,
                fallback_position=rule.fallback_position,
                unacceptable_triggers=rule.unacceptable_triggers,
            )
            doc_stems = cls._extract_stemmed_tokens(canonical_text)
            corpus_docs.append(doc_stems)
            unique_doc_stems = set(doc_stems)
            for q_stem in query_stem_set:
                if q_stem in unique_doc_stems:
                    doc_freqs[q_stem] += 1

        num_docs = len(corpus_docs)
        avg_dl = sum(len(doc) for doc in corpus_docs) / max(1, num_docs)

        raw_bm25_scores: list[float] = []
        overlap_ratios: list[float] = []

        for doc_stems in corpus_docs:
            if not doc_stems:
                raw_bm25_scores.append(0.0)
                overlap_ratios.append(0.0)
                continue

            doc_len = len(doc_stems)
            term_counts: dict[str, int] = {}
            for s in doc_stems:
                term_counts[s] = term_counts.get(s, 0) + 1

            score = 0.0
            matched_query_terms = 0
            for q_stem in query_stem_set:
                tf = term_counts.get(q_stem, 0)
                if tf == 0:
                    continue
                matched_query_terms += 1
                df = doc_freqs.get(q_stem, 0)
                idf = math.log(1.0 + (num_docs - df + 0.5) / (df + 0.5))
                denom = tf + k1 * (1.0 - b + b * (doc_len / max(1.0, avg_dl)))
                score += idf * ((tf * (k1 + 1.0)) / denom)

            raw_bm25_scores.append(score)
            overlap_ratios.append(matched_query_terms / len(query_stem_set))

        max_bm25 = max(raw_bm25_scores, default=0.0)
        normalized_scores: list[float] = []
        for bm25_val, overlap_val in zip(raw_bm25_scores, overlap_ratios, strict=True):
            norm_bm25 = (bm25_val / max_bm25) if max_bm25 > 0.0 else 0.0
            blended_lexical = (0.65 * norm_bm25) + (0.35 * overlap_val)
            normalized_scores.append(max(0.0, min(1.0, blended_lexical)))

        return normalized_scores

    async def retrieve_top_rules(
        self,
        query: PlaybookSearchQuery,
    ) -> list[MatchedPlaybookRule]:
        """Execute hybrid dense vector + BM25 retrieval scoped strictly to `query.org_id`."""
        candidates = await self._repository.list_candidates_for_retrieval(
            org_id=query.org_id,
            category=query.category,
        )
        if not candidates:
            return []

        query_embedding = await self._embedding_generator.embed_text(query.query_text)
        keyword_scores = self._compute_bm25_scores(query.query_text, candidates)

        matches: list[MatchedPlaybookRule] = []
        for rule, kw_score in zip(candidates, keyword_scores, strict=True):
            vec_score = compute_cosine_similarity(query_embedding, rule.embedding)
            combined = (self._vector_weight * vec_score) + (self._keyword_weight * kw_score)
            matches.append(
                MatchedPlaybookRule(
                    rule=rule,
                    combined_score=round(combined, 6),
                    vector_score=round(vec_score, 6),
                    keyword_score=round(kw_score, 6),
                )
            )

        matches.sort(
            key=lambda item: (item.combined_score, item.vector_score, item.keyword_score),
            reverse=True,
        )
        return matches[: query.top_k]

    async def retrieve_relevant_rules(
        self,
        query: PlaybookSearchQuery,
    ) -> list[MatchedPlaybookRule]:
        """Alias for `retrieve_top_rules`."""
        return await self.retrieve_top_rules(query)


__all__ = [
    "HybridPlaybookRetriever",
    "compute_cosine_similarity",
]
