"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  AuditLogEntryDTO,
  ClauseCommentDTO,
  ClauseDTO,
  RedlineSuggestionDTO,
} from "@/services/contracts";
import { RiskFilterMode, useWorkspaceStore } from "@/store/workspaceStore";
import { AuditTrailPanel } from "./AuditTrailPanel";
import { ClauseCommentThread } from "./ClauseCommentThread";
import { RedlineCard } from "./RedlineCard";

export interface AiInspectorPanelProps {
  clauses: ClauseDTO[];
  redlines: RedlineSuggestionDTO[];
  comments?: ClauseCommentDTO[];
  auditLogs?: AuditLogEntryDTO[];
  onAcceptSuggestion?: (suggestionId: string) => Promise<void> | void;
  onModifySuggestion?: (
    suggestionId: string,
    modifiedText: string
  ) => Promise<void> | void;
  onRejectSuggestion?: (suggestionId: string) => Promise<void> | void;
  onAddComment?: (clauseId: string, body: string) => Promise<void> | void;
  onLocalApplyPreview?: (clauseId: string, proposedText: string) => void;
  onLocalRejectPreview?: (suggestionId: string) => void;
  onTriggerAudit?: () => void;
}

const FILTER_TABS: { mode: RiskFilterMode; label: string }[] = [
  { mode: "ALL", label: "All Risks" },
  { mode: "CRITICAL", label: "Critical" },
  { mode: "HIGH", label: "High" },
  { mode: "MEDIUM", label: "Medium" },
  { mode: "COMPLIANT", label: "Compliant" },
];

const EMPTY_COMMENTS: ClauseCommentDTO[] = [];

