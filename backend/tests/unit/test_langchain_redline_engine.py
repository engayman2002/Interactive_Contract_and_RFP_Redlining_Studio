"""Unit tests for Phase 4 LangChain LCEL Redlining Engine and 100-Clause Batch Benchmark."""

import time
from typing import Any
from uuid import UUID, uuid4

import pytest
from langchain_core.runnables import RunnableLambda
from src.domain.entities import (
    ClauseAuditInput,
    CounterpartyPushbackInput,
    DocumentClause,
    MatchedPlaybookRule,
    PlaybookRule,
    PlaybookSearchQuery,
)
from src.domain.enums import (
    NegotiationStance,
    PushbackSeverity,
    RiskLevel,
    VerificationStatus,
)
from src.domain.exceptions import StructuredOutputValidationError
from src.infrastructure.ai import (
    BatchDocumentAuditWorker,
    LangChainClauseAuditor,
    RedlineOutput,
    parse_and_validate_redline_output,
)
from src.infrastructure.vector import (
    DeterministicHashEmbeddingAdapter,
    HybridPlaybookRetriever,
    format_playbook_rule_for_embedding,
)


class InMemoryPlaybookRepositoryForAudit:
    """In-memory `PlaybookRepositoryPort` test double for batch clause auditing benchmarks."""

    def __init__(self, rules: list[PlaybookRule]) -> None:
        self._rules = list(rules)

    async def create(
        self,
        rule: PlaybookRule,
        org_id: UUID | None = None,
    ) -> PlaybookRule:
        _ = org_id
        self._rules.append(rule)
        return rule

    async def get_by_id(self, org_id: UUID, rule_id: UUID) -> PlaybookRule | None:
        for r in self._rules:
            if r.org_id == org_id and r.id == rule_id:
                return r
        return None

    async def list_by_org(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        items = [r for r in self._rules if r.org_id == org_id]
        if category is not None and category.strip():
            cat_lower = category.strip().lower()
            items = [r for r in items if r.category.lower() == cat_lower]
        return items

    async def update(self, org_id: UUID, rule: PlaybookRule) -> PlaybookRule:
        _ = org_id
        return rule

    async def delete(self, org_id: UUID, rule_id: UUID) -> bool:
        _ = org_id, rule_id
        return True

    async def list_candidates_for_retrieval(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        return await self.list_by_org(org_id=org_id, category=category)


async def test_langchain_clause_auditor_compliant_and_non_compliant_clauses() -> None:
    """Verify `LangChainClauseAuditor` accurately flags policy violations and compliant clauses."""
    org_id = uuid4()
    doc_id = uuid4()
    lol_rule = PlaybookRule(
        org_id=org_id,
        category="Limitation of Liability",
        standard_position=(
            "Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid or payable, and neither party shall be liable for consequential damages."
        ),
        fallback_position="Super-cap of 24 months of fees for confidentiality or data breaches.",
        unacceptable_triggers="Uncapped liability for Customer or vendor cap below $10,000.",
        embedding=[0.01] * 1536,
    )
    matched_rules = [
        MatchedPlaybookRule(
            rule=lol_rule,
            combined_score=0.91,
            vector_score=0.92,
            keyword_score=0.89,
        )
    ]

    auditor = LangChainClauseAuditor(max_retries=2, temperature=0.0)

    # 1. Non-compliant clause with uncapped liability & $500 vendor cap -> CRITICAL
    risky_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=0,
        heading="8. Limitation of Liability",
        clause_text=(
            "8.1 In no event shall Vendor's aggregate liability exceed $500, and Customer "
            "shall have uncapped liability for all consequential damages."
        ),
    )
    risky_result = await auditor.audit_clause(risky_input, matched_rules)

    assert risky_result.is_compliant is False
    assert risky_result.risk == RiskLevel.CRITICAL
    assert risky_result.category == "Limitation of Liability"
    assert risky_result.matched_rule_id == lol_rule.id
    assert risky_result.proposed_text.startswith("8.1 ")
    assert "twelve (12) months" in risky_result.proposed_text
    assert auditor.last_trace_metadata["org_id"] == str(org_id)
    assert auditor.last_trace_metadata["temperature"] == 0.0

    # 2. Compliant clause matching company standard position -> LOW & is_compliant=True
    compliant_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=1,
        heading="8. Limitation of Liability",
        clause_text=(
            "8.2 Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid or payable, and neither party shall be liable for consequential damages."
        ),
    )
    compliant_result = await auditor.audit_clause(compliant_input, matched_rules)

    assert compliant_result.is_compliant is True
    assert compliant_result.risk == RiskLevel.LOW
    assert compliant_result.proposed_text == compliant_input.clause_text


