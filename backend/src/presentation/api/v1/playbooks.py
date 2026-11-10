"""FastAPI v1 router for Phase 3 Company Playbook CRUD, Embedding Generation, and Hybrid Search."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status

from src.application.dtos import (
    CreatePlaybookRuleCommand,
    CreatePlaybookRuleRequestDTO,
    ExtractPlaybookFromTextRequestDTO,
    ExtractPlaybookResponseDTO,
    PlaybookRuleResponseDTO,
    PlaybookSearchRequestDTO,
    PlaybookSearchResponseDTO,
    TokenPayloadDTO,
    UpdatePlaybookRuleCommand,
    UpdatePlaybookRuleRequestDTO,
)
from src.application.services import RbacGuardService
from src.application.use_cases import (
    CreatePlaybookRuleUseCase,
    DeletePlaybookRuleUseCase,
    ExtractPlaybookRulesUseCase,
    GetPlaybookRuleUseCase,
    ListPlaybookRulesUseCase,
    SearchPlaybookRulesUseCase,
    UpdatePlaybookRuleUseCase,
)
from src.domain.enums import UserRole
from src.domain.ports import (
    ClauseSegmenterPort,
    DocumentParserPort,
    EmbeddingGeneratorPort,
    PlaybookExtractorPort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)
from src.infrastructure.config import get_settings
from src.presentation.dependencies import (
    get_clause_segmenter,
    get_current_user,
    get_document_parser,
    get_embedding_generator,
    get_playbook_extractor,
    get_playbook_retriever,
    get_rbac_guard,
    get_uow,
    require_roles,
)

playbooks_router = APIRouter(prefix="/playbooks", tags=["Playbooks & Vector Knowledge Base"])


@playbooks_router.post(
    "/rules",
    response_model=PlaybookRuleResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_playbook_rule(
    payload: CreatePlaybookRuleRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN, UserRole.LEGAL_COUNSEL)),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    embedding_generator: Annotated[EmbeddingGeneratorPort, Depends(get_embedding_generator)],
) -> PlaybookRuleResponseDTO:
    """Create a new company Playbook Rule and auto-generate its 1536-d vector embedding."""
    use_case = CreatePlaybookRuleUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        embedding_generator=embedding_generator,
    )
    command = CreatePlaybookRuleCommand(
        org_id=current_user.org_id,
        actor_role=current_user.role,
        category=payload.category,
        standard_position=payload.standard_position,
        fallback_position=payload.fallback_position,
        unacceptable_triggers=payload.unacceptable_triggers,
    )
    return await use_case.execute(command)


@playbooks_router.get(
    "/rules",
    response_model=list[PlaybookRuleResponseDTO],
    status_code=status.HTTP_200_OK,
)
async def list_playbook_rules(
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    category: Annotated[
        str | None,
        Query(max_length=128, description="Optional category filter for playbook rules"),
    ] = None,
) -> list[PlaybookRuleResponseDTO]:
    """List all Playbook Rules for the authenticated organization (optional `?category=` filter)."""
    use_case = ListPlaybookRulesUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user, category=category)


@playbooks_router.get(
    "/rules/{rule_id}",
    response_model=PlaybookRuleResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def get_playbook_rule(
    rule_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> PlaybookRuleResponseDTO:
    """Retrieve a single Playbook Rule strictly scoped by `org_id`."""
    use_case = GetPlaybookRuleUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user, rule_id=rule_id)


@playbooks_router.put(
    "/rules/{rule_id}",
    response_model=PlaybookRuleResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def update_playbook_rule(
    rule_id: UUID,
    payload: UpdatePlaybookRuleRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN, UserRole.LEGAL_COUNSEL)),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    embedding_generator: Annotated[EmbeddingGeneratorPort, Depends(get_embedding_generator)],
) -> PlaybookRuleResponseDTO:
    """Update an existing Playbook Rule and regenerate its 1536-d vector embedding."""
    use_case = UpdatePlaybookRuleUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        embedding_generator=embedding_generator,
    )
    command = UpdatePlaybookRuleCommand(
        org_id=current_user.org_id,
        rule_id=rule_id,
        actor_role=current_user.role,
        category=payload.category,
        standard_position=payload.standard_position,
        fallback_position=payload.fallback_position,
        unacceptable_triggers=payload.unacceptable_triggers,
    )
    return await use_case.execute(command)


@playbooks_router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_playbook_rule(
    rule_id: UUID,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN, UserRole.LEGAL_COUNSEL)),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> Response:
    """Delete a Playbook Rule strictly scoped by `org_id`."""
    use_case = DeletePlaybookRuleUseCase(uow=uow, rbac_guard=rbac_guard)
    await use_case.execute(actor=current_user, rule_id=rule_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@playbooks_router.post(
    "/search",
    response_model=PlaybookSearchResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def search_playbook_rules(
    payload: PlaybookSearchRequestDTO,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    retriever: Annotated[PlaybookRetrieverPort, Depends(get_playbook_retriever)],
) -> PlaybookSearchResponseDTO:
    """Execute a hybrid vector + BM25 search against the organization's Playbook knowledge base."""
    use_case = SearchPlaybookRulesUseCase(
        rbac_guard=rbac_guard,
        retriever=retriever,
    )
    return await use_case.execute(actor=current_user, request=payload)


@playbooks_router.post(
    "/extract-from-text",
    response_model=ExtractPlaybookResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def extract_playbook_from_text(
    payload: ExtractPlaybookFromTextRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    extractor: Annotated[PlaybookExtractorPort, Depends(get_playbook_extractor)],
    embedding_generator: Annotated[EmbeddingGeneratorPort, Depends(get_embedding_generator)],
) -> ExtractPlaybookResponseDTO:
    """Auto-extract corporate Playbook rules from pasted golden contract clauses."""
    use_case = ExtractPlaybookRulesUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        extractor=extractor,
        embedding_generator=embedding_generator,
    )
    return await use_case.execute_from_text(actor=current_user, request=payload)


@playbooks_router.post(
    "/extract-from-file",
    response_model=ExtractPlaybookResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def extract_playbook_from_file(
    file: Annotated[UploadFile, File(description="Golden contract file (.docx or .pdf)")],
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    extractor: Annotated[PlaybookExtractorPort, Depends(get_playbook_extractor)],
    embedding_generator: Annotated[EmbeddingGeneratorPort, Depends(get_embedding_generator)],
    parser: Annotated[DocumentParserPort, Depends(get_document_parser)],
    segmenter: Annotated[ClauseSegmenterPort, Depends(get_clause_segmenter)],
    auto_save: Annotated[bool, Form()] = True,
    max_rules: Annotated[int, Form()] = 6,
) -> ExtractPlaybookResponseDTO:
    """Upload a `.docx`/`.pdf` golden contract and auto-extract corporate Playbook rules."""
    settings = get_settings()
    file_bytes = await file.read()
    use_case = ExtractPlaybookRulesUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        extractor=extractor,
        embedding_generator=embedding_generator,
        parser=parser,
        segmenter=segmenter,
        max_upload_bytes=settings.max_upload_size_bytes,
    )
    return await use_case.execute_from_file(
        actor=current_user,
        filename=file.filename or "golden_contract.docx",
        file_bytes=file_bytes,
        content_type=file.content_type,
        max_rules=max_rules,
        auto_save=auto_save,
    )


__all__ = ["playbooks_router"]

