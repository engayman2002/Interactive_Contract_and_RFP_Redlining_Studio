"""Domain layer: Pure entities, enums, exceptions, and ports with zero external dependencies."""

from src.domain.enums import (
    AuditAction,
    CrossClauseIssueType,
    DocumentStatus,
    ExportMode,
    NegotiationStance,
    RiskLevel,
    SuggestionStatus,
    UserRole,
)

__all__ = [
    "AuditAction",
    "CrossClauseIssueType",
    "DocumentStatus",
    "ExportMode",
    "NegotiationStance",
    "RiskLevel",
    "SuggestionStatus",
    "UserRole",
]