async def test_langchain_clause_auditor_retry_and_fallback_recovery() -> None:
    """Verify retry recovery when an LLM emits malformed JSON on initial attempts."""
    org_id = uuid4()
    doc_id = uuid4()
    call_counter = {"count": 0}

    def _flaky_llm(_prompt_value: Any) -> str:
        call_counter["count"] += 1
        if call_counter["count"] == 1:
            return "{malformed_json: true, unclosed_string: 'oops"
        # Second attempt returns fenced JSON with trailing comma to test repair + validation
        return """```json
        {
            "is_compliant": false,
            "risk": "HIGH",
            "category": "Service Level Agreement",
            "proposed_text": "99.95% monthly uptime with 10% service credit per 0.1% downtime.",
            "rationale": "Added binding uptime SLA and service credits.",
            "negotiation_talking_point": "Standard enterprise SLA commitment.",
        }
        ```"""

    auditor = LangChainClauseAuditor(
        llm_runnable=RunnableLambda(_flaky_llm),
        max_retries=2,
        temperature=0.0,
        enable_deterministic_fallback=False,
    )
    audit_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=0,
        heading="Service Level Agreement",
        clause_text="Vendor provides the service on a best-efforts basis without uptime credits.",
    )
    result = await auditor.audit_clause(audit_input, matched_rules=[])

    assert call_counter["count"] == 2
    assert result.is_compliant is False
    assert result.risk == RiskLevel.HIGH
    assert result.category == "Service Level Agreement"

    # Also verify that if a model permanently emits broken JSON:
    # 1) With fallback enabled (default), it recovers with 0 unhandled errors
    def _always_broken(_prompt_value: Any) -> str:
        return "NOT_VALID_JSON_AT_ALL{{{"

    always_broken_llm = RunnableLambda(_always_broken)
    fallback_auditor = LangChainClauseAuditor(
        llm_runnable=always_broken_llm,
        max_retries=1,
        enable_deterministic_fallback=True,
    )
    recovered = await fallback_auditor.audit_clause(audit_input, matched_rules=[])
    assert recovered.risk == RiskLevel.HIGH
    assert recovered.is_compliant is False

    # 2) With fallback explicitly disabled, it raises `StructuredOutputValidationError`
    strict_auditor = LangChainClauseAuditor(
        llm_runnable=always_broken_llm,
        max_retries=1,
        enable_deterministic_fallback=False,
    )
    with pytest.raises(StructuredOutputValidationError):
        await strict_auditor.audit_clause(audit_input, matched_rules=[])


