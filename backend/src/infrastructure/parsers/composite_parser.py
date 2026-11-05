"""Composite document parser routing `.docx` and `.pdf` streams to their respective parsers."""

import os
from typing import Final

from src.domain.entities.parsed_clause import RawDocumentBlock
from src.domain.exceptions import EmptyDocumentError, InvalidDocumentFormatError
from src.domain.ports.ingestion_ports import DocumentParserPort
from src.infrastructure.parsers.docx_parser import DocxDocumentParser
from src.infrastructure.parsers.pdf_parser import PdfDocumentParser

DOCX_MIME_TYPES: Final[frozenset[str]] = frozenset(
    {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    }
)
PDF_MIME_TYPES: Final[frozenset[str]] = frozenset(
    {
        "application/pdf",
        "application/octet-stream",
    }
)


class CompositeDocumentParser(DocumentParserPort):
    """Router parser delegating `.docx` and `.pdf` files and rejecting unsupported formats."""

    def __init__(
        self,
        docx_parser: DocxDocumentParser | None = None,
        pdf_parser: PdfDocumentParser | None = None,
    ) -> None:
        self._docx_parser = docx_parser or DocxDocumentParser()
        self._pdf_parser = pdf_parser or PdfDocumentParser()

    def parse(
        self,
        filename: str,
        file_bytes: bytes,
        content_type: str | None = None,
    ) -> list[RawDocumentBlock]:
        """Validate extension, MIME type, and payload before delegating structural parsing."""
        if not file_bytes:
            raise EmptyDocumentError("Uploaded file contains 0 bytes.")

        safe_name = os.path.basename(filename.replace("\\", "/")).strip()
        _, ext = os.path.splitext(safe_name)
        normalized_ext = ext.lower()

        normalized_mime = (
            content_type.split(";")[0].strip().lower() if content_type else None
        )

        if normalized_ext == ".docx":
            if normalized_mime and normalized_mime not in DOCX_MIME_TYPES:
                raise InvalidDocumentFormatError(
                    f"MIME type '{normalized_mime}' is not valid for a .docx document."
                )
            return self._docx_parser.parse(file_bytes)

        if normalized_ext == ".pdf":
            if normalized_mime and normalized_mime not in PDF_MIME_TYPES:
                raise InvalidDocumentFormatError(
                    f"MIME type '{normalized_mime}' is not valid for a .pdf document."
                )
            return self._pdf_parser.parse(file_bytes)

        raise InvalidDocumentFormatError(
            f"Unsupported document extension '{normalized_ext or '<none>'}'. "
            "Only .docx and .pdf files are supported."
        )


__all__ = ["CompositeDocumentParser"]

