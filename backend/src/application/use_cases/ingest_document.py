"""Use cases for Phase 2 Document Upload, Structural Ingestion, and Workspace Retrieval."""

from uuid import UUID

from src.application.dtos import (
    ClauseResponseDTO,
    DocumentResponseDTO,
    DocumentUploadResponseDTO,
    DocumentWorkspaceResponseDTO,
    IngestDocumentCommand,
    TokenPayloadDTO,
)
from src.application.services import RBACAction, RbacGuardService
from src.domain.entities import Document, DocumentClause
from src.domain.enums import DocumentStatus
from src.domain.exceptions import (
    DocumentTooLargeError,
    EmptyDocumentError,
    EntityNotFoundError,
)
from src.domain.ports import (
    ClauseSegmenterPort,
    DocumentParserPort,
    FileStoragePort,
    UnitOfWorkPort,
)


class UploadAndIngestDocumentUseCase:
    """Validate, parse, segment, store, and persist an uploaded DOCX/PDF contract or RFP."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        parser: DocumentParserPort,
        segmenter: ClauseSegmenterPort,
        storage: FileStoragePort,
        max_upload_bytes: int = 25 * 1024 * 1024,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._parser = parser
        self._segmenter = segmenter
        self._storage = storage
        self._max_upload_bytes = max_upload_bytes

    async def execute(
        self,
        actor: TokenPayloadDTO,
        command: IngestDocumentCommand,
    ) -> DocumentUploadResponseDTO:
        """Execute end-to-end document ingestion within the actor's tenant scope."""
        # 1. Enforce RBAC and multi-tenant isolation
        self._rbac_guard.ensure_can_mutate(actor.role)
        self._rbac_guard.authorize_action(actor.role, RBACAction.UPLOAD_DOCUMENT)
        self._rbac_guard.enforce_tenant_isolation(
            actor_org_id=actor.org_id,
            target_org_id=command.org_id,
        )

        # 2. Validate payload size
        payload_size = len(command.file_bytes)
        if payload_size == 0:
            raise EmptyDocumentError("Uploaded file is empty (0 bytes).")
        if payload_size > self._max_upload_bytes:
            raise DocumentTooLargeError(
                f"Uploaded file size ({payload_size} bytes) exceeds limit of "
                f"{self._max_upload_bytes} bytes."
            )

        # 3. Parse structural blocks and segment into ordered semantic clauses
        raw_blocks = self._parser.parse(
            filename=command.filename,
            file_bytes=command.file_bytes,
            content_type=command.content_type,
        )
        clause_candidates = self._segmenter.segment(raw_blocks)

        # 4. Initialize Document entity and store raw file in tenant-isolated storage
        document = Document(
            org_id=actor.org_id,
            title=command.resolved_title,
            created_by=actor.sub,
            status=DocumentStatus.PROCESSING.value,
            version=1,
        )
        storage_key = await self._storage.save_file(
            org_id=actor.org_id,
            document_id=document.id,
            filename=command.filename,
            content=command.file_bytes,
        )

        # 5. Build ordered DocumentClause entities and persist atomically
        clause_entities = [
            DocumentClause(
                document_id=document.id,
                clause_index=candidate.clause_index,
                heading=candidate.heading,
                original_text=candidate.text,
                current_text=candidate.text,
                version=1,
            )
            for candidate in clause_candidates
        ]

        persisted_doc, persisted_clauses = await self._uow.documents.create_with_clauses(
            org_id=actor.org_id,
            document=document,
            clauses=clause_entities,
        )
        await self._uow.commit()

        return DocumentUploadResponseDTO(
            document_id=persisted_doc.id,
            org_id=persisted_doc.org_id,
            title=persisted_doc.title,
            status=persisted_doc.status,
            version=persisted_doc.version,
            clause_count=len(persisted_clauses),
            storage_key=storage_key,
            created_at=persisted_doc.created_at,
        )


class GetDocumentWorkspaceUseCase:
    """Fetch a document and its sequentially ordered clauses scoped strictly to `org_id`."""

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
    ) -> DocumentWorkspaceResponseDTO:
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)

        result = await self._uow.documents.get_with_clauses(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if result is None:
            raise EntityNotFoundError(
                f"Document '{document_id}' was not found in your organization."
            )

        document, clauses = result
        doc_dto = DocumentResponseDTO.model_validate(document)
        clause_dtos = [ClauseResponseDTO.model_validate(c) for c in clauses]

        return DocumentWorkspaceResponseDTO(
            document_id=document.id,
            org_id=document.org_id,
            title=document.title,
            status=document.status,
            version=document.version,
            created_by=document.created_by,
            created_at=document.created_at,
            document=doc_dto,
            clauses=clause_dtos,
            redlines=[],
            comments=[],
        )


class ListOrganizationDocumentsUseCase:
    """List all documents belonging strictly to the authenticated user's organization."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard

    async def execute(self, actor: TokenPayloadDTO) -> list[DocumentResponseDTO]:
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)
        docs = await self._uow.documents.list_by_org(org_id=actor.org_id)
        return [DocumentResponseDTO.model_validate(d) for d in docs]


__all__ = [
    "GetDocumentWorkspaceUseCase",
    "ListOrganizationDocumentsUseCase",
    "UploadAndIngestDocumentUseCase",
]

