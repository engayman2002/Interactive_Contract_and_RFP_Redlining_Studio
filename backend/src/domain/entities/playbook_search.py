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


__all__ = [
    "MatchedPlaybookRule",
    "PlaybookSearchQuery",
]
