"""Application use cases for Onboarding, Authentication, and RBAC User/Document Management."""

from uuid import UUID

from src.application.dtos import (
    CreateDocumentRequestDTO,
    CreateUserRequestDTO,
    DocumentResponseDTO,
    LoginRequestDTO,
    OnboardingResponseDTO,
    OrganizationResponseDTO,
    RegisterOrganizationRequestDTO,
    TokenPayloadDTO,
    TokenResponseDTO,
    UpdateDocumentRequestDTO,
    UserResponseDTO,
)
from src.application.services import (
    JwtTokenService,
    PasswordService,
    RBACAction,
    RbacGuardService,
)
from src.domain.entities import Document, Organization, User
from src.domain.enums import UserRole
from src.domain.exceptions import EntityNotFoundError, UnauthorizedError
from src.domain.ports import UnitOfWorkPort


class RegisterOrganizationAndAdminUseCase:
    """Onboard a new tenant Organization and provision its initial ADMIN user."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        password_service: PasswordService,
        jwt_service: JwtTokenService,
    ) -> None:
        self._uow = uow
        self._password_service = password_service
        self._jwt_service = jwt_service

    async def execute(
        self,
        request: RegisterOrganizationRequestDTO,
    ) -> OnboardingResponseDTO:
        organization = Organization(name=request.organization_name)
        created_org = await self._uow.organizations.create(organization)

        password_hash = self._password_service.hash_password(request.admin_password)
        admin_user = User(
            org_id=created_org.id,
            email=request.admin_email,
            role=UserRole.ADMIN,
            password_hash=password_hash,
        )
        created_admin = await self._uow.users.create(
            org_id=created_org.id,
            user=admin_user,
        )
        await self._uow.commit()

        access_token = self._jwt_service.create_access_token(
            user_id=created_admin.id,
            org_id=created_org.id,
            role=created_admin.role,
        )
        return OnboardingResponseDTO(
            organization=OrganizationResponseDTO.model_validate(created_org),
            admin_user=UserResponseDTO.model_validate(created_admin),
            access_token=access_token,
        )


class AuthenticateUserUseCase:
    """Authenticate a user by email and password and issue a tenant-scoped JWT."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        password_service: PasswordService,
        jwt_service: JwtTokenService,
    ) -> None:
        self._uow = uow
        self._password_service = password_service
        self._jwt_service = jwt_service

    async def execute(self, request: LoginRequestDTO) -> TokenResponseDTO:
        user = await self._uow.users.get_by_email_for_auth(request.email)
        if user is None:
            # Mitigate timing side-channel enumeration
            self._password_service.verify_dummy(request.password)
            raise UnauthorizedError("Invalid email or password.")

        if not self._password_service.verify_password(request.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        access_token = self._jwt_service.create_access_token(
            user_id=user.id,
            org_id=user.org_id,
            role=user.role,
        )
        return TokenResponseDTO(
            access_token=access_token,
            expires_in=self._jwt_service.expire_seconds,
            user=UserResponseDTO.model_validate(user),
        )


class CreateOrganizationUserUseCase:
    """Create a new user inside an organization (strictly restricted to ADMIN role)."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        password_service: PasswordService,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._password_service = password_service
        self._rbac_guard = rbac_guard

    async def execute(
        self,
        actor: TokenPayloadDTO,
        request: CreateUserRequestDTO,
    ) -> UserResponseDTO:
        self._rbac_guard.authorize_action(actor.role, RBACAction.MANAGE_USERS)

        target_org_id = request.org_id if request.org_id is not None else actor.org_id
        self._rbac_guard.enforce_tenant_isolation(
            actor_org_id=actor.org_id,
            target_org_id=target_org_id,
        )

        password_hash = self._password_service.hash_password(request.password)
        new_user = User(
            org_id=actor.org_id,
            email=request.email,
            role=request.role,
            password_hash=password_hash,
        )
        created = await self._uow.users.create(org_id=actor.org_id, user=new_user)
        await self._uow.commit()
        return UserResponseDTO.model_validate(created)


class ListOrganizationUsersUseCase:
    """List users belonging strictly to the authenticated user's organization."""

    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    async def execute(self, actor: TokenPayloadDTO) -> list[UserResponseDTO]:
        users = await self._uow.users.list_by_org(org_id=actor.org_id)
        return [UserResponseDTO.model_validate(u) for u in users]


class GetOrganizationUserByIdUseCase:
    """Fetch a single user by ID strictly within the authenticated user's organization."""

    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    async def execute(self, actor: TokenPayloadDTO, user_id: UUID) -> UserResponseDTO:
        user = await self._uow.users.get_by_id(org_id=actor.org_id, user_id=user_id)
        if user is None:
            raise EntityNotFoundError(f"User '{user_id}' not found in your organization.")
        return UserResponseDTO.model_validate(user)


class CreateDocumentFoundationUseCase:
    """Create a document metadata record (restricted to ADMIN, LEGAL_COUNSEL, TECHNICAL_LEAD)."""

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
        request: CreateDocumentRequestDTO,
    ) -> DocumentResponseDTO:
        self._rbac_guard.ensure_can_mutate(actor.role)
        self._rbac_guard.authorize_action(actor.role, RBACAction.UPLOAD_DOCUMENT)

        doc = Document(
            org_id=actor.org_id,
            title=request.title,
            created_by=actor.sub,
        )
        created = await self._uow.documents.create(org_id=actor.org_id, document=doc)
        await self._uow.commit()
        return DocumentResponseDTO.model_validate(created)


