"""Domain exceptions for document ingestion, format validation, and payload constraints."""

from src.domain.exceptions import DomainValidationError


class InvalidDocumentFormatError(DomainValidationError):
    """Raised when an uploaded document has an invalid format, MIME type, or corrupt structure."""

    def __init__(
        self,
        message: str = (
            "Unsupported or corrupted document format. "
            "Only valid .docx and .pdf files are accepted."
        ),
    ) -> None:
        super().__init__(message=message)
        self.code = "INVALID_DOCUMENT_FORMAT"


class EmptyDocumentError(DomainValidationError):
    """Raised when an uploaded document contains zero bytes or no extractable clauses."""

    def __init__(
        self,
        message: str = "Uploaded document is empty or contains no extractable text clauses.",
    ) -> None:
        super().__init__(message=message)
        self.code = "EMPTY_DOCUMENT"


class DocumentTooLargeError(DomainValidationError):
    """Raised when an uploaded document exceeds the maximum allowed byte size."""

    def __init__(
        self,
        message: str = "Uploaded document exceeds the maximum permitted file size.",
    ) -> None:
        super().__init__(message=message)
        self.code = "DOCUMENT_TOO_LARGE"


__all__ = [
    "DocumentTooLargeError",
    "EmptyDocumentError",
    "InvalidDocumentFormatError",
]
