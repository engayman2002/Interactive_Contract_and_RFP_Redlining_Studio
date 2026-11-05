"""Semantic clause segmenter preserving section hierarchy and grouping dependent sub-clauses."""

import re
from collections.abc import Sequence
from typing import Final

from src.domain.entities.parsed_clause import ParsedClauseCandidate, RawDocumentBlock
from src.domain.exceptions import EmptyDocumentError
from src.domain.ports.ingestion_ports import ClauseSegmenterPort

DEPENDENT_SUBCLAUSE_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(?:\([a-zA-Z]{1,4}\)|\([0-9]{1,3}\)|[a-zA-Z]\)|\d+\)|[•\-–—\*])\s+"
)

NEW_TOP_CLAUSE_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(?:\d+(?:\.\d+)*\.?\s+|Section\s+\d+|ARTICLE\s+[IVXLCDM0-9]+|Clause\s+\d+)",
    re.IGNORECASE,
)

STEM_ENDING_SUFFIXES: Final[tuple[str, ...]] = (
    ":",
    ";",
    "; and",
    "; or",
    "as follows:",
    "the following:",
    "including:",
    "provided that:",
    "subject to:",
)

INLINE_CLAUSE_HEADING_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(\d+(?:\.\d+)*\.?\s+[A-Z][A-Za-z0-9\s,&/-]{1,65}?)\.\s+.+"
)


class SemanticClauseSegmenter(ClauseSegmenterPort):
    """Group sub-clauses and stems into self-contained `ParsedClauseCandidate` items."""

    @staticmethod
    def _is_dependent_subclause(text: str) -> bool:
        """Return True if `text` starts with a sub-clause marker like `(a)`, `(i)`, or bullet."""
        return bool(DEPENDENT_SUBCLAUSE_PATTERN.match(text.strip()))

    @staticmethod
    def _ends_with_incomplete_stem(text: str) -> bool:
        """Return True if `text` ends with an introductory stem or mid-sentence across pages."""
        stripped = text.rstrip()
        lower = stripped.lower()
        if any(lower.endswith(suffix) for suffix in STEM_ENDING_SUFFIXES):
            return True
        return not stripped.endswith((".", "!", "?", '"', "'", "”", ")"))

    @staticmethod
    def _starts_new_numbered_clause(text: str) -> bool:
        """Return True if `text` begins a new top-level or decimal-numbered contract clause."""
        return bool(NEW_TOP_CLAUSE_PATTERN.match(text.strip()))

    @staticmethod
    def _extract_inline_heading(text: str) -> str | None:
        """Extract inline bold/titled clause heading if present (e.g. '1.1 Definitions. The...')."""
        match = INLINE_CLAUSE_HEADING_PATTERN.match(text.strip())
        if match:
            return match.group(1).strip()
        return None

    def segment(
        self,
        blocks: Sequence[RawDocumentBlock],
    ) -> list[ParsedClauseCandidate]:
        """Transform structural blocks into sequentially ordered `ParsedClauseCandidate` objects."""
        if not blocks:
            raise EmptyDocumentError("Cannot segment an empty block sequence.")

        active_section_heading: str | None = None
        grouped_items: list[tuple[str | None, list[str]]] = []

        for block in blocks:
            text = block.text.strip()
            if not text:
                continue

            if block.is_heading:
                active_section_heading = text
                continue

            # Determine whether this block should merge into the previous clause
            should_merge_with_previous = False
            if grouped_items:
                prev_text = grouped_items[-1][1][-1]
                if self._is_dependent_subclause(text) or (
                    self._ends_with_incomplete_stem(prev_text)
                    and not self._starts_new_numbered_clause(text)
                ) or text[0].islower() and not self._starts_new_numbered_clause(text):
                    should_merge_with_previous = True

            if should_merge_with_previous:
                grouped_items[-1][1].append(text)
            else:
                effective_heading = active_section_heading or self._extract_inline_heading(text)
                grouped_items.append((effective_heading, [text]))

        # Fallback: if a document consisted only of heading-styled blocks, treat them as clauses
        if not grouped_items:
            for block in blocks:
                if block.text.strip():
                    grouped_items.append((block.text.strip(), [block.text.strip()]))

        if not grouped_items:
            raise EmptyDocumentError("No valid contract or RFP clauses could be segmented.")

        candidates: list[ParsedClauseCandidate] = []
        for idx, (heading, paragraphs) in enumerate(grouped_items):
            combined_text = "\n".join(paragraphs).strip()
            candidates.append(
                ParsedClauseCandidate(
                    clause_index=idx,
                    heading=heading,
                    text=combined_text,
                )
            )

        return candidates


__all__ = ["SemanticClauseSegmenter"]