class GetDocumentFoundationUseCase:
    """Retrieve a document strictly scoped to the actor's organization."""

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
        document_id: UUID,
    ) -> DocumentResponseDTO:
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)
        doc = await self._uow.documents.get_by_id(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if doc is None:
            raise EntityNotFoundError(f"Document '{document_id}' not found in your organization.")
        return DocumentResponseDTO.model_validate(doc)


class UpdateDocumentFoundationUseCase:
    """Update a document within the actor's organization with RBAC and optimistic concurrency."""

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
        document_id: UUID,
        request: UpdateDocumentRequestDTO,
    ) -> DocumentResponseDTO:
        self._rbac_guard.ensure_can_mutate(actor.role)
        self._rbac_guard.authorize_action(actor.role, RBACAction.MUTATE_DOCUMENT)

        existing = await self._uow.documents.get_by_id(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if existing is None:
            raise EntityNotFoundError(f"Document '{document_id}' not found in your organization.")

        updated_entity = Document(
            id=existing.id,
            org_id=actor.org_id,
            title=request.title,
            status=existing.status,
            version=existing.version,
            created_by=existing.created_by,
            created_at=existing.created_at,
        )
        saved = await self._uow.documents.update(
            org_id=actor.org_id,
            document=updated_entity,
            expected_version=request.expected_version,
        )
        await self._uow.commit()
        return DocumentResponseDTO.model_validate(saved)


from src.application.use_cases.analyze_document import (  # noqa: E402
    AnalyzeDocumentClausesUseCase,
    RunCrossClauseCheckUseCase,
    StreamDocumentAnalysisUseCase,
    format_sse_event,
)
from src.application.use_cases.collaboration import (  # noqa: E402
    CreateClauseCommentUseCase,
    ListClauseCommentsUseCase,
    RefineRedlineSuggestionUseCase,
    ResolveRedlineSuggestionUseCase,
)
from src.application.use_cases.export_and_audit import (  # noqa: E402
    DOCX_MIME_TYPE,
    ExportDocumentUseCase,
    ListDocumentAuditLogsUseCase,
)
from src.application.use_cases.ingest_document import (  # noqa: E402
    GetDocumentWorkspaceUseCase,
    ListOrganizationDocumentsUseCase,
    UploadAndIngestDocumentUseCase,
)
from src.application.use_cases.manage_playbook import (  # noqa: E402
    CreatePlaybookRuleUseCase,
    DeletePlaybookRuleUseCase,
    GetPlaybookRuleUseCase,
    ListPlaybookRulesUseCase,
    SearchPlaybookRulesUseCase,
    UpdatePlaybookRuleUseCase,
    compose_playbook_embedding_text,
)

__all__ = [
    "AnalyzeDocumentClausesUseCase",
    "AuthenticateUserUseCase",
    "CreateClauseCommentUseCase",
    "CreateDocumentFoundationUseCase",
    "CreateOrganizationUserUseCase",
    "CreatePlaybookRuleUseCase",
    "DOCX_MIME_TYPE",
    "DeletePlaybookRuleUseCase",
    "ExportDocumentUseCase",
    "GetDocumentFoundationUseCase",
    "GetDocumentWorkspaceUseCase",
    "GetOrganizationUserByIdUseCase",
    "GetPlaybookRuleUseCase",
    "ListClauseCommentsUseCase",
    "ListDocumentAuditLogsUseCase",
    "ListOrganizationDocumentsUseCase",
    "ListOrganizationUsersUseCase",
    "ListPlaybookRulesUseCase",
    "RefineRedlineSuggestionUseCase",
    "RegisterOrganizationAndAdminUseCase",
    "ResolveRedlineSuggestionUseCase",
    "RunCrossClauseCheckUseCase",
    "SearchPlaybookRulesUseCase",
    "StreamDocumentAnalysisUseCase",
    "UpdateDocumentFoundationUseCase",
    "UpdatePlaybookRuleUseCase",
    "UploadAndIngestDocumentUseCase",
    "compose_playbook_embedding_text",
    "format_sse_event",
]
