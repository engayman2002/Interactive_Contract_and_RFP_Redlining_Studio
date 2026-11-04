"""Security, authentication, and Role-Based Access Control (RBAC) application services."""

from collections.abc import Collection
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any, Final
from uuid import UUID, uuid4

import bcrypt
import jwt
from pydantic import ValidationError

from src.application.dtos import TokenPayloadDTO
from src.domain.enums import UserRole
from src.domain.exceptions import (
    DomainValidationError,
    ForbiddenRoleError,
    TenantIsolationError,
    UnauthorizedError,
)


class RBACAction(StrEnum):
    """Granular domain actions governed by Role-Based Access Control."""

    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_PLAYBOOKS = "MANAGE_PLAYBOOKS"
    UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT"
    MUTATE_DOCUMENT = "MUTATE_DOCUMENT"
    MUTATE_CLAUSE = "MUTATE_CLAUSE"
    RESOLVE_SUGGESTION = "RESOLVE_SUGGESTION"
    COMMENT_CLAUSE = "COMMENT_CLAUSE"
    VIEW_WORKSPACE = "VIEW_WORKSPACE"
    EXPORT_DOCUMENT = "EXPORT_DOCUMENT"


ROLE_PERMISSION_MATRIX: Final[dict[RBACAction, frozenset[UserRole]]] = {
    RBACAction.MANAGE_USERS: frozenset({UserRole.ADMIN}),
    RBACAction.MANAGE_PLAYBOOKS: frozenset({UserRole.ADMIN, UserRole.LEGAL_COUNSEL}),
    RBACAction.UPLOAD_DOCUMENT: frozenset(
        {UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD}
    ),
    RBACAction.MUTATE_DOCUMENT: frozenset(
        {UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD}
    ),
    RBACAction.MUTATE_CLAUSE: frozenset(
        {UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD}
    ),
    RBACAction.RESOLVE_SUGGESTION: frozenset(
        {UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD}
    ),
    RBACAction.COMMENT_CLAUSE: frozenset(
        {
            UserRole.ADMIN,
            UserRole.LEGAL_COUNSEL,
            UserRole.TECHNICAL_LEAD,
            UserRole.VIEWER,
        }
    ),
    RBACAction.VIEW_WORKSPACE: frozenset(
        {
            UserRole.ADMIN,
            UserRole.LEGAL_COUNSEL,
            UserRole.TECHNICAL_LEAD,
            UserRole.VIEWER,
        }
    ),
    RBACAction.EXPORT_DOCUMENT: frozenset(
        {
            UserRole.ADMIN,
            UserRole.LEGAL_COUNSEL,
            UserRole.TECHNICAL_LEAD,
            UserRole.VIEWER,
        }
    ),
}

MUTATING_ROLES: Final[frozenset[UserRole]] = frozenset(
    {UserRole.ADMIN, UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD}
)


class PasswordService:
    """Password hashing and verification service using bcrypt with unique per-user salts.

    TODO(security): Integrate enterprise OAuth 2.0 / OIDC SSO provider support.
    TODO(security): Add Multi-Factor Authentication (MFA / TOTP) verification flow.
    TODO(security): Add HaveIBeenPwned (HIBP) k-anonymity leaked password check.
    """

    def __init__(self, rounds: int = 12) -> None:
        self._rounds = rounds
        # Precomputed dummy hash used to mitigate user enumeration timing side-channels
        self._dummy_hash: bytes = bcrypt.hashpw(
            b"dummy-constant-time-mitigation-secret",
            bcrypt.gensalt(rounds=rounds),
        )

    @staticmethod
    def validate_password_policy(password: str) -> None:
        """Enforce strong password length and character policy."""
        if len(password) < 8:
            raise DomainValidationError("Password must be at least 8 characters long.")
        if len(password) > 128:
            raise DomainValidationError("Password must not exceed 128 characters.")
        if not password.strip():
            raise DomainValidationError("Password cannot be blank or whitespace only.")

    def hash_password(self, plain_password: str) -> str:
        """Hash a plaintext password using bcrypt with a fresh cryptographic salt."""
        self.validate_password_policy(plain_password)
        salt = bcrypt.gensalt(rounds=self._rounds)
        hashed: bytes = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(self, plain_password: str, password_hash: str) -> bool:
        """Verify a plaintext password against a stored bcrypt hash."""
        if not password_hash:
            return False
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                password_hash.encode("utf-8"),
            )
        except ValueError:
            return False

    def verify_dummy(self, plain_password: str) -> None:
        """Perform a dummy bcrypt check when a user is not found to prevent timing attacks."""
        bcrypt.checkpw(plain_password.encode("utf-8"), self._dummy_hash)


