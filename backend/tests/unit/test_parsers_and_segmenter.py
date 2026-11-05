"""Unit tests for DOCX/PDF structural parsers, semantic clause segmenter, and file storage."""

import io
import zipfile
from pathlib import Path
from uuid import uuid4

import pytest
from docx import Document as CreateDocxDocument
from src.domain.exceptions import (
    EmptyDocumentError,
    InvalidDocumentFormatError,
    TenantIsolationError,
)
from src.infrastructure.parsers import (
    CompositeDocumentParser,
    LocalS3CompatibleStorageAdapter,
    SemanticClauseSegmenter,
)

SECTION_TITLES: tuple[str, ...] = (
    "DEFINITIONS AND INTERPRETATION",
    "SCOPE OF SERVICES AND DELIVERABLES",
    "TERM AND RENEWAL",
    "FEES, INVOICING, AND PAYMENT TERMS",
    "SERVICE LEVEL AGREEMENTS AND CREDITS",
    "INTELLECTUAL PROPERTY RIGHTS",
    "CONFIDENTIALITY AND NON-DISCLOSURE",
    "DATA PROTECTION AND CYBERSECURITY",
    "REPRESENTATIONS AND WARRANTIES",
    "INDEMNIFICATION OBLIGATIONS",
    "LIMITATION OF LIABILITY",
    "INSURANCE COVERAGE",
    "AUDIT AND COMPLIANCE RIGHTS",
    "TERMINATION AND TRANSITION ASSISTANCE",
    "GOVERNING LAW AND DISPUTE RESOLUTION",
)


