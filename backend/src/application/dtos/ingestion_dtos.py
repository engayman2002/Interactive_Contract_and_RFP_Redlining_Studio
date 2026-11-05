"""Immutable Pydantic v2 DTOs for Phase 2 Document Ingestion & Workspace Retrieval."""

import os
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from src.application.dtos import DocumentResponseDTO, ImmutableDTO


class IngestDocumentCommand(ImmutableDTO):
    """Input command DTO for uploading and structurally ingesting a contract or RFP."""

    org_id: UUID
    uploaded_by: UUID
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = None
    file_bytes: bytes
    title: str | None = None

    @property
    def resolved_title(self) -> str:
        """Return explicit title or derive a clean title from the uploaded filename."""
        if self.title and self.title.strip():
            return self.title.strip()[:255]
        safe_base = os.path.basename(self.filename.replace("\\", "/")).strip()
        stem, _ = os.path.splitext(safe_base)
        cleaned_stem = stem.strip()
        return (cleaned_stem or "Untitled Contract")[:255]


class ClauseResponseDTO(ImmutableDTO):
    """Output DTO representing a persisted contract or RFP clause in the workspace."""

    id: UUID
    document_id: UUID
    clause_index: int
    heading: str | None = None
    original_text: str
    current_text: str
    version: int


class DocumentUploadResponseDTO(ImmutableDTO):
    """Output DTO returned after uploading and ingesting a contract or RFP document."""

    document_id: UUID
    org_id: UUID
    title: str
    status: str
    version: int
    clause_count: int
    storage_key: str
    created_at: datetime


class DocumentWorkspaceResponseDTO(ImmutableDTO):
    """Output DTO representing the full document workspace with ordered clauses."""

    document_id: UUID
    org_id: UUID
    title: str
    status: str
    version: int
    created_by: UUID
    created_at: datetime
    document: DocumentResponseDTO
    clauses: list[ClauseResponseDTO]
    redlines: list[dict[str, Any]] = Field(default_factory=list)
    comments: list[dict[str, Any]] = Field(default_factory=list)


__all__ = [
    "ClauseResponseDTO",
    "DocumentUploadResponseDTO",
    "DocumentWorkspaceResponseDTO",
    "IngestDocumentCommand",
]
