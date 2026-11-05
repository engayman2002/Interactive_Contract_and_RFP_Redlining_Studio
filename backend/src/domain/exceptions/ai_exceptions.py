"""Domain exceptions for Phase 4 AI Clause Analysis and Structured Output Validation."""

from src.domain.exceptions import DomainError, DomainValidationError


class ClauseAnalysisError(DomainError):
    """Raised when an AI clause audit pipeline execution fails after retry attempts."""

    def __init__(
        self,
        message: str = "AI clause redline evaluation failed.",
    ) -> None:
        super().__init__(message=message, code="CLAUSE_ANALYSIS_ERROR")


class StructuredOutputValidationError(DomainValidationError):
    """Raised when an LLM output fails structured JSON / schema validation after retries."""

    def __init__(
        self,
        message: str = "LLM output failed structured schema validation after maximum retries.",
    ) -> None:
        super().__init__(message=message)
        self.code = "STRUCTURED_OUTPUT_VALIDATION_ERROR"


__all__ = [
    "ClauseAnalysisError",
    "StructuredOutputValidationError",
]

