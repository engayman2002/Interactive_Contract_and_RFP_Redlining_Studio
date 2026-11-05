"""Structural PDF parser extracting section headings and paragraphs while stripping page noise."""

import io
import re
from collections import Counter
from typing import Final

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from src.domain.entities.parsed_clause import RawDocumentBlock
from src.domain.exceptions import EmptyDocumentError, InvalidDocumentFormatError

PDF_MAGIC_SIGNATURE: Final[bytes] = b"%PDF-"

PAGE_NOISE_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"^page\s+\d+(?:\s+of\s+\d+)?$", re.IGNORECASE),
    re.compile(r"^-\s*\d+\s*-$"),
    re.compile(r"^\d+\s*/\s*\d+$"),
    re.compile(r"^\d{1,4}$"),
)

PDF_HEADING_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(?:ARTICLE\s+[IVXLCDM0-9]+(?:\s*[-:–—]\s*.+)?|SECTION\s+\d+(?:\.\d+)*(?:\s*[-.:–—]\s*.+)?|\d+\.\s+[A-Z][A-Z0-9\s,&/-]{2,80})$"
)

CLAUSE_START_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^(?:\d+\.\d+(?:\.\d+)*\.?\s+|\d+\.\s+[A-Z]|\([a-zA-Z0-9]{1,4}\)\s+|Clause\s+\d+|Section\s+\d+)"
)


class PdfDocumentParser:
    """Extract structural blocks from PDF byte streams while removing repetitive headers/footers."""

    @staticmethod
    def _validate_pdf_bytes(file_bytes: bytes) -> None:
        if not file_bytes:
            raise EmptyDocumentError("Uploaded PDF file is empty (0 bytes).")
        if PDF_MAGIC_SIGNATURE not in file_bytes[:1024]:
            raise InvalidDocumentFormatError(
                "Invalid PDF file header: missing %PDF- magic signature."
            )

    @staticmethod
    def _is_page_number_noise(line: str) -> bool:
        stripped = line.strip()
        return any(pattern.match(stripped) for pattern in PAGE_NOISE_PATTERNS)

    @classmethod
    def _detect_repetitive_boundary_lines(cls, pages_lines: list[list[str]]) -> set[str]:
        """Identify repetitive running headers or footers appearing across multiple pages."""
        if len(pages_lines) < 2:
            return set()

        boundary_counter: Counter[str] = Counter()
        for lines in pages_lines:
            non_empty = [ln.strip() for ln in lines if ln.strip()]
            if not non_empty:
                continue
            candidates = {non_empty[0], non_empty[-1]}
            for candidate in candidates:
                if len(candidate) <= 100 and not CLAUSE_START_PATTERN.match(candidate):
                    boundary_counter[candidate] += 1

        threshold = max(2, len(pages_lines) // 2)
        return {line for line, count in boundary_counter.items() if count >= threshold}

    @staticmethod
    def _is_heading_line(line: str) -> bool:
        stripped = line.strip()
        if len(stripped) > 120 or stripped.endswith((".", ";", ",")):
            return False
        if PDF_HEADING_PATTERN.match(stripped):
            return True
        return (
            stripped.isupper()
            and len(stripped) >= 4
            and len(stripped.split()) <= 10
            and any(c.isalpha() for c in stripped)
        )

    @staticmethod
    def _flush_paragraph_buffer(
        buffer: list[str],
        blocks: list[RawDocumentBlock],
        page_num: int,
    ) -> None:
        if not buffer:
            return
        joined = " ".join(buffer).strip()
        buffer.clear()
        if joined:
            blocks.append(
                RawDocumentBlock(
                    text=joined,
                    is_heading=False,
                    heading_level=None,
                    page_number=page_num,
                )
            )

    def parse(self, file_bytes: bytes) -> list[RawDocumentBlock]:
        """Parse PDF byte stream into ordered `RawDocumentBlock` items."""
        self._validate_pdf_bytes(file_bytes)

        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            if reader.is_encrypted:
                raise InvalidDocumentFormatError("Encrypted PDF files are not supported.")
            pages_raw: list[list[str]] = []
            for page in reader.pages:
                extracted = page.extract_text() or ""
                pages_raw.append(extracted.splitlines())
        except InvalidDocumentFormatError:
            raise
        except (PdfReadError, Exception) as exc:
            raise InvalidDocumentFormatError("Failed to read corrupted PDF structure.") from exc

        if not pages_raw:
            raise EmptyDocumentError("PDF document contains zero pages.")

        repetitive_headers_footers = self._detect_repetitive_boundary_lines(pages_raw)
        blocks: list[RawDocumentBlock] = []

        for page_idx, lines in enumerate(pages_raw, start=1):
            current_paragraph_lines: list[str] = []

            for idx, raw_line in enumerate(lines):
                line = raw_line.strip()
                if not line:
                    self._flush_paragraph_buffer(current_paragraph_lines, blocks, page_idx)
                    continue

                is_boundary_line = idx == 0 or idx == len(lines) - 1
                if is_boundary_line and (
                    self._is_page_number_noise(line) or line in repetitive_headers_footers
                ):
                    continue
                if self._is_page_number_noise(line):
                    continue

                if self._is_heading_line(line):
                    self._flush_paragraph_buffer(current_paragraph_lines, blocks, page_idx)
                    blocks.append(
                        RawDocumentBlock(
                            text=line,
                            is_heading=True,
                            heading_level=1,
                            page_number=page_idx,
                        )
                    )
                    continue

                if CLAUSE_START_PATTERN.match(line) and current_paragraph_lines:
                    self._flush_paragraph_buffer(current_paragraph_lines, blocks, page_idx)

                current_paragraph_lines.append(line)

            self._flush_paragraph_buffer(current_paragraph_lines, blocks, page_idx)

        if not blocks:
            raise EmptyDocumentError("PDF document contains no extractable text clauses.")

        return blocks


__all__ = ["PdfDocumentParser"]