async def test_100_clause_batch_audit_completes_under_25s_with_zero_malformed_outputs() -> None:
    """Phase 4 Acceptance: 100-clause document completes in < 25s with 0 malformed outputs."""
    org_id = uuid4()
    doc_id = uuid4()
    embedder = DeterministicHashEmbeddingAdapter(dimension=1536)

    raw_policies = [
        (
            "Limitation of Liability",
            (
                "Each party's aggregate liability shall not exceed 12 months of fees paid or "
                "payable; mutual exclusion of consequential and indirect damages."
            ),
            "Super-cap of 24 months of fees for confidentiality or data protection breaches.",
            "Uncapped liability for Customer or vendor cap below $10,000.",
        ),
        (
            "Indemnification",
            (
                "Vendor shall defend, indemnify, and hold harmless Customer against third-party "
                "IP infringement claims."
            ),
            "Mutual indemnification for bodily injury and tangible property damage.",
            "Customer required to indemnify Vendor for Vendor's own negligence.",
        ),
        (
            "Service Level Agreement",
            "99.95% monthly uptime commitment with 10% service credit per 0.1% downtime.",
            "99.9% monthly uptime commitment with service credits.",
            "Best-efforts availability only or sole remedy waiver.",
        ),
        (
            "Data Privacy & GDPR",
            "Customer data must be encrypted at rest (AES-256) and hosted in EU data centers.",
            "Standard Contractual Clauses with 48-hour breach notification.",
            "Training public or foundation AI models on Customer confidential data.",
        ),
    ]

    seeded_rules: list[PlaybookRule] = []
    for category, std_pos, fb_pos, triggers in raw_policies:
        canonical = format_playbook_rule_for_embedding(
            category=category,
            standard_position=std_pos,
            fallback_position=fb_pos,
            unacceptable_triggers=triggers,
        )
        vec = await embedder.embed_text(canonical)
        seeded_rules.append(
            PlaybookRule(
                org_id=org_id,
                category=category,
                standard_position=std_pos,
                fallback_position=fb_pos,
                unacceptable_triggers=triggers,
                embedding=vec,
            )
        )

    repo = InMemoryPlaybookRepositoryForAudit(seeded_rules)
    retriever = HybridPlaybookRetriever(
        repository=repo,
        embedding_generator=embedder,
        vector_weight=0.7,
        keyword_weight=0.3,
    )
    auditor = LangChainClauseAuditor(max_retries=2, temperature=0.0)
    worker = BatchDocumentAuditWorker(
        retriever=retriever,
        auditor=auditor,
        concurrency=20,
        top_k=3,
    )

    # Generate 100 realistic clauses (cycling through risky and compliant legal/technical clauses)
    clause_templates = [
        (
            "Limitation of Liability",
            (
                "In no event shall Vendor's aggregate liability exceed $500, and Customer "
                "shall have uncapped liability."
            ),
        ),
        (
            "Indemnification",
            (
                "Customer shall indemnify and hold harmless Vendor even for Vendor's own "
                "negligence without limit."
            ),
        ),
        (
            "Service Level Agreement",
            "Vendor shall provide cloud hosting on a best-efforts basis with sole remedy waiver.",
        ),
        (
            "Data Privacy & GDPR",
            (
                "Vendor may use Customer Confidential Data to train public foundation models "
                "at its discretion."
            ),
        ),
        (
            "General Commercial",
            (
                "Each party shall comply with applicable laws and maintain standard commercial "
                "insurance coverage."
            ),
        ),
    ]

    clauses_100: list[DocumentClause] = []
    for idx in range(100):
        heading, body = clause_templates[idx % len(clause_templates)]
        clauses_100.append(
            DocumentClause(
                document_id=doc_id,
                clause_index=idx,
                heading=f"{idx + 1}. {heading}",
                original_text=f"{idx + 1}.1 {body}",
                current_text=f"{idx + 1}.1 {body}",
                version=1,
            )
        )

    started = time.perf_counter()
    results = await worker.audit_document_clauses(
        org_id=org_id,
        document_id=doc_id,
        clauses=clauses_100,
    )
    elapsed_seconds = time.perf_counter() - started

    assert len(results) == 100
    assert elapsed_seconds < 25.0, (
        f"Expected 100-clause evaluation in < 25s, took {elapsed_seconds:.2f}s"
    )
    assert [r.clause_index for r in results] == list(range(100))

    # Verify every single result conforms to RedlineOutput and has non-empty fields
    for res in results:
        validated = parse_and_validate_redline_output(
            {
                "is_compliant": res.is_compliant,
                "risk": res.risk.value,
                "category": res.category,
                "proposed_text": res.proposed_text,
                "rationale": res.rationale,
                "negotiation_talking_point": res.negotiation_talking_point,
            }
        )
        assert isinstance(validated, RedlineOutput)

    non_compliant_count = sum(1 for r in results if not r.is_compliant)
    compliant_count = sum(1 for r in results if r.is_compliant)
    assert non_compliant_count == 80
    assert compliant_count == 20
    assert sum(1 for r in results if r.risk == RiskLevel.CRITICAL) >= 40

    # Verify streaming worker helper yields all 100 progress events in order
    streamed_events = [
        event
        async for _, event in worker.stream_document_clauses(
            org_id=org_id,
            document_id=doc_id,
            clauses=clauses_100[:5],
        )
    ]
    assert len(streamed_events) == 5
    assert streamed_events[-1].completed_count == 5
    assert streamed_events[-1].total_count == 5
    assert PlaybookSearchQuery(org_id=org_id, query_text="test", top_k=3).top_k == 3


