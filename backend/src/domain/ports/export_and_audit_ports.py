"""Domain port interfaces for Phase 7 Native Word DOCX Export and Immutable Audit Trail."""

from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import (
    AuditLogEntry,
    ClauseComment,
    Document,
    DocumentClause,
    RedlineSuggestion,
)
from src.domain.enums import ExportMode


@runtime_checkable
class DocxExporterPort(Protocol):
    """Port interface for reconstructing a `.docx` file in `track_changes` or `clean` mode."""

    def generate_docx(
        self,
        document: Document,
        clauses: list[DocumentClause],
        suggestions: list[RedlineSuggestion],
        comments: list[ClauseComment],
        mode: ExportMode,
        author_name: str = "AI Redlining Studio",
    ) -> bytes:
        """Reconstruct a `.docx` document with optional native Word OpenXML Track Changes."""
        ...


@runtime_checkable
class AuditLogRepositoryPort(Protocol):
    """Port interface for append-only multi-tenant compliance `AuditLogEntry` persistence."""

    async def append(
        self,
        org_id: UUID,
        entry: AuditLogEntry,
    ) -> AuditLogEntry:
        """Append an immutable `AuditLogEntry` strictly scoped to `org_id`."""
        ...

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[AuditLogEntry]:
        """List audit log entries for `document_id` strictly isolated within `org_id`."""
        ...


__all__ = [
    "AuditLogRepositoryPort",
    "DocxExporterPort",
]

