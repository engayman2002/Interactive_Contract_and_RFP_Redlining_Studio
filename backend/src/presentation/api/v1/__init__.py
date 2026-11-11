"""FastAPI v1 routers for Health, Authentication, Organization Users, and RBAC Foundation routes."""

from typing import Annotated, Final
from uuid import UUID

from fastapi import APIRouter, Depends, status

from src.application.dtos import (
    CreateUserRequestDTO,
    ImmutableDTO,
    LoginRequestDTO,
    OnboardingResponseDTO,
    RegisterOrganizationRequestDTO,
    TokenPayloadDTO,
    TokenResponseDTO,
    UserResponseDTO,
)
from src.application.services import JwtTokenService, PasswordService, RbacGuardService
from src.application.use_cases import (
    AuthenticateUserUseCase,
    CreateOrganizationUserUseCase,
    GetOrganizationUserByIdUseCase,
    ListOrganizationUsersUseCase,
    RegisterOrganizationAndAdminUseCase,
)
from src.domain.entities import Organization, User
from src.domain.enums import UserRole
from src.domain.exceptions import DuplicateEntityError
from src.domain.ports import UnitOfWorkPort
from src.presentation.api.v1.ai_settings import ai_settings_router
from src.presentation.api.v1.collaboration import (
    clauses_router,
    suggestions_router,
)
from src.presentation.api.v1.documents import documents_router
from src.presentation.api.v1.playbooks import playbooks_router
from src.presentation.dependencies import (
    get_current_user,
    get_jwt_service,
    get_password_service,
    get_rbac_guard,
    get_uow,
    require_roles,
)


class HealthResponseDTO(ImmutableDTO):
    """Health check status response."""

    status: str = "ok"
    service: str = "redlining-studio-backend"
    phase: int = 1


class LogoutResponseDTO(ImmutableDTO):
    """Session invalidation response."""

    status: str = "logged_out"


api_v1_router = APIRouter()

# ---------------------------------------------------------------------------
# 1. Health Check Router
# ---------------------------------------------------------------------------
health_router = APIRouter(tags=["Health"])


@health_router.get(
    "/health",
    response_model=HealthResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def health_check() -> HealthResponseDTO:
    """Return service readiness and active Phase 1 status."""
    return HealthResponseDTO()


# ---------------------------------------------------------------------------
# 2. Authentication & Organization Onboarding Router
# ---------------------------------------------------------------------------
auth_router = APIRouter(prefix="/auth", tags=["Authentication & Onboarding"])


@auth_router.post(
    "/register-org",
    response_model=OnboardingResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def register_organization(
    payload: RegisterOrganizationRequestDTO,
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    jwt_service: Annotated[JwtTokenService, Depends(get_jwt_service)],
) -> OnboardingResponseDTO:
    """Register a new tenant Organization and provision its initial ADMIN user."""
    use_case = RegisterOrganizationAndAdminUseCase(
        uow=uow,
        password_service=password_service,
        jwt_service=jwt_service,
    )
    return await use_case.execute(payload)


@auth_router.post(
    "/login",
    response_model=TokenResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def login(
    payload: LoginRequestDTO,
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    jwt_service: Annotated[JwtTokenService, Depends(get_jwt_service)],
) -> TokenResponseDTO:
    """Authenticate user credentials and issue a signed tenant-scoped JWT."""
    use_case = AuthenticateUserUseCase(
        uow=uow,
        password_service=password_service,
        jwt_service=jwt_service,
    )
    return await use_case.execute(payload)


DEFAULT_WORKSPACE_ORG_NAME: Final[str] = "Redline Global Technologies"
DEFAULT_WORKSPACE_EMAIL: Final[str] = "counsel@redlinestudio.local"
DEFAULT_WORKSPACE_BOOTSTRAP_PASSWORD: Final[str] = "RedlineStudio2026!"  # noqa: S105


@auth_router.post(
    "/workspace-session",
    response_model=TokenResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def bootstrap_workspace_session(
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    jwt_service: Annotated[JwtTokenService, Depends(get_jwt_service)],
) -> TokenResponseDTO:
    """Idempotently provision/authenticate the default workspace user and return a signed JWT."""
    user = await uow.users.get_by_email_for_auth(DEFAULT_WORKSPACE_EMAIL)
    if user is None:
        try:
            org = await uow.organizations.create(
                Organization(name=DEFAULT_WORKSPACE_ORG_NAME)
            )
            password_hash = password_service.hash_password(
                DEFAULT_WORKSPACE_BOOTSTRAP_PASSWORD
            )
            created_user = await uow.users.create(
                org_id=org.id,
                user=User(
                    org_id=org.id,
                    email=DEFAULT_WORKSPACE_EMAIL,
                    role=UserRole.ADMIN,
                    password_hash=password_hash,
                ),
            )
            await uow.commit()
            user = created_user
        except DuplicateEntityError:
            await uow.rollback()
            user = await uow.users.get_by_email_for_auth(DEFAULT_WORKSPACE_EMAIL)
            if user is None:
                raise

    access_token = jwt_service.create_access_token(
        user_id=user.id,
        org_id=user.org_id,
        role=user.role,
    )
    return TokenResponseDTO(
        access_token=access_token,
        expires_in=jwt_service.expire_seconds,
        user=UserResponseDTO.model_validate(user),
    )


@auth_router.post(
    "/logout",
    response_model=LogoutResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def logout(
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    jwt_service: Annotated[JwtTokenService, Depends(get_jwt_service)],
) -> LogoutResponseDTO:
    """Invalidate the current JWT session token."""
    if current_user.jti:
        jwt_service.revoke_token(current_user.jti)
    return LogoutResponseDTO()


# ---------------------------------------------------------------------------
# 3. Organization Users Router (Multi-Tenant + RBAC Enforced)
# ---------------------------------------------------------------------------
users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.post(
    "",
    response_model=UserResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    payload: CreateUserRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN)),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> UserResponseDTO:
    """Create a new user inside the authenticated ADMIN's organization."""
    use_case = CreateOrganizationUserUseCase(
        uow=uow,
        password_service=password_service,
        rbac_guard=rbac_guard,
    )
    return await use_case.execute(actor=current_user, request=payload)


@users_router.get(
    "",
    response_model=list[UserResponseDTO],
    status_code=status.HTTP_200_OK,
)
async def list_organization_users(
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
) -> list[UserResponseDTO]:
    """List all users belonging strictly to the caller's tenant organization."""
    use_case = ListOrganizationUsersUseCase(uow=uow)
    return await use_case.execute(actor=current_user)


@users_router.get(
    "/{user_id}",
    response_model=UserResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def get_organization_user(
    user_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
) -> UserResponseDTO:
    """Fetch a single user by ID strictly isolated within the caller's organization."""
    use_case = GetOrganizationUserByIdUseCase(uow=uow)
    return await use_case.execute(actor=current_user, user_id=user_id)


api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(playbooks_router)
api_v1_router.include_router(suggestions_router)
api_v1_router.include_router(clauses_router)
api_v1_router.include_router(ai_settings_router)

__all__ = ["api_v1_router"]

