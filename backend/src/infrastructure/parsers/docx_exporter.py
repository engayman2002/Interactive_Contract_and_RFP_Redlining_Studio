"""Native Word OpenXML Track-Changes (`<w:ins>`, `<w:del>`) and Clean DOCX Export Adapter."""

import difflib
import io
import re
from collections import defaultdict
from datetime import UTC, datetime
from uuid import UUID

from docx import Document as CreateDocxDocument
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph

from src.domain.entities import (
    ClauseComment,
    Document,
    DocumentClause,
    RedlineSuggestion,
)
from src.domain.enums import ExportMode, SuggestionStatus

TOKEN_SPLIT_PATTERN = re.compile(r"\S+\s*|\s+")


def _format_openxml_date(dt: datetime | None) -> str:
    """Format a datetime as an OpenXML ISO-8601 UTC timestamp (`YYYY-MM-DDTHH:MM:SSZ`)."""
    target = dt if dt is not None else datetime.now(UTC)
    if target.tzinfo is None:
        target = target.replace(tzinfo=UTC)
    return target.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _append_standard_run(paragraph: Paragraph, text: str) -> None:
    """Append a standard OpenXML `<w:r><w:t xml:space="preserve">...</w:t></w:r>` element."""
    if not text:
        return
    run_el = OxmlElement("w:r")
    text_el = OxmlElement("w:t")
    text_el.set(qn("xml:space"), "preserve")
    text_el.text = text
    run_el.append(text_el)
    paragraph._p.append(run_el)


def _append_tracked_deletion(
    paragraph: Paragraph,
    deleted_text: str,
    revision_id: int,
    author_name: str,
    iso_date: str,
) -> None:
    """Append a native Word OpenXML `<w:del>` element containing `<w:delText>`."""
    if not deleted_text:
        return
    del_el = OxmlElement("w:del")
    del_el.set(qn("w:id"), str(revision_id))
    del_el.set(qn("w:author"), author_name)
    del_el.set(qn("w:date"), iso_date)

    run_el = OxmlElement("w:r")
    del_text_el = OxmlElement("w:delText")
    del_text_el.set(qn("xml:space"), "preserve")
    del_text_el.text = deleted_text
    run_el.append(del_text_el)
    del_el.append(run_el)
    paragraph._p.append(del_el)


def _append_tracked_insertion(
    paragraph: Paragraph,
    inserted_text: str,
    revision_id: int,
    author_name: str,
    iso_date: str,
) -> None:
    """Append a native Word OpenXML `<w:ins>` element containing `<w:t>`."""
    if not inserted_text:
        return
    ins_el = OxmlElement("w:ins")
    ins_el.set(qn("w:id"), str(revision_id))
    ins_el.set(qn("w:author"), author_name)
    ins_el.set(qn("w:date"), iso_date)

    run_el = OxmlElement("w:r")
    text_el = OxmlElement("w:t")
    text_el.set(qn("xml:space"), "preserve")
    text_el.text = inserted_text
    run_el.append(text_el)
    ins_el.append(run_el)
    paragraph._p.append(ins_el)


def _append_comment_range_start(paragraph: Paragraph, comment_id: int) -> None:
    """Append an OpenXML `<w:commentRangeStart w:id="..."/>` anchor to a clause paragraph."""
    start_el = OxmlElement("w:commentRangeStart")
    start_el.set(qn("w:id"), str(comment_id))
    paragraph._p.append(start_el)


def _append_comment_range_end(paragraph: Paragraph, comment_id: int) -> None:
    """Append an OpenXML `<w:commentRangeEnd w:id="..."/>` anchor to a clause paragraph."""
    end_el = OxmlElement("w:commentRangeEnd")
    end_el.set(qn("w:id"), str(comment_id))
    paragraph._p.append(end_el)


