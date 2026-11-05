"""Immutable Pydantic v2 DTOs for Phase 4 AI Clause Auditing and Redline Suggestions."""

from datetime import datetime
from uuid import UUID

from src.application.dtos import ImmutableDTO
from src.domain.entities import RedlineSuggestion
from src.domain.enums import RiskLevel, SuggestionStatus


class RedlineSuggestionResponseDTO(ImmutableDTO):
    """Output DTO representing an AI-generated `RedlineSuggestion` persisted for a clause."""

    id: UUID
    clause_id: UUID
    matched_rule_id: UUID | None = None
    risk: RiskLevel
    proposed_text: str
    rationale: str
    status: SuggestionStatus
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime

    @classmethod
    def from_domain(cls, suggestion: RedlineSuggestion) -> "RedlineSuggestionResponseDTO":
        """Construct a `RedlineSuggestionResponseDTO` from a `RedlineSuggestion` domain entity."""
        return cls(
            id=suggestion.id,
            clause_id=suggestion.clause_id,
            matched_rule_id=suggestion.matched_rule_id,
            risk=suggestion.risk,
            proposed_text=suggestion.proposed_text,
            rationale=suggestion.rationale,
            status=suggestion.status,
            resolved_by=suggestion.resolved_by,
            resolved_at=suggestion.resolved_at,
            created_at=suggestion.created_at,
        )


class DocumentAnalysisSummaryDTO(ImmutableDTO):
    """Output DTO returned by `POST /api/v1/documents/{document_id}/analyze`."""

    document_id: UUID
    status: str
    total_clauses: int
    suggestions_created: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    compliant_count: int
    execution_time_ms: float


__all__ = [
    "DocumentAnalysisSummaryDTO",
    "RedlineSuggestionResponseDTO",
]

