"""Immutable Pydantic v2 DTOs for Phase 7 Compliance Audit Trail and DOCX Export."""

from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.application.dtos import ImmutableDTO
from src.domain.entities import AuditLogEntry
from src.domain.enums import AuditAction, UserRole


class AuditLogEntryResponseDTO(ImmutableDTO):
    """Output DTO representing an immutable compliance audit log entry."""

    id: UUID
    org_id: UUID
    document_id: UUID
    clause_id: UUID | None = None
    actor_user_id: UUID
    actor_role: UserRole
    action: AuditAction
    details: dict[str, str | int | None] = Field(default_factory=dict)
    created_at: datetime

    @classmethod
    def from_domain(cls, entry: AuditLogEntry) -> "AuditLogEntryResponseDTO":
        """Create an `AuditLogEntryResponseDTO` from a pure domain `AuditLogEntry`."""
        return cls(
            id=entry.id,
            org_id=entry.org_id,
            document_id=entry.document_id,
            clause_id=entry.clause_id,
            actor_user_id=entry.actor_user_id,
            actor_role=entry.actor_role,
            action=entry.action,
            details=dict(entry.details),
            created_at=entry.created_at,
        )


__all__ = ["AuditLogEntryResponseDTO"]

