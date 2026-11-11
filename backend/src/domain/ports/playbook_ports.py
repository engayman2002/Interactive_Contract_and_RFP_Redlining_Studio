"""Domain port interfaces for Playbook vector embeddings, persistence, and hybrid retrieval."""

from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import PlaybookRule
from src.domain.entities.playbook_search import (
    ExtractedPlaybookRuleCandidate,
    MatchedPlaybookRule,
    PlaybookSearchQuery,
)


@runtime_checkable
class EmbeddingGeneratorPort(Protocol):
    """Port interface for generating 1536-dimensional L2-normalized semantic embeddings."""

    async def embed_text(self, text: str) -> list[float]:
        """Generate a 1536-d L2-normalized embedding vector for a single text string."""
        ...

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate 1536-d L2-normalized embedding vectors for a batch of text strings."""
        ...


@runtime_checkable
class PlaybookRepositoryPort(Protocol):
    """Port interface for multi-tenant PlaybookRule persistence operations."""

    async def create(
        self,
        rule: PlaybookRule,
        org_id: UUID | None = None,
    ) -> PlaybookRule:
        """Persist a new PlaybookRule scoped strictly to its `org_id`."""
        ...

    async def get_by_id(self, org_id: UUID, rule_id: UUID) -> PlaybookRule | None:
        """Fetch a PlaybookRule by ID strictly isolated within `org_id`."""
        ...

    async def list_by_org(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        """List all PlaybookRules belonging to `org_id`, optionally filtered by `category`."""
        ...

    async def update(self, org_id: UUID, rule: PlaybookRule) -> PlaybookRule:
        """Update an existing PlaybookRule and its embedding strictly within `org_id`."""
        ...

    async def delete(self, org_id: UUID, rule_id: UUID) -> bool:
        """Delete a PlaybookRule by ID strictly within `org_id`."""
        ...

    async def list_candidates_for_retrieval(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        """Fetch candidate PlaybookRules within `org_id` (and optional `category`) for retrieval."""
        ...


@runtime_checkable
class PlaybookRetrieverPort(Protocol):
    """Port interface for hybrid vector + BM25 PlaybookRule retrieval."""

    async def retrieve_top_rules(
        self,
        query: PlaybookSearchQuery,
    ) -> list[MatchedPlaybookRule]:
        """Retrieve and rank the top-k relevant PlaybookRules for a contract clause query."""
        ...


@runtime_checkable
class PlaybookExtractorPort(Protocol):
    """Port interface for AI extraction of structured Playbook rules from golden clauses."""

    async def extract_rules_from_clauses(
        self,
        clauses_text: list[str],
        max_rules: int = 8,
        org_id: UUID | None = None,
    ) -> list[ExtractedPlaybookRuleCandidate]:
        """Distill corporate standards, fallbacks, and deal-breakers from golden clauses."""
        ...


__all__ = [
    "EmbeddingGeneratorPort",
    "PlaybookExtractorPort",
    "PlaybookRepositoryPort",
    "PlaybookRetrieverPort",
]
