"""Pure domain value objects for Phase 4 AI Clause Auditing and SSE Progress Streaming."""

from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from src.domain.enums import (
    CrossClauseIssueType,
    NegotiationStance,
    PushbackSeverity,
    RiskLevel,
    VerificationStatus,
)
from src.domain.exceptions import DomainValidationError

AuditEventType = Literal["clause_audited", "completed", "error"]

DEFAULT_CRITIC_NOTES = (
    "Verified by Critic Agent against Playbook policy and hallucination guard."
)


@dataclass(frozen=True, slots=True)
class CriticVerificationReport:
    """Immutable report emitted by Agent 2 (Critic & Hallucination Guard Verifier)."""

    verification_status: VerificationStatus
    confidence_score: int
    policy_alignment_passed: bool
    hallucination_free_passed: bool
    obligation_preservation_passed: bool
    auto_corrected: bool
    critic_notes: str
    refined_proposed_text: str

    def __post_init__(self) -> None:
        if not (0 <= self.confidence_score <= 100):
            raise DomainValidationError("confidence_score must be between 0 and 100.")
        if not self.critic_notes.strip():
            raise DomainValidationError("critic_notes cannot be empty.")
        if not self.refined_proposed_text.strip():
            raise DomainValidationError("refined_proposed_text cannot be empty.")


@dataclass(frozen=True, slots=True)
class ClauseAuditInput:
    """Immutable input payload for evaluating a single contract or RFP clause."""

    org_id: UUID
    document_id: UUID
    clause_id: UUID
    clause_index: int
    heading: str | None
    clause_text: str
    stance: NegotiationStance = NegotiationStance.BALANCED
    bypass_cache: bool = False

    def __post_init__(self) -> None:
        if self.clause_index < 0:
            raise DomainValidationError("clause_index must be non-negative.")
        cleaned_text = self.clause_text.strip()
        if not cleaned_text:
            raise DomainValidationError("clause_text cannot be empty.")
        object.__setattr__(self, "clause_text", cleaned_text)


@dataclass(frozen=True, slots=True)
class ClauseAuditResult:
    """Immutable output value object produced by `ClauseAuditorPort.audit_clause`."""

    clause_id: UUID
    clause_index: int
    is_compliant: bool
    risk: RiskLevel
    category: str
    matched_rule_id: UUID | None
    proposed_text: str
    rationale: str
    negotiation_talking_point: str
    latency_ms: float
    stance: NegotiationStance = NegotiationStance.BALANCED
    confidence_score: int = 94
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    critic_notes: str = DEFAULT_CRITIC_NOTES
    policy_alignment_passed: bool = True
    hallucination_free_passed: bool = True
    obligation_preservation_passed: bool = True

    def __post_init__(self) -> None:
        if not self.category.strip():
            raise DomainValidationError("Audit result category cannot be empty.")
        if not self.proposed_text.strip():
            raise DomainValidationError("Audit result proposed_text cannot be empty.")
        if not self.rationale.strip():
            raise DomainValidationError("Audit result rationale cannot be empty.")
        if not self.negotiation_talking_point.strip():
            raise DomainValidationError(
                "Audit result negotiation_talking_point cannot be empty."
            )
        if not (0 <= self.confidence_score <= 100):
            raise DomainValidationError("confidence_score must be between 0 and 100.")


@dataclass(frozen=True, slots=True)
class AuditProgressEvent:
    """Immutable SSE progress event emitted during real-time document clause analysis."""

    event_type: AuditEventType
    document_id: UUID
    clause_id: UUID | None
    clause_index: int | None
    completed_count: int
    total_count: int
    risk: RiskLevel | None
    status: str


@dataclass(frozen=True, slots=True)
class ClauseCopilotRefineInput:
    """Immutable input payload for refining an existing redline suggestion via AI Copilot."""

    org_id: UUID
    document_id: UUID
    clause_id: UUID
    suggestion_id: UUID
    clause_index: int
    heading: str | None
    original_clause_text: str
    current_proposed_text: str
    user_instruction: str
    stance: NegotiationStance = NegotiationStance.BALANCED

    def __post_init__(self) -> None:
        if self.clause_index < 0:
            raise DomainValidationError("clause_index must be non-negative.")
        cleaned_orig = self.original_clause_text.strip()
        cleaned_prop = self.current_proposed_text.strip()
        cleaned_instr = self.user_instruction.strip()
        if not cleaned_orig:
            raise DomainValidationError("original_clause_text cannot be empty.")
        if not cleaned_prop:
            raise DomainValidationError("current_proposed_text cannot be empty.")
        if not cleaned_instr:
            raise DomainValidationError("user_instruction cannot be empty.")
        object.__setattr__(self, "original_clause_text", cleaned_orig)
        object.__setattr__(self, "current_proposed_text", cleaned_prop)
        object.__setattr__(self, "user_instruction", cleaned_instr)


