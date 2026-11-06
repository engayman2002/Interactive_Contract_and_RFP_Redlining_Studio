"""Unit tests for PasswordService, JwtTokenService, and RbacGuardService."""

from datetime import timedelta
from pathlib import Path
from uuid import uuid4

import jwt
import pytest
from src.application.services import (
    JwtTokenService,
    PasswordService,
    RBACAction,
    RbacGuardService,
)
from src.domain.enums import UserRole
from src.domain.exceptions import (
    DomainValidationError,
    ForbiddenRoleError,
    TenantIsolationError,
    UnauthorizedError,
)
from src.infrastructure.config import Settings


def test_password_service_hash_and_verify() -> None:
    """Verify bcrypt password hashing, verification, and strength enforcement."""
    service = PasswordService(rounds=4)
    raw_password = "Correct-Horse-Battery-Staple!99"
    hashed = service.hash_password(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$2b$")
    assert service.verify_password(raw_password, hashed) is True
    assert service.verify_password("Wrong-Password-123!", hashed) is False

    with pytest.raises(DomainValidationError):
        service.hash_password("short")


def test_jwt_token_service_creation_validation_and_revocation() -> None:
    """Verify JWT signing, claim extraction, algorithm enforcement, and revocation."""
    secret = "test-cryptographic-secret-key-with-32-plus-bytes"
    jwt_service = JwtTokenService(secret_key=secret, algorithm="HS256", expire_minutes=15)

    user_id = uuid4()
    org_id = uuid4()
    token = jwt_service.create_access_token(
        user_id=user_id,
        org_id=org_id,
        role=UserRole.LEGAL_COUNSEL,
    )

    payload = jwt_service.decode_and_validate_token(token)
    assert payload.sub == user_id
    assert payload.org_id == org_id
    assert payload.role == UserRole.LEGAL_COUNSEL
    assert payload.jti is not None

    # Reject 'none' algorithm tokens
    none_token = jwt.encode(
        {"sub": str(user_id), "org_id": str(org_id), "role": "ADMIN", "exp": 9999999999},
        key="",
        algorithm="none",
    )
    with pytest.raises(UnauthorizedError):
        jwt_service.decode_and_validate_token(none_token)

    # Reject expired tokens
    expired_token = jwt_service.create_access_token(
        user_id=user_id,
        org_id=org_id,
        role=UserRole.ADMIN,
        expires_delta=timedelta(seconds=-10),
    )
    with pytest.raises(UnauthorizedError):
        jwt_service.decode_and_validate_token(expired_token)

    # Revoke specific token JTI
    jwt_service.revoke_token(payload.jti)
    with pytest.raises(UnauthorizedError):
        jwt_service.decode_and_validate_token(token)


def test_rbac_guard_blocks_viewer_mutations_and_enforces_role_matrix() -> None:
    """Verify RbacGuardService blocks VIEWER from mutations and enforces role permissions."""
    guard = RbacGuardService()

    # VIEWER cannot mutate state
    with pytest.raises(ForbiddenRoleError):
        guard.ensure_can_mutate(UserRole.VIEWER)

    for mutating_role in (
        UserRole.ADMIN,
        UserRole.LEGAL_COUNSEL,
        UserRole.TECHNICAL_LEAD,
    ):
        guard.ensure_can_mutate(mutating_role)

    # VIEWER is blocked from all state-changing domain actions
    for mutation_action in (
        RBACAction.MANAGE_USERS,
        RBACAction.MANAGE_PLAYBOOKS,
        RBACAction.UPLOAD_DOCUMENT,
        RBACAction.MUTATE_DOCUMENT,
        RBACAction.MUTATE_CLAUSE,
        RBACAction.RESOLVE_SUGGESTION,
    ):
        with pytest.raises(ForbiddenRoleError):
            guard.authorize_action(UserRole.VIEWER, mutation_action)

    # VIEWER is allowed read/comment/export actions
    for viewer_allowed_action in (
        RBACAction.VIEW_WORKSPACE,
        RBACAction.COMMENT_CLAUSE,
        RBACAction.EXPORT_DOCUMENT,
    ):
        guard.authorize_action(UserRole.VIEWER, viewer_allowed_action)

    # Only ADMIN can manage users
    guard.authorize_action(UserRole.ADMIN, RBACAction.MANAGE_USERS)
    for non_admin in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        with pytest.raises(ForbiddenRoleError):
            guard.authorize_action(non_admin, RBACAction.MANAGE_USERS)

    # Cross-tenant guard raises TenantIsolationError
    org_a = uuid4()
    org_b = uuid4()
    guard.enforce_tenant_isolation(actor_org_id=org_a, target_org_id=org_a)
    with pytest.raises(TenantIsolationError):
        guard.enforce_tenant_isolation(actor_org_id=org_a, target_org_id=org_b)


def test_production_secret_file_mount_resolution(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify Docker Swarm / Kubernetes `*_FILE` secret mounts resolve in production mode."""
    jwt_file = tmp_path / "jwt_secret_key"
    groq_file = tmp_path / "groq_api_key"
    openai_file = tmp_path / "openai_api_key"

    jwt_file.write_text("prod-mounted-jwt-secret-key-with-32-plus-bytes\n", encoding="utf-8")
    groq_file.write_text("gsk_prod_mounted_groq_key\n", encoding="utf-8")
    openai_file.write_text("sk-prod-mounted-openai-key\n", encoding="utf-8")

    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET_KEY_FILE", str(jwt_file))
    monkeypatch.setenv("GROQ_API_KEY_FILE", str(groq_file))
    monkeypatch.setenv("OPENAI_API_KEY_FILE", str(openai_file))

    prod_settings = Settings()
    assert prod_settings.JWT_SECRET_KEY == "prod-mounted-jwt-secret-key-with-32-plus-bytes"  # noqa: S105
    assert prod_settings.GROQ_API_KEY == "gsk_prod_mounted_groq_key"
    assert prod_settings.OPENAI_API_KEY == "sk-prod-mounted-openai-key"

