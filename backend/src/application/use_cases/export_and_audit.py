"""Application use cases for Phase 7 Native Word DOCX Export and Compliance Audit Trail."""

import re
from typing import Final
from uuid import UUID

from src.application.dtos import AuditLogEntryResponseDTO, TokenPayloadDTO
from src.application.services import RBACAction, RbacGuardService
from src.domain.entities import AuditLogEntry, ExportedDocumentArtifact
from src.domain.enums import AuditAction, ExportMode
from src.domain.exceptions import EntityNotFoundError
from src.domain.ports import DocxExporterPort, UnitOfWorkPort

DOCX_MIME_TYPE: Final[str] = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
SAFE_FILENAME_PATTERN: Final[re.Pattern[str]] = re.compile(r"[^a-zA-Z0-9_-]+")


def _build_safe_export_filename(title: str, mode: ExportMode) -> str:
    """Derive a sanitized `.docx` attachment filename from the document title and export mode."""
    slug = SAFE_FILENAME_PATTERN.sub("_", title.strip()).strip("_") or "contract"
    return f"{slug[:80]}_{mode.value}.docx"


class ExportDocumentUseCase:
    """Reconstruct a `.docx` file with native Word Track Changes or clean text and log export."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        exporter: DocxExporterPort,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._exporter = exporter

    async def execute(
        self,
        actor: TokenPayloadDTO,
        document_id: UUID,
        mode: ExportMode = ExportMode.TRACK_CHANGES,
    ) -> ExportedDocumentArtifact:
        """Authorize export, generate `.docx` bytes, record `DOCUMENT_EXPORTED` audit entry."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.EXPORT_DOCUMENT)

        doc_with_clauses = await self._uow.documents.get_with_clauses(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if doc_with_clauses is None:
            raise EntityNotFoundError(
                f"Document '{document_id}' was not found in your organization."
            )

        document, clauses = doc_with_clauses
        suggestions = await self._uow.redlines.list_by_document(
            org_id=actor.org_id,
            document_id=document.id,
        )
        comments = await self._uow.comments.list_by_document(
            org_id=actor.org_id,
            document_id=document.id,
        )

        file_bytes = self._exporter.generate_docx(
            document=document,
            clauses=clauses,
            suggestions=suggestions,
            comments=comments,
            mode=mode,
            author_name=f"AI Redlining Studio ({actor.role.value})",
        )

        filename = _build_safe_export_filename(document.title, mode)

        await self._uow.audit_logs.append(
            org_id=actor.org_id,
            entry=AuditLogEntry(
                org_id=actor.org_id,
                document_id=document.id,
                actor_user_id=actor.sub,
                actor_role=actor.role,
                action=AuditAction.DOCUMENT_EXPORTED,
                details={
                    "mode": mode.value,
                    "filename": filename,
                    "clause_count": len(clauses),
                },
            ),
        )
        await self._uow.commit()

        return ExportedDocumentArtifact(
            document_id=document.id,
            filename=filename,
            content_type=DOCX_MIME_TYPE,
            mode=mode,
            file_bytes=file_bytes,
        )


class ListDocumentAuditLogsUseCase:
    """List immutable compliance audit log entries for a document scoped strictly to `org_id`."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard

    async def execute(
        self,
        actor: TokenPayloadDTO,
        document_id: UUID,
    ) -> list[AuditLogEntryResponseDTO]:
        """Authorize workspace view, verify document tenant ownership, and return audit entries."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)

        doc = await self._uow.documents.get_by_id(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if doc is None:
            raise EntityNotFoundError(
                f"Document '{document_id}' was not found in your organization."
            )

        entries = await self._uow.audit_logs.list_by_document(
            org_id=actor.org_id,
            document_id=document_id,
        )
        return [AuditLogEntryResponseDTO.from_domain(e) for e in entries]


__all__ = [
    "DOCX_MIME_TYPE",
    "ExportDocumentUseCase",
    "ListDocumentAuditLogsUseCase",
]
