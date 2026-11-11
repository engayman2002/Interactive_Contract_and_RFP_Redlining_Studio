"""FastAPI dependency injection providers for database sessions, JWT auth, and RBAC guards."""

from collections.abc import Callable, Coroutine
from functools import lru_cache
from typing import Annotated, Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.dtos import TokenPayloadDTO
from src.application.services import JwtTokenService, PasswordService, RbacGuardService
from src.domain.enums import UserRole
from src.domain.exceptions import UnauthorizedError
from src.domain.ports import (
    ClauseAuditorPort,
    ClauseSegmenterPort,
    CrossClauseAnalyzerPort,
    DocumentParserPort,
    DocxExporterPort,
    EmbeddingGeneratorPort,
    FileStoragePort,
    PlaybookExtractorPort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)
from src.infrastructure.ai import (
    LangChainCrossClauseAnalyzer,
    LangChainPlaybookExtractor,
    RuntimeAISettingsManager,
    create_llm_runnable,
)
from src.infrastructure.config import get_settings
from src.infrastructure.db.repositories import SqlAlchemyUnitOfWork
from src.infrastructure.db.session import get_async_db_session
from src.infrastructure.parsers import (
    CompositeDocumentParser,
    LocalS3CompatibleStorageAdapter,
    NativeWordDocxExporter,
    SemanticClauseSegmenter,
)
from src.infrastructure.vector import HybridPlaybookRetriever

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_password_service() -> PasswordService:
    """Provide singleton PasswordService."""
    return PasswordService()


@lru_cache(maxsize=1)
def get_jwt_service() -> JwtTokenService:
    """Provide singleton JwtTokenService configured from environment settings."""
    settings = get_settings()
    return JwtTokenService(
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@lru_cache(maxsize=1)
def get_rbac_guard() -> RbacGuardService:
    """Provide singleton RbacGuardService."""
    return RbacGuardService()


@lru_cache(maxsize=1)
def get_document_parser() -> DocumentParserPort:
    """Provide singleton CompositeDocumentParser for DOCX and PDF ingestion."""
    return CompositeDocumentParser()


@lru_cache(maxsize=1)
def get_clause_segmenter() -> ClauseSegmenterPort:
    """Provide singleton SemanticClauseSegmenter."""
    return SemanticClauseSegmenter()


@lru_cache(maxsize=1)
def get_file_storage() -> FileStoragePort:
    """Provide singleton LocalS3CompatibleStorageAdapter configured from settings."""
    settings = get_settings()
    return LocalS3CompatibleStorageAdapter(root_path=settings.STORAGE_ROOT_PATH)


def get_embedding_generator() -> EmbeddingGeneratorPort:
    """Provide active EmbeddingGeneratorPort resolved dynamically via RuntimeAISettingsManager."""
    return RuntimeAISettingsManager.get_active_embedding_generator()


def get_clause_auditor() -> ClauseAuditorPort:
    """Provide active ClauseAuditorPort resolved dynamically via RuntimeAISettingsManager."""
    return RuntimeAISettingsManager.get_active_clause_auditor()


@lru_cache(maxsize=1)
def get_cross_clause_analyzer() -> CrossClauseAnalyzerPort:
    """Provide singleton LangChainCrossClauseAnalyzer for multi-clause integrity checks."""
    return LangChainCrossClauseAnalyzer()


def get_playbook_extractor() -> PlaybookExtractorPort:
    """Provide PlaybookExtractorPort configured with the active runtime LLM settings."""
    effective = RuntimeAISettingsManager.get_effective_settings()
    llm_runnable: Any | None = None
    try:
        llm_runnable = create_llm_runnable(effective)
    except Exception:
        llm_runnable = None
    return LangChainPlaybookExtractor(
        llm_runnable=llm_runnable,
        max_retries=1,
        provider_name=effective.LLM_PROVIDER,
        model_name=effective.LLM_MODEL_NAME,
    )


@lru_cache(maxsize=1)
def get_docx_exporter() -> DocxExporterPort:
    """Provide singleton NativeWordDocxExporter for Track-Changes and Clean DOCX export."""
    return NativeWordDocxExporter()


async def get_uow(
    session: Annotated[AsyncSession, Depends(get_async_db_session)],
) -> UnitOfWorkPort:
    """Provide transactional UnitOfWorkPort backed by SQLAlchemy AsyncSession."""
    return SqlAlchemyUnitOfWork(session)


async def get_playbook_retriever(
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
    embedding_generator: Annotated[EmbeddingGeneratorPort, Depends(get_embedding_generator)],
) -> PlaybookRetrieverPort:
    """Provide tenant-isolated HybridPlaybookRetriever combining vector + BM25 scoring."""
    settings = get_settings()
    return HybridPlaybookRetriever(
        repository=uow.playbooks,
        embedding_generator=embedding_generator,
        vector_weight=settings.HYBRID_VECTOR_WEIGHT,
        keyword_weight=settings.HYBRID_KEYWORD_WEIGHT,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    jwt_service: Annotated[JwtTokenService, Depends(get_jwt_service)],
    uow: Annotated[UnitOfWorkPort, Depends(get_uow)],
) -> TokenPayloadDTO:
    """Extract and validate Bearer JWT and confirm user membership in the tenant organization."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing or invalid Bearer authentication header.")

    payload = jwt_service.decode_and_validate_token(credentials.credentials)

    # Confirm the user still exists within the claimed tenant organization
    db_user = await uow.users.get_by_id(org_id=payload.org_id, user_id=payload.sub)
    if db_user is None:
        raise UnauthorizedError("Authenticated user no longer exists in the tenant organization.")

    return payload


def require_roles(
    *allowed_roles: UserRole,
) -> Callable[..., Coroutine[Any, Any, TokenPayloadDTO]]:
    """Declarative FastAPI dependency factory enforcing allowed `UserRole` permissions."""
    allowed_set = frozenset(allowed_roles)

    async def _role_guard(
        current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
        rbac_guard: Annotated[RbacGuardService, Depends(get_rbac_guard)],
    ) -> TokenPayloadDTO:
        rbac_guard.require_roles(user_role=current_user.role, allowed_roles=allowed_set)
        return current_user

    return _role_guard


__all__ = [
    "bearer_scheme",
    "get_clause_auditor",
    "get_clause_segmenter",
    "get_cross_clause_analyzer",
    "get_current_user",
    "get_document_parser",
    "get_docx_exporter",
    "get_embedding_generator",
    "get_file_storage",
    "get_jwt_service",
    "get_password_service",
    "get_playbook_extractor",
    "get_playbook_retriever",
    "get_rbac_guard",
    "get_uow",
    "require_roles",
]

