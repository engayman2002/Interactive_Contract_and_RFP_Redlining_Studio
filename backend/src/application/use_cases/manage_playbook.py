"""Use cases for Phase 3 Company Playbook CRUD, Embedding Generation, and Hybrid Search."""

import logging
import re
import time
from uuid import UUID

from src.application.dtos import (
    CreatePlaybookRuleCommand,
    ExtractedPlaybookRuleCandidateDTO,
    ExtractPlaybookFromTextRequestDTO,
    ExtractPlaybookResponseDTO,
    MatchedPlaybookRuleResponseDTO,
    PlaybookRuleResponseDTO,
    PlaybookSearchRequestDTO,
    PlaybookSearchResponseDTO,
    TokenPayloadDTO,
    UpdatePlaybookRuleCommand,
)
from src.application.services import RBACAction, RbacGuardService
from src.domain.entities import (
    ExtractedPlaybookRuleCandidate,
    PlaybookRule,
    PlaybookSearchQuery,
)
from src.domain.enums import AuditAction, UserRole
from src.domain.exceptions import DomainValidationError, PlaybookRuleNotFoundError
from src.domain.ports import (
    ClauseSegmenterPort,
    DocumentParserPort,
    EmbeddingGeneratorPort,
    PlaybookExtractorPort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)

logger = logging.getLogger(__name__)

_RE_TEXT_SECTION_SPLIT = re.compile(
    r"(?:^|\n)(?=(?:\d+(?:\.\d+)*\.?\s+|Section\s+\d+|Article\s+[IVXLCDM0-9]+|Clause\s+\d+))",
    re.IGNORECASE,
)


def _split_reference_text_to_clauses(reference_text: str) -> list[str]:
    """Split pasted golden contract text into discrete clause strings without outer imports."""
    cleaned = reference_text.strip()
    if not cleaned:
        return []
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", cleaned) if p.strip()]
    clauses: list[str] = []
    for para in paragraphs:
        sub_parts = [part.strip() for part in _RE_TEXT_SECTION_SPLIT.split(para) if part.strip()]
        clauses.extend(sub_parts if sub_parts else [para])
    if len(clauses) <= 1 and ";" in cleaned:
        semi_parts = [p.strip() for p in cleaned.split(";") if len(p.strip()) >= 25]
        if len(semi_parts) > 1:
            clauses = semi_parts
    filtered = [c for c in clauses if len(c) >= 20]
    return filtered if filtered else [cleaned]


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


