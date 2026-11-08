"""Application use cases for Phase 4 Concurrent Clause Auditing and Real-Time SSE Streaming."""

import asyncio
import json
import time
from collections.abc import AsyncIterator
from uuid import UUID

from src.application.dtos import (
    DocumentAnalysisSummaryDTO,
    TokenPayloadDTO,
)
from src.application.services import MUTATING_ROLES, RBACAction, RbacGuardService
from src.domain.entities import (
    AuditLogEntry,
    AuditProgressEvent,
    ClauseAuditInput,
    ClauseAuditResult,
    Document,
    DocumentClause,
    PlaybookSearchQuery,
    RedlineSuggestion,
)
from src.domain.enums import (
    AuditAction,
    DocumentStatus,
    NegotiationStance,
    RiskLevel,
    SuggestionStatus,
)
from src.domain.exceptions import EntityNotFoundError
from src.domain.ports import (
    ClauseAuditorPort,
    PlaybookRetrieverPort,
    UnitOfWorkPort,
)


async def _evaluate_clauses_concurrently(
    org_id: UUID,
    document_id: UUID,
    clauses: list[DocumentClause],
    retriever: PlaybookRetrieverPort,
    auditor: ClauseAuditorPort,
    concurrency: int = 20,
    top_k: int = 3,
    stance: NegotiationStance = NegotiationStance.BALANCED,
) -> list[ClauseAuditResult]:
    """Evaluate all document clauses concurrently using bounded `asyncio.Semaphore`."""
    if not clauses:
        return []

    semaphore = asyncio.Semaphore(max(1, concurrency))
    retriever_lock = asyncio.Lock()

    async def _audit_one(clause: DocumentClause) -> ClauseAuditResult:
        async with semaphore:
            query = PlaybookSearchQuery(
                org_id=org_id,
                query_text=clause.current_text,
                category=None,
                top_k=max(1, top_k),
            )
            async with retriever_lock:
                matched_rules = await retriever.retrieve_top_rules(query)

            audit_input = ClauseAuditInput(
                org_id=org_id,
                document_id=document_id,
                clause_id=clause.id,
                clause_index=clause.clause_index,
                heading=clause.heading,
                clause_text=clause.current_text,
                stance=stance,
            )
            return await auditor.audit_clause(
                audit_input=audit_input,
                matched_rules=matched_rules,
            )

    results = await asyncio.gather(*(_audit_one(c) for c in clauses))
    return sorted(results, key=lambda item: item.clause_index)


def _build_redline_suggestions(results: list[ClauseAuditResult]) -> list[RedlineSuggestion]:
    """Convert non-compliant `ClauseAuditResult` items into `RedlineSuggestion` entities."""
    suggestions: list[RedlineSuggestion] = []
    for res in results:
        if not res.is_compliant:
            combined_rationale = (
                f"{res.rationale} | Talking Point: {res.negotiation_talking_point}"
            )
            suggestions.append(
                RedlineSuggestion(
                    clause_id=res.clause_id,
                    matched_rule_id=res.matched_rule_id,
                    risk=res.risk,
                    proposed_text=res.proposed_text,
                    rationale=combined_rationale,
                    status=SuggestionStatus.PENDING,
                )
            )
    return suggestions


def format_sse_event(event_name: str, payload: dict[str, object]) -> str:
    """Serialize an event name and dictionary payload into W3C Server-Sent Events wire format."""
    return f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"


