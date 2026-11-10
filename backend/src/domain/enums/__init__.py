"""Domain enumerations for RBAC roles, risk severity, and workflow statuses."""

from enum import StrEnum


class UserRole(StrEnum):
    """Role-Based Access Control (RBAC) roles within an organization."""

    ADMIN = "ADMIN"
    LEGAL_COUNSEL = "LEGAL_COUNSEL"
    TECHNICAL_LEAD = "TECHNICAL_LEAD"
    VIEWER = "VIEWER"


class RiskLevel(StrEnum):
    """Clause risk classification levels evaluated against company playbooks."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NegotiationStance(StrEnum):
    """AI negotiation posture guiding aggressiveness and compromise tolerance."""

    STRICT = "strict"
    BALANCED = "balanced"
    COMMERCIAL = "commercial"


class CrossClauseIssueType(StrEnum):
    """Defect categories identified across multi-clause contract structural graphs."""

    CONTRADICTION = "CONTRADICTION"
    BROKEN_REFERENCE = "BROKEN_REFERENCE"
    UNDEFINED_TERM = "UNDEFINED_TERM"


class VerificationStatus(StrEnum):
    """Verification outcomes produced by the Critic-Refiner Multi-Agent Guard."""

    VERIFIED = "VERIFIED"
    AUTO_REFINED = "AUTO_REFINED"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"


class PushbackSeverity(StrEnum):
    """Predicted adversarial counterparty resistance severity levels."""

    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    DEALBREAKER = "DEALBREAKER"


class SuggestionStatus(StrEnum):
    """Lifecycle states of an AI-generated redline suggestion."""

    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"


class DocumentStatus(StrEnum):
    """Processing states of an uploaded contract or RFP document."""

    PROCESSING = "PROCESSING"
    ANALYZED = "ANALYZED"
    READY = "READY"
    FAILED = "FAILED"


class ExportMode(StrEnum):
    """DOCX export output modes (Native Word Track Changes vs. Finalized Clean)."""

    TRACK_CHANGES = "track_changes"
    CLEAN = "clean"


class AuditAction(StrEnum):
    """Immutable compliance audit log actions recorded across the workspace lifecycle."""

    DOCUMENT_INGESTED = "DOCUMENT_INGESTED"
    DOCUMENT_ANALYZED = "DOCUMENT_ANALYZED"
    SUGGESTION_ACCEPTED = "SUGGESTION_ACCEPTED"
    SUGGESTION_MODIFIED = "SUGGESTION_MODIFIED"
    SUGGESTION_REJECTED = "SUGGESTION_REJECTED"
    SUGGESTION_REFINED = "SUGGESTION_REFINED"
    SUGGESTION_VERIFIED = "SUGGESTION_VERIFIED"
    PUSHBACK_SIMULATED = "PUSHBACK_SIMULATED"
    COMMENT_CREATED = "COMMENT_CREATED"
    DOCUMENT_EXPORTED = "DOCUMENT_EXPORTED"
    CROSS_CLAUSE_CHECKED = "CROSS_CLAUSE_CHECKED"


__all__ = [
    "AuditAction",
    "CrossClauseIssueType",
    "DocumentStatus",
    "ExportMode",
    "NegotiationStance",
    "PushbackSeverity",
    "RiskLevel",
    "SuggestionStatus",
    "UserRole",
    "VerificationStatus",
]

