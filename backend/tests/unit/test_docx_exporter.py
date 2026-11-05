"""Unit tests for Phase 7 Native Word OpenXML Track-Changes and Clean DOCX Exporter."""

import io
import zipfile
from datetime import UTC, datetime
from uuid import uuid4

from docx import Document as LoadDocxDocument
from src.domain.entities import (
    ClauseComment,
    Document,
    DocumentClause,
    RedlineSuggestion,
)
from src.domain.enums import ExportMode, RiskLevel, SuggestionStatus
from src.infrastructure.parsers import NativeWordDocxExporter


def _read_document_xml(docx_bytes: bytes) -> str:
    """Extract raw `word/document.xml` string from a `.docx` ZIP archive."""
    with zipfile.ZipFile(io.BytesIO(docx_bytes), mode="r") as archive:
        return archive.read("word/document.xml").decode("utf-8")


def test_docx_exporter_track_changes_embeds_native_openxml_ins_and_del_tags() -> None:
    """Verify `track_changes` mode generates valid `.docx` with `<w:ins>` and `<w:del>` markup."""
    org_id = uuid4()
    user_id = uuid4()
    doc = Document(
        org_id=org_id,
        title="Master SaaS Agreement",
        created_by=user_id,
    )
    clause_0 = DocumentClause(
        document_id=doc.id,
        clause_index=0,
        heading="Section 8. Limitation of Liability",
        original_text="Provider liability shall be unlimited for all claims.",
        current_text="Provider liability shall be capped at 12 months of fees for all claims.",
        version=2,
    )
    clause_1 = DocumentClause(
        document_id=doc.id,
        clause_index=1,
        heading="Section 9. Governing Law",
        original_text="This Agreement is governed by Delaware law.",
        current_text="This Agreement is governed by Delaware law.",
        version=1,
    )
    suggestion = RedlineSuggestion(
        clause_id=clause_0.id,
        risk=RiskLevel.CRITICAL,
        proposed_text=clause_0.current_text,
        rationale="Playbook requires mutual super-cap at 12 months of fees.",
        status=SuggestionStatus.ACCEPTED,
        resolved_by=user_id,
        resolved_at=datetime(2026, 11, 5, 14, 30, 0, tzinfo=UTC),
    )
    comment = ClauseComment(
        clause_id=clause_0.id,
        author_id=user_id,
        body="Approved cap language with VP of Legal.",
    )

    exporter = NativeWordDocxExporter()
    docx_bytes = exporter.generate_docx(
        document=doc,
        clauses=[clause_1, clause_0],
        suggestions=[suggestion],
        comments=[comment],
        mode=ExportMode.TRACK_CHANGES,
        author_name="AI Redlining Studio (LEGAL_COUNSEL)",
    )

    assert docx_bytes.startswith(b"PK\x03\x04")
    parsed_doc = LoadDocxDocument(io.BytesIO(docx_bytes))
    all_paragraphs_text = "\n".join(p.text for p in parsed_doc.paragraphs)
    assert "Master SaaS Agreement" in all_paragraphs_text
    assert "Section 8. Limitation of Liability" in all_paragraphs_text
    assert "Playbook requires mutual super-cap at 12 months of fees." in all_paragraphs_text
    assert "Approved cap language with VP of Legal." in all_paragraphs_text

    raw_xml = _read_document_xml(docx_bytes)
    assert "<w:del " in raw_xml
    assert "<w:delText" in raw_xml
    assert "unlimited" in raw_xml
    assert "<w:ins " in raw_xml
    assert "capped at 12 months of fees" in raw_xml
    assert 'w:author="AI Redlining Studio (LEGAL_COUNSEL)"' in raw_xml
    assert 'w:date="2026-11-05T14:30:00Z"' in raw_xml
    assert "<w:commentRangeStart" in raw_xml
    assert "<w:commentRangeEnd" in raw_xml


def test_docx_exporter_clean_mode_produces_finalized_text_without_revision_markup() -> None:
    """Verify `clean` mode outputs finalized clause text with zero `<w:ins>` or `<w:del>` tags."""
    org_id = uuid4()
    user_id = uuid4()
    doc = Document(
        org_id=org_id,
        title="Master SaaS Agreement",
        created_by=user_id,
    )
    clause_0 = DocumentClause(
        document_id=doc.id,
        clause_index=0,
        heading="Section 8. Limitation of Liability",
        original_text="Provider liability shall be unlimited for all claims.",
        current_text="Provider liability shall be capped at 12 months of fees for all claims.",
        version=2,
    )
    suggestion = RedlineSuggestion(
        clause_id=clause_0.id,
        risk=RiskLevel.CRITICAL,
        proposed_text=clause_0.current_text,
        rationale="Playbook requires mutual super-cap at 12 months of fees.",
        status=SuggestionStatus.ACCEPTED,
        resolved_by=user_id,
    )
    comment = ClauseComment(
        clause_id=clause_0.id,
        author_id=user_id,
        body="Approved cap language with VP of Legal.",
    )

    exporter = NativeWordDocxExporter()
    docx_bytes = exporter.generate_docx(
        document=doc,
        clauses=[clause_0],
        suggestions=[suggestion],
        comments=[comment],
        mode=ExportMode.CLEAN,
    )

    assert docx_bytes.startswith(b"PK\x03\x04")
    parsed_doc = LoadDocxDocument(io.BytesIO(docx_bytes))
    all_paragraphs_text = "\n".join(p.text for p in parsed_doc.paragraphs)
    assert "capped at 12 months of fees" in all_paragraphs_text
    assert "unlimited" not in all_paragraphs_text
    assert "Approved cap language" not in all_paragraphs_text

    raw_xml = _read_document_xml(docx_bytes)
    assert "<w:del " not in raw_xml
    assert "<w:delText" not in raw_xml
    assert "<w:ins " not in raw_xml
    assert "<w:commentRangeStart" not in raw_xml

