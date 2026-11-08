"""Pure domain value objects for Phase 4 AI Clause Auditing and SSE Progress Streaming."""

from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from src.domain.enums import NegotiationStance, RiskLevel
from src.domain.exceptions import DomainValidationError

AuditEventType = Literal["clause_audited", "completed", "error"]


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


__all__ = [
    "AuditEventType",
    "AuditProgressEvent",
    "ClauseAuditInput",
    "ClauseAuditResult",
]