class AnalyzeDocumentClausesUseCase:
    """Concurrently audit all clauses in a document and persist `RedlineSuggestion` records."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        retriever: PlaybookRetrieverPort,
        auditor: ClauseAuditorPort,
        concurrency: int = 20,
        top_k: int = 3,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._retriever = retriever
        self._auditor = auditor
        self._concurrency = max(1, concurrency)
        self._top_k = max(1, top_k)

    async def execute(
        self,
        actor: TokenPayloadDTO,
        document_id: UUID,
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> DocumentAnalysisSummaryDTO:
        """Enforce RBAC, evaluate clauses concurrently, persist suggestions, and update status."""
        self._rbac_guard.ensure_can_mutate(actor.role)
        self._rbac_guard.authorize_action(actor.role, RBACAction.MUTATE_DOCUMENT)

        started_at = time.perf_counter()
        doc_with_clauses = await self._uow.documents.get_with_clauses(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if doc_with_clauses is None:
            raise EntityNotFoundError(
                f"Document '{document_id}' was not found in your organization."
            )

        document, clauses = doc_with_clauses

        # Clear any existing PENDING suggestions for idempotency on re-analysis
        await self._uow.redlines.delete_pending_by_document(
            org_id=actor.org_id,
            document_id=document.id,
        )

        audit_results = await _evaluate_clauses_concurrently(
            org_id=actor.org_id,
            document_id=document.id,
            clauses=clauses,
            retriever=self._retriever,
            auditor=self._auditor,
            concurrency=self._concurrency,
            top_k=self._top_k,
            stance=stance,
        )

        suggestions = _build_redline_suggestions(audit_results)
        persisted_suggestions = await self._uow.redlines.create_many(
            org_id=actor.org_id,
            suggestions=suggestions,
        )

        updated_doc = Document(
            id=document.id,
            org_id=actor.org_id,
            title=document.title,
            status=DocumentStatus.ANALYZED.value,
            version=document.version,
            created_by=document.created_by,
            created_at=document.created_at,
        )
        saved_doc = await self._uow.documents.update(
            org_id=actor.org_id,
            document=updated_doc,
            expected_version=document.version,
        )
        await self._uow.audit_logs.append(
            org_id=actor.org_id,
            entry=AuditLogEntry(
                org_id=actor.org_id,
                document_id=saved_doc.id,
                actor_user_id=actor.sub,
                actor_role=actor.role,
                action=AuditAction.DOCUMENT_ANALYZED,
                details={
                    "total_clauses": len(clauses),
                    "suggestions_created": len(persisted_suggestions),
                    "stance": stance.value,
                },
            ),
        )
        await self._uow.commit()

        elapsed_ms = round((time.perf_counter() - started_at) * 1000.0, 3)
        critical_count = sum(1 for r in audit_results if r.risk == RiskLevel.CRITICAL)
        high_count = sum(1 for r in audit_results if r.risk == RiskLevel.HIGH)
        medium_count = sum(1 for r in audit_results if r.risk == RiskLevel.MEDIUM)
        low_count = sum(1 for r in audit_results if r.risk == RiskLevel.LOW)
        compliant_count = sum(1 for r in audit_results if r.is_compliant)

        return DocumentAnalysisSummaryDTO(
            document_id=saved_doc.id,
            status=saved_doc.status,
            total_clauses=len(clauses),
            suggestions_created=len(persisted_suggestions),
            critical_count=critical_count,
            high_count=high_count,
            medium_count=medium_count,
            low_count=low_count,
            compliant_count=compliant_count,
            execution_time_ms=elapsed_ms,
            stance=stance,
        )


class StreamDocumentAnalysisUseCase:
    """Stream real-time Server-Sent Events (`text/event-stream`) as document clauses are audited."""

    def __init__(
        self,
        uow: UnitOfWorkPort,
        rbac_guard: RbacGuardService,
        retriever: PlaybookRetrieverPort,
        auditor: ClauseAuditorPort,
        concurrency: int = 20,
        top_k: int = 3,
    ) -> None:
        self._uow = uow
        self._rbac_guard = rbac_guard
        self._retriever = retriever
        self._auditor = auditor
        self._concurrency = max(1, concurrency)
        self._top_k = max(1, top_k)

    async def verify_access_and_load(
        self,
        actor: TokenPayloadDTO,
        document_id: UUID,
    ) -> tuple[Document, list[DocumentClause]]:
        """Validate RBAC and tenant ownership before opening the HTTP SSE stream."""
        self._rbac_guard.authorize_action(actor.role, RBACAction.VIEW_WORKSPACE)
        doc_with_clauses = await self._uow.documents.get_with_clauses(
            org_id=actor.org_id,
            document_id=document_id,
        )
        if doc_with_clauses is None:
            raise EntityNotFoundError(
                f"Document '{document_id}' was not found in your organization."
            )
        return doc_with_clauses

    async def stream_events(
        self,
        actor: TokenPayloadDTO,
        document: Document,
        clauses: list[DocumentClause],
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> AsyncIterator[str]:
        """Yield SSE-formatted `clause_audited` events followed by a final `completed` event."""
        total_count = len(clauses)
        audit_results = await _evaluate_clauses_concurrently(
            org_id=actor.org_id,
            document_id=document.id,
            clauses=clauses,
            retriever=self._retriever,
            auditor=self._auditor,
            concurrency=self._concurrency,
            top_k=self._top_k,
            stance=stance,
        )

        # Persist suggestions if caller has mutation permissions and none exist yet
        if actor.role in MUTATING_ROLES:
            existing_redlines = await self._uow.redlines.list_by_document(
                org_id=actor.org_id,
                document_id=document.id,
            )
            if not existing_redlines:
                suggestions = _build_redline_suggestions(audit_results)
                if suggestions:
                    await self._uow.redlines.create_many(
                        org_id=actor.org_id,
                        suggestions=suggestions,
                    )
                    await self._uow.commit()

        for idx, res in enumerate(audit_results, start=1):
            progress_event = AuditProgressEvent(
                event_type="clause_audited",
                document_id=document.id,
                clause_id=res.clause_id,
                clause_index=res.clause_index,
                completed_count=idx,
                total_count=total_count,
                risk=res.risk,
                status="COMPLIANT" if res.is_compliant else "REDLINE_PROPOSED",
            )
            payload: dict[str, object] = {
                "event_type": progress_event.event_type,
                "document_id": str(progress_event.document_id),
                "clause_id": str(progress_event.clause_id) if progress_event.clause_id else None,
                "clause_index": progress_event.clause_index,
                "completed_count": progress_event.completed_count,
                "total_count": progress_event.total_count,
                "risk": progress_event.risk.value if progress_event.risk else None,
                "status": progress_event.status,
                "is_compliant": res.is_compliant,
                "category": res.category,
                "matched_rule_id": str(res.matched_rule_id) if res.matched_rule_id else None,
                "proposed_text": res.proposed_text,
                "rationale": res.rationale,
                "stance": res.stance.value if res.stance else stance.value,
            }
            yield format_sse_event("clause_audited", payload)

        completed_event = AuditProgressEvent(
            event_type="completed",
            document_id=document.id,
            clause_id=None,
            clause_index=None,
            completed_count=total_count,
            total_count=total_count,
            risk=None,
            status=DocumentStatus.ANALYZED.value,
        )
        completed_payload: dict[str, object] = {
            "event_type": completed_event.event_type,
            "document_id": str(completed_event.document_id),
            "clause_id": None,
            "clause_index": None,
            "completed_count": completed_event.completed_count,
            "total_count": completed_event.total_count,
            "risk": None,
            "status": completed_event.status,
            "stance": stance.value,
        }
        yield format_sse_event("completed", completed_payload)


__all__ = [
    "AnalyzeDocumentClausesUseCase",
    "StreamDocumentAnalysisUseCase",
    "format_sse_event",
]

