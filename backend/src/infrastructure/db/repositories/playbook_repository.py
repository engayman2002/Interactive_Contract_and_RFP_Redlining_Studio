"""SQLAlchemy 2.0 async repository for multi-tenant PlaybookRules and 1536-d embeddings."""

from uuid import UUID

from sqlalchemy import func, select

from src.domain.entities import PlaybookRule
from src.domain.exceptions import PlaybookRuleNotFoundError
from src.domain.ports.playbook_ports import PlaybookRepositoryPort
from src.infrastructure.db.models import PlaybookRuleModel
from src.infrastructure.db.repositories.base import MultiTenantRepositoryBase


class SqlAlchemyPlaybookRepository(MultiTenantRepositoryBase, PlaybookRepositoryPort):
    """SQLAlchemy async PlaybookRepositoryPort enforcing strict `org_id` isolation."""

    @staticmethod
    def _to_domain(model: PlaybookRuleModel) -> PlaybookRule:
        raw_embedding = model.embedding
        embedding_list = [float(x) for x in raw_embedding] if raw_embedding is not None else []
        return PlaybookRule(
            id=model.id,
            org_id=model.org_id,
            category=model.category,
            standard_position=model.standard_position,
            fallback_position=model.fallback_position,
            unacceptable_triggers=model.unacceptable_triggers,
            embedding=embedding_list,
        )

    async def create(
        self,
        rule: PlaybookRule,
        org_id: UUID | None = None,
    ) -> PlaybookRule:
        """Persist a new PlaybookRule scoped strictly to its `org_id`."""
        expected_org_id = org_id if org_id is not None else rule.org_id
        self._enforce_tenant_match(
            expected_org_id=expected_org_id,
            resource_org_id=rule.org_id,
        )

        model = PlaybookRuleModel(
            id=rule.id,
            org_id=rule.org_id,
            category=rule.category,
            standard_position=rule.standard_position,
            fallback_position=rule.fallback_position,
            unacceptable_triggers=rule.unacceptable_triggers,
            embedding=list(rule.embedding),
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def get_by_id(self, org_id: UUID, rule_id: UUID) -> PlaybookRule | None:
        """Fetch a PlaybookRule by ID strictly isolated within `org_id`."""
        stmt = self._apply_tenant_filter(
            select(PlaybookRuleModel),
            PlaybookRuleModel.org_id,
            org_id,
        ).where(PlaybookRuleModel.id == rule_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_domain(model) if model is not None else None

    async def list_by_org(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        """List PlaybookRules belonging strictly to `org_id`, with optional `category` filter."""
        stmt = self._apply_tenant_filter(
            select(PlaybookRuleModel),
            PlaybookRuleModel.org_id,
            org_id,
        )
        if category is not None and category.strip():
            normalized_cat = category.strip().lower()
            stmt = stmt.where(func.lower(PlaybookRuleModel.category) == normalized_cat)

        stmt = stmt.order_by(PlaybookRuleModel.category.asc(), PlaybookRuleModel.id.asc())
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]

    async def update(self, org_id: UUID, rule: PlaybookRule) -> PlaybookRule:
        """Update an existing PlaybookRule strictly within `org_id`."""
        self._enforce_tenant_match(expected_org_id=org_id, resource_org_id=rule.org_id)

        stmt = self._apply_tenant_filter(
            select(PlaybookRuleModel),
            PlaybookRuleModel.org_id,
            org_id,
        ).where(PlaybookRuleModel.id == rule.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise PlaybookRuleNotFoundError(
                f"Playbook rule '{rule.id}' not found in organization '{org_id}'."
            )

        model.category = rule.category
        model.standard_position = rule.standard_position
        model.fallback_position = rule.fallback_position
        model.unacceptable_triggers = rule.unacceptable_triggers
        model.embedding = list(rule.embedding)
        await self._session.flush()
        return self._to_domain(model)

    async def delete(self, org_id: UUID, rule_id: UUID) -> bool:
        """Delete a PlaybookRule strictly isolated within `org_id`."""
        stmt = self._apply_tenant_filter(
            select(PlaybookRuleModel),
            PlaybookRuleModel.org_id,
            org_id,
        ).where(PlaybookRuleModel.id == rule_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False

        await self._session.delete(model)
        await self._session.flush()
        return True

    async def list_candidates_for_retrieval(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        """Fetch candidate PlaybookRules within `org_id` for hybrid vector + BM25 retrieval."""
        return await self.list_by_org(org_id=org_id, category=category)


__all__ = ["SqlAlchemyPlaybookRepository"]
