"""Application use cases for Phase 6 Collaboration, Threaded Comments, and One-Click Resolution."""

from uuid import UUID

from src.application.dtos import (
    ClauseCommentResponseDTO,
    ClauseResolutionStateDTO,
    CreateClauseCommentCommand,
    RedlineSuggestionResponseDTO,
    ResolveSuggestionCommand,
    ResolveSuggestionResponseDTO,
    TokenPayloadDTO,
)
from src.application.services import RBACAction, RbacGuardService
from src.domain.entities import AuditLogEntry, ClauseComment
from src.domain.enums import AuditAction, SuggestionStatus
from src.domain.exceptions import (
    ClauseNotFoundError,
    ConcurrencyConflictError,
    InvalidResolutionError,
    SuggestionNotFoundError,
)
from src.domain.ports import UnitOfWorkPort


class ResolveRedlineSuggestionUseCase:
    """Accept, modify, or reject an AI redline suggestion with optimistic concurrency control."""

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
        command: ResolveSuggestionCommand,
    ) -> ResolveSuggestionResponseDTO:
        """Execute atomic suggestion resolution and clause revision within `org_id`."""
        # 1. Enforce RBAC and multi-tenant isolation
        self._rbac_guard.ensure_can_mutate(actor.role)
        self._rbac_guard.authorize_action(actor.role, RBACAction.RESOLVE_SUGGESTION)
        self._rbac_guard.enforce_tenant_isolation(
            actor_org_id=actor.org_id,
            target_org_id=command.org_id,
        )

        # 2. Fetch suggestion and its associated clause scoped strictly to org_id
        suggestion = await self._uow.redlines.get_by_id(
            org_id=actor.org_id,
            suggestion_id=command.suggestion_id,
        )
        if suggestion is None:
            raise SuggestionNotFoundError(
                f"Redline suggestion '{command.suggestion_id}' was not found in your organization."
            )

        clause = await self._uow.documents.get_clause_by_id(
            org_id=actor.org_id,
            clause_id=suggestion.clause_id,
        )
        if clause is None:
            raise ClauseNotFoundError(
                f"Document clause '{suggestion.clause_id}' was not found in your organization."
            )

        # 3. Verify optimistic concurrency before applying mutation
        if clause.version != command.expected_clause_version:
            raise ConcurrencyConflictError(
                f"Clause version conflict on clause '{clause.id}': "
                f"expected version {command.expected_clause_version}, "
                f"actual version {clause.version}."
            )

        # 4. Determine target text and transition suggestion resolution status
        if command.action == "ACCEPT":
            target_clause_text = suggestion.proposed_text
            audit_action = AuditAction.SUGGESTION_ACCEPTED
            suggestion.resolve(
                new_status=SuggestionStatus.ACCEPTED,
                resolved_by=command.actor_user_id,
            )
        elif command.action == "MODIFY":
            if command.modified_text is None or not command.modified_text.strip():
                raise InvalidResolutionError(
                    "MODIFY action requires a non-empty modified_text value."
                )
            target_clause_text = command.modified_text.strip()
            audit_action = AuditAction.SUGGESTION_MODIFIED
            suggestion.resolve(
                new_status=SuggestionStatus.MODIFIED,
                resolved_by=command.actor_user_id,
                modified_text=target_clause_text,
            )
        elif command.action == "REJECT":
            target_clause_text = clause.current_text
            audit_action = AuditAction.SUGGESTION_REJECTED
            suggestion.resolve(
                new_status=SuggestionStatus.REJECTED,
                resolved_by=command.actor_user_id,
            )
        else:
            raise InvalidResolutionError(f"Unsupported resolution action: {command.action}")

        # 5. Persist clause update (with optimistic lock) and suggestion resolution atomically
        updated_clause = await self._uow.documents.update_clause_with_optimistic_lock(
            org_id=actor.org_id,
            clause_id=clause.id,
            new_text=target_clause_text,
            expected_version=command.expected_clause_version,
        )
        updated_suggestion = await self._uow.redlines.update_resolution(
            org_id=actor.org_id,
            suggestion=suggestion,
        )
        parent_doc = await self._uow.documents.get_by_id(
            org_id=actor.org_id,
            document_id=updated_clause.document_id,
        )
        document_version = parent_doc.version if parent_doc is not None else updated_clause.version
        await self._uow.audit_logs.append(
            org_id=actor.org_id,
            entry=AuditLogEntry(
                org_id=actor.org_id,
                document_id=updated_clause.document_id,
                clause_id=updated_clause.id,
                actor_user_id=actor.sub,
                actor_role=actor.role,
                action=audit_action,
                details={
                    "suggestion_id": str(updated_suggestion.id),
                    "clause_version": updated_clause.version,
                    "status": updated_suggestion.status.value,
                },
            ),
        )
        await self._uow.commit()

        return ResolveSuggestionResponseDTO(
            suggestion=RedlineSuggestionResponseDTO.from_domain(updated_suggestion),
            clause=ClauseResolutionStateDTO.model_validate(updated_clause),
            document_version=document_version,
        )


class CreateClauseCommentUseCase:
    """Append a threaded comment to a specific clause (accessible to all roles in the tenant)."""

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
        command: CreateClauseCommentCommand,
    ) -> ClauseCommentResponseDTO:
        """Verify tenant isolation and clause existence, then persist `ClauseComment`."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.COMMENT_CLAUSE)
        self._rbac_guard.enforce_tenant_isolation(
            actor_org_id=actor.org_id,
            target_org_id=command.org_id,
        )

        clause = await self._uow.documents.get_clause_by_id(
            org_id=actor.org_id,
            clause_id=command.clause_id,
        )
        if clause is None:
            raise ClauseNotFoundError(
                f"Document clause '{command.clause_id}' was not found in your organization."
            )

        comment_entity = ClauseComment(
            clause_id=command.clause_id,
            author_id=command.author_id,
            body=command.body,
        )
        persisted = await self._uow.comments.create(
            org_id=actor.org_id,
            comment=comment_entity,
        )
        await self._uow.audit_logs.append(
            org_id=actor.org_id,
            entry=AuditLogEntry(
                org_id=actor.org_id,
                document_id=clause.document_id,
                clause_id=clause.id,
                actor_user_id=actor.sub,
                actor_role=actor.role,
                action=AuditAction.COMMENT_CREATED,
                details={
                    "comment_id": str(persisted.id),
                },
            ),
        )
        await self._uow.commit()
        return ClauseCommentResponseDTO.from_domain(persisted)


class ListClauseCommentsUseCase:
    """List chronological threaded comments for a specific clause within `org_id`."""

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
        clause_id: UUID,
    ) -> list[ClauseCommentResponseDTO]:
        """Verify clause belongs to `actor.org_id` and return its ordered comments."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)

        clause = await self._uow.documents.get_clause_by_id(
            org_id=actor.org_id,
            clause_id=clause_id,
        )
        if clause is None:
            raise ClauseNotFoundError(
                f"Document clause '{clause_id}' was not found in your organization."
            )

        comments = await self._uow.comments.list_by_clause(
            org_id=actor.org_id,
            clause_id=clause_id,
        )
        return [ClauseCommentResponseDTO.from_domain(cm) for cm in comments]


__all__ = [
    "CreateClauseCommentUseCase",
    "ListClauseCommentsUseCase",
    "ResolveRedlineSuggestionUseCase",
]

