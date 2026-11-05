"""Domain port interfaces for Phase 6 Collaboration and Threaded Clause Comments."""

from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import ClauseComment


@runtime_checkable
class CommentRepositoryPort(Protocol):
    """Port interface for multi-tenant `ClauseComment` persistence operations."""

    async def create(
        self,
        org_id: UUID,
        comment: ClauseComment,
    ) -> ClauseComment:
        """Persist a new `ClauseComment` after verifying the target clause belongs to `org_id`."""
        ...

    async def list_by_clause(
        self,
        org_id: UUID,
        clause_id: UUID,
    ) -> list[ClauseComment]:
        """List chronological comments for `clause_id` strictly isolated within `org_id`."""
        ...

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[ClauseComment]:
        """List all chronological clause comments for `document_id` strictly within `org_id`."""
        ...


__all__ = ["CommentRepositoryPort"]