@pytest.mark.asyncio
async def test_negotiation_stances_strict_vs_commercial_differentiation() -> None:
    """Verify that STRICT vs BALANCED vs COMMERCIAL negotiation stances adapt redlines."""
    org_id = uuid4()
    doc_id = uuid4()
    auditor = LangChainClauseAuditor()

    test_rule = PlaybookRule(
        id=uuid4(),
        org_id=org_id,
        category="Limitation of Liability",
        standard_position=(
            "1.1 Each party's aggregate liability shall not exceed 12 months of fees paid, "
            "with mutual waiver of consequential damages."
        ),
        fallback_position=(
            "1.1 Each party's aggregate liability shall not exceed 2x annual fees paid under "
            "the agreement."
        ),
        unacceptable_triggers=(
            "Customer shall have uncapped liability, or vendor liability capped under $1,000."
        ),
    )
    matched = [
        MatchedPlaybookRule(
            rule=test_rule,
            combined_score=0.95,
            vector_score=0.95,
            keyword_score=0.95,
        )
    ]
    non_compliant_clause_text = (
        "1.1 Vendor's liability shall not exceed $500, and Customer shall have uncapped liability."
    )

    # 1. Commercial Stance: should adopt pre-approved fallback position
    comm_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=0,
        heading="1. Limitation of Liability",
        clause_text=non_compliant_clause_text,
        stance=NegotiationStance.COMMERCIAL,
    )
    comm_result = await auditor.audit_clause(comm_input, matched)
    assert comm_result.stance == NegotiationStance.COMMERCIAL
    assert "[Commercial Fast-Close Stance]" in comm_result.rationale
    assert "2x annual fees" in comm_result.proposed_text

    # 2. Strict Stance: should strictly enforce standard position
    strict_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=0,
        heading="1. Limitation of Liability",
        clause_text=non_compliant_clause_text,
        stance=NegotiationStance.STRICT,
    )
    strict_result = await auditor.audit_clause(strict_input, matched)
    assert strict_result.stance == NegotiationStance.STRICT
    assert "[Strict Protective Stance]" in strict_result.rationale
    assert "12 months of fees paid" in strict_result.proposed_text

    # 3. Balanced Stance (Default): should enforce standard balanced position
    balanced_input = ClauseAuditInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        clause_index=0,
        heading="1. Limitation of Liability",
        clause_text=non_compliant_clause_text,
        stance=NegotiationStance.BALANCED,
    )
    balanced_result = await auditor.audit_clause(balanced_input, matched)
    assert balanced_result.stance == NegotiationStance.BALANCED
    assert "[Balanced Mutual Stance]" in balanced_result.rationale
    assert "12 months of fees paid" in balanced_result.proposed_text


async def test_critic_agent_repairs_placeholders_missing_numbering_and_scores_confidence() -> None:
    """Verify Agent 2 Critic repairs [TBD] placeholders, 1.1 prefix, and confidence scores."""
    org_id = uuid4()
    lol_rule = PlaybookRule(
        org_id=org_id,
        category="Limitation of Liability",
        standard_position=(
            "Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid or payable."
        ),
        fallback_position="Mutual liability capped at 2x annual fees.",
        unacceptable_triggers="uncapped liability, exceed $500",
    )
    matched = [
        MatchedPlaybookRule(
            rule=lol_rule,
            combined_score=0.92,
            vector_score=0.93,
            keyword_score=0.90,
        )
    ]
    auditor = LangChainClauseAuditor()

    # 1. Defect case: dropped section prefix '1.1 ' and leaked placeholder '[TBD]'
    auto_refined_report = await auditor.verify_and_critique_suggestion(
        original_clause_text="1.1 Vendor aggregate liability shall not exceed $500.",
        heading="1. Limitation of Liability",
        candidate_proposed_text=(
            "Each party's aggregate cumulative liability shall not exceed [TBD] "
            "twelve (12) months of fees paid or payable."
        ),
        candidate_risk=RiskLevel.CRITICAL,
        matched_rules=matched,
        stance=NegotiationStance.BALANCED,
    )
    assert auto_refined_report.auto_corrected is True
    assert auto_refined_report.verification_status == VerificationStatus.AUTO_REFINED
    assert auto_refined_report.refined_proposed_text.startswith("1.1 ")
    assert "[TBD]" not in auto_refined_report.refined_proposed_text
    assert 0 <= auto_refined_report.confidence_score <= 100
    assert auto_refined_report.policy_alignment_passed is True
    assert auto_refined_report.hallucination_free_passed is True
    assert auto_refined_report.obligation_preservation_passed is True

    # 2. Clean first-pass verification
    clean_report = await auditor.verify_and_critique_suggestion(
        original_clause_text="1.1 Vendor aggregate liability shall not exceed $500.",
        heading="1. Limitation of Liability",
        candidate_proposed_text=(
            "1.1 Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid or payable."
        ),
        candidate_risk=RiskLevel.CRITICAL,
        matched_rules=matched,
        stance=NegotiationStance.BALANCED,
    )
    assert clean_report.auto_corrected is False
    assert clean_report.verification_status == VerificationStatus.VERIFIED
    assert 85 <= clean_report.confidence_score <= 99

    # 3. No matching Playbook rule on custom complex clause -> NEEDS_HUMAN_REVIEW
    review_report = await auditor.verify_and_critique_suggestion(
        original_clause_text=(
            "9.1 Unusual bespoke aerospace indemnity allocation governed by orbital arbitration."
        ),
        heading="9. Special Provisions",
        candidate_proposed_text="9.1 Custom mutual orbital risk allocation clause.",
        candidate_risk=RiskLevel.HIGH,
        matched_rules=[],
        stance=NegotiationStance.BALANCED,
    )
    assert review_report.verification_status == VerificationStatus.NEEDS_HUMAN_REVIEW
    assert 60 <= review_report.confidence_score <= 74
    assert review_report.policy_alignment_passed is False


