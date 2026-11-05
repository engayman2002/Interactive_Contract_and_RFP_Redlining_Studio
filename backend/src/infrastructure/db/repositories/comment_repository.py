"""SQLAlchemy 2.0 async repository for `ClauseComment` enforcing strict `org_id` isolation."""

from uuid import UUID

from sqlalchemy import select

from src.domain.entities import ClauseComment
from src.domain.exceptions import ClauseNotFoundError
from src.domain.ports import CommentRepositoryPort
from src.infrastructure.db.models import (
    ClauseCommentModel,
    DocumentClauseModel,
    DocumentModel,
)
from src.infrastructure.db.repositories.base import MultiTenantRepositoryBase


class SqlAlchemyCommentRepository(MultiTenantRepositoryBase, CommentRepositoryPort):
    """SQLAlchemy async `CommentRepositoryPort` enforcing strict `org_id` tenant isolation."""

    @staticmethod
    def _to_domain(model: ClauseCommentModel) -> ClauseComment:
        return ClauseComment(
            id=model.id,
            clause_id=model.clause_id,
            author_id=model.author_id,
            body=model.body,
            created_at=model.created_at,
        )

    async def create(
        self,
        org_id: UUID,
        comment: ClauseComment,
    ) -> ClauseComment:
        """Persist a new `ClauseComment` after verifying the target clause belongs to `org_id`."""
        verify_stmt = (
            select(DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentClauseModel.id == comment.clause_id,
            )
        )
        verified_result = await self._session.execute(verify_stmt)
        verified_clause_id = verified_result.scalar_one_or_none()
        if verified_clause_id is None:
            raise ClauseNotFoundError(
                f"Document clause '{comment.clause_id}' not found in organization '{org_id}'."
            )

        model = ClauseCommentModel(
            id=comment.id,
            clause_id=comment.clause_id,
            author_id=comment.author_id,
            body=comment.body,
            created_at=comment.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def list_by_clause(
        self,
        org_id: UUID,
        clause_id: UUID,
    ) -> list[ClauseComment]:
        """List chronological comments for `clause_id` strictly isolated within `org_id`."""
        stmt = (
            select(ClauseCommentModel)
            .join(DocumentClauseModel, ClauseCommentModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                ClauseCommentModel.clause_id == clause_id,
            )
            .order_by(ClauseCommentModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[ClauseComment]:
        """List all chronological clause comments for `document_id` strictly within `org_id`."""
        stmt = (
            select(ClauseCommentModel)
            .join(DocumentClauseModel, ClauseCommentModel.clause_id == DocumentClauseModel.id)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentModel.id == document_id,
            )
            .order_by(ClauseCommentModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]


__all__ = ["SqlAlchemyCommentRepository"]

