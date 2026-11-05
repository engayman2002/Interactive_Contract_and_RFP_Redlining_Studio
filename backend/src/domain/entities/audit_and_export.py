"""Pure domain entities for Phase 7 Compliance Audit Trail and DOCX Export Artifacts."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.domain.enums import AuditAction, ExportMode, UserRole
from src.domain.exceptions import DomainValidationError


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class AuditLogEntry:
    """Immutable compliance audit log entry scoped strictly to `org_id` and `document_id`."""

    org_id: UUID
    document_id: UUID
    actor_user_id: UUID
    actor_role: UserRole
    action: AuditAction
    clause_id: UUID | None = None
    details: dict[str, str | int | None] = field(default_factory=dict)
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)


@dataclass(frozen=True, slots=True)
class ExportedDocumentArtifact:
    """Immutable value object holding reconstructed `.docx` bytes and download metadata."""

    document_id: UUID
    filename: str
    content_type: str
    mode: ExportMode
    file_bytes: bytes

    def __post_init__(self) -> None:
        if not self.filename.strip():
            raise DomainValidationError("Exported document filename cannot be empty.")
        if not self.file_bytes:
            raise DomainValidationError("Exported document file_bytes cannot be empty.")


__all__ = [
    "AuditLogEntry",
    "ExportedDocumentArtifact",
]