@dataclass(frozen=True, slots=True)
class ClauseCopilotRefineResult:
    """Immutable output value object produced by `ClauseAuditorPort.refine_clause_suggestion`."""

    suggestion_id: UUID
    clause_id: UUID
    risk: RiskLevel
    proposed_text: str
    rationale: str
    negotiation_talking_point: str
    latency_ms: float
    confidence_score: int = 94
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    critic_notes: str = DEFAULT_CRITIC_NOTES
    policy_alignment_passed: bool = True
    hallucination_free_passed: bool = True
    obligation_preservation_passed: bool = True

    def __post_init__(self) -> None:
        if not self.proposed_text.strip():
            raise DomainValidationError("Refine result proposed_text cannot be empty.")
        if not self.rationale.strip():
            raise DomainValidationError("Refine result rationale cannot be empty.")
        if not self.negotiation_talking_point.strip():
            raise DomainValidationError(
                "Refine result negotiation_talking_point cannot be empty."
            )
        if not (0 <= self.confidence_score <= 100):
            raise DomainValidationError("confidence_score must be between 0 and 100.")


@dataclass(frozen=True, slots=True)
class CrossClauseFinding:
    """Finding representing a cross-clause contradiction, broken ref, or undefined term."""

    id: UUID
    issue_type: CrossClauseIssueType
    severity: RiskLevel
    source_clause_id: UUID
    source_clause_index: int
    target_clause_id: UUID | None
    target_clause_index: int | None
    title: str
    description: str
    recommended_fix: str

    def __post_init__(self) -> None:
        if self.source_clause_index < 0:
            raise DomainValidationError("source_clause_index must be non-negative.")
        if self.target_clause_index is not None and self.target_clause_index < 0:
            raise DomainValidationError("target_clause_index must be non-negative.")
        if not self.title.strip():
            raise DomainValidationError("Finding title cannot be empty.")
        if not self.description.strip():
            raise DomainValidationError("Finding description cannot be empty.")
        if not self.recommended_fix.strip():
            raise DomainValidationError("Finding recommended_fix cannot be empty.")


@dataclass(frozen=True, slots=True)
class CrossClauseAnalysisReport:
    """Immutable aggregate analysis report detailing document-wide structural/logical defects."""

    document_id: UUID
    total_findings: int
    contradiction_count: int
    broken_reference_count: int
    undefined_term_count: int
    integrity_score: int
    findings: list[CrossClauseFinding]
    execution_time_ms: float

    def __post_init__(self) -> None:
        if self.total_findings < 0:
            raise DomainValidationError("total_findings must be non-negative.")
        if not (0 <= self.integrity_score <= 100):
            raise DomainValidationError("integrity_score must be between 0 and 100.")
        if self.execution_time_ms < 0:
            raise DomainValidationError("execution_time_ms must be non-negative.")


@dataclass(frozen=True, slots=True)
class CounterpartyPushbackInput:
    """Immutable input payload for simulating opposing counsel pushback on a redline."""

    org_id: UUID
    document_id: UUID
    clause_id: UUID
    suggestion_id: UUID
    clause_index: int
    heading: str | None
    original_clause_text: str
    proposed_text: str
    risk: RiskLevel
    stance: NegotiationStance = NegotiationStance.BALANCED

    def __post_init__(self) -> None:
        if self.clause_index < 0:
            raise DomainValidationError("clause_index must be non-negative.")
        cleaned_orig = self.original_clause_text.strip()
        cleaned_prop = self.proposed_text.strip()
        if not cleaned_orig:
            raise DomainValidationError("original_clause_text cannot be empty.")
        if not cleaned_prop:
            raise DomainValidationError("proposed_text cannot be empty.")
        object.__setattr__(self, "original_clause_text", cleaned_orig)
        object.__setattr__(self, "proposed_text", cleaned_prop)


@dataclass(frozen=True, slots=True)
class CounterpartyPushbackSimulation:
    """Immutable adversarial pushback forecast and Round-2 rebuttal strategy."""

    suggestion_id: UUID
    clause_id: UUID
    acceptance_probability: int
    pushback_severity: PushbackSeverity
    counterparty_persona: str
    expected_objection: str
    rebuttal_talking_point: str
    fallback_compromise_text: str
    latency_ms: float

    def __post_init__(self) -> None:
        if not (0 <= self.acceptance_probability <= 100):
            raise DomainValidationError("acceptance_probability must be between 0 and 100.")
        if not self.counterparty_persona.strip():
            raise DomainValidationError("counterparty_persona cannot be empty.")
        if not self.expected_objection.strip():
            raise DomainValidationError("expected_objection cannot be empty.")
        if not self.rebuttal_talking_point.strip():
            raise DomainValidationError("rebuttal_talking_point cannot be empty.")
        if not self.fallback_compromise_text.strip():
            raise DomainValidationError("fallback_compromise_text cannot be empty.")
        if self.latency_ms < 0:
            raise DomainValidationError("latency_ms must be non-negative.")


__all__ = [
    "AuditEventType",
    "AuditProgressEvent",
    "ClauseAuditInput",
    "ClauseAuditResult",
    "ClauseCopilotRefineInput",
    "ClauseCopilotRefineResult",
    "CounterpartyPushbackInput",
    "CounterpartyPushbackSimulation",
    "CriticVerificationReport",
    "CrossClauseAnalysisReport",
    "CrossClauseFinding",
    "DEFAULT_CRITIC_NOTES",
]