class NativeWordDocxExporter:
    """Reconstructs a valid `.docx` file with native Word Track Changes or clean text."""

    def generate_docx(
        self,
        document: Document,
        clauses: list[DocumentClause],
        suggestions: list[RedlineSuggestion],
        comments: list[ClauseComment],
        mode: ExportMode,
        author_name: str = "AI Redlining Studio",
    ) -> bytes:
        """Generate `.docx` bytes in either `track_changes` or `clean` mode."""
        doc = CreateDocxDocument()
        doc.add_heading(document.title, level=1)

        suggestions_by_clause: dict[UUID, list[RedlineSuggestion]] = defaultdict(list)
        for suggestion in suggestions:
            suggestions_by_clause[suggestion.clause_id].append(suggestion)

        comments_by_clause: dict[UUID, list[ClauseComment]] = defaultdict(list)
        for comment in comments:
            comments_by_clause[comment.clause_id].append(comment)

        ordered_clauses = sorted(clauses, key=lambda c: c.clause_index)
        revision_id = 1
        comment_anchor_id = 1

        for clause in ordered_clauses:
            heading_text = clause.heading or f"Clause {clause.clause_index + 1}"
            doc.add_heading(heading_text, level=2)
            paragraph = doc.add_paragraph()

            clause_suggestions = suggestions_by_clause.get(clause.id, [])
            resolved_suggestions = [
                s
                for s in clause_suggestions
                if s.status in (SuggestionStatus.ACCEPTED, SuggestionStatus.MODIFIED)
            ]
            clause_comments = comments_by_clause.get(clause.id, [])
            has_annotations = bool(resolved_suggestions or clause_comments)

            if mode == ExportMode.CLEAN:
                paragraph.add_run(clause.current_text)
                continue

            # Track Changes Mode
            if has_annotations:
                _append_comment_range_start(paragraph, comment_anchor_id)

            if clause.current_text == clause.original_text:
                _append_standard_run(paragraph, clause.current_text)
            else:
                latest_resolved_at = max(
                    (s.resolved_at for s in resolved_suggestions if s.resolved_at is not None),
                    default=document.created_at,
                )
                iso_date = _format_openxml_date(latest_resolved_at)

                orig_tokens = TOKEN_SPLIT_PATTERN.findall(clause.original_text)
                curr_tokens = TOKEN_SPLIT_PATTERN.findall(clause.current_text)
                matcher = difflib.SequenceMatcher(a=orig_tokens, b=curr_tokens, autojunk=False)

                for tag, i1, i2, j1, j2 in matcher.get_opcodes():
                    if tag == "equal":
                        _append_standard_run(paragraph, "".join(orig_tokens[i1:i2]))
                    elif tag == "delete":
                        _append_tracked_deletion(
                            paragraph=paragraph,
                            deleted_text="".join(orig_tokens[i1:i2]),
                            revision_id=revision_id,
                            author_name=author_name,
                            iso_date=iso_date,
                        )
                        revision_id += 1
                    elif tag == "insert":
                        _append_tracked_insertion(
                            paragraph=paragraph,
                            inserted_text="".join(curr_tokens[j1:j2]),
                            revision_id=revision_id,
                            author_name=author_name,
                            iso_date=iso_date,
                        )
                        revision_id += 1
                    elif tag == "replace":
                        _append_tracked_deletion(
                            paragraph=paragraph,
                            deleted_text="".join(orig_tokens[i1:i2]),
                            revision_id=revision_id,
                            author_name=author_name,
                            iso_date=iso_date,
                        )
                        revision_id += 1
                        _append_tracked_insertion(
                            paragraph=paragraph,
                            inserted_text="".join(curr_tokens[j1:j2]),
                            revision_id=revision_id,
                            author_name=author_name,
                            iso_date=iso_date,
                        )
                        revision_id += 1

            if has_annotations:
                _append_comment_range_end(paragraph, comment_anchor_id)
                comment_anchor_id += 1

            for suggestion in resolved_suggestions:
                callout = doc.add_paragraph()
                label_run = callout.add_run(
                    f"[AI Redline Rationale — {suggestion.status.value.upper()} | "
                    f"Risk: {suggestion.risk.value.upper()}] "
                )
                label_run.bold = True
                body_run = callout.add_run(suggestion.rationale)
                body_run.italic = True

            for comment in clause_comments:
                comment_para = doc.add_paragraph()
                author_run = comment_para.add_run(
                    f"[Reviewer Comment — Author {comment.author_id}] "
                )
                author_run.bold = True
                text_run = comment_para.add_run(comment.body)
                text_run.italic = True

        buffer = io.BytesIO()
        doc.save(buffer)
        return buffer.getvalue()


__all__ = ["NativeWordDocxExporter"]
