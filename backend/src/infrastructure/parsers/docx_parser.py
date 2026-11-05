"""Structural DOCX parser extracting headings, section hierarchies, and paragraphs."""

import io
import os
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Final

from docx import Document as LoadDocxDocument
from docx.text.paragraph import Paragraph

from src.domain.entities.parsed_clause import RawDocumentBlock
from src.domain.exceptions import EmptyDocumentError, InvalidDocumentFormatError

PK_ZIP_MAGIC_BYTES: Final[bytes] = b"PK\x03\x04"
MAX_DECOMPRESSED_ZIP_BYTES: Final[int] = 100 * 1024 * 1024  # 100 MB zip-bomb ceiling
WORD_NAMESPACE: Final[dict[str, str]] = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
}

STANDALONE_HEADING_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(?:ARTICLE\s+[IVXLCDM0-9]+|SECTION\s+\d+(?:\.\d+)*|[IVXLCDM]+\.\s+[A-Z]|\d+\.\s+[A-Z0-9\s,&/-]{3,80}$)",
    re.IGNORECASE,
)


class DocxDocumentParser:
    """Extract structural headings and paragraphs from `.docx` files using `python-docx`."""

    @staticmethod
    def _validate_docx_archive(file_bytes: bytes) -> None:
        """Inspect magic bytes, member paths (Zip Slip protection), and XML safety (XXE guard)."""
        if not file_bytes:
            raise EmptyDocumentError("Uploaded DOCX file is empty (0 bytes).")

        if not file_bytes.startswith(PK_ZIP_MAGIC_BYTES):
            raise InvalidDocumentFormatError(
                "Invalid DOCX file header: missing PK ZIP signature."
            )

        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes), mode="r") as archive:
                names = archive.namelist()
                if "word/document.xml" not in names or "[Content_Types].xml" not in names:
                    raise InvalidDocumentFormatError(
                        "Invalid DOCX container: required Word XML parts are missing."
                    )

                total_uncompressed = 0
                for info in archive.infolist():
                    normalized = info.filename.replace("\\", "/")
                    if (
                        normalized.startswith("/")
                        or ".." in normalized.split("/")
                        or os.path.isabs(normalized)
                    ):
                        raise InvalidDocumentFormatError(
                            "Unsafe archive member path detected in DOCX file."
                        )
                    total_uncompressed += info.file_size
                    if total_uncompressed > MAX_DECOMPRESSED_ZIP_BYTES:
                        raise InvalidDocumentFormatError(
                            "DOCX archive exceeds safe uncompressed size threshold."
                        )

                    if normalized.endswith(".xml") or normalized.endswith(".rels"):
                        raw_xml = archive.read(info.filename)
                        upper_head = raw_xml[:4096].upper()
                        if b"<!DOCTYPE" in upper_head or b"<!ENTITY" in upper_head:
                            raise InvalidDocumentFormatError(
                                "Forbidden XML DTD/Entity declaration detected in DOCX archive."
                            )
        except zipfile.BadZipFile as exc:
            raise InvalidDocumentFormatError("Corrupted DOCX ZIP container.") from exc

    @staticmethod
    def _extract_heading_level(style_name: str, text: str, is_all_runs_bold: bool) -> int | None:
        """Determine whether a DOCX paragraph represents a structural section heading."""
        lower_style = style_name.lower()
        if lower_style.startswith("heading"):
            parts = lower_style.replace("heading", "").strip().split()
            if parts and parts[0].isdigit():
                return int(parts[0])
            return 1
        if lower_style in {"title", "subtitle"}:
            return 1

        # Detect standalone section / article headers formatted in bold or uppercase
        if len(text) <= 120 and not text.endswith((".", ";", ":")):
            if STANDALONE_HEADING_PATTERN.match(text):
                return 2
            if is_all_runs_bold and len(text.split()) <= 12:
                return 2

        return None

    @staticmethod
    def _has_xml_numbering(paragraph: Paragraph) -> bool:
        """Check whether a paragraph uses Word automatic list numbering (`w:numPr`)."""
        p_xml = paragraph._p.xml
        try:
            root = ET.fromstring(p_xml)  # noqa: S314 - DTD/ENTITY already rejected in _validate_docx_archive
        except ET.ParseError:
            return False
        return root.find(".//w:numPr", WORD_NAMESPACE) is not None

    def parse(self, file_bytes: bytes) -> list[RawDocumentBlock]:
        """Parse DOCX bytes into an ordered sequence of `RawDocumentBlock` items."""
        self._validate_docx_archive(file_bytes)

        try:
            doc = LoadDocxDocument(io.BytesIO(file_bytes))
        except Exception as exc:
            raise InvalidDocumentFormatError("Failed to parse DOCX document structure.") from exc

        blocks: list[RawDocumentBlock] = []
        auto_num_counter = 0

        for paragraph in doc.paragraphs:
            raw_text = paragraph.text.strip()
            if not raw_text:
                continue

            style_name = (
                paragraph.style.name if paragraph.style and paragraph.style.name else "Normal"
            )
            non_empty_runs = [r for r in paragraph.runs if r.text.strip()]
            is_all_runs_bold = bool(non_empty_runs) and all(
                bool(r.bold) for r in non_empty_runs
            )

            heading_level = self._extract_heading_level(
                style_name=style_name,
                text=raw_text,
                is_all_runs_bold=is_all_runs_bold,
            )

            if heading_level is not None:
                blocks.append(
                    RawDocumentBlock(
                        text=raw_text,
                        is_heading=True,
                        heading_level=heading_level,
                        style_name=style_name,
                    )
                )
                continue

            # Preserve automatic Word list numbering if not already inline in the text
            if self._has_xml_numbering(paragraph) and not re.match(
                r"^(?:\d+(?:\.\d+)*\.?|\([a-zA-Z0-9]+\))", raw_text
            ):
                auto_num_counter += 1
                raw_text = f"{auto_num_counter}. {raw_text}"

            blocks.append(
                RawDocumentBlock(
                    text=raw_text,
                    is_heading=False,
                    heading_level=None,
                    style_name=style_name,
                )
            )

        if not blocks:
            raise EmptyDocumentError("DOCX document contains no extractable text or clauses.")

        return blocks


__all__ = ["DocxDocumentParser"]
