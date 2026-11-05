"""SQLAlchemy 2.0 async repository for multi-tenant Documents and ordered DocumentClauses."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select

from src.domain.entities import Document, DocumentClause
from src.domain.enums import DocumentStatus
from src.domain.exceptions import (
    ConcurrencyConflictError,
     DomainValidationError,
    EntityNotFoundError,
)
from src.domain.ports import DocumentRepositoryPort
from src.infrastructure.db.models import DocumentClauseModel, DocumentModel
from src.infrastructure.db.repositories.base import MultiTenantRepositoryBase


class SqlAlchemyDocumentRepository(MultiTenantRepositoryBase, DocumentRepositoryPort):
    """SQLAlchemy async implementation of DocumentRepositoryPort with strict `org_id` scoping."""

    @staticmethod
    def _to_domain(model: DocumentModel) -> Document:
        return Document(
            id=model.id,
            org_id=model.org_id,
            title=model.title,
            status=model.status,
            version=model.version,
            created_by=model.created_by,
            created_at=model.created_at,
        )

    @staticmethod
    def _clause_to_domain(model: DocumentClauseModel) -> DocumentClause:
        return DocumentClause(
            id=model.id,
            document_id=model.document_id,
            clause_index=model.clause_index,
            heading=model.heading,
            original_text=model.original_text,
            current_text=model.current_text,
            version=model.version,
        )

    async def create(self, org_id: UUID, document: Document) -> Document:
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=document.org_id)

        model = DocumentModel(
            id=document.id,
            org_id=org_id,
            title=document.title,
            status=document.status,
            version=document.version,
            created_by=document.created_by,
            created_at=document.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def create_with_clauses(
        self,
        org_id: UUID,
        document: Document,
        clauses: Sequence[DocumentClause],
    ) -> tuple[Document, list[DocumentClause]]:
        """Atomically persist a document and its ordered `DocumentClause` list within `org_id`."""
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=document.org_id)

        doc_model = DocumentModel(
            id=document.id,
            org_id=org_id,
            title=document.title,
            status=DocumentStatus.PROCESSING.value,
            version=1,
            created_by=document.created_by,
            created_at=document.created_at,
        )
        self._session.add(doc_model)
        await self._session.flush()

        ordered_clauses = sorted(clauses, key=lambda c: c.clause_index)
        clause_models: list[DocumentClauseModel] = []
        for expected_idx, clause in enumerate(ordered_clauses):
            if clause.document_id != document.id:
                raise DomainValidationError(
                    "Clause document_id does not match parent Document id."
                )
            if clause.clause_index != expected_idx:
                raise DomainValidationError(
                    f"Non-contiguous clause_index: expected {expected_idx}, "
                    f"got {clause.clause_index}."
                )
            clause_model = DocumentClauseModel(
                id=clause.id,
                document_id=document.id,
                clause_index=clause.clause_index,
                heading=clause.heading[:255] if clause.heading else None,
                original_text=clause.original_text,
                current_text=clause.current_text,
                version=1,
            )
            clause_models.append(clause_model)

        self._session.add_all(clause_models)
        doc_model.status = DocumentStatus.READY.value
        await self._session.flush()

        return (
            self._to_domain(doc_model),
            [self._clause_to_domain(cm) for cm in clause_models],
        )

    async def get_by_id(self, org_id: UUID, document_id: UUID) -> Document | None:
        stmt = self._apply_tenant_filter(
            select(DocumentModel),
            DocumentModel.org_id,
            org_id,
        ).where(DocumentModel.id == document_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def get_with_clauses(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> tuple[Document, list[DocumentClause]] | None:
        """Fetch a document and its ordered clauses (`ORDER BY clause_index`) within `org_id`."""
        doc = await self.get_by_id(org_id=org_id, document_id=document_id)
        if doc is None:
            return None

        clauses = await self.list_clauses_by_document(org_id=org_id, document_id=document_id)
        return doc, clauses

    async def list_clauses_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[DocumentClause]:
        """List ordered clauses for a document strictly isolated within `org_id`."""
        stmt = (
            select(DocumentClauseModel)
            .join(DocumentModel, DocumentClauseModel.document_id == DocumentModel.id)
            .where(
                DocumentModel.org_id == org_id,
                DocumentClauseModel.document_id == document_id,
            )
            .order_by(DocumentClauseModel.clause_index.asc())
        )
        result = await self._session.execute(stmt)
        return [self._clause_to_domain(row) for row in result.scalars().all()]

    async def list_by_org(self, org_id: UUID) -> Sequence[Document]:
        stmt = (
            self._apply_tenant_filter(
                select(DocumentModel),
                DocumentModel.org_id,
                org_id,
            )
            .order_by(DocumentModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]

    async def update(
        self,
        org_id: UUID,
        document: Document,
        expected_version: int,
    ) -> Document:
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=document.org_id)

        stmt = self._apply_tenant_filter(
            select(DocumentModel),
            DocumentModel.org_id,
            org_id,
        ).where(DocumentModel.id == document.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise EntityNotFoundError(
                f"Document '{document.id}' not found in organization '{org_id}'."
            )

        if model.version != expected_version:
            raise ConcurrencyConflictError(
                f"Optimistic concurrency failure for document '{document.id}': "
                f"expected version {expected_version}, actual version {model.version}."
            )

        model.title = document.title
        model.status = document.status
        model.version = expected_version + 1
        await self._session.flush()
        return self._to_domain(model)

    async def delete(self, org_id: UUID, document_id: UUID) -> bool:
        stmt = self._apply_tenant_filter(
            select(DocumentModel),
            DocumentModel.org_id,
            org_id,
        ).where(DocumentModel.id == document_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False

        await self._session.delete(model)
        await self._session.flush()
        return True


__all__ = ["SqlAlchemyDocumentRepository"]