class JwtTokenService:
    """Stateless JWT creation, validation, and revocation service."""

    ALLOWED_ALGORITHMS: Final[tuple[str, ...]] = ("HS256",)

    def __init__(
        self,
        secret_key: str,
        algorithm: str = "HS256",
        expire_minutes: int = 30,
    ) -> None:
        if algorithm.lower() == "none" or algorithm not in self.ALLOWED_ALGORITHMS:
            raise ValueError(f"Unsupported or insecure JWT algorithm: {algorithm}")
        if not secret_key or len(secret_key) < 16:
            raise ValueError("JWT secret_key must be at least 16 characters long.")
        self._secret_key = secret_key
        self._algorithm = algorithm
        self._expire_minutes = expire_minutes
        self._revoked_jtis: set[str] = set()
        self._revoked_users: set[UUID] = set()

    @property
    def expire_seconds(self) -> int:
        """Return token expiration window in seconds."""
        return self._expire_minutes * 60

    def create_access_token(
        self,
        user_id: UUID,
        org_id: UUID,
        role: UserRole,
        expires_delta: timedelta | None = None,
    ) -> str:
        """Create a signed JWT containing `sub`, `org_id`, `role`, `iat`, `exp`, and `jti`."""
        now = datetime.now(UTC)
        expire_at = now + (
            expires_delta
            if expires_delta is not None
            else timedelta(minutes=self._expire_minutes)
        )
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "org_id": str(org_id),
            "role": role.value,
            "iat": int(now.timestamp()),
            "exp": int(expire_at.timestamp()),
            "jti": str(uuid4()),
        }
        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def decode_and_validate_token(self, token: str) -> TokenPayloadDTO:
        """Decode and validate a JWT, strictly enforcing algorithm allow-listing and expiration."""
        if not token or not token.strip():
            raise UnauthorizedError("Authentication token is missing.")

        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.InvalidTokenError as exc:
            raise UnauthorizedError("Malformed authentication token header.") from exc

        header_alg = str(unverified_header.get("alg", "")).strip()
        if header_alg.lower() == "none" or header_alg != self._algorithm:
            raise UnauthorizedError("Disallowed or mismatched JWT signing algorithm.")

        try:
            decoded: dict[str, Any] = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
                options={"require": ["sub", "org_id", "role", "exp"]},
            )
            payload = TokenPayloadDTO.model_validate(decoded)
        except jwt.ExpiredSignatureError as exc:
            raise UnauthorizedError("Authentication token has expired.") from exc
        except (jwt.InvalidTokenError, ValidationError, ValueError) as exc:
            raise UnauthorizedError("Invalid authentication token payload.") from exc

        if payload.jti and payload.jti in self._revoked_jtis:
            raise UnauthorizedError("Authentication token has been revoked.")
        if payload.sub in self._revoked_users:
            raise UnauthorizedError("User session has been invalidated.")

        return payload

    def revoke_token(self, jti: str) -> None:
        """Invalidate a specific token JTI (e.g. upon user logout)."""
        self._revoked_jtis.add(jti)

    def revoke_user_sessions(self, user_id: UUID) -> None:
        """Invalidate all tokens issued to a specific user (e.g. account removal/deactivation)."""
        self._revoked_users.add(user_id)


class RbacGuardService:
    """Centralized Role-Based Access Control (RBAC) and tenant boundary policy guard."""

    @staticmethod
    def is_role_allowed(user_role: UserRole, action: RBACAction) -> bool:
        """Return True if `user_role` is authorized to execute `action`."""
        allowed = ROLE_PERMISSION_MATRIX.get(action, frozenset())
        return user_role in allowed

    @classmethod
    def authorize_action(cls, user_role: UserRole, action: RBACAction) -> None:
        """Raise ForbiddenRoleError if `user_role` is not permitted to perform `action`."""
        if not cls.is_role_allowed(user_role, action):
            raise ForbiddenRoleError(
                f"Role '{user_role.value}' is not authorized to perform '{action.value}'."
            )

    @staticmethod
    def ensure_can_mutate(user_role: UserRole) -> None:
        """Block VIEWER (and any non-mutating role) from state-changing operations."""
        if user_role not in MUTATING_ROLES:
            raise ForbiddenRoleError(
                f"Role '{user_role.value}' is read-only and forbidden from mutating state."
            )

    @staticmethod
    def require_roles(user_role: UserRole, allowed_roles: Collection[UserRole]) -> None:
        """Verify that `user_role` belongs to `allowed_roles`."""
        if user_role not in allowed_roles:
            allowed_str = ", ".join(sorted(r.value for r in allowed_roles))
            raise ForbiddenRoleError(
                f"Role '{user_role.value}' is forbidden. Required one of: [{allowed_str}]."
            )

    @staticmethod
    def enforce_tenant_isolation(actor_org_id: UUID, target_org_id: UUID) -> None:
        """Ensure an authenticated actor only accesses resources inside their own `org_id`."""
        if actor_org_id != target_org_id:
            raise TenantIsolationError(
                "Cross-organization access denied: actor org_id does not match target resource."
            )


__all__ = [
    "JwtTokenService",
    "MUTATING_ROLES",
    "PasswordService",
    "RBACAction",
    "ROLE_PERMISSION_MATRIX",
    "RbacGuardService",
]

