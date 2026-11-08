"""Concurrent Batch Document Clause Audit Worker using `asyncio.Semaphore` and `asyncio.gather`."""

import asyncio
from collections.abc import AsyncIterator, Sequence
from uuid import UUID

from src.domain.entities import (
    AuditProgressEvent,
    ClauseAuditInput,
    ClauseAuditResult,
    DocumentClause,
    PlaybookSearchQuery,
)
from src.domain.enums import NegotiationStance
from src.domain.ports import ClauseAuditorPort, PlaybookRetrieverPort


class BatchDocumentAuditWorker:
    """Evaluate all document clauses concurrently with bounded `asyncio.Semaphore` concurrency."""

    def __init__(
        self,
        retriever: PlaybookRetrieverPort,
        auditor: ClauseAuditorPort,
        concurrency: int = 20,
        top_k: int = 3,
    ) -> None:
        self._retriever = retriever
        self._auditor = auditor
        self._concurrency = max(1, concurrency)
        self._top_k = max(1, top_k)

    async def _evaluate_single_clause(
        self,
        org_id: UUID,
        document_id: UUID,
        clause: DocumentClause,
        semaphore: asyncio.Semaphore,
        retriever_lock: asyncio.Lock,
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> ClauseAuditResult:
        async with semaphore:
            query = PlaybookSearchQuery(
                org_id=org_id,
                query_text=clause.current_text,
                category=None,
                top_k=self._top_k,
            )
            async with retriever_lock:
                matched_rules = await self._retriever.retrieve_top_rules(query)

            audit_input = ClauseAuditInput(
                org_id=org_id,
                document_id=document_id,
                clause_id=clause.id,
                clause_index=clause.clause_index,
                heading=clause.heading,
                clause_text=clause.current_text,
                stance=stance,
            )
            return await self._auditor.audit_clause(
                audit_input=audit_input,
                matched_rules=matched_rules,
            )

    async def audit_document_clauses(
        self,
        org_id: UUID,
        document_id: UUID,
        clauses: Sequence[DocumentClause],
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> list[ClauseAuditResult]:
        """Concurrently evaluate all `clauses` and return results ordered by `clause_index`."""
        if not clauses:
            return []

        semaphore = asyncio.Semaphore(self._concurrency)
        retriever_lock = asyncio.Lock()

        tasks = [
            self._evaluate_single_clause(
                org_id=org_id,
                document_id=document_id,
                clause=clause,
                semaphore=semaphore,
                retriever_lock=retriever_lock,
                stance=stance,
            )
            for clause in clauses
        ]
        results = await asyncio.gather(*tasks)
        return sorted(results, key=lambda item: item.clause_index)

    async def stream_document_clauses(
        self,
        org_id: UUID,
        document_id: UUID,
        clauses: Sequence[DocumentClause],
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> AsyncIterator[tuple[ClauseAuditResult, AuditProgressEvent]]:
        """Evaluate clauses concurrently and yield `(ClauseAuditResult, AuditProgressEvent)`."""
        total_count = len(clauses)
        if total_count == 0:
            return

        results = await self.audit_document_clauses(
            org_id=org_id,
            document_id=document_id,
            clauses=clauses,
            stance=stance,
        )
        for idx, result in enumerate(results, start=1):
            event = AuditProgressEvent(
                event_type="clause_audited",
                document_id=document_id,
                clause_id=result.clause_id,
                clause_index=result.clause_index,
                completed_count=idx,
                total_count=total_count,
                risk=result.risk,
                status="COMPLIANT" if result.is_compliant else "REDLINE_PROPOSED",
            )
            yield result, event


__all__ = ["BatchDocumentAuditWorker"]
