"""Base multi-tenant repository providing mandatory `org_id` isolation guards and SQL filters."""

from typing import Any
from uuid import UUID

from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.exceptions import TenantIsolationError


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


__all__ = ["MultiTenantRepositoryBase"]