export const AiInspectorPanel: React.FC<AiInspectorPanelProps> = ({
  clauses,
  redlines,
  comments = [],
  auditLogs,
  onAcceptSuggestion,
  onModifySuggestion,
  onRejectSuggestion,
  onAddComment,
  onLocalApplyPreview,
  onLocalRejectPreview,
  onTriggerAudit,
}) => {
  const activeClauseId = useWorkspaceStore((state) => state.activeClauseId);
  const selectionSource = useWorkspaceStore((state) => state.selectionSource);
  const riskFilter = useWorkspaceStore((state) => state.riskFilter);
  const setRiskFilter = useWorkspaceStore((state) => state.setRiskFilter);
  const streamProgress = useWorkspaceStore((state) => state.streamProgress);
  const selectClause = useWorkspaceStore((state) => state.selectClause);
  const storeAuditLogs = useWorkspaceStore((state) => state.auditLogs);

  const resolvedAuditLogs = auditLogs ?? storeAuditLogs;
  const [activeViewTab, setActiveViewTab] = useState<"redlines" | "audit">(
    "redlines"
  );

  const cardContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const clausesById = useMemo(() => {
    const map = new Map<string, ClauseDTO>();
    for (const c of clauses) {
      map.set(c.id, c);
    }
    return map;
  }, [clauses]);

  const redlinesByClauseId = useMemo(() => {
    const map = new Map<string, RedlineSuggestionDTO>();
    for (const r of redlines) {
      map.set(r.clause_id, r);
    }
    return map;
  }, [redlines]);

  const commentsByClauseId = useMemo(() => {
    const map = new Map<string, ClauseCommentDTO[]>();
    for (const cm of comments) {
      const existing = map.get(cm.clause_id) ?? [];
      existing.push(cm);
      map.set(cm.clause_id, existing);
    }
    return map;
  }, [comments]);

  const filteredRedlines = useMemo(() => {
    if (riskFilter === "ALL") {
      return redlines;
    }
    if (riskFilter === "COMPLIANT") {
      return [];
    }
    return redlines.filter((r) => r.risk === riskFilter);
  }, [redlines, riskFilter]);

  const compliantClauses = useMemo(
    () => clauses.filter((c) => !redlinesByClauseId.has(c.id)),
    [clauses, redlinesByClauseId]
  );

  // Scroll matching AI card into view when user clicks a clause in the left-hand editor
  useEffect(() => {
    if (!activeClauseId || selectionSource !== "editor") {
      return;
    }
    const cardEl = cardContainerRefs.current.get(activeClauseId);
    if (cardEl && typeof cardEl.scrollIntoView === "function") {
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => {
          cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      } else {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeClauseId, selectionSource]);

  const activeClauseForComments = useMemo(() => {
    if (activeClauseId && clausesById.has(activeClauseId)) {
      return clausesById.get(activeClauseId) ?? null;
    }
    return clauses[0] ?? null;
  }, [activeClauseId, clauses, clausesById]);

  const criticalCount = useMemo(
    () => redlines.filter((r) => r.risk === "CRITICAL").length,
    [redlines]
  );
  const highCount = useMemo(
    () => redlines.filter((r) => r.risk === "HIGH").length,
    [redlines]
  );

  return (
    <aside
      aria-label="AI Redline Inspector Panel"
      data-testid="ai-inspector-panel"
      className="flex h-full w-full flex-col overflow-hidden bg-slate-950"
    >
      {/* Inspector Header & Summary */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-100">
              AI Redline Inspector
            </h2>
            <p className="text-xs text-slate-400">
              Hover over &ldquo;Apply Redline&rdquo; to preview inline word-level
              diffs
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">
              {criticalCount} Critical
            </span>
            <span className="rounded bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300">
              {highCount} High
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
              {compliantClauses.length} Compliant
            </span>
          </div>
        </div>

        {/* View Mode Switcher: Redlines vs Compliance Audit Trail */}
        <div className="mt-3 flex gap-2 border-b border-slate-800 pb-2.5">
          <button
            type="button"
            data-testid="inspector-tab-redlines"
            onClick={() => setActiveViewTab("redlines")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              activeViewTab === "redlines"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Redlines ({redlines.length})
          </button>
          <button
            type="button"
            data-testid="inspector-tab-audit"
            onClick={() => setActiveViewTab("audit")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              activeViewTab === "audit"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Audit Trail ({resolvedAuditLogs.length})
          </button>
        </div>

        {/* Real-time SSE Audit Progress Bar */}
        {streamProgress.isStreaming || streamProgress.total > 0 ? (
          <div
            data-testid="sse-progress-bar"
            className="mt-3 rounded border border-slate-800 bg-slate-950 px-3 py-2"
          >
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
              <span>
                {streamProgress.isStreaming
                  ? "Streaming LangChain Clause Evaluation..."
                  : "AI Audit Complete"}
              </span>
              <span className="font-mono">
                {streamProgress.completed}/{streamProgress.total} clauses
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{
                  width: `${
                    streamProgress.total > 0
                      ? Math.round(
                          (streamProgress.completed / streamProgress.total) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Filter Tabs (shown in Redlines view) */}
        {activeViewTab === "redlines" ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = riskFilter === tab.mode;
              return (
                <button
                  key={tab.mode}
                  type="button"
                  data-testid={`filter-tab-${tab.mode}`}
                  onClick={() => setRiskFilter(tab.mode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeViewTab === "audit" ? (
        <AuditTrailPanel auditLogs={resolvedAuditLogs} />
      ) : (
        <>
          {redlines.length === 0 ? (
            <div
              data-testid="empty-redlines-guide"
              className="m-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-indigo-500/30 bg-indigo-950/20 p-8 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 text-2xl text-indigo-400">
                ✨
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Ready for AI Redlining
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-300">
                This document contains {clauses.length} extracted clauses.
                Benchmarking against your corporate playbook will surface
                critical liability, indemnification, SLA, and privacy risks.
              </p>
              <button
                type="button"
                data-testid="empty-state-analyze-btn"
                onClick={onTriggerAudit}
                disabled={streamProgress.isStreaming}
                className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
              >
                <span>✨</span>
                <span>
                  {streamProgress.isStreaming
                    ? "Auditing Clauses..."
                    : "Analyze Contract with AI"}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {riskFilter !== "COMPLIANT" &&
                filteredRedlines.map((suggestion) => {
                  const clause = clausesById.get(suggestion.clause_id);
                  if (!clause) {
                    return null;
                  }
                  const clauseComments = commentsByClauseId.get(clause.id) ?? [];
                  return (
                    <div
                      key={suggestion.id}
                      ref={(el) => {
                        if (el) {
                          cardContainerRefs.current.set(clause.id, el);
                        } else {
                          cardContainerRefs.current.delete(clause.id);
                        }
                      }}
                    >
                      <RedlineCard
                        clause={clause}
                        suggestion={suggestion}
                        commentCount={clauseComments.length}
                        onAcceptSuggestion={onAcceptSuggestion}
                        onModifySuggestion={onModifySuggestion}
                        onRejectSuggestion={onRejectSuggestion}
                        onLocalApplyPreview={onLocalApplyPreview}
                        onLocalRejectPreview={onLocalRejectPreview}
                      />
                    </div>
                  );
                })}

              {(riskFilter === "ALL" || riskFilter === "COMPLIANT") &&
                compliantClauses.map((clause) => {
                  const isSelected = activeClauseId === clause.id;
                  return (
                    <div
                      key={clause.id}
                      ref={(el) => {
                        if (el) {
                          cardContainerRefs.current.set(clause.id, el);
                        } else {
                          cardContainerRefs.current.delete(clause.id);
                        }
                      }}
                      data-testid={`redline-card-${clause.id}`}
                      data-clause-id={clause.id}
                      data-risk-level="COMPLIANT"
                      data-active={isSelected ? "true" : "false"}
                      onClick={() => selectClause(clause.id, "inspector")}
                      className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-950/35 ring-2 ring-indigo-500/80"
                          : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          Clause #{clause.clause_index + 1}:{" "}
                          {clause.heading ?? "Provision"}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          COMPLIANT
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Satisfies company playbook standards with zero
                        unacceptable triggers.
                      </p>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Threaded Clause Comments Panel */}
          {activeClauseForComments && onAddComment ? (
            <ClauseCommentThread
              clause={activeClauseForComments}
              comments={commentsByClauseId.get(activeClauseForComments.id) ?? EMPTY_COMMENTS}
              onAddComment={onAddComment}
            />
          ) : null}
        </>
      )}
    </aside>
  );
};
