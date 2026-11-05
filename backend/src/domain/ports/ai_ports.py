"""Domain port interfaces for Phase 4 AI Clause Auditing and RedlineSuggestion persistence."""

from collections.abc import Sequence
from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import (
    ClauseAuditInput,
    ClauseAuditResult,
    MatchedPlaybookRule,
    RedlineSuggestion,
)


@runtime_checkable
class ClauseAuditorPort(Protocol):
    """Port interface for evaluating a contract or RFP clause against company playbook rules."""

    async def audit_clause(
        self,
        audit_input: ClauseAuditInput,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> ClauseAuditResult:
        """Evaluate `audit_input` against `matched_rules` and return `ClauseAuditResult`."""
        ...


@runtime_checkable
class RedlineRepositoryPort(Protocol):
    """Port interface for multi-tenant `RedlineSuggestion` persistence operations."""

    async def create_many(
        self,
        org_id: UUID,
        suggestions: Sequence[RedlineSuggestion],
    ) -> list[RedlineSuggestion]:
        """Atomically persist multiple `RedlineSuggestion` records strictly within `org_id`."""
        ...

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[RedlineSuggestion]:
        """List all `RedlineSuggestion` records for a document strictly isolated within `org_id`."""
        ...

    async def delete_pending_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> int:
        """Delete existing `PENDING` suggestions for a document in `org_id` before re-analysis."""
        ...


__all__ = [
    "ClauseAuditorPort",
    "RedlineRepositoryPort",
]
