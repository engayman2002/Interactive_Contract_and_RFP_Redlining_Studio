"""Domain value objects for Playbook hybrid vector + BM25 search queries and ranked results."""

from dataclasses import dataclass
from uuid import UUID

from src.domain.entities import PlaybookRule
from src.domain.exceptions.playbook_exceptions import InvalidPlaybookRuleError


@dataclass(frozen=True, slots=True)
class PlaybookSearchQuery:
    """Immutable query specification for hybrid Playbook Rule retrieval."""

    org_id: UUID
    query_text: str
    category: str | None = None
    top_k: int = 3

    def __post_init__(self) -> None:
        cleaned_query = self.query_text.strip()
        if not cleaned_query:
            raise InvalidPlaybookRuleError("Playbook search query_text cannot be empty.")
        if self.top_k < 1:
            raise InvalidPlaybookRuleError("Playbook search top_k must be >= 1.")
        object.__setattr__(self, "query_text", cleaned_query)
        if self.category is not None:
            cleaned_cat = self.category.strip()
            object.__setattr__(self, "category", cleaned_cat or None)


@dataclass(frozen=True, slots=True)
class MatchedPlaybookRule:
    """Ranked PlaybookRule match with combined, dense vector, and BM25 keyword scores."""

    rule: PlaybookRule
    combined_score: float
    vector_score: float
    keyword_score: float


@dataclass(frozen=True, slots=True)
class ExtractedPlaybookRuleCandidate:
    """AI-extracted Playbook rule candidate derived from a golden reference contract clause."""

    category: str
    standard_position: str
    fallback_position: str
    unacceptable_triggers: list[str]
    source_clause_excerpt: str
    confidence_score: int = 85

    def __post_init__(self) -> None:
        cleaned_cat = self.category.strip()
        cleaned_std = self.standard_position.strip()
        cleaned_fb = self.fallback_position.strip()
        cleaned_excerpt = self.source_clause_excerpt.strip()
        if not cleaned_cat:
            raise InvalidPlaybookRuleError("Extracted rule category cannot be empty.")
        if not cleaned_std:
            raise InvalidPlaybookRuleError("Extracted rule standard_position cannot be empty.")
        if not cleaned_fb:
            raise InvalidPlaybookRuleError("Extracted rule fallback_position cannot be empty.")
        if not cleaned_excerpt:
            raise InvalidPlaybookRuleError(
                "Extracted rule source_clause_excerpt cannot be empty."
            )

        cleaned_triggers = [t.strip() for t in self.unacceptable_triggers if t.strip()]
        if not cleaned_triggers:
            cleaned_triggers = ["uncapped risk exposure", "unilateral counterparty override"]

        clamped_conf = max(0, min(100, int(self.confidence_score)))

        object.__setattr__(self, "category", cleaned_cat)
        object.__setattr__(self, "standard_position", cleaned_std)
        object.__setattr__(self, "fallback_position", cleaned_fb)
        object.__setattr__(self, "unacceptable_triggers", cleaned_triggers)
        object.__setattr__(self, "source_clause_excerpt", cleaned_excerpt)
        object.__setattr__(self, "confidence_score", clamped_conf)


__all__ = [
    "ExtractedPlaybookRuleCandidate",
    "MatchedPlaybookRule",
    "PlaybookSearchQuery",
]
