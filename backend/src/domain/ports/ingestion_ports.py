"""Domain port interfaces for file storage, structural document parsing, and clause segmentation."""

from collections.abc import Sequence
from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities.parsed_clause import ParsedClauseCandidate, RawDocumentBlock


@runtime_checkable
class FileStoragePort(Protocol):
    """Port interface for multi-tenant raw contract/RFP file storage."""

    async def save_file(
        self,
        org_id: UUID,
        document_id: UUID,
        filename: str,
        content: bytes,
    ) -> str:
        """Persist raw file bytes isolated under `org_id/document_id` and return storage key."""
        ...

    async def load_file(
        self,
        org_id: UUID,
        document_id: UUID,
        storage_key: str,
    ) -> bytes:
        """Retrieve raw file bytes strictly isolated within `org_id` and `document_id`."""
        ...


@runtime_checkable
class DocumentParserPort(Protocol):
    """Port interface for extracting structural blocks (headings and paragraphs) from raw bytes."""

    def parse(
        self,
        filename: str,
        file_bytes: bytes,
        content_type: str | None = None,
    ) -> list[RawDocumentBlock]:
        """Parse DOCX or PDF byte streams into ordered structural blocks."""
        ...


@runtime_checkable
class ClauseSegmenterPort(Protocol):
    """Port interface transforming structural blocks into sequentially indexed semantic clauses."""

    def segment(
        self,
        blocks: Sequence[RawDocumentBlock],
    ) -> list[ParsedClauseCandidate]:
        """Group sub-clauses and stems into self-contained `ParsedClauseCandidate` objects."""
        ...


__all__ = [
    "ClauseSegmenterPort",
    "DocumentParserPort",
    "FileStoragePort",
]
