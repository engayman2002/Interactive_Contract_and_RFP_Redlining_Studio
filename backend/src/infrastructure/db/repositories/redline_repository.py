"""SQLAlchemy 2.0 async repository for `RedlineSuggestion` enforcing strict `org_id` isolation."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import delete, select

from src.domain.entities import RedlineSuggestion
from src.domain.enums import SuggestionStatus
from src.domain.exceptions import EntityNotFoundError, SuggestionNotFoundError
from src.domain.ports import RedlineRepositoryPort
from src.infrastructure.db.models import (
    DocumentClauseModel,
    DocumentModel,
    RedlineSuggestionModel,
)
from src.infrastructure.db.repositories.base import MultiTenantRepositoryBase


class SqlAlchemyRedlineRepository(MultiTenantRepositoryBase, RedlineRepositoryPort):
    """SQLAlchemy async `RedlineRepositoryPort` enforcing strict `org_id` tenant isolation."""

    @staticmethod
    def _to_domain(model: RedlineSuggestionModel) -> RedlineSuggestion:
        return RedlineSuggestion(
            id=model.id,
            clause_id=model.clause_id,
            matched_rule_id=model.matched_rule_id,
            risk=model.risk,
            proposed_text=model.proposed_text,
            rationale=model.rationale,
            status=model.status,
            resolved_by=model.resolved_by,
            resolved_at=model.resolved_at,
            created_at=model.created_at,
        )

    async def create_many(
        self,
        org_id: UUID,
        suggestions: Sequence[RedlineSuggestion],
    ) -> list[RedlineSuggestion]:
        """Atomically persist `RedlineSuggestion` records after verifying clause ownership."""
        if not suggestions:
            return []

        clause_ids = {s.clause_id for s in suggestions}
        verify_stmt = (
            select(DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentClauseModel.id.in_(clause_ids),
            )
        )
        verified_result = await self._session.execute(verify_stmt)
        verified_clause_ids = set(verified_result.scalars().all())

        if verified_clause_ids != clause_ids:
            missing_ids = clause_ids - verified_clause_ids
            raise EntityNotFoundError(
                f"Cannot create redline suggestions: clauses {missing_ids} not found in tenant."
            )

        models: list[RedlineSuggestionModel] = []
        for item in suggestions:
            model = RedlineSuggestionModel(
                id=item.id,
                clause_id=item.clause_id,
                matched_rule_id=item.matched_rule_id,
                risk=item.risk,
                proposed_text=item.proposed_text,
                rationale=item.rationale,
                status=item.status,
                resolved_by=item.resolved_by,
                resolved_at=item.resolved_at,
                created_at=item.created_at,
            )
            models.append(model)

        self._session.add_all(models)
        await self._session.flush()
        return [self._to_domain(m) for m in models]

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[RedlineSuggestion]:
        """List all `RedlineSuggestion` records for `document_id` isolated within `org_id`."""
        stmt = (
            select(RedlineSuggestionModel)
            .join(DocumentClauseModel, RedlineSuggestionModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentModel.id == document_id,
            )
            .order_by(
                DocumentClauseModel.clause_index.asc(),
                RedlineSuggestionModel.created_at.asc(),
            )
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]

    async def delete_pending_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> int:
        """Delete existing `PENDING` suggestions for `document_id` strictly within `org_id`."""
        id_stmt = (
            select(RedlineSuggestionModel.id)
            .join(DocumentClauseModel, RedlineSuggestionModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentModel.id == document_id,
                RedlineSuggestionModel.status == SuggestionStatus.PENDING,
            )
        )
        id_result = await self._session.execute(id_stmt)
        pending_ids = list(id_result.scalars().all())
        if not pending_ids:
            return 0

        del_stmt = delete(RedlineSuggestionModel).where(
            RedlineSuggestionModel.id.in_(pending_ids)
        )
        await self._session.execute(del_stmt)
        await self._session.flush()
        return len(pending_ids)

    async def get_by_id(
        self,
        org_id: UUID,
        suggestion_id: UUID,
    ) -> RedlineSuggestion | None:
        """Fetch a single `RedlineSuggestion` by ID strictly isolated within `org_id`."""
        stmt = (
            select(RedlineSuggestionModel)
            .join(DocumentClauseModel, RedlineSuggestionModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                RedlineSuggestionModel.id == suggestion_id,
            )
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def update_resolution(
        self,
        org_id: UUID,
        suggestion: RedlineSuggestion,
    ) -> RedlineSuggestion:
        """Persist resolution state (`status`, `proposed_text`, `resolved_by`) in `org_id`."""
        stmt = (
            select(RedlineSuggestionModel)
            .join(DocumentClauseModel, RedlineSuggestionModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                RedlineSuggestionModel.id == suggestion.id,
            )
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise SuggestionNotFoundError(
                f"Redline suggestion '{suggestion.id}' not found in organization '{org_id}'."
            )

        model.proposed_text = suggestion.proposed_text
        model.status = suggestion.status
        model.resolved_by = suggestion.resolved_by
        model.resolved_at = suggestion.resolved_at
        await self._session.flush()
        return self._to_domain(model)

    async def update_suggestion_content(
        self,
        org_id: UUID,
        suggestion: RedlineSuggestion,
    ) -> RedlineSuggestion:
        """Persist updated suggestion content (proposed_text, rationale, status) in org_id."""
        stmt = (
            select(RedlineSuggestionModel)
            .join(DocumentClauseModel, RedlineSuggestionModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                RedlineSuggestionModel.id == suggestion.id,
            )
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise SuggestionNotFoundError(
                f"Redline suggestion '{suggestion.id}' not found in organization '{org_id}'."
            )

        model.proposed_text = suggestion.proposed_text
        model.rationale = suggestion.rationale
        model.status = suggestion.status
        model.resolved_by = suggestion.resolved_by
        model.resolved_at = suggestion.resolved_at
        await self._session.flush()
        return self._to_domain(model)


__all__ = ["SqlAlchemyRedlineRepository"]
