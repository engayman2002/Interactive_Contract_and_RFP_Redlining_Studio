"""Immutable Pydantic v2 DTOs for Phase 4 AI Clause Auditing and Redline Suggestions."""

from datetime import datetime
from uuid import UUID

from src.application.dtos import ImmutableDTO
from src.domain.entities import (
    CrossClauseAnalysisReport,
    CrossClauseFinding,
    RedlineSuggestion,
)
from src.domain.enums import (
    CrossClauseIssueType,
    NegotiationStance,
    RiskLevel,
    SuggestionStatus,
)


class AnalyzeDocumentRequestDTO(ImmutableDTO):
    """Input DTO for requesting AI clause analysis with an explicit negotiation stance."""

    stance: NegotiationStance = NegotiationStance.BALANCED


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
    stance: NegotiationStance = NegotiationStance.BALANCED


class CrossClauseFindingDTO(ImmutableDTO):
    """Output DTO representing a cross-clause contradiction, broken ref, or undefined term."""

    id: UUID
    issue_type: CrossClauseIssueType
    severity: RiskLevel
    source_clause_id: UUID
    source_clause_index: int
    target_clause_id: UUID | None = None
    target_clause_index: int | None = None
    title: str
    description: str
    recommended_fix: str

    @classmethod
    def from_domain(cls, finding: CrossClauseFinding) -> "CrossClauseFindingDTO":
        """Construct from pure domain CrossClauseFinding."""
        return cls(
            id=finding.id,
            issue_type=finding.issue_type,
            severity=finding.severity,
            source_clause_id=finding.source_clause_id,
            source_clause_index=finding.source_clause_index,
            target_clause_id=finding.target_clause_id,
            target_clause_index=finding.target_clause_index,
            title=finding.title,
            description=finding.description,
            recommended_fix=finding.recommended_fix,
        )


class CrossClauseAnalysisReportDTO(ImmutableDTO):
    """Output DTO detailing document-wide structural/logical integrity report."""

    document_id: UUID
    total_findings: int
    contradiction_count: int
    broken_reference_count: int
    undefined_term_count: int
    integrity_score: int
    findings: list[CrossClauseFindingDTO]
    execution_time_ms: float

    @classmethod
    def from_domain(
        cls, report: CrossClauseAnalysisReport
    ) -> "CrossClauseAnalysisReportDTO":
        """Construct from pure domain CrossClauseAnalysisReport."""
        return cls(
            document_id=report.document_id,
            total_findings=report.total_findings,
            contradiction_count=report.contradiction_count,
            broken_reference_count=report.broken_reference_count,
            undefined_term_count=report.undefined_term_count,
            integrity_score=report.integrity_score,
            findings=[CrossClauseFindingDTO.from_domain(f) for f in report.findings],
            execution_time_ms=report.execution_time_ms,
        )


__all__ = [
    "AnalyzeDocumentRequestDTO",
    "CrossClauseAnalysisReportDTO",
    "CrossClauseFindingDTO",
    "DocumentAnalysisSummaryDTO",
    "RedlineSuggestionResponseDTO",
]

