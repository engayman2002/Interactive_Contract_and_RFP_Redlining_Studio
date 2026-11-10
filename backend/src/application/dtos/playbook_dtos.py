"""Immutable Pydantic v2 DTOs for Phase 3 Playbook & Vector Knowledge Base."""

from uuid import UUID

from pydantic import Field, field_validator

from src.application.dtos import ImmutableDTO
from src.domain.entities import (
    ExtractedPlaybookRuleCandidate,
    MatchedPlaybookRule,
    PlaybookRule,
)
from src.domain.enums import AuditAction, UserRole


def _validate_non_empty_text(value: str, field_label: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"{field_label} must not be empty or whitespace only.")
    return cleaned


class CreatePlaybookRuleRequestDTO(ImmutableDTO):
    """REST request body DTO for creating a Playbook Rule (`POST /api/v1/playbooks/rules`)."""

    category: str = Field(min_length=1, max_length=128)
    standard_position: str = Field(min_length=1, max_length=8000)
    fallback_position: str = Field(min_length=1, max_length=8000)
    unacceptable_triggers: str = Field(min_length=1, max_length=8000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook category")

    @field_validator("standard_position")
    @classmethod
    def validate_standard_position(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook standard_position")

    @field_validator("fallback_position")
    @classmethod
    def validate_fallback_position(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook fallback_position")

    @field_validator("unacceptable_triggers")
    @classmethod
    def validate_unacceptable_triggers(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook unacceptable_triggers")


class UpdatePlaybookRuleRequestDTO(CreatePlaybookRuleRequestDTO):
    """REST request body DTO for updating a Playbook Rule (`PUT /api/v1/playbooks/rules/{id}`)."""


class CreatePlaybookRuleCommand(ImmutableDTO):
    """Application command DTO encapsulating tenant and role context for Playbook Rule creation."""

    org_id: UUID
    actor_role: UserRole
    category: str = Field(min_length=1, max_length=128)
    standard_position: str = Field(min_length=1, max_length=8000)
    fallback_position: str = Field(min_length=1, max_length=8000)
    unacceptable_triggers: str = Field(min_length=1, max_length=8000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook category")

    @field_validator("standard_position")
    @classmethod
    def validate_standard_position(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook standard_position")

    @field_validator("fallback_position")
    @classmethod
    def validate_fallback_position(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook fallback_position")

    @field_validator("unacceptable_triggers")
    @classmethod
    def validate_unacceptable_triggers(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Playbook unacceptable_triggers")


class UpdatePlaybookRuleCommand(CreatePlaybookRuleCommand):
    """Application command DTO encapsulating tenant, rule ID, and role context for rule updates."""

    rule_id: UUID


class PlaybookRuleResponseDTO(ImmutableDTO):
    """Output DTO representing a persisted Playbook Rule and its embedding dimensionality."""

    id: UUID
    org_id: UUID
    category: str
    standard_position: str
    fallback_position: str
    unacceptable_triggers: str
    embedding_dim: int

    @classmethod
    def from_domain(cls, rule: PlaybookRule) -> "PlaybookRuleResponseDTO":
        """Construct a response DTO from a pure `PlaybookRule` domain entity."""
        return cls(
            id=rule.id,
            org_id=rule.org_id,
            category=rule.category,
            standard_position=rule.standard_position,
            fallback_position=rule.fallback_position,
            unacceptable_triggers=rule.unacceptable_triggers,
            embedding_dim=len(rule.embedding) if rule.embedding is not None else 0,
        )


class PlaybookSearchRequestDTO(ImmutableDTO):
    """Input DTO for hybrid semantic + keyword search across an organization's Playbook Rules."""

    query_text: str = Field(min_length=1, max_length=16000)
    category: str | None = Field(default=None, max_length=128)
    top_k: int = Field(default=3, ge=1, le=50)

    @field_validator("query_text")
    @classmethod
    def validate_query_text(cls, value: str) -> str:
        return _validate_non_empty_text(value, "Search query_text")

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned if cleaned else None


class MatchedPlaybookRuleResponseDTO(ImmutableDTO):
    """Output DTO representing a single ranked Playbook Rule match from hybrid search."""

    rule: PlaybookRuleResponseDTO
    combined_score: float
    vector_score: float
    keyword_score: float

    @classmethod
    def from_domain(cls, match: MatchedPlaybookRule) -> "MatchedPlaybookRuleResponseDTO":
        """Construct a ranked match DTO from a `MatchedPlaybookRule` domain value object."""
        return cls(
            rule=PlaybookRuleResponseDTO.from_domain(match.rule),
            combined_score=match.combined_score,
            vector_score=match.vector_score,
            keyword_score=match.keyword_score,
        )


class PlaybookSearchResponseDTO(ImmutableDTO):
    """Output DTO for `POST /api/v1/playbooks/search` with ranked results and execution time."""

    results: list[MatchedPlaybookRuleResponseDTO]
    execution_time_ms: float


class ExtractedPlaybookRuleCandidateDTO(ImmutableDTO):
    """Output DTO representing a single AI-extracted Playbook rule candidate."""

    category: str
    standard_position: str
    fallback_position: str
    unacceptable_triggers: list[str]
    source_clause_excerpt: str
    confidence_score: int = Field(ge=0, le=100)

    @classmethod
    def from_domain(
        cls,
        candidate: ExtractedPlaybookRuleCandidate,
    ) -> "ExtractedPlaybookRuleCandidateDTO":
        """Construct an extracted rule candidate DTO from its domain entity."""
        return cls(
            category=candidate.category,
            standard_position=candidate.standard_position,
            fallback_position=candidate.fallback_position,
            unacceptable_triggers=list(candidate.unacceptable_triggers),
            source_clause_excerpt=candidate.source_clause_excerpt,
            confidence_score=candidate.confidence_score,
        )


class ExtractPlaybookFromTextRequestDTO(ImmutableDTO):
    """Input DTO for extracting Playbook rules from pasted golden contract text."""

    reference_text: str = Field(min_length=20, max_length=200000)
    max_rules: int = Field(default=6, ge=1, le=20)
    auto_save: bool = Field(default=True)

    @field_validator("reference_text")
    @classmethod
    def validate_reference_text(cls, value: str) -> str:
        cleaned = _validate_non_empty_text(value, "Reference golden contract text")
        if len(cleaned) < 20:
            raise ValueError("Reference golden contract text must be at least 20 characters.")
        return cleaned


class ExtractPlaybookResponseDTO(ImmutableDTO):
    """Output DTO for `POST /api/v1/playbooks/extract-from-text` and `/extract-from-file`."""

    extracted_count: int = Field(ge=0)
    auto_saved: bool
    audit_action: AuditAction = AuditAction.PLAYBOOK_AUTO_EXTRACTED
    candidates: list[ExtractedPlaybookRuleCandidateDTO]
    saved_rules: list[PlaybookRuleResponseDTO]
    latency_ms: float = Field(ge=0.0)


__all__ = [
    "CreatePlaybookRuleCommand",
    "CreatePlaybookRuleRequestDTO",
    "ExtractPlaybookFromTextRequestDTO",
    "ExtractPlaybookResponseDTO",
    "ExtractedPlaybookRuleCandidateDTO",
    "MatchedPlaybookRuleResponseDTO",
    "PlaybookRuleResponseDTO",
    "PlaybookSearchRequestDTO",
    "PlaybookSearchResponseDTO",
    "UpdatePlaybookRuleCommand",
    "UpdatePlaybookRuleRequestDTO",
]
