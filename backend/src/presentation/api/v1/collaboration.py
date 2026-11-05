"""FastAPI v1 routers for Phase 6 One-Click Redline Resolution and Threaded Clause Comments."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from src.application.dtos import (
    ClauseCommentResponseDTO,
    CreateClauseCommentCommand,
    CreateClauseCommentRequestDTO,
    ResolveSuggestionCommand,
    ResolveSuggestionRequestDTO,
    ResolveSuggestionResponseDTO,
    TokenPayloadDTO,
)
from src.application.services import RbacGuardService
from src.application.use_cases import (
    CreateClauseCommentUseCase,
    ListClauseCommentsUseCase,
    ResolveRedlineSuggestionUseCase,
)
from src.domain.enums import UserRole
from src.domain.ports import UnitOfWorkPort
from src.presentation.dependencies import (
    get_current_user,
    get_rbac_guard,
    get_uow,
    require_roles,
)

suggestions_router = APIRouter(
    prefix="/suggestions",
    tags=["Redline Resolution & Collaboration"],
)

clauses_router = APIRouter(
    prefix="/clauses",
    tags=["Clause Threaded Comments"],
)


@suggestions_router.post(
    "/{suggestion_id}/resolve",
    response_model=ResolveSuggestionResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def resolve_redline_suggestion(
    suggestion_id: UUID,
    payload: ResolveSuggestionRequestDTO,
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
) -> ResolveSuggestionResponseDTO:
    """Accept, modify, or reject an AI redline suggestion with optimistic concurrency control."""
    use_case = ResolveRedlineSuggestionUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
    )
    command = ResolveSuggestionCommand(
        org_id=current_user.org_id,
        suggestion_id=suggestion_id,
        actor_user_id=current_user.sub,
        actor_role=current_user.role,
        action=payload.action,
        expected_clause_version=payload.expected_clause_version,
        modified_text=payload.modified_text,
    )
    return await use_case.execute(actor=current_user, command=command)


@clauses_router.post(
    "/{clause_id}/comments",
    response_model=ClauseCommentResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_clause_comment(
    clause_id: UUID,
    payload: CreateClauseCommentRequestDTO,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> ClauseCommentResponseDTO:
    """Append a threaded comment to a specific clause (accessible to all roles in the tenant)."""
    use_case = CreateClauseCommentUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
    )
    command = CreateClauseCommentCommand(
        org_id=current_user.org_id,
        clause_id=clause_id,
        author_id=current_user.sub,
        actor_role=current_user.role,
        body=payload.body,
    )
    return await use_case.execute(actor=current_user, command=command)


@clauses_router.get(
    "/{clause_id}/comments",
    response_model=list[ClauseCommentResponseDTO],
    status_code=status.HTTP_200_OK,
)
async def list_clause_comments(
    clause_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> list[ClauseCommentResponseDTO]:
    """List chronological threaded comments for a specific clause within the caller's tenant."""
    use_case = ListClauseCommentsUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
    )
    return await use_case.execute(actor=current_user, clause_id=clause_id)


__all__ = ["clauses_router", "suggestions_router"]

