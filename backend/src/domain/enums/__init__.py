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


__all__ = [
    "DocumentStatus",
    "RiskLevel",
    "SuggestionStatus",
    "UserRole",
]

