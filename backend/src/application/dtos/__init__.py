"""Immutable Pydantic v2 Data Transfer Objects (DTOs) for Phase 1 Auth, Multi-Tenancy, and RBAC."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.domain.enums import UserRole


def _validate_email_format(value: str) -> str:
    cleaned = value.strip().lower()
    if "@" not in cleaned or cleaned.startswith("@") or cleaned.endswith("@"):
        raise ValueError("Invalid email address format.")
    local_part, _, domain_part = cleaned.partition("@")
    if not local_part or "." not in domain_part:
        raise ValueError("Invalid email address domain.")
    return cleaned


def _validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(value) > 128:
        raise ValueError("Password must not exceed 128 characters.")
    if not value.strip():
        raise ValueError("Password cannot consist solely of whitespace.")
    return value


class ImmutableDTO(BaseModel):
    """Base immutable Pydantic v2 DTO forbidding unexpected extra fields."""

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
        from_attributes=True,
    )


class RegisterOrganizationRequestDTO(ImmutableDTO):
    """Input DTO for onboarding a new tenant organization and its initial ADMIN user."""

    organization_name: str = Field(min_length=2, max_length=255)
    admin_email: str = Field(min_length=5, max_length=255)
    admin_password: str = Field(min_length=8, max_length=128)

    @field_validator("organization_name")
    @classmethod
    def validate_org_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Organization name must be at least 2 non-whitespace characters.")
        return cleaned

    @field_validator("admin_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email_format(value)

    @field_validator("admin_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class CreateUserRequestDTO(ImmutableDTO):
    """Input DTO for an ADMIN creating a new user inside their organization."""

    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = Field(default=UserRole.VIEWER)
    org_id: UUID | None = Field(
        default=None,
        description=(
            "Optional explicit org_id; must match the authenticated admin's org_id if provided."
        ),
    )

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email_format(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class LoginRequestDTO(ImmutableDTO):
    """Input DTO for authenticating a user with email and password."""

    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email_format(value)


class TokenPayloadDTO(ImmutableDTO):
    """Validated JWT claims payload embedding user, tenant organization, and role context."""

    sub: UUID
    org_id: UUID
    role: UserRole
    exp: int
    iat: int | None = None
    jti: str | None = None


class OrganizationResponseDTO(ImmutableDTO):
    """Output DTO representing a tenant organization."""

    id: UUID
    name: str
    created_at: datetime


class UserResponseDTO(ImmutableDTO):
    """Output DTO representing a tenant-scoped user (never exposes password_hash)."""

    id: UUID
    org_id: UUID
    email: str
    role: UserRole
    created_at: datetime


class TokenResponseDTO(ImmutableDTO):
    """Output DTO returned upon successful authentication."""

    access_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int
    user: UserResponseDTO


class OnboardingResponseDTO(ImmutableDTO):
    """Output DTO returned after onboarding a new organization and its initial admin."""

    organization: OrganizationResponseDTO
    admin_user: UserResponseDTO
    access_token: str
    token_type: str = "bearer"  # noqa: S105


class CreateDocumentRequestDTO(ImmutableDTO):
    """Input DTO for creating a contract/RFP document record within the tenant scope."""

    title: str = Field(min_length=1, max_length=255)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Document title cannot be empty.")
        return cleaned


class UpdateDocumentRequestDTO(ImmutableDTO):
    """Input DTO for mutating a document's title/status with optimistic concurrency control."""

    title: str = Field(min_length=1, max_length=255)
    expected_version: int = Field(ge=1)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Document title cannot be empty.")
        return cleaned


class DocumentResponseDTO(ImmutableDTO):
    """Output DTO representing a tenant-isolated document."""

    id: UUID
    org_id: UUID
    title: str
    status: str
    version: int
    created_by: UUID
    created_at: datetime


from src.application.dtos.collaboration_dtos import (  # noqa: E402
    ClauseCommentResponseDTO,
    ClauseResolutionStateDTO,
    CreateClauseCommentCommand,
    CreateClauseCommentRequestDTO,
    ResolutionAction,
    ResolveSuggestionCommand,
    ResolveSuggestionRequestDTO,
    ResolveSuggestionResponseDTO,
)
from src.application.dtos.export_and_audit_dtos import (  # noqa: E402
    AuditLogEntryResponseDTO,
)
from src.application.dtos.ingestion_dtos import (  # noqa: E402
    ClauseResponseDTO,
    DocumentUploadResponseDTO,
    DocumentWorkspaceResponseDTO,
    IngestDocumentCommand,
)
from src.application.dtos.playbook_dtos import (  # noqa: E402
    CreatePlaybookRuleCommand,
    CreatePlaybookRuleRequestDTO,
    MatchedPlaybookRuleResponseDTO,
    PlaybookRuleResponseDTO,
    PlaybookSearchRequestDTO,
    PlaybookSearchResponseDTO,
    UpdatePlaybookRuleCommand,
    UpdatePlaybookRuleRequestDTO,
)
from src.application.dtos.redline_dtos import (  # noqa: E402
    DocumentAnalysisSummaryDTO,
    RedlineSuggestionResponseDTO,
)

__all__ = [
    "AuditLogEntryResponseDTO",
    "ClauseCommentResponseDTO",
    "ClauseResolutionStateDTO",
    "ClauseResponseDTO",
    "CreateClauseCommentCommand",
    "CreateClauseCommentRequestDTO",
    "CreateDocumentRequestDTO",
    "CreatePlaybookRuleCommand",
    "CreatePlaybookRuleRequestDTO",
    "CreateUserRequestDTO",
    "DocumentAnalysisSummaryDTO",
    "DocumentResponseDTO",
    "DocumentUploadResponseDTO",
    "DocumentWorkspaceResponseDTO",
    "ImmutableDTO",
    "IngestDocumentCommand",
    "LoginRequestDTO",
    "MatchedPlaybookRuleResponseDTO",
    "OnboardingResponseDTO",
    "OrganizationResponseDTO",
    "PlaybookRuleResponseDTO",
    "PlaybookSearchRequestDTO",
    "PlaybookSearchResponseDTO",
    "RedlineSuggestionResponseDTO",
    "RegisterOrganizationRequestDTO",
    "ResolutionAction",
    "ResolveSuggestionCommand",
    "ResolveSuggestionRequestDTO",
    "ResolveSuggestionResponseDTO",
    "TokenPayloadDTO",
    "TokenResponseDTO",
    "UpdateDocumentRequestDTO",
    "UpdatePlaybookRuleCommand",
    "UpdatePlaybookRuleRequestDTO",
    "UserResponseDTO",
]
