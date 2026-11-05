"""Domain exceptions for Playbook Rule management and vector embedding generation."""

from src.domain.exceptions import DomainValidationError, EntityNotFoundError


class PlaybookRuleNotFoundError(EntityNotFoundError):
    """Raised when a requested PlaybookRule does not exist within the tenant organization."""

    def __init__(
        self,
        message: str = "Requested playbook rule was not found in your organization.",
    ) -> None:
        super().__init__(message=message)
        self.code = "PLAYBOOK_RULE_NOT_FOUND"


class InvalidPlaybookRuleError(DomainValidationError):
    """Raised when PlaybookRule fields or invariants fail domain validation."""

    def __init__(
        self,
        message: str = "Playbook rule fields are invalid or incomplete.",
    ) -> None:
        super().__init__(message=message)
        self.code = "INVALID_PLAYBOOK_RULE"


class EmbeddingGenerationError(DomainValidationError):
    """Raised when text embedding generation fails or receives empty/invalid input."""

    def __init__(
        self,
        message: str = "Failed to generate valid 1536-dimensional embedding vector.",
    ) -> None:
        super().__init__(message=message)
        self.code = "EMBEDDING_GENERATION_ERROR"


__all__ = [
    "EmbeddingGenerationError",
    "InvalidPlaybookRuleError",
    "PlaybookRuleNotFoundError",
]

