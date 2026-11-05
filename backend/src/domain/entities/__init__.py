"""Pure domain entities with zero ORM or framework imports."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.domain.enums import DocumentStatus, RiskLevel, SuggestionStatus, UserRole
from src.domain.exceptions import (
    ConcurrencyConflictError,
    DomainValidationError,
    InvalidPlaybookRuleError,
)


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class Organization:
    """Tenant organization entity."""

    name: str
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)

    def __post_init__(self) -> None:
        cleaned = self.name.strip()
        if not cleaned:
            raise DomainValidationError("Organization name cannot be empty.")
        self.name = cleaned


@dataclass(slots=True)
class User:
    """Organization-scoped user entity with RBAC role."""

    org_id: UUID
    email: str
    role: UserRole = UserRole.VIEWER
    password_hash: str = ""
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)

    def __post_init__(self) -> None:
        normalized_email = self.email.strip().lower()
        if not normalized_email or "@" not in normalized_email:
            raise DomainValidationError("A valid email address is required.")
        self.email = normalized_email


@dataclass(slots=True)
class PlaybookRule:
    """Company playbook rule benchmarked against contract and RFP clauses."""

    org_id: UUID
    category: str
    standard_position: str
    fallback_position: str
    unacceptable_triggers: str
    embedding: list[float] = field(default_factory=list)
    id: UUID = field(default_factory=uuid4)

    def __post_init__(self) -> None:
        cleaned_cat = self.category.strip()
        cleaned_std = self.standard_position.strip()
        cleaned_fb = self.fallback_position.strip()
        cleaned_trig = self.unacceptable_triggers.strip()
        if not cleaned_cat:
            raise InvalidPlaybookRuleError("Playbook rule category cannot be empty.")
        if not cleaned_std:
            raise InvalidPlaybookRuleError("Playbook rule standard_position cannot be empty.")
        if not cleaned_fb:
            raise InvalidPlaybookRuleError("Playbook rule fallback_position cannot be empty.")
        if not cleaned_trig:
            raise InvalidPlaybookRuleError("Playbook rule unacceptable_triggers cannot be empty.")
        if self.embedding and len(self.embedding) != 1536:
            raise InvalidPlaybookRuleError("Playbook rule embedding must have dimension 1536.")
        self.category = cleaned_cat
        self.standard_position = cleaned_std
        self.fallback_position = cleaned_fb
        self.unacceptable_triggers = cleaned_trig


@dataclass(slots=True)
class Document:
    """Contract or RFP document entity guarded by optimistic concurrency control."""

    org_id: UUID
    title: str
    created_by: UUID
    status: str = DocumentStatus.PROCESSING.value
    version: int = 1
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)

    def __post_init__(self) -> None:
        cleaned_title = self.title.strip()
        if not cleaned_title:
            raise DomainValidationError("Document title cannot be empty.")
        if self.version < 1:
            raise DomainValidationError("Document version must be >= 1.")
        self.title = cleaned_title

    def increment_version(self, expected_version: int) -> None:
        """Increment document version after verifying optimistic concurrency."""
        if self.version != expected_version:
            raise ConcurrencyConflictError(
                f"Document version mismatch: expected {expected_version}, found {self.version}."
            )
        self.version += 1


@dataclass(slots=True)
class DocumentClause:
    """Individual contract or RFP clause node mapped to ProseMirror editor state."""

    document_id: UUID
    clause_index: int
    original_text: str
    current_text: str
    heading: str | None = None
    version: int = 1
    id: UUID = field(default_factory=uuid4)

    def __post_init__(self) -> None:
        if self.clause_index < 0:
            raise DomainValidationError("clause_index must be non-negative.")
        if not self.original_text.strip():
            raise DomainValidationError("Clause original_text cannot be empty.")
        if not self.current_text.strip():
            raise DomainValidationError("Clause current_text cannot be empty.")
        if self.version < 1:
            raise DomainValidationError("Clause version must be >= 1.")

    def apply_text_revision(self, new_text: str, expected_version: int) -> None:
        """Apply a redline or manual revision using optimistic concurrency."""
        if self.version != expected_version:
            raise ConcurrencyConflictError(
                f"Clause version mismatch: expected {expected_version}, found {self.version}."
            )
        cleaned = new_text.strip()
        if not cleaned:
            raise DomainValidationError("Revised clause text cannot be empty.")
        self.current_text = cleaned
        self.version += 1


@dataclass(slots=True)
class RedlineSuggestion:
    """AI-generated redline suggestion linked to a specific document clause."""

    clause_id: UUID
    risk: RiskLevel
    proposed_text: str
    rationale: str
    matched_rule_id: UUID | None = None
    status: SuggestionStatus = SuggestionStatus.PENDING
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)

    def resolve(
        self,
        new_status: SuggestionStatus,
        resolved_by: UUID,
        modified_text: str | None = None,
    ) -> None:
        """Resolve a suggestion idempotently."""
        if new_status == SuggestionStatus.PENDING:
            raise DomainValidationError("Cannot resolve a suggestion back to PENDING.")
        if new_status == SuggestionStatus.MODIFIED and modified_text:
            self.proposed_text = modified_text.strip()
        self.status = new_status
        self.resolved_by = resolved_by
        self.resolved_at = _utc_now()


@dataclass(slots=True)
class ClauseComment:
    """Threaded comment anchored to a specific contract clause."""

    clause_id: UUID
    author_id: UUID
    body: str
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_utc_now)

    def __post_init__(self) -> None:
        cleaned = self.body.strip()
        if not cleaned:
            raise DomainValidationError("Comment body cannot be empty.")
        self.body = cleaned


from src.domain.entities.parsed_clause import (  # noqa: E402
    DocumentWithClauses,
    ParsedClauseCandidate,
    RawDocumentBlock,
)
from src.domain.entities.playbook_search import (  # noqa: E402
    MatchedPlaybookRule,
    PlaybookSearchQuery,
)
from src.domain.entities.redline_analysis import (  # noqa: E402
    AuditEventType,
    AuditProgressEvent,
    ClauseAuditInput,
    ClauseAuditResult,
)

__all__ = [
    "AuditEventType",
    "AuditProgressEvent",
    "ClauseAuditInput",
    "ClauseAuditResult",
    "ClauseComment",
    "Document",
    "DocumentClause",
    "DocumentWithClauses",
    "MatchedPlaybookRule",
    "Organization",
    "ParsedClauseCandidate",
    "PlaybookRule",
    "PlaybookSearchQuery",
    "RawDocumentBlock",
    "RedlineSuggestion",
    "User",
]

