"""Domain port interfaces for Phase 4 AI Clause Auditing and RedlineSuggestion persistence."""

from collections.abc import Sequence
from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import (
    ClauseAuditInput,
    ClauseAuditResult,
    ClauseCopilotRefineInput,
    ClauseCopilotRefineResult,
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

    async def refine_clause_suggestion(
        self,
        refine_input: ClauseCopilotRefineInput,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> ClauseCopilotRefineResult:
        """Refine an existing redline suggestion using custom user prompt instruction."""
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

    async def get_by_id(
        self,
        org_id: UUID,
        suggestion_id: UUID,
    ) -> RedlineSuggestion | None:
        """Fetch a single `RedlineSuggestion` by ID strictly isolated within `org_id`."""
        ...

    async def update_resolution(
        self,
        org_id: UUID,
        suggestion: RedlineSuggestion,
    ) -> RedlineSuggestion:
        """Persist resolution state (`status`, `proposed_text`, `resolved_by`) in `org_id`."""
        ...

    async def update_suggestion_content(
        self,
        org_id: UUID,
        suggestion: RedlineSuggestion,
    ) -> RedlineSuggestion:
        """Persist updated suggestion content (proposed_text, rationale, status) in org_id."""
        ...


__all__ = [
    "ClauseAuditorPort",
    "RedlineRepositoryPort",
]
