"""FastAPI v1 router for Document Upload, Ingestion, Listing, and Workspace Retrieval."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import StreamingResponse

from src.application.dtos import (
    CreateDocumentRequestDTO,
    DocumentAnalysisSummaryDTO,
    DocumentResponseDTO,
    DocumentUploadResponseDTO,
    DocumentWorkspaceResponseDTO,
    IngestDocumentCommand,
    TokenPayloadDTO,
    UpdateDocumentRequestDTO,
)
from src.application.services import RbacGuardService
from src.application.use_cases import (
    AnalyzeDocumentClausesUseCase,
    CreateDocumentFoundationUseCase,
    GetDocumentFoundationUseCase,
    GetDocumentWorkspaceUseCase,
    ListOrganizationDocumentsUseCase,
    StreamDocumentAnalysisUseCase,
    UpdateDocumentFoundationUseCase,
    UploadAndIngestDocumentUseCase,
)
from src.domain.enums import UserRole
from src.domain.ports import (
    ClauseAuditorPort,
    ClauseSegmenterPort,
    DocumentParserPort,
    FileStoragePort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)
from src.infrastructure.config import get_settings
from src.presentation.dependencies import (
    get_clause_auditor,
    get_clause_segmenter,
    get_current_user,
    get_document_parser,
    get_file_storage,
    get_playbook_retriever,
    get_rbac_guard,
    get_uow,
    require_roles,
)

documents_router = APIRouter(prefix="/documents", tags=["Documents"])


@documents_router.post(
    "/upload",
    response_model=DocumentUploadResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def upload_and_ingest_document(
    file: Annotated[UploadFile, File(description="Contract or RFP file (.docx or .pdf)")],
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    parser: Annotated[DocumentParserPort, Depends(get_document_parser)],
    segmenter: Annotated[ClauseSegmenterPort, Depends(get_clause_segmenter)],
    storage: Annotated[FileStoragePort, Depends(get_file_storage)],
    title: Annotated[str | None, Form()] = None,
) -> DocumentUploadResponseDTO:
    """Upload a DOCX or PDF contract/RFP, extract semantic clauses, and persist in PostgreSQL."""
    settings = get_settings()
    file_bytes = await file.read()
    command = IngestDocumentCommand(
        org_id=current_user.org_id,
        uploaded_by=current_user.sub,
        filename=file.filename or "uploaded_contract",
        content_type=file.content_type,
        file_bytes=file_bytes,
        title=title,
    )
    use_case = UploadAndIngestDocumentUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        parser=parser,
        segmenter=segmenter,
        storage=storage,
        max_upload_bytes=settings.max_upload_size_bytes,
    )
    return await use_case.execute(actor=current_user, command=command)


@documents_router.get(
    "",
    response_model=list[DocumentResponseDTO],
    status_code=status.HTTP_200_OK,
)
async def list_documents(
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> list[DocumentResponseDTO]:
    """List all documents belonging strictly to the caller's tenant organization."""
    use_case = ListOrganizationDocumentsUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user)


@documents_router.get(
    "/{document_id}/workspace",
    response_model=DocumentWorkspaceResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def get_document_workspace(
    document_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> DocumentWorkspaceResponseDTO:
    """Fetch document metadata, ordered clauses, and AI redlines for the split-screen workspace."""
    use_case = GetDocumentWorkspaceUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user, document_id=document_id)


@documents_router.post(
    "/{document_id}/analyze",
    response_model=DocumentAnalysisSummaryDTO,
    status_code=status.HTTP_200_OK,
)
async def analyze_document_clauses(
    document_id: UUID,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    retriever: Annotated[PlaybookRetrieverPort, Depends(get_playbook_retriever)],
    auditor: Annotated[ClauseAuditorPort, Depends(get_clause_auditor)],
) -> DocumentAnalysisSummaryDTO:
    """Trigger concurrent AI redline evaluation across all clauses in a document."""
    settings = get_settings()
    use_case = AnalyzeDocumentClausesUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        retriever=retriever,
        auditor=auditor,
        concurrency=settings.REDLINE_BATCH_CONCURRENCY,
        top_k=settings.PLAYBOOK_DEFAULT_TOP_K,
    )
    return await use_case.execute(actor=current_user, document_id=document_id)


@documents_router.get(
    "/{document_id}/stream",
    status_code=status.HTTP_200_OK,
)
async def stream_document_analysis(
    document_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    retriever: Annotated[PlaybookRetrieverPort, Depends(get_playbook_retriever)],
    auditor: Annotated[ClauseAuditorPort, Depends(get_clause_auditor)],
) -> StreamingResponse:
    """Stream Server-Sent Events (`text/event-stream`) of real-time AI clause audit results."""
    settings = get_settings()
    use_case = StreamDocumentAnalysisUseCase(
        uow=uow,
        rbac_guard=rbac_guard,
        retriever=retriever,
        auditor=auditor,
        concurrency=settings.REDLINE_BATCH_CONCURRENCY,
        top_k=settings.PLAYBOOK_DEFAULT_TOP_K,
    )
    document, clauses = await use_case.verify_access_and_load(
        actor=current_user,
        document_id=document_id,
    )
    return StreamingResponse(
        use_case.stream_events(
            actor=current_user,
            document=document,
            clauses=clauses,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@documents_router.post(
    "",
    response_model=DocumentResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    payload: CreateDocumentRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> DocumentResponseDTO:
    """Create a tenant-scoped document metadata record (VIEWER blocked with 403)."""
    use_case = CreateDocumentFoundationUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user, request=payload)


@documents_router.get(
    "/{document_id}",
    response_model=DocumentResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def get_document(
    document_id: UUID,
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> DocumentResponseDTO:
    """Retrieve a document strictly within the caller's tenant organization."""
    use_case = GetDocumentFoundationUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(actor=current_user, document_id=document_id)


@documents_router.patch(
    "/{document_id}",
    response_model=DocumentResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def update_document(
    document_id: UUID,
    payload: UpdateDocumentRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
) -> DocumentResponseDTO:
    """Mutate a document within the caller's tenant organization (VIEWER blocked with 403)."""
    use_case = UpdateDocumentFoundationUseCase(uow=uow, rbac_guard=rbac_guard)
    return await use_case.execute(
        actor=current_user,
        document_id=document_id,
        request=payload,
    )


__all__ = ["documents_router"]
