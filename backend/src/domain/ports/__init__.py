"""Abstract repository and Unit-of-Work port interfaces enforcing multi-tenancy by design."""

from collections.abc import Sequence
from typing import Protocol, runtime_checkable
from uuid import UUID

from src.domain.entities import Document, Organization, User


@runtime_checkable
class OrganizationRepositoryPort(Protocol):
    """Port interface for Organization persistence operations."""

    async def create(self, organization: Organization) -> Organization:
        """Persist a new tenant organization."""
        ...

    async def get_by_id(self, org_id: UUID) -> Organization | None:
        """Fetch an organization by its tenant identifier."""
        ...


@runtime_checkable
class UserRepositoryPort(Protocol):
    """Port interface for multi-tenant User persistence operations."""

    async def create(self, org_id: UUID, user: User) -> User:
        """Persist a user strictly scoped to `org_id`."""
        ...

    async def get_by_id(self, org_id: UUID, user_id: UUID) -> User | None:
        """Fetch a user by ID strictly isolated within `org_id`."""
        ...

    async def get_by_email(self, org_id: UUID, email: str) -> User | None:
        """Fetch a user by email strictly isolated within `org_id`."""
        ...

    async def get_by_email_for_auth(self, email: str) -> User | None:
        """Fetch a user by unique email during initial login authentication."""
        ...

    async def list_by_org(self, org_id: UUID) -> Sequence[User]:
        """List all users belonging strictly to `org_id`."""
        ...


@runtime_checkable
class DocumentRepositoryPort(Protocol):
    """Port interface for multi-tenant Document persistence operations."""

    async def create(self, org_id: UUID, document: Document) -> Document:
        """Persist a document strictly scoped to `org_id`."""
        ...

    async def get_by_id(self, org_id: UUID, document_id: UUID) -> Document | None:
        """Fetch a document by ID strictly isolated within `org_id`."""
        ...

    async def list_by_org(self, org_id: UUID) -> Sequence[Document]:
        """List all documents belonging strictly to `org_id`."""
        ...

    async def update(
        self,
        org_id: UUID,
        document: Document,
        expected_version: int,
    ) -> Document:
        """Update a document within `org_id` enforcing optimistic concurrency."""
        ...

    async def delete(self, org_id: UUID, document_id: UUID) -> bool:
        """Delete a document strictly isolated within `org_id`."""
        ...


@runtime_checkable
class UnitOfWorkPort(Protocol):
    """Abstract Unit of Work port for atomic transactional boundaries."""

    organizations: OrganizationRepositoryPort
    users: UserRepositoryPort
    documents: DocumentRepositoryPort

    async def commit(self) -> None:
        """Commit the current transaction."""
        ...

    async def rollback(self) -> None:
        """Roll back the current transaction."""
        ...


__all__ = [
    "DocumentRepositoryPort",
    "OrganizationRepositoryPort",
    "UnitOfWorkPort",
    "UserRepositoryPort",
]

