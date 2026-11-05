"""Structural PDF/DOCX parser adapters, semantic clause segmenter, and file storage exports."""

from src.infrastructure.parsers.clause_segmenter import SemanticClauseSegmenter
from src.infrastructure.parsers.composite_parser import CompositeDocumentParser
from src.infrastructure.parsers.docx_parser import DocxDocumentParser
from src.infrastructure.parsers.pdf_parser import PdfDocumentParser
from src.infrastructure.parsers.storage import LocalS3CompatibleStorageAdapter

__all__ = [
    "CompositeDocumentParser",
    "DocxDocumentParser",
    "LocalS3CompatibleStorageAdapter",
    "PdfDocumentParser",
    "SemanticClauseSegmenter",
]
