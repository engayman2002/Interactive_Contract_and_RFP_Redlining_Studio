"""Unit tests for Phase 3 1536-d Embedding Engine and Hybrid Playbook Retriever."""

import math
import time
from uuid import UUID, uuid4

import pytest
from src.domain.entities import PlaybookRule, PlaybookSearchQuery
from src.domain.exceptions import EmbeddingGenerationError, InvalidPlaybookRuleError
from src.infrastructure.vector import (
    DeterministicHashEmbeddingAdapter,
    HybridPlaybookRetriever,
    compute_cosine_similarity,
    format_playbook_rule_for_embedding,
)


class InMemoryPlaybookRepository:
    """In-memory `PlaybookRepositoryPort` test double strictly enforcing `org_id` isolation."""

    def __init__(self, rules: list[PlaybookRule] | None = None) -> None:
        self._rules: dict[UUID, PlaybookRule] = {r.id: r for r in (rules or [])}

    async def create(
        self,
        rule: PlaybookRule,
        org_id: UUID | None = None,
    ) -> PlaybookRule:
        _ = org_id
        self._rules[rule.id] = rule
        return rule

    async def get_by_id(self, org_id: UUID, rule_id: UUID) -> PlaybookRule | None:
        rule = self._rules.get(rule_id)
        if rule is None or rule.org_id != org_id:
            return None
        return rule

    async def list_by_org(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        results = [r for r in self._rules.values() if r.org_id == org_id]
        if category is not None and category.strip():
            cat_lower = category.strip().lower()
            results = [r for r in results if r.category.lower() == cat_lower]
        return results

    async def update(self, org_id: UUID, rule: PlaybookRule) -> PlaybookRule:
        _ = org_id
        self._rules[rule.id] = rule
        return rule

    async def delete(self, org_id: UUID, rule_id: UUID) -> bool:
        existing = await self.get_by_id(org_id=org_id, rule_id=rule_id)
        if existing is None:
            return False
        del self._rules[rule_id]
        return True

    async def list_candidates_for_retrieval(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        return await self.list_by_org(org_id=org_id, category=category)


async def test_embedding_generator_produces_1536_dim_unit_vector() -> None:
    """Verify `embed_text` outputs a 1536-d L2-normalized vector and captures legal semantics."""
    adapter = DeterministicHashEmbeddingAdapter(dimension=1536)

    vec_lol_1 = await adapter.embed_text(
        "Limitation of Liability cap at 12 months fees and consequential damages waiver"
    )
    vec_lol_2 = await adapter.embed_text(
        "Liability cap limited to annual contract value excluding indirect damages"
    )
    vec_gdpr = await adapter.embed_text(
        "Data residency in EU Frankfurt servers under GDPR processor subprocessor rules"
    )

    assert len(vec_lol_1) == 1536
    assert len(vec_lol_2) == 1536
    assert len(vec_gdpr) == 1536

    l2_norm = math.sqrt(sum(v * v for v in vec_lol_1))
    assert math.isclose(l2_norm, 1.0, rel_tol=1e-5)

    sim_related = compute_cosine_similarity(vec_lol_1, vec_lol_2)
    sim_unrelated = compute_cosine_similarity(vec_lol_1, vec_gdpr)
    assert sim_related > sim_unrelated

    batch_vectors = await adapter.embed_batch(["First clause", "Second clause"])
    assert len(batch_vectors) == 2
    assert all(len(v) == 1536 for v in batch_vectors)


async def test_embedding_generator_rejects_empty_text() -> None:
    """Verify blank or whitespace-only text raises `EmbeddingGenerationError`."""
    adapter = DeterministicHashEmbeddingAdapter(dimension=1536)

    with pytest.raises(EmbeddingGenerationError):
        await adapter.embed_text("")

    with pytest.raises(EmbeddingGenerationError):
        await adapter.embed_text("   \n\t  ")


async def test_hybrid_retriever_ranks_limitation_of_liability_top_1_under_150ms() -> None:
    """Phase 3 Acceptance: Querying with a sample LoL clause ranks LoL rule #1 in < 150ms."""
    org_id = uuid4()
    adapter = DeterministicHashEmbeddingAdapter(dimension=1536)

    raw_policies = [
        (
            "Limitation of Liability",
            (
                "Mutual aggregate liability cap equal to 12 months of fees paid or payable; "
                "mutual waiver of consequential, indirect, and punitive damages."
            ),
            "Super-cap of 24 months of fees for confidentiality or data protection breaches.",
            "Uncapped liability for Customer or asymmetric vendor cap below $10,000.",
        ),
        (
            "Indemnification",
            (
                "Vendor shall defend, indemnify, and hold harmless Customer against third-party "
                "intellectual property infringement claims."
            ),
            "Mutual indemnification for bodily injury, death, and tangible property damage.",
            (
                "One-sided indemnification obligating Customer to indemnify Vendor for "
                "Vendor's own negligence."
            ),
        ),
        (
            "Data Privacy & GDPR",
            (
                "All customer personal data must be encrypted at rest (AES-256) and in transit "
                "(TLS 1.3) and hosted within EU data centers."
            ),
            "Standard Contractual Clauses (SCCs) with 72-hour breach notification.",
            "Unrestricted right to sell or train public AI models on Customer confidential data.",
        ),
        (
            "Governing Law",
            (
                "Agreement shall be governed by the laws of the State of Delaware, with "
                "exclusive jurisdiction in Wilmington courts."
            ),
            "New York governing law and AAA commercial arbitration in New York City.",
            (
                "Foreign jurisdiction outside the United States or mandatory jury trial waiver "
                "without mutual consent."
            ),
        ),
        (
            "Payment Terms",
            (
                "Net 45 days from receipt of undisputed invoice; no late interest exceeding "
                "1% per month."
            ),
            "Net 30 days from receipt of undisputed invoice.",
            (
                "Upfront annual payment without termination refund or automatic 5% monthly "
                "compound penalty."
            ),
        ),
    ]

    seeded_rules: list[PlaybookRule] = []
    for category, std_pos, fallback_pos, triggers in raw_policies:
        canonical = format_playbook_rule_for_embedding(
            category=category,
            standard_position=std_pos,
            fallback_position=fallback_pos,
            unacceptable_triggers=triggers,
        )
        emb = await adapter.embed_text(canonical)
        seeded_rules.append(
            PlaybookRule(
                org_id=org_id,
                category=category,
                standard_position=std_pos,
                fallback_position=fallback_pos,
                unacceptable_triggers=triggers,
                embedding=emb,
            )
        )

    repo = InMemoryPlaybookRepository(seeded_rules)
    retriever = HybridPlaybookRetriever(
        repository=repo,
        embedding_generator=adapter,
        vector_weight=0.7,
        keyword_weight=0.3,
    )

    sample_clause = (
        "In no event shall Vendor's aggregate liability exceed $500, and Customer "
        "shall have uncapped liability for all consequential damages."
    )
    query = PlaybookSearchQuery(
        org_id=org_id,
        query_text=sample_clause,
        top_k=3,
    )

    started = time.perf_counter()
    results = await retriever.retrieve_top_rules(query)
    elapsed_ms = (time.perf_counter() - started) * 1000.0

    assert len(results) == 3
    assert results[0].rule.category == "Limitation of Liability"
    assert results[0].combined_score > results[1].combined_score
    assert results[0].vector_score > 0.0
    assert results[0].keyword_score > 0.0
    assert elapsed_ms < 150.0, f"Expected retrieval < 150ms, took {elapsed_ms:.2f}ms"


async def test_hybrid_retriever_category_filter() -> None:
    """Verify passing `category='Data Privacy & GDPR'` filters strictly to that category."""
    org_id = uuid4()
    adapter = DeterministicHashEmbeddingAdapter(dimension=1536)

    lol_rule = PlaybookRule(
        org_id=org_id,
        category="Limitation of Liability",
        standard_position="Liability cap at 12 months fees.",
        fallback_position="24 months fees cap.",
        unacceptable_triggers="Uncapped liability.",
        embedding=await adapter.embed_text("Limitation of Liability cap at 12 months fees"),
    )
    gdpr_rule = PlaybookRule(
        org_id=org_id,
        category="Data Privacy & GDPR",
        standard_position="EU data residency in Frankfurt and GDPR compliance.",
        fallback_position="Standard Contractual Clauses.",
        unacceptable_triggers="Selling customer personal data.",
        embedding=await adapter.embed_text("Data Privacy & GDPR EU data residency"),
    )

    repo = InMemoryPlaybookRepository([lol_rule, gdpr_rule])
    retriever = HybridPlaybookRetriever(repository=repo, embedding_generator=adapter)

    query = PlaybookSearchQuery(
        org_id=org_id,
        query_text="Uncapped liability and damages cap",
        category="Data Privacy & GDPR",
        top_k=3,
    )
    results = await retriever.retrieve_top_rules(query)

    assert len(results) == 1
    assert results[0].rule.id == gdpr_rule.id
    assert results[0].rule.category == "Data Privacy & GDPR"


def test_playbook_domain_entities_validation() -> None:
    """Verify `PlaybookRule` and `PlaybookSearchQuery` enforce domain invariants."""
    org_id = uuid4()

    with pytest.raises(InvalidPlaybookRuleError):
        PlaybookRule(
            org_id=org_id,
            category="   ",
            standard_position="Valid",
            fallback_position="Valid",
            unacceptable_triggers="Valid",
        )

    with pytest.raises(InvalidPlaybookRuleError):
        PlaybookRule(
            org_id=org_id,
            category="Liability",
            standard_position="Valid",
            fallback_position="Valid",
            unacceptable_triggers="Valid",
            embedding=[0.1, 0.2],  # Wrong dimension (expected 1536)
        )

    with pytest.raises(InvalidPlaybookRuleError):
        PlaybookSearchQuery(org_id=org_id, query_text="   ", top_k=3)

    with pytest.raises(InvalidPlaybookRuleError):
        PlaybookSearchQuery(org_id=org_id, query_text="Valid query", top_k=0)
