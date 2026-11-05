"""Deterministic 1536-dimensional L2-normalized semantic embedding service for Playbook Rules."""

import hashlib
import math
import re
import struct
from typing import Final

from src.domain.exceptions import EmbeddingGenerationError
from src.domain.ports.playbook_ports import EmbeddingGeneratorPort

TOKEN_PATTERN: Final[re.Pattern[str]] = re.compile(r"[a-z0-9]{2,}")

STOP_WORDS: Final[frozenset[str]] = frozenset(
    {
        "the",
        "and",
        "for",
        "that",
        "this",
        "with",
        "from",
        "shall",
        "will",
        "may",
        "any",
        "all",
        "under",
        "such",
        "into",
        "upon",
        "have",
        "has",
        "had",
        "are",
        "was",
        "were",
        "been",
        "being",
        "its",
        "their",
        "our",
        "your",
        "which",
        "who",
        "whom",
        "where",
        "when",
        "other",
        "than",
        "then",
        "also",
        "only",
        "each",
        "both",
        "either",
        "neither",
    }
)

# Domain-specific legal/technical concept clusters for high-recall semantic alignment
LEGAL_CONCEPT_CLUSTERS: Final[dict[str, frozenset[str]]] = {
    "cluster_limitation_of_liability": frozenset(
        {
            "liability",
            "liabilities",
            "liable",
            "cap",
            "capped",
            "limit",
            "limitation",
            "aggregate",
            "consequential",
            "indirect",
            "incidental",
            "punitive",
            "special",
            "damages",
            "damage",
            "exceed",
            "exceeding",
            "preceding",
            "twelve",
            "months",
            "fees",
            "paid",
            "payable",
            "uncapped",
            "supercap",
        }
    ),
    "cluster_indemnification": frozenset(
        {
            "indemnify",
            "indemnification",
            "indemnified",
            "indemnifying",
            "indemnity",
            "harmless",
            "defend",
            "defense",
            "claim",
            "claims",
            "third",
            "infringement",
            "alleging",
            "losses",
            "counsel",
        }
    ),
    "cluster_intellectual_property": frozenset(
        {
            "intellectual",
            "property",
            "ip",
            "copyright",
            "patent",
            "trademark",
            "trade",
            "secret",
            "ownership",
            "retain",
            "retained",
            "derivative",
            "works",
            "work",
            "license",
            "licensed",
            "royalty",
            "assign",
            "assignment",
            "background",
            "foreground",
        }
    ),
    "cluster_service_level_agreement": frozenset(
        {
            "sla",
            "uptime",
            "availability",
            "available",
            "downtime",
            "outage",
            "credit",
            "credits",
            "maintenance",
            "scheduled",
            "response",
            "resolution",
            "severity",
            "ninety",
            "percent",
        }
    ),
    "cluster_data_protection_security": frozenset(
        {
            "data",
            "privacy",
            "personal",
            "gdpr",
            "ccpa",
            "hipaa",
            "security",
            "cybersecurity",
            "encryption",
            "encrypted",
            "breach",
            "incident",
            "unauthorized",
            "soc",
            "iso",
            "subprocessor",
            "processing",
        }
    ),
    "cluster_governing_law_disputes": frozenset(
        {
            "governing",
            "law",
            "laws",
            "jurisdiction",
            "venue",
            "courts",
            "court",
            "arbitration",
            "dispute",
            "disputes",
            "delaware",
            "york",
            "california",
            "statute",
            "tribunal",
        }
    ),
    "cluster_termination_renewal": frozenset(
        {
            "termination",
            "terminate",
            "convenience",
            "cause",
            "cure",
            "renewal",
            "renew",
            "auto",
            "notice",
            "wind",
            "transition",
            "expiration",
        }
    ),
}


def stem_legal_token(token: str) -> str:
    """Normalize a legal/technical token to its canonical morphological stem."""
    word = token.lower()
    if len(word) <= 4:
        return word
    for suffix, replacement in (
        ("ifications", "y"),
        ("ification", "y"),
        ("abilities", "able"),
        ("ability", "able"),
        ("lements", "le"),
        ("lement", "le"),
        ("ations", "ate"),
        ("ation", "ate"),
        ("ments", "ment"),
        ("ities", "ity"),
        ("ying", "y"),
        ("ied", "y"),
        ("ies", "y"),
        ("ing", ""),
        ("ed", ""),
        ("es", ""),
        ("s", ""),
    ):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)] + replacement
    return word


