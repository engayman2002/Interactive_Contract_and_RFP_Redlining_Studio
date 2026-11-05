"""Domain value objects for structural document blocks and parsed clause candidates."""

from dataclasses import dataclass

from src.domain.entities import Document, DocumentClause
from src.domain.exceptions import DomainValidationError


@dataclass(frozen=True, slots=True)
class RawDocumentBlock:
    """Raw structural block (heading or paragraph) extracted from a DOCX or PDF stream."""

    text: str
    is_heading: bool = False
    heading_level: int | None = None
    style_name: str | None = None
    page_number: int | None = None

    def __post_init__(self) -> None:
        cleaned = self.text.strip()
        if not cleaned:
            raise DomainValidationError("RawDocumentBlock text cannot be empty.")
        object.__setattr__(self, "text", cleaned)


@dataclass(frozen=True, slots=True)
class ParsedClauseCandidate:
    """Self-contained, sequentially indexed clause candidate produced by semantic segmentation."""

    clause_index: int
    heading: str | None
    text: str

    def __post_init__(self) -> None:
        if self.clause_index < 0:
            raise DomainValidationError("ParsedClauseCandidate clause_index must be >= 0.")
        cleaned_text = self.text.strip()
        if not cleaned_text:
            raise DomainValidationError("ParsedClauseCandidate text cannot be empty.")
        object.__setattr__(self, "text", cleaned_text)
        if self.heading is not None:
            cleaned_heading = self.heading.strip()
            object.__setattr__(self, "heading", cleaned_heading or None)


@dataclass(frozen=True, slots=True)
class DocumentWithClauses:
    """Aggregate pairing a persisted Document with its ordered DocumentClause items."""

    document: Document
    clauses: list[DocumentClause]


__all__ = [
    "DocumentWithClauses",
    "ParsedClauseCandidate",
    "RawDocumentBlock",
]