def build_30_page_contract_docx_bytes(
    num_sections: int = 15,
    clauses_per_section: int = 8,
) -> bytes:
    """Build a realistic 30-page equivalent contract DOCX (120 clauses across 15 sections)."""
    doc = CreateDocxDocument()
    for sec_idx in range(1, num_sections + 1):
        sec_title = SECTION_TITLES[(sec_idx - 1) % len(SECTION_TITLES)]
        doc.add_heading(f"ARTICLE {sec_idx} - {sec_title}", level=1)

        for sub_idx in range(1, clauses_per_section + 1):
            clause_num = f"{sec_idx}.{sub_idx}"
            if sub_idx % 3 == 0:
                # Clause with an introductory stem followed by dependent sub-clauses (a), (b), (c)
                doc.add_paragraph(
                    f"{clause_num} Covenant and Obligation Stem. Provider shall strictly comply "
                    f"with each of the following mandatory requirements under Article {sec_idx}:"
                )
                doc.add_paragraph(
                    f"(a) maintain continuous SOC 2 Type II and ISO 27001 certifications "
                    f"for {clause_num};"
                )
                doc.add_paragraph(
                    f"(b) notify Customer within twenty-four (24) hours of any security "
                    f"incident affecting {clause_num}; and"
                )
                doc.add_paragraph(
                    f"(c) remediate any identified vulnerability at Provider's sole "
                    f"expense for {clause_num}."
                )
            else:
                doc.add_paragraph(
                    f"{clause_num} Standard Provision. Each party acknowledges and agrees that "
                    f"the obligations set forth in Section {clause_num} of Article {sec_idx} "
                    f"({sec_title}) shall remain in full force and effect throughout the Term."
                )

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_multi_page_contract_pdf_bytes(pages_text_lines: list[list[str]]) -> bytes:
    """Construct a valid multi-page PDF byte stream containing exact text lines per page."""
    objects: list[bytes] = []

    def _add_obj(body: bytes) -> int:
        objects.append(body)
        return len(objects)

    font_obj_id = _add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    pages_placeholder_id = _add_obj(b"")

    page_obj_ids: list[int] = []
    for lines in pages_text_lines:
        content_Commands = ["BT", "/F1 11 Tf", "50 750 Td", "14 TL"]
        for line in lines:
            escaped = _escape_pdf_text(line)
            content_Commands.append(f"({escaped}) Tj T*")
        content_Commands.append("ET")
        stream_bytes = "\n".join(content_Commands).encode("latin-1")
        content_id = _add_obj(
            f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
            + stream_bytes
            + b"\nendstream"
        )
        page_id = _add_obj(
            f"<< /Type /Page /Parent {pages_placeholder_id} 0 R "
            f"/MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_obj_id} 0 R >> >> "
            f"/Contents {content_id} 0 R >>".encode("latin-1")
        )
        page_obj_ids.append(page_id)

    kids_str = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    objects[pages_placeholder_id - 1] = (
        f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_ids)} >>".encode("latin-1")
    )
    catalog_id = _add_obj(
        f"<< /Type /Catalog /Pages {pages_placeholder_id} 0 R >>".encode("latin-1")
    )

    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets: list[int] = [0]
    for idx, obj_body in enumerate(objects, start=1):
        offsets.append(out.tell())
        out.write(f"{idx} 0 obj\n".encode("latin-1"))
        out.write(obj_body)
        out.write(b"\nendobj\n")

    xref_pos = out.tell()
    out.write(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    out.write(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.write(f"{off:010d} 00000 n \n".encode("latin-1"))

    out.write(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n".encode("latin-1")
    )
    return out.getvalue()


def test_30_page_contract_docx_extracts_100_percent_clauses_in_order() -> None:
    """Phase 2 Acceptance: 30-page contract extracts 100% of clauses in sequential order."""
    docx_bytes = build_30_page_contract_docx_bytes(num_sections=15, clauses_per_section=8)
    parser = CompositeDocumentParser()
    segmenter = SemanticClauseSegmenter()

    blocks = parser.parse(
        filename="Enterprise_Master_Services_Agreement.docx",
        file_bytes=docx_bytes,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    clauses = segmenter.segment(blocks)

    # 15 sections * 8 clauses = 120 self-contained clauses
    assert len(clauses) == 120

    expected_idx = 0
    for sec_idx in range(1, 16):
        sec_title = SECTION_TITLES[(sec_idx - 1) % len(SECTION_TITLES)]
        expected_heading = f"ARTICLE {sec_idx} - {sec_title}"

        for sub_idx in range(1, 9):
            candidate = clauses[expected_idx]
            clause_num = f"{sec_idx}.{sub_idx}"

            assert candidate.clause_index == expected_idx
            assert candidate.heading == expected_heading
            assert candidate.text.startswith(f"{clause_num} ")

            # Verify sub-clauses (a), (b), (c) were grouped into their parent obligation stem
            if sub_idx % 3 == 0:
                assert "(a) maintain continuous SOC 2 Type II" in candidate.text
                assert "(b) notify Customer within twenty-four (24) hours" in candidate.text
                assert "(c) remediate any identified vulnerability" in candidate.text

            expected_idx += 1


def test_multi_page_pdf_parser_strips_headers_footers_and_preserves_hierarchy() -> None:
    """Verify PDF parser removes repetitive headers/footers/page numbers and preserves clauses."""
    pages = [
        [
            "CONFIDENTIAL MASTER RFP AGREEMENT",
            "ARTICLE 1 - DEFINITIONS AND SCOPE",
            "1.1 Scope of Work. Supplier shall deliver the platform components:",
            "(a) Core ingestion service; and",
            "(b) Semantic redlining engine.",
            "1.2 Service Availability. The platform shall achieve 99.99% uptime.",
            "Page 1 of 3",
        ],
        [
            "CONFIDENTIAL MASTER RFP AGREEMENT",
            "ARTICLE 2 - DATA SECURITY AND PRIVACY",
            "2.1 Encryption Standards. All customer data shall be encrypted at rest using AES-256.",
            "2.2 Breach Notification. Supplier shall report unauthorized access within 12 hours.",
            "Page 2 of 3",
        ],
        [
            "CONFIDENTIAL MASTER RFP AGREEMENT",
            "ARTICLE 3 - LIMITATION OF LIABILITY",
            "3.1 Liability Cap. Neither party's aggregate liability shall exceed 2x annual fees.",
            "Page 3 of 3",
        ],
    ]
    pdf_bytes = build_multi_page_contract_pdf_bytes(pages)

    parser = CompositeDocumentParser()
    segmenter = SemanticClauseSegmenter()

    blocks = parser.parse(
        filename="Cloud_Security_RFP.pdf",
        file_bytes=pdf_bytes,
        content_type="application/pdf",
    )
    clauses = segmenter.segment(blocks)

    assert len(clauses) == 5
    assert [c.clause_index for c in clauses] == [0, 1, 2, 3, 4]

    assert clauses[0].heading == "ARTICLE 1 - DEFINITIONS AND SCOPE"
    assert clauses[0].text.startswith("1.1 Scope of Work.")
    assert "(a) Core ingestion service; and" in clauses[0].text
    assert "(b) Semantic redlining engine." in clauses[0].text

    assert clauses[1].heading == "ARTICLE 1 - DEFINITIONS AND SCOPE"
    assert clauses[1].text.startswith("1.2 Service Availability.")

    assert clauses[2].heading == "ARTICLE 2 - DATA SECURITY AND PRIVACY"
    assert clauses[2].text.startswith("2.1 Encryption Standards.")

    assert clauses[4].heading == "ARTICLE 3 - LIMITATION OF LIABILITY"
    assert clauses[4].text.startswith("3.1 Liability Cap.")

    # Ensure repetitive running header and page numbers were stripped
    for c in clauses:
        assert "CONFIDENTIAL MASTER RFP AGREEMENT" not in c.text
        assert "Page " not in c.text


def test_parser_rejects_unsupported_corrupted_empty_and_malicious_archives() -> None:
    """Verify unsupported extensions, empty files, corrupted files, and XXE are blocked."""
    parser = CompositeDocumentParser()

    # 1. Empty payload
    with pytest.raises(EmptyDocumentError):
        parser.parse(filename="empty.docx", file_bytes=b"")

    # 2. Unsupported file extensions (.exe, .txt)
    for bad_filename in ("malware.exe", "notes.txt", "archive.zip"):
        with pytest.raises(InvalidDocumentFormatError):
            parser.parse(filename=bad_filename, file_bytes=b"some non-empty content")

    # 3. Corrupted DOCX bytes
    with pytest.raises(InvalidDocumentFormatError):
        parser.parse(filename="corrupted.docx", file_bytes=b"not-a-valid-zip-file")

    # 4. Corrupted PDF bytes
    with pytest.raises(InvalidDocumentFormatError):
        parser.parse(filename="corrupted.pdf", file_bytes=b"not-a-valid-pdf-header")

    # 5. DOCX containing forbidden XML <!DOCTYPE / <!ENTITY (XXE attack vector)
    xxe_zip_buf = io.BytesIO()
    with zipfile.ZipFile(xxe_zip_buf, mode="w") as zf:
        zf.writestr("[Content_Types].xml", "<Types></Types>")
        zf.writestr(
            "word/document.xml",
            '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><w:document/>',
        )
    with pytest.raises(InvalidDocumentFormatError):
        parser.parse(filename="xxe_payload.docx", file_bytes=xxe_zip_buf.getvalue())


async def test_storage_adapter_enforces_tenant_isolation_and_path_traversal_guards(
    tmp_path: Path,
) -> None:
    """Verify LocalS3CompatibleStorageAdapter isolates files by tenant and blocks traversal."""
    storage = LocalS3CompatibleStorageAdapter(root_path=tmp_path / "vault")
    org_a = uuid4()
    org_b = uuid4()
    doc_id = uuid4()
    payload = b"%PDF-1.4 sample contract bytes"

    storage_key = await storage.save_file(
        org_id=org_a,
        document_id=doc_id,
        filename="../../etc/passwd/../../Contract_Draft.pdf",
        content=payload,
    )
    assert storage_key.startswith(f"{org_a}/{doc_id}/")
    assert ".." not in storage_key
    assert "Contract_Draft" not in storage_key  # Randomized UUID filename

    loaded = await storage.load_file(
        org_id=org_a,
        document_id=doc_id,
        storage_key=storage_key,
    )
    assert loaded == payload

    # Cross-tenant read attempt by Org B is blocked with TenantIsolationError
    with pytest.raises(TenantIsolationError):
        await storage.load_file(
            org_id=org_b,
            document_id=doc_id,
            storage_key=storage_key,
        )