def tokenize_legal_text(text: str) -> list[str]:
    """Extract normalized non-stopword tokens from legal or technical prose."""
    raw_tokens = TOKEN_PATTERN.findall(text.lower())
    return [tok for tok in raw_tokens if tok not in STOP_WORDS]


def format_playbook_rule_for_embedding(
    category: str,
    standard_position: str,
    fallback_position: str,
    unacceptable_triggers: str,
) -> str:
    """Construct the canonical weighted text representation of a PlaybookRule for embedding."""
    clean_category = category.strip()
    return (
        f"Category: {clean_category}. {clean_category}. "
        f"Standard Position: {standard_position.strip()}. "
        f"Fallback Position: {fallback_position.strip()}. "
        f"Unacceptable Triggers: {unacceptable_triggers.strip()}."
    )


class DeterministicHashEmbeddingAdapter(EmbeddingGeneratorPort):
    """High-speed deterministic 1536-dimensional L2-normalized semantic feature-hashing embedder."""

    def __init__(self, dimension: int = 1536) -> None:
        if dimension <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    def _project_feature(self, vector: list[float], feature: str, weight: float) -> None:
        """Hash `feature` into two independent signed dimensions to minimize collisions."""
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=16).digest()
        h1, h2 = struct.unpack("<QQ", digest)

        idx1 = h1 % self._dimension
        sign1 = 1.0 if (h1 >> 63) == 0 else -1.0
        vector[idx1] += sign1 * weight

        idx2 = h2 % self._dimension
        sign2 = 1.0 if (h2 >> 63) == 0 else -1.0
        vector[idx2] += sign2 * (weight * 0.5)

    def _compute_normalized_embedding(self, text: str) -> list[float]:
        cleaned = text.strip()
        if not cleaned:
            raise EmbeddingGenerationError("Cannot generate embedding for empty or blank text.")

        tokens = tokenize_legal_text(cleaned)
        if not tokens:
            tokens = TOKEN_PATTERN.findall(cleaned.lower())
        if not tokens:
            raise EmbeddingGenerationError(
                "Input text contains no indexable alphanumeric tokens."
            )

        vector = [0.0] * self._dimension
        stems = [stem_legal_token(t) for t in tokens]

        # 1. Project unigrams, morphological stems, and 4-char prefixes
        for tok, stem in zip(tokens, stems, strict=True):
            self._project_feature(vector, f"tok:{tok}", 1.5)
            self._project_feature(vector, f"stem:{stem}", 2.0)
            if len(stem) >= 4:
                self._project_feature(vector, f"pre:{stem[:4]}", 0.75)

        # 2. Project adjacent stem bigrams
        for i in range(len(stems) - 1):
            bigram = f"bi:{stems[i]}_{stems[i + 1]}"
            self._project_feature(vector, bigram, 1.25)

        # 3. Project legal/technical domain concept cluster activations
        token_set = set(tokens) | set(stems)
        for cluster_name, cluster_vocab in LEGAL_CONCEPT_CLUSTERS.items():
            matched_terms = token_set & cluster_vocab
            if matched_terms:
                cluster_weight = 3.5 * math.log1p(len(matched_terms))
                self._project_feature(vector, f"domain:{cluster_name}", cluster_weight)
                for sub_idx in range(4):
                    self._project_feature(
                        vector,
                        f"domain:{cluster_name}:{sub_idx}",
                        cluster_weight * 0.8,
                    )

        # 4. L2-normalize to unit length (||v||_2 == 1.0)
        squared_norm = sum(val * val for val in vector)
        norm = math.sqrt(squared_norm)
        if norm == 0.0:
            raise EmbeddingGenerationError("Generated zero-magnitude embedding vector.")

        return [val / norm for val in vector]

    async def embed_text(self, text: str) -> list[float]:
        """Generate a 1536-dimensional L2-normalized embedding vector for `text`."""
        return self._compute_normalized_embedding(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate 1536-dimensional L2-normalized embedding vectors for a batch of texts."""
        if not texts:
            return []
        return [self._compute_normalized_embedding(t) for t in texts]


__all__ = [
    "DeterministicHashEmbeddingAdapter",
    "LEGAL_CONCEPT_CLUSTERS",
    "format_playbook_rule_for_embedding",
    "stem_legal_token",
    "tokenize_legal_text",
]
