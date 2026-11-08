"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
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
  { mode: "ALL", label: "All" },
  { mode: "CRITICAL", label: "Critical" },
  { mode: "HIGH", label: "High" },
  { mode: "MEDIUM", label: "Medium" },
  { mode: "COMPLIANT", label: "Compliant" },
];

const EMPTY_COMMENTS: ClauseCommentDTO[] = [];

const CompliantClauseCard = React.memo(
  ({
    clause,
    onSelect,
    onRef,
  }: {
    clause: ClauseDTO;
    onSelect: (clauseId: string) => void;
    onRef: (el: HTMLDivElement | null) => void;
  }) => {
    const isSelected = useWorkspaceStore(
      (state) => state.activeClauseId === clause.id
    );

    return (
      <div
        ref={onRef}
        data-testid={`redline-card-${clause.id}`}
        data-clause-id={clause.id}
        data-risk-level="COMPLIANT"
        data-active={isSelected ? "true" : "false"}
        onClick={() => onSelect(clause.id)}
        className={`cursor-pointer rounded-xl border p-4 transition-all ${
          isSelected
            ? "border-indigo-500 bg-white shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-slate-900 dark:ring-indigo-500/35"
            : "border-slate-200/90 bg-white shadow-sm hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Clause #{clause.clause_index + 1}:{" "}
              {clause.heading ?? "Provision"}
            </span>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            COMPLIANT
          </span>
        </div>
        <p className="mt-1.5 pl-6 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          Satisfies company Playbook standards with zero unacceptable triggers.
        </p>
      </div>
    );
  }
);

CompliantClauseCard.displayName = "CompliantClauseCard";

const ActiveClauseCommentBar = React.memo(
  ({
    clauses,
    clausesById,
    commentsByClauseId,
    onAddComment,
  }: {
    clauses: ClauseDTO[];
    clausesById: ReadonlyMap<string, ClauseDTO>;
    commentsByClauseId: ReadonlyMap<string, ClauseCommentDTO[]>;
    onAddComment: (clauseId: string, body: string) => Promise<void> | void;
  }) => {
    const activeClauseId = useWorkspaceStore((state) => state.activeClauseId);
    const activeClause =
      (activeClauseId && clausesById.get(activeClauseId)) || clauses[0] || null;

    if (!activeClause) {
      return null;
    }

    return (
      <ClauseCommentThread
        clause={activeClause}
        comments={commentsByClauseId.get(activeClause.id) ?? EMPTY_COMMENTS}
        onAddComment={onAddComment}
      />
    );
  }
);

ActiveClauseCommentBar.displayName = "ActiveClauseCommentBar";

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
  const riskFilter = useWorkspaceStore((state) => state.riskFilter);
  const setRiskFilter = useWorkspaceStore((state) => state.setRiskFilter);
  const streamProgress = useWorkspaceStore((state) => state.streamProgress);
  const selectClause = useWorkspaceStore((state) => state.selectClause);
  const storeAuditLogs = useWorkspaceStore((state) => state.auditLogs);
  const negotiationStance = useWorkspaceStore((state) => state.negotiationStance);

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
    for (const c of comments) {
      const existing = map.get(c.clause_id);
      if (existing) {
        existing.push(c);
      } else {
        map.set(c.clause_id, [c]);
      }
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
    const unsubscribe = useWorkspaceStore.subscribe((state, prevState) => {
      if (
        state.activeClauseId === prevState.activeClauseId ||
        !state.activeClauseId ||
        state.selectionSource !== "editor"
      ) {
        return;
      }
      const cardEl = cardContainerRefs.current.get(state.activeClauseId);
      if (cardEl && typeof cardEl.scrollIntoView === "function") {
        if (
          typeof window !== "undefined" &&
          typeof window.requestAnimationFrame === "function"
        ) {
          window.requestAnimationFrame(() => {
            cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
        } else {
          cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleSelectFromInspector = useCallback(
    (clauseId: string) => {
      selectClause(clauseId, "inspector");
    },
    [selectClause]
  );

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
      className="flex h-full w-full flex-col overflow-hidden bg-slate-50/90 dark:bg-[#0B0F19]"
    >
      {/* Inspector Header & Summary */}
      <div className="border-b border-slate-200/80 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              AI Redline Inspector
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Playbook benchmarking &amp; surgical clause resolutions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span
              data-testid="inspector-active-stance-badge"
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                negotiationStance === "strict"
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
                  : negotiationStance === "commercial"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300"
              }`}
            >
              Stance: {negotiationStance}
            </span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {criticalCount} Critical
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {highCount} High
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {compliantClauses.length} Compliant
            </span>
          </div>
        </div>

        {/* Segmented Tab Control: AI Redlines vs Audit Trail */}
        <div className="mt-3.5 flex gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-950/70">
          <button
            type="button"
            data-testid="inspector-tab-redlines"
            onClick={() => setActiveViewTab("redlines")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeViewTab === "redlines"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            AI Redlines ({redlines.length})
          </button>
          <button
            type="button"
            data-testid="inspector-tab-audit"
            onClick={() => setActiveViewTab("audit")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeViewTab === "audit"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Audit Trail ({resolvedAuditLogs.length})
          </button>
        </div>

        {/* Real-time SSE Audit Progress Bar */}
        {streamProgress.isStreaming || streamProgress.total > 0 ? (
          <div
            data-testid="sse-progress-bar"
            className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span>
                {streamProgress.isStreaming
                  ? "Streaming LangChain Clause Evaluation..."
                  : "AI Playbook Audit Complete"}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {streamProgress.completed}/{streamProgress.total} clauses
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-150 dark:bg-indigo-500"
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

        {/* Pill Filter Bar (shown in Redlines view) */}
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "border-indigo-600 bg-indigo-600 font-semibold text-white shadow-sm"
                      : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
              className="m-5 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-8 text-center shadow-sm dark:border-indigo-500/25 dark:bg-slate-900/60"
            >
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Ready for Playbook Benchmarking
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                This agreement contains {clauses.length} segmented provisions.
                Run AI analysis to evaluate liability caps, indemnification,
                SLAs, and data governance against your Company Playbook.
              </p>
              <button
                type="button"
                data-testid="empty-state-analyze-btn"
                onClick={onTriggerAudit}
                disabled={streamProgress.isStreaming}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {streamProgress.isStreaming
                    ? "Auditing Clauses..."
                    : "Analyze Contract with AI"}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              {riskFilter !== "COMPLIANT" &&
                filteredRedlines.map((suggestion) => {
                  const clause = clausesById.get(suggestion.clause_id);
                  if (!clause) {
                    return null;
                  }
                  const clauseComments =
                    commentsByClauseId.get(clause.id) ?? EMPTY_COMMENTS;
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
                compliantClauses.map((clause) => (
                  <CompliantClauseCard
                    key={clause.id}
                    clause={clause}
                    onSelect={handleSelectFromInspector}
                    onRef={(el) => {
                      if (el) {
                        cardContainerRefs.current.set(clause.id, el);
                      } else {
                        cardContainerRefs.current.delete(clause.id);
                      }
                    }}
                  />
                ))}
            </div>
          )}

          {/* Threaded Clause Comments Panel */}
          {onAddComment ? (
            <ActiveClauseCommentBar
              clauses={clauses}
              clausesById={clausesById}
              commentsByClauseId={commentsByClauseId}
              onAddComment={onAddComment}
            />
          ) : null}
        </>
      )}
    </aside>
  );
};
