"""Domain exception hierarchy with zero external dependencies."""


class DomainError(Exception):
    """Base exception for all domain-level business rule violations."""

    def __init__(self, message: str, code: str = "DOMAIN_ERROR") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class UnauthorizedError(DomainError):
    """Raised when authentication credentials are missing, expired, or invalid."""

    def __init__(self, message: str = "Authentication credentials are invalid or expired.") -> None:
        super().__init__(message=message, code="UNAUTHORIZED")


class ForbiddenRoleError(DomainError):
    """Raised when an authenticated user's role lacks permission for an operation."""

    def __init__(
        self,
        message: str = "Insufficient role permissions to perform this action.",
    ) -> None:
        super().__init__(message=message, code="FORBIDDEN_ROLE")


class TenantIsolationError(DomainError):
    """Raised when an operation attempts cross-organization resource access or mutation."""

    def __init__(
        self,
        message: str = "Cross-tenant resource access is strictly forbidden.",
    ) -> None:
        super().__init__(message=message, code="TENANT_ISOLATION_VIOLATION")


class EntityNotFoundError(DomainError):
    """Raised when a requested domain entity cannot be found within the tenant scope."""

    def __init__(self, message: str = "Requested resource was not found.") -> None:
        super().__init__(message=message, code="ENTITY_NOT_FOUND")


class ConcurrencyConflictError(DomainError):
    """Raised when optimistic concurrency control detects a stale version write."""

    def __init__(
        self,
        message: str = "Resource has been modified by another transaction.",
    ) -> None:
        super().__init__(message=message, code="CONCURRENCY_CONFLICT")


class DuplicateEntityError(DomainError):
    """Raised when attempting to create an entity that violates uniqueness constraints."""

    def __init__(self, message: str = "Entity already exists.") -> None:
        super().__init__(message=message, code="DUPLICATE_ENTITY")


class DomainValidationError(DomainError):
    """Raised when domain invariants or input policies fail validation."""

    def __init__(self, message: str = "Domain validation failed.") -> None:
        super().__init__(message=message, code="DOMAIN_VALIDATION_ERROR")


from src.domain.exceptions.ai_exceptions import (  # noqa: E402
    ClauseAnalysisError,
    StructuredOutputValidationError,
)
from src.domain.exceptions.ingestion_exceptions import (  # noqa: E402
    DocumentTooLargeError,
    EmptyDocumentError,
    InvalidDocumentFormatError,
)
from src.domain.exceptions.playbook_exceptions import (  # noqa: E402
    EmbeddingGenerationError,
    InvalidPlaybookRuleError,
    PlaybookRuleNotFoundError,
)

__all__ = [
    "ClauseAnalysisError",
    "ConcurrencyConflictError",
    "DocumentTooLargeError",
    "DomainError",
    "DomainValidationError",
    "DuplicateEntityError",
    "EmbeddingGenerationError",
    "EmptyDocumentError",
    "EntityNotFoundError",
    "ForbiddenRoleError",
    "InvalidDocumentFormatError",
    "InvalidPlaybookRuleError",
    "PlaybookRuleNotFoundError",
    "StructuredOutputValidationError",
    "TenantIsolationError",
    "UnauthorizedError",
]