class ExtractPlaybookRulesUseCase:
    """Extract corporate Playbook rules from golden contract text or `.docx`/`.pdf` uploads."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        extractor: PlaybookExtractorPort,
        embedding_generator: EmbeddingGeneratorPort,
        parser: DocumentParserPort | None = None,
        segmenter: ClauseSegmenterPort | None = None,
        max_upload_bytes: int = 25 * 1024 * 1024,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._extractor = extractor
        self._embedding_generator = embedding_generator
        self._parser = parser
        self._segmenter = segmenter
        self._max_upload_bytes = max_upload_bytes

    def _authorize(self, actor: TokenPayloadDTO, auto_save: bool) -> None:
        self._rbac_guard.ensure_can_mutate(actor.role)
        if auto_save:
            self._rbac_guard.require_roles(actor.role, (UserRole.ADMIN,))
        else:
            self._rbac_guard.require_roles(
                actor.role,
                (UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD),
            )

    async def _persist_candidates(
        self,
        actor: TokenPayloadDTO,
        candidates: list[ExtractedPlaybookRuleCandidate],
    ) -> list[PlaybookRuleResponseDTO]:
        if not candidates:
            return []

        embedding_texts = [
            compose_playbook_embedding_text(
                category=c.category,
                standard_position=c.standard_position,
                fallback_position=c.fallback_position,
                unacceptable_triggers=", ".join(c.unacceptable_triggers),
            )
            for c in candidates
        ]
        embeddings = await self._embedding_generator.embed_batch(embedding_texts)

        saved_dtos: list[PlaybookRuleResponseDTO] = []
        for candidate, embedding in zip(candidates, embeddings, strict=True):
            triggers_text = ", ".join(candidate.unacceptable_triggers)
            rule_entity = PlaybookRule(
                org_id=actor.org_id,
                category=candidate.category,
                standard_position=candidate.standard_position,
                fallback_position=candidate.fallback_position,
                unacceptable_triggers=triggers_text,
                embedding=embedding,
            )
            persisted = await self._uow.playbooks.create(rule_entity, org_id=actor.org_id)
            saved_dtos.append(PlaybookRuleResponseDTO.from_domain(persisted))

        await self._uow.commit()
        return saved_dtos

    async def execute_from_text(
        self,
        actor: TokenPayloadDTO,
        request: ExtractPlaybookFromTextRequestDTO,
    ) -> ExtractPlaybookResponseDTO:
        """Extract structured Playbook rules from pasted golden contract text."""
        started_at = time.perf_counter()
        self._authorize(actor, request.auto_save)

        clauses_text = _split_reference_text_to_clauses(request.reference_text)
        candidates = await self._extractor.extract_rules_from_clauses(
            clauses_text=clauses_text,
            max_rules=request.max_rules,
        )

        saved_rules: list[PlaybookRuleResponseDTO] = []
        if request.auto_save and candidates:
            saved_rules = await self._persist_candidates(actor, candidates)

        logger.info(
            "audit_action=%s org_id=%s actor_id=%s extracted_count=%d auto_saved=%s",
            AuditAction.PLAYBOOK_AUTO_EXTRACTED.value,
            actor.org_id,
            actor.sub,
            len(candidates),
            bool(request.auto_save and saved_rules),
        )
        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 3)
        return ExtractPlaybookResponseDTO(
            extracted_count=len(candidates),
            auto_saved=bool(request.auto_save and saved_rules),
            audit_action=AuditAction.PLAYBOOK_AUTO_EXTRACTED,
            candidates=[
                ExtractedPlaybookRuleCandidateDTO.from_domain(c) for c in candidates
            ],
            saved_rules=saved_rules,
            latency_ms=latency_ms,
        )

    async def execute_from_file(
        self,
        actor: TokenPayloadDTO,
        *,
        filename: str,
        file_bytes: bytes,
        content_type: str | None = None,
        max_rules: int = 6,
        auto_save: bool = True,
    ) -> ExtractPlaybookResponseDTO:
        """Parse an uploaded `.docx`/`.pdf` golden contract and extract Playbook rules."""
        started_at = time.perf_counter()
        self._authorize(actor, auto_save)

        if self._parser is None or self._segmenter is None:
            raise DomainValidationError(
                "Document parser and segmenter must be configured for file extraction."
            )
        if len(file_bytes) > self._max_upload_bytes:
            raise DomainValidationError(
                f"Uploaded file exceeds maximum allowed size of {self._max_upload_bytes} bytes."
            )
        if max_rules < 1 or max_rules > 20:
            raise DomainValidationError("max_rules must be between 1 and 20.")

        raw_blocks = self._parser.parse(
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
        )
        parsed_clauses = self._segmenter.segment(raw_blocks)
        clauses_text = [
            f"{clause.heading}: {clause.text}" if clause.heading else clause.text
            for clause in parsed_clauses
        ]

        candidates = await self._extractor.extract_rules_from_clauses(
            clauses_text=clauses_text,
            max_rules=max_rules,
        )

        saved_rules: list[PlaybookRuleResponseDTO] = []
        if auto_save and candidates:
            saved_rules = await self._persist_candidates(actor, candidates)

        logger.info(
            "audit_action=%s org_id=%s actor_id=%s filename=%s extracted_count=%d auto_saved=%s",
            AuditAction.PLAYBOOK_AUTO_EXTRACTED.value,
            actor.org_id,
            actor.sub,
            filename,
            len(candidates),
            bool(auto_save and saved_rules),
        )
        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 3)
        return ExtractPlaybookResponseDTO(
            extracted_count=len(candidates),
            auto_saved=bool(auto_save and saved_rules),
            audit_action=AuditAction.PLAYBOOK_AUTO_EXTRACTED,
            candidates=[
                ExtractedPlaybookRuleCandidateDTO.from_domain(c) for c in candidates
            ],
            saved_rules=saved_rules,
            latency_ms=latency_ms,
        )


__all__ = [
    "CreatePlaybookRuleUseCase",
    "DeletePlaybookRuleUseCase",
    "ExtractPlaybookRulesUseCase",
    "GetPlaybookRuleUseCase",
    "ListPlaybookRulesUseCase",
    "SearchPlaybookRulesUseCase",
    "UpdatePlaybookRuleUseCase",
    "compose_playbook_embedding_text",
]