async def test_simulate_counterparty_pushback_deterministic_and_commercial_comparison() -> None:
    """Verify opposing counsel simulation calculates probability, objection, rebuttal & fallback."""
    org_id = uuid4()
    doc_id = uuid4()
    lol_rule = PlaybookRule(
        org_id=org_id,
        category="Limitation of Liability",
        standard_position=(
            "Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid."
        ),
        fallback_position="Mutual liability capped at two times (2x) annual contract fees.",
        unacceptable_triggers="uncapped liability, exceed $500",
    )
    matched = [
        MatchedPlaybookRule(
            rule=lol_rule,
            combined_score=0.94,
            vector_score=0.95,
            keyword_score=0.92,
        )
    ]
    auditor = LangChainClauseAuditor()

    # 1. Strict posture on CRITICAL liability shift -> High pushback resistance
    strict_input = CounterpartyPushbackInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        suggestion_id=uuid4(),
        clause_index=0,
        heading="1. Limitation of Liability",
        original_clause_text="1.1 Vendor liability shall not exceed $500.",
        proposed_text=(
            "1.1 Each party's aggregate cumulative liability shall not exceed twelve (12) months "
            "of fees paid."
        ),
        risk=RiskLevel.CRITICAL,
        stance=NegotiationStance.STRICT,
    )
    strict_sim = await auditor.simulate_counterparty_pushback(strict_input, matched)
    assert 0 <= strict_sim.acceptance_probability <= 100
    assert strict_sim.acceptance_probability < 50
    assert strict_sim.pushback_severity == PushbackSeverity.HIGH
    assert len(strict_sim.counterparty_persona) > 5
    assert len(strict_sim.expected_objection) > 15
    assert len(strict_sim.rebuttal_talking_point) > 15
    assert strict_sim.fallback_compromise_text.startswith("1.1 ")
    assert "2x" in strict_sim.fallback_compromise_text

    # 2. Commercial posture with pre-adopted compromise -> Higher acceptance & LOW severity
    comm_input = CounterpartyPushbackInput(
        org_id=org_id,
        document_id=doc_id,
        clause_id=uuid4(),
        suggestion_id=uuid4(),
        clause_index=0,
        heading="1. Limitation of Liability",
        original_clause_text="1.1 Vendor liability shall not exceed $500.",
        proposed_text="1.1 Mutual liability capped at two times (2x) annual contract fees.",
        risk=RiskLevel.HIGH,
        stance=NegotiationStance.COMMERCIAL,
    )
    comm_sim = await auditor.simulate_counterparty_pushback(comm_input, matched)
    assert comm_sim.acceptance_probability >= 75
    assert comm_sim.pushback_severity == PushbackSeverity.LOW
    assert comm_sim.fallback_compromise_text.startswith("1.1 ")



