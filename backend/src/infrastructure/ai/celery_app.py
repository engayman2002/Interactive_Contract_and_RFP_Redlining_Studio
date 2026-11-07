"""Celery application and background task wrapper for Phase 4 Document Clause Auditing."""

import asyncio
from typing import Any
from uuid import UUID

from celery import Celery

from src.domain.entities import DocumentClause
from src.infrastructure.ai.batch_worker import BatchDocumentAuditWorker
from src.infrastructure.ai.provider_registry import create_llm_runnable
from src.infrastructure.ai.redline_chain import LangChainClauseAuditor
from src.infrastructure.ai.runtime_settings import RuntimeAISettingsManager
from src.infrastructure.config import get_settings
from src.infrastructure.db.repositories import SqlAlchemyUnitOfWork
from src.infrastructure.db.session import AsyncSessionFactory
from src.infrastructure.vector import (
    HybridPlaybookRetriever,
    create_embedding_generator,
)


def create_celery_app() -> Celery:
    """Create and configure the Celery application instance from settings."""
    settings = get_settings()
    app = Celery(
        "redlining_studio_worker",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_BROKER_URL,
    )
    app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
        task_eager_propagates=True,
    )
    return app


celery_app = create_celery_app()


async def _run_batch_audit_for_clauses(
    org_id: UUID,
    document_id: UUID,
    clauses: list[DocumentClause],
) -> list[dict[str, Any]]:
    settings = RuntimeAISettingsManager.get_effective_settings()
    async with AsyncSessionFactory() as session:
        uow = SqlAlchemyUnitOfWork(session)
        embedder = create_embedding_generator(settings)
        retriever = HybridPlaybookRetriever(
            repository=uow.playbooks,
            embedding_generator=embedder,
            vector_weight=settings.HYBRID_VECTOR_WEIGHT,
            keyword_weight=settings.HYBRID_KEYWORD_WEIGHT,
        )
        llm_runnable = create_llm_runnable(settings)
        auditor = LangChainClauseAuditor(
            llm_runnable=llm_runnable,
            max_retries=settings.REDLINE_MAX_RETRIES,
            temperature=settings.LLM_TEMPERATURE,
        )
        worker = BatchDocumentAuditWorker(
            retriever=retriever,
            auditor=auditor,
            concurrency=settings.REDLINE_BATCH_CONCURRENCY,
            top_k=settings.PLAYBOOK_DEFAULT_TOP_K,
        )
        results = await worker.audit_document_clauses(
            org_id=org_id,
            document_id=document_id,
            clauses=clauses,
        )
        return [
            {
                "clause_id": str(r.clause_id),
                "clause_index": r.clause_index,
                "is_compliant": r.is_compliant,
                "risk": r.risk.value,
                "category": r.category,
                "matched_rule_id": str(r.matched_rule_id) if r.matched_rule_id else None,
                "proposed_text": r.proposed_text,
                "rationale": r.rationale,
                "negotiation_talking_point": r.negotiation_talking_point,
                "latency_ms": r.latency_ms,
            }
            for r in results
        ]


@celery_app.task(name="redlining_studio.audit_document_task")  # type: ignore[untyped-decorator]
def audit_document_celery_task(
    org_id_str: str,
    document_id_str: str,
    serialized_clauses: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Celery task entry point delegating to `BatchDocumentAuditWorker`."""
    org_id = UUID(org_id_str)
    document_id = UUID(document_id_str)
    clauses = [
        DocumentClause(
            id=UUID(str(c["id"])),
            document_id=document_id,
            clause_index=int(c["clause_index"]),
            heading=c.get("heading"),
            original_text=str(c["original_text"]),
            current_text=str(c["current_text"]),
            version=int(c.get("version", 1)),
        )
        for c in serialized_clauses
    ]
    return asyncio.run(_run_batch_audit_for_clauses(org_id, document_id, clauses))


__all__ = [
    "audit_document_celery_task",
    "celery_app",
    "create_celery_app",
]

