"""SQLAlchemy 2.0 async repository for immutable `AuditLogEntry` records scoped by `org_id`."""

from uuid import UUID

from sqlalchemy import select

from src.domain.entities import AuditLogEntry
from src.domain.ports import AuditLogRepositoryPort
from src.infrastructure.db.models import AuditLogModel
from src.infrastructure.db.repositories.base import MultiTenantRepositoryBase


class SqlAlchemyAuditLogRepository(MultiTenantRepositoryBase, AuditLogRepositoryPort):
    """Append-only SQLAlchemy repository enforcing strict `org_id` tenant isolation."""

    @staticmethod
    def _to_domain(model: AuditLogModel) -> AuditLogEntry:
        raw_details = model.details_json if isinstance(model.details_json, dict) else {}
        typed_details: dict[str, str | int | None] = {
            str(k): (v if isinstance(v, (str, int)) or v is None else str(v))
            for k, v in raw_details.items()
        }
        return AuditLogEntry(
            id=model.id,
            org_id=model.org_id,
            document_id=model.document_id,
            clause_id=model.clause_id,
            actor_user_id=model.actor_user_id,
            actor_role=model.actor_role,
            action=model.action,
            details=typed_details,
            created_at=model.created_at,
        )

    async def append(
        self,
        org_id: UUID,
        entry: AuditLogEntry,
    ) -> AuditLogEntry:
        """Append an immutable `AuditLogEntry` strictly scoped to `org_id`."""
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=entry.org_id)

        model = AuditLogModel(
            id=entry.id,
            org_id=org_id,
            document_id=entry.document_id,
            clause_id=entry.clause_id,
            actor_user_id=entry.actor_user_id,
            actor_role=entry.actor_role,
            action=entry.action,
            details_json=dict(entry.details),
            created_at=entry.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def list_by_document(
        self,
        org_id: UUID,
        document_id: UUID,
    ) -> list[AuditLogEntry]:
        """List audit log entries for `document_id` strictly isolated within `org_id`."""
        stmt = (
            self._apply_tenant_filter(
                select(AuditLogModel),
                AuditLogModel.org_id,
                org_id,
            )
            .where(AuditLogModel.document_id == document_id)
            .order_by(AuditLogModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]


__all__ = ["SqlAlchemyAuditLogRepository"]
