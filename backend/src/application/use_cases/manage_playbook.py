"""Use cases for Phase 3 Company Playbook CRUD, Embedding Generation, and Hybrid Search."""

import time
from uuid import UUID

from src.application.dtos import (
    CreatePlaybookRuleCommand,
    MatchedPlaybookRuleResponseDTO,
    PlaybookRuleResponseDTO,
    PlaybookSearchRequestDTO,
    PlaybookSearchResponseDTO,
    TokenPayloadDTO,
    UpdatePlaybookRuleCommand,
)
from src.application.services import RBACAction, RbacGuardService
from src.domain.entities import PlaybookRule, PlaybookSearchQuery
from src.domain.exceptions import PlaybookRuleNotFoundError
from src.domain.ports import (
    EmbeddingGeneratorPort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)


def compose_playbook_embedding_text(
    category: str,
    standard_position: str,
    fallback_position: str,
    unacceptable_triggers: str,
) -> str:
    """Format Playbook Rule fields into a canonical document string for 1536-d embedding."""
    return (
        f"Category: {category.strip()}\n"
        f"Standard Position: {standard_position.strip()}\n"
        f"Fallback Position: {fallback_position.strip()}\n"
        f"Unacceptable Triggers: {unacceptable_triggers.strip()}"
    )


class CreatePlaybookRuleUseCase:
    """Create a tenant-scoped Playbook Rule and automatically generate its 1536-d embedding."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        embedding_generator: EmbeddingGeneratorPort,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._embedding_generator = embedding_generator

    async def execute(
        self,
        command: CreatePlaybookRuleCommand,
    ) -> PlaybookRuleResponseDTO:
        """Enforce RBAC (`ADMIN` or `LEGAL_COUNSEL`), embed rule text, and persist atomically."""
        self._rbac_guard.authorize_action(command.actor_role, RBACAction.MANAGE_PLAYBOOKS)

        canonical_text = compose_playbook_embedding_text(
            category=command.category,
            standard_position=command.standard_position,
            fallback_position=command.fallback_position,
            unacceptable_triggers=command.unacceptable_triggers,
        )
        embedding = await self._embedding_generator.embed_text(canonical_text)

        rule_entity = PlaybookRule(
            org_id=command.org_id,
            category=command.category,
            standard_position=command.standard_position,
            fallback_position=command.fallback_position,
            unacceptable_triggers=command.unacceptable_triggers,
            embedding=embedding,
        )
        persisted = await self._uow.playbooks.create(rule_entity)
        await self._uow.commit()
        return PlaybookRuleResponseDTO.from_domain(persisted)


class GetPlaybookRuleUseCase:
    """Fetch a single Playbook Rule strictly scoped to the authenticated actor's organization."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard

    async def execute(
        self,
        actor: TokenPayloadDTO,
        rule_id: UUID,
    ) -> PlaybookRuleResponseDTO:
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)
        rule = await self._uow.playbooks.get_by_id(org_id=actor.org_id, rule_id=rule_id)
        if rule is None:
            raise PlaybookRuleNotFoundError(
                f"Playbook rule '{rule_id}' was not found in your organization."
            )
        return PlaybookRuleResponseDTO.from_domain(rule)


class ListPlaybookRulesUseCase:
    """List Playbook Rules belonging strictly to the authenticated actor's organization."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard

    async def execute(
        self,
        actor: TokenPayloadDTO,
        category: str | None = None,
    ) -> list[PlaybookRuleResponseDTO]:
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)
        rules = await self._uow.playbooks.list_by_org(
            org_id=actor.org_id,
            category=category,
        )
        return [PlaybookRuleResponseDTO.from_domain(r) for r in rules]


class UpdatePlaybookRuleUseCase:
    """Update an existing Playbook Rule and regenerate its 1536-d embedding vector."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        embedding_generator: EmbeddingGeneratorPort,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._embedding_generator = embedding_generator

    async def execute(
        self,
        command: UpdatePlaybookRuleCommand,
    ) -> PlaybookRuleResponseDTO:
        """Enforce RBAC (`ADMIN` or `LEGAL_COUNSEL`), re-embed updated text, and persist."""
        self._rbac_guard.authorize_action(command.actor_role, RBACAction.MANAGE_PLAYBOOKS)

        existing = await self._uow.playbooks.get_by_id(
            org_id=command.org_id,
            rule_id=command.rule_id,
        )
        if existing is None:
            raise PlaybookRuleNotFoundError(
                f"Playbook rule '{command.rule_id}' was not found in your organization."
            )

        canonical_text = compose_playbook_embedding_text(
            category=command.category,
            standard_position=command.standard_position,
            fallback_position=command.fallback_position,
            unacceptable_triggers=command.unacceptable_triggers,
        )
        embedding = await self._embedding_generator.embed_text(canonical_text)

        updated_entity = PlaybookRule(
            id=existing.id,
            org_id=command.org_id,
            category=command.category,
            standard_position=command.standard_position,
            fallback_position=command.fallback_position,
            unacceptable_triggers=command.unacceptable_triggers,
            embedding=embedding,
        )
        saved = await self._uow.playbooks.update(
            org_id=command.org_id,
            rule=updated_entity,
        )
        await self._uow.commit()
        return PlaybookRuleResponseDTO.from_domain(saved)


class DeletePlaybookRuleUseCase:
    """Delete a Playbook Rule strictly within the authenticated actor's organization."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard

    async def execute(
        self,
        actor: TokenPayloadDTO,
        rule_id: UUID,
    ) -> None:
        """Enforce RBAC (`ADMIN` or `LEGAL_COUNSEL`) and delete the rule."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.MANAGE_PLAYBOOKS)

        deleted = await self._uow.playbooks.delete(
            org_id=actor.org_id,
            rule_id=rule_id,
        )
        if not deleted:
            raise PlaybookRuleNotFoundError(
                f"Playbook rule '{rule_id}' was not found in your organization."
            )
        await self._uow.commit()


class SearchPlaybookRulesUseCase:
    """Execute hybrid vector + BM25 search across the organization's Playbook knowledge base."""

    def __init__(
        self,
        rbac_guard: RbacGuardService,
        retriever: PlaybookRetrieverPort,
    ) -> None:
        self._rbac_guard = rbac_guard
        self._retriever = retriever

    async def execute(
        self,
        actor: TokenPayloadDTO,
        request: PlaybookSearchRequestDTO,
    ) -> PlaybookSearchResponseDTO:
        """Available to all authenticated tenant roles (`ADMIN` through `VIEWER`)."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)

        started_at = time.perf_counter()
        search_query = PlaybookSearchQuery(
            org_id=actor.org_id,
            query_text=request.query_text,
            category=request.category,
            top_k=request.top_k,
        )
        matches = await self._retriever.retrieve_top_rules(search_query)
        elapsed_ms = round((time.perf_counter() - started_at) * 1000.0, 3)

        return PlaybookSearchResponseDTO(
            results=[MatchedPlaybookRuleResponseDTO.from_domain(m) for m in matches],
            execution_time_ms=elapsed_ms,
        )


__all__ = [
    "CreatePlaybookRuleUseCase",
    "DeletePlaybookRuleUseCase",
    "GetPlaybookRuleUseCase",
    "ListPlaybookRulesUseCase",
    "SearchPlaybookRulesUseCase",
    "UpdatePlaybookRuleUseCase",
    "compose_playbook_embedding_text",
]
