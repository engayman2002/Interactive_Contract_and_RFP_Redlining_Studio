"""Domain exceptions for Phase 6 Collaboration, Threaded Comments, and One-Click Resolution."""

from src.domain.exceptions import DomainValidationError, EntityNotFoundError


class SuggestionNotFoundError(EntityNotFoundError):
    """Raised when a target `RedlineSuggestion` does not exist within the tenant's organization."""

    def __init__(
        self,
        message: str = "Redline suggestion was not found in your organization.",
    ) -> None:
        super().__init__(message=message)
        self.code = "SUGGESTION_NOT_FOUND"


class ClauseNotFoundError(EntityNotFoundError):
    """Raised when a target `DocumentClause` does not exist within the tenant's organization."""

    def __init__(
        self,
        message: str = "Document clause was not found in your organization.",
    ) -> None:
        super().__init__(message=message)
        self.code = "CLAUSE_NOT_FOUND"


class InvalidResolutionError(DomainValidationError):
    """Raised when a suggestion resolution request violates domain rules."""

    def __init__(
        self,
        message: str = "Invalid redline suggestion resolution parameters.",
    ) -> None:
        super().__init__(message=message)
        self.code = "INVALID_RESOLUTION"


__all__ = [
    "ClauseNotFoundError",
    "InvalidResolutionError",
    "SuggestionNotFoundError",
]
