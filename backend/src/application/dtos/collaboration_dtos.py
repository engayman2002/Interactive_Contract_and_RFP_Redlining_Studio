"""Immutable Pydantic v2 DTOs for Phase 6 Collaboration, Comments, and One-Click Resolution."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator

from src.application.dtos import ImmutableDTO
from src.application.dtos.redline_dtos import RedlineSuggestionResponseDTO
from src.domain.entities import ClauseComment
from src.domain.enums import UserRole

ResolutionAction = Literal["ACCEPT", "REJECT", "MODIFY"]


class ClauseCommentResponseDTO(ImmutableDTO):
    """Output DTO representing a persisted threaded comment on a contract clause."""

    id: UUID
    clause_id: UUID
    author_id: UUID
    body: str
    created_at: datetime

    @classmethod
    def from_domain(cls, comment: ClauseComment) -> "ClauseCommentResponseDTO":
        """Construct a `ClauseCommentResponseDTO` from a `ClauseComment` domain entity."""
        return cls(
            id=comment.id,
            clause_id=comment.clause_id,
            author_id=comment.author_id,
            body=comment.body,
            created_at=comment.created_at,
        )


class CreateClauseCommentRequestDTO(ImmutableDTO):
    """REST request body DTO for `POST /api/v1/clauses/{clause_id}/comments`."""

    body: str = Field(min_length=1, max_length=8000)

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Comment body cannot be empty or whitespace only.")
        return cleaned


class CreateClauseCommentCommand(ImmutableDTO):
    """Application command DTO for creating a threaded clause comment."""

    org_id: UUID
    clause_id: UUID
    author_id: UUID
    actor_role: UserRole
    body: str


class ResolveSuggestionRequestDTO(ImmutableDTO):
    """REST request body DTO for `POST /api/v1/suggestions/{suggestion_id}/resolve`."""

    action: ResolutionAction
    expected_clause_version: int = Field(default=1, ge=1)
    modified_text: str | None = Field(default=None, max_length=16000)


class ResolveSuggestionCommand(ImmutableDTO):
    """Application command DTO for resolving an AI redline suggestion with optimistic locking."""

    org_id: UUID
    suggestion_id: UUID
    actor_user_id: UUID
    actor_role: UserRole
    action: ResolutionAction
    expected_clause_version: int = Field(ge=1)
    modified_text: str | None = None


class ClauseResolutionStateDTO(ImmutableDTO):
    """Output DTO representing the updated contract clause state after resolving a suggestion."""

    id: UUID
    document_id: UUID
    clause_index: int
    heading: str | None = None
    original_text: str
    current_text: str
    version: int


class ResolveSuggestionResponseDTO(ImmutableDTO):
    """Output DTO returned by `POST /api/v1/suggestions/{suggestion_id}/resolve`."""

    suggestion: RedlineSuggestionResponseDTO
    clause: ClauseResolutionStateDTO
    document_version: int


__all__ = [
    "ClauseCommentResponseDTO",
    "ClauseResolutionStateDTO",
    "CreateClauseCommentCommand",
    "CreateClauseCommentRequestDTO",
    "ResolutionAction",
    "ResolveSuggestionCommand",
    "ResolveSuggestionRequestDTO",
    "ResolveSuggestionResponseDTO",
]
