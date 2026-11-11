"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type {
  AuditLogEntryDTO,
  ClauseCommentDTO,
  ClauseDTO,
  RedlineSuggestionDTO,
} from "@/services/contracts";
import { RiskFilterMode, useWorkspaceStore } from "@/store/workspaceStore";
import { AITelemetryPanel } from "./AITelemetryPanel";
import { AuditTrailPanel } from "./AuditTrailPanel";
import { ClauseCommentThread } from "./ClauseCommentThread";
import { CrossClauseRadarPanel } from "./CrossClauseRadarPanel";
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
        className={`surface-card cursor-pointer rounded-xl p-3.5 transition-all ${
          isSelected
            ? "border-indigo-400/90 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500/80 dark:ring-indigo-500/35"
            : "hover:border-slate-300/90 hover:shadow-md dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              Clause #{clause.clause_index + 1}:{" "}
              {clause.heading ?? "Provision"}
            </span>
          </div>
          <span className="micro-badge shrink-0 whitespace-nowrap border-emerald-200/90 bg-emerald-50/90 tracking-wider text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="micro-badge-dot bg-emerald-500" aria-hidden="true" />
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
  const [activeViewTab, setActiveViewTab] = useState<
    "redlines" | "radar" | "audit" | "telemetry"
  >("redlines");

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
  const mediumCount = useMemo(
    () => redlines.filter((r) => r.risk === "MEDIUM").length,
    [redlines]
  );
  const lowCount = useMemo(
    () => redlines.filter((r) => r.risk === "LOW").length,
    [redlines]
  );

  const filterCounts: Record<RiskFilterMode, number> = {
    ALL: redlines.length + compliantClauses.length,
    CRITICAL: criticalCount,
    HIGH: highCount,
    MEDIUM: mediumCount,
    LOW: lowCount,
    COMPLIANT: compliantClauses.length,
  };

  return (
    <aside
      aria-label="AI Redline Inspector Panel"
      data-testid="ai-inspector-panel"
      className="bg-enterprise-canvas flex h-full w-full flex-col overflow-hidden"
    >
      {/* Compressed 2-Row Executive Inspector Header (~85px shorter so Clause #1 actions sit above the fold) */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#070B14]/95">
        {/* Row 1: Compact Title + Stance Pill + 4-Tab Segmented Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex shrink-0 items-center gap-2">
            <h2 className="whitespace-nowrap text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              AI Redline Inspector
            </h2>
            <span
              data-testid="inspector-active-stance-badge"
              className={`micro-badge shrink-0 whitespace-nowrap uppercase tracking-wider ${
                negotiationStance === "strict"
                  ? "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
                  : negotiationStance === "commercial"
                  ? "border-emerald-200/90 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-indigo-200/90 bg-indigo-50/90 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300"
              }`}
            >
              <span
                className={`micro-badge-dot ${
                  negotiationStance === "strict"
                    ? "bg-rose-500"
                    : negotiationStance === "commercial"
                    ? "bg-emerald-500"
                    : "bg-indigo-500"
                }`}
                aria-hidden="true"
              />
              Stance: {negotiationStance}
            </span>
          </div>

          <div className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100/90 p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              data-testid="inspector-tab-redlines"
              onClick={() => setActiveViewTab("redlines")}
              className={`inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-all ${
                activeViewTab === "redlines"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3 w-3 shrink-0 text-indigo-500" />
              <span>Redlines</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {redlines.length}
              </span>
            </button>
            <button
              type="button"
              data-testid="inspector-tab-cross-clause"
              onClick={() => setActiveViewTab("radar")}
              className={`inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-all ${
                activeViewTab === "radar"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="h-3 w-3 shrink-0 text-amber-500" />
              <span>Radar</span>
            </button>
            <button
              type="button"
              data-testid="inspector-tab-telemetry"
              onClick={() => setActiveViewTab("telemetry")}
              className={`inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-all ${
                activeViewTab === "telemetry"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Activity className="h-3 w-3 shrink-0 text-emerald-500" />
              <span>⚡ AI Telemetry</span>
            </button>
            <button
              type="button"
              data-testid="inspector-tab-audit"
              onClick={() => setActiveViewTab("audit")}
              className={`inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-semibold transition-all ${
                activeViewTab === "audit"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <ClipboardList className="h-3 w-3 shrink-0 text-sky-500" />
              <span>Audit Trail</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {resolvedAuditLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Real-time SSE Audit Progress Bar */}
        {streamProgress.isStreaming || streamProgress.total > 0 ? (
          <div
            data-testid="sse-progress-bar"
            className="mt-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/70"
          >
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span>
                {streamProgress.isStreaming
                  ? "Streaming LangChain Clause Evaluation..."
                  : "AI Playbook Audit Complete"}
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {streamProgress.completed}/{streamProgress.total} clauses
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-150"
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

        {/* Row 2: Unified Single-Line Risk Filter Pills with Embedded Counts */}
        {activeViewTab === "redlines" ? (
          <div className="mt-2 flex h-7 items-center gap-1.5 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const active = riskFilter === tab.mode;
              const count = filterCounts[tab.mode];
              const dotClass =
                tab.mode === "CRITICAL"
                  ? "bg-rose-500"
                  : tab.mode === "HIGH"
                  ? "bg-amber-500"
                  : tab.mode === "MEDIUM"
                  ? "bg-sky-500"
                  : tab.mode === "COMPLIANT"
                  ? "bg-emerald-500"
                  : "";
              return (
                <button
                  key={tab.mode}
                  type="button"
                  data-testid={`filter-tab-${tab.mode}`}
                  onClick={() => setRiskFilter(tab.mode)}
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-medium transition-all ${
                    active
                      ? "border-indigo-600 bg-gradient-to-b from-indigo-500 to-indigo-600 font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20"
                      : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {dotClass && !active ? (
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>
                    {tab.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeViewTab === "audit" ? (
        <AuditTrailPanel auditLogs={resolvedAuditLogs} />
      ) : activeViewTab === "radar" ? (
        <CrossClauseRadarPanel clauses={clauses} />
      ) : activeViewTab === "telemetry" ? (
        <AITelemetryPanel />
      ) : (
        <>
          {redlines.length === 0 ? (
            <div
              data-testid="empty-redlines-guide"
              className="surface-card m-5 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200/90 p-8 text-center dark:border-indigo-500/25"
            >
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200/70 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
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
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600 disabled:opacity-50"
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
