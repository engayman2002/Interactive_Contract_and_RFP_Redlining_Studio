"""Concrete SQLAlchemy 2.0 async repositories enforcing strict multi-tenant `org_id` isolation."""

from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Document, Organization, User
from src.domain.exceptions import (
    ConcurrencyConflictError,
    DuplicateEntityError,
    EntityNotFoundError,
    TenantIsolationError,
)
from src.domain.ports import (
    DocumentRepositoryPort,
    OrganizationRepositoryPort,
    UnitOfWorkPort,
    UserRepositoryPort,
)
from src.infrastructure.db.models import DocumentModel, OrganizationModel, UserModel


class MultiTenantRepositoryBase:
    """Base repository providing mandatory `org_id` tenant isolation guards and filters."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _enforce_tenant_match(expected_org_id: UUID, resource_org_id: UUID) -> None:
        """Raise TenantIsolationError if entity `org_id` does not match caller `org_id`."""
        if expected_org_id != resource_org_id:
            raise TenantIsolationError(
                "Cross-organization operation blocked: tenant org_id mismatch."
            )

    @staticmethod
    def _apply_tenant_filter(
        statement: Select[Any],
        org_column: Any,
        org_id: UUID,
    ) -> Select[Any]:
        """Append mandatory `WHERE model.org_id = :org_id` clause to a SQLAlchemy Select."""
        return statement.where(org_column == org_id)


class SqlAlchemyOrganizationRepository(OrganizationRepositoryPort):
    """SQLAlchemy async implementation of OrganizationRepositoryPort."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _to_domain(model: OrganizationModel) -> Organization:
        return Organization(
            id=model.id,
            name=model.name,
            created_at=model.created_at,
        )

    async def create(self, organization: Organization) -> Organization:
        model = OrganizationModel(
            id=organization.id,
            name=organization.name,
            created_at=organization.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def get_by_id(self, org_id: UUID) -> Organization | None:
        stmt = select(OrganizationModel).where(OrganizationModel.id == org_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None


class SqlAlchemyUserRepository(MultiTenantRepositoryBase, UserRepositoryPort):
    """SQLAlchemy async implementation of UserRepositoryPort with strict `org_id` scoping."""

    @staticmethod
    def _to_domain(model: UserModel) -> User:
        return User(
            id=model.id,
            org_id=model.org_id,
            email=model.email,
            role=model.role,
            password_hash=model.password_hash,
            created_at=model.created_at,
        )

    async def create(self, org_id: UUID, user: User) -> User:
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=user.org_id)

        existing = await self.get_by_email_for_auth(user.email)
        if existing is not None:
            raise DuplicateEntityError(f"User with email '{user.email}' already exists.")

        model = UserModel(
            id=user.id,
            org_id=org_id,
            email=user.email,
            password_hash=user.password_hash,
            role=user.role,
            created_at=user.created_at,
        )
        self._session.add(model)
        try:
            await self._session.flush()
        except IntegrityError as exc:
            raise DuplicateEntityError("User email is already registered.") from exc
        return self._to_domain(model)

    async def get_by_id(self, org_id: UUID, user_id: UUID) -> User | None:
        stmt = self._apply_tenant_filter(
            select(UserModel),
            UserModel.org_id,
            org_id,
        ).where(UserModel.id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def get_by_email(self, org_id: UUID, email: str) -> User | None:
        normalized_email = email.strip().lower()
        stmt = self._apply_tenant_filter(
            select(UserModel),
            UserModel.org_id,
            org_id,
        ).where(UserModel.email == normalized_email)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def get_by_email_for_auth(self, email: str) -> User | None:
        normalized_email = email.strip().lower()
        stmt = select(UserModel).where(UserModel.email == normalized_email)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def list_by_org(self, org_id: UUID) -> Sequence[User]:
        stmt = (
            self._apply_tenant_filter(
                select(UserModel),
                UserModel.org_id,
                org_id,
            )
            .order_by(UserModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]


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

    async def get_by_id(self, org_id: UUID, document_id: UUID) -> Document | None:
        stmt = self._apply_tenant_filter(
            select(DocumentModel),
            DocumentModel.org_id,
            org_id,
        ).where(DocumentModel.id == document_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

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


class SqlAlchemyUnitOfWork(UnitOfWorkPort):
    """Concrete SQLAlchemy Unit of Work coordinating repository transactions."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self.organizations = SqlAlchemyOrganizationRepository(session)
        self.users = SqlAlchemyUserRepository(session)
        self.documents = SqlAlchemyDocumentRepository(session)

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()


__all__ = [
    "MultiTenantRepositoryBase",
    "SqlAlchemyDocumentRepository",
    "SqlAlchemyOrganizationRepository",
    "SqlAlchemyUnitOfWork",
    "SqlAlchemyUserRepository",
]
