"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InlineDiffPreview } from "@/components/diff/InlineDiffPreview";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";
import { useI18n } from "@/i18n/useI18n";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  buildTipTapDocumentFromClauses,
  ClauseNodeExtension,
  ClauseRiskBadge,
  resolveClauseRiskBadge,
} from "./ClauseNodeExtension";
import { RiskHeatmapGutter } from "./RiskHeatmapGutter";

export interface ContractEditorCanvasProps {
  clauses: ClauseDTO[];
  redlines: RedlineSuggestionDTO[];
  documentTitle?: string;
}

const CLAUSE_ACCENT_BAR_MAP: Record<ClauseRiskBadge, string> = {
  CRITICAL: "border-l-4 border-l-rose-500",
  HIGH: "border-l-4 border-l-amber-500",
  MEDIUM: "border-l-4 border-l-sky-500",
  LOW: "border-l-4 border-l-sky-400",
  COMPLIANT: "border-l-4 border-l-emerald-500",
};

const RISK_PILL_STYLE_MAP: Record<ClauseRiskBadge, string> = {
  CRITICAL:
    "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
  HIGH: "border-amber-200/90 bg-amber-50/90 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
  MEDIUM:
    "border-sky-200/90 bg-sky-50/90 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300",
  LOW: "border-sky-200/90 bg-sky-50/90 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300",
  COMPLIANT:
    "border-emerald-200/90 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
};

const RISK_DOT_STYLE_MAP: Record<ClauseRiskBadge, string> = {
  CRITICAL: "bg-rose-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-sky-500",
  LOW: "bg-sky-400",
  COMPLIANT: "bg-emerald-500",
};

const EditorClauseItem = React.memo(
  ({
    clause,
    suggestion,
    onRef,
    onSelect,
  }: {
    clause: ClauseDTO;
    suggestion?: RedlineSuggestionDTO;
    onRef: (el: HTMLDivElement | null) => void;
    onSelect: (clauseId: string) => void;
  }) => {
    const isSelected = useWorkspaceStore(
      (state) => state.activeClauseId === clause.id
    );
    const isHoverDiffActive = useWorkspaceStore(
      (state) =>
        Boolean(suggestion) &&
        state.hoveredSuggestionId !== null &&
        suggestion?.id === state.hoveredSuggestionId
    );
    const riskBadge = resolveClauseRiskBadge(suggestion);

    return (
      <div
        ref={onRef}
        role="button"
        tabIndex={0}
        data-testid={`editor-clause-${clause.id}`}
        data-clause-id={clause.id}
        data-clause-index={clause.clause_index}
        data-risk-level={riskBadge}
        data-active={isSelected ? "true" : "false"}
        onClick={() => onSelect(clause.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(clause.id);
          }
        }}
        className={`cursor-pointer border-b border-slate-100/90 py-5 pl-5 pr-4 transition-all last:border-b-0 dark:border-slate-800/60 ${
          CLAUSE_ACCENT_BAR_MAP[riskBadge]
        } ${
          isSelected
            ? "rounded-xl bg-indigo-50/55 ring-1 ring-inset ring-indigo-500/20 dark:bg-indigo-950/30 dark:ring-indigo-500/30"
            : "hover:bg-slate-50/75 dark:hover:bg-slate-800/30"
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span
                aria-hidden="true"
                className="text-slate-400 dark:text-slate-500"
              >
                §
              </span>
              <span>#{clause.clause_index + 1}</span>
            </span>
            {clause.heading ? (
              <h3 className="text-[14.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {clause.heading}
              </h3>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`micro-badge ${RISK_PILL_STYLE_MAP[riskBadge]}`}
            >
              <span
                className={`micro-badge-dot ${RISK_DOT_STYLE_MAP[riskBadge]}`}
                aria-hidden="true"
              />
              {riskBadge}
            </span>
            <span className="rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
              v{clause.version}
            </span>
          </div>
        </div>

        {isHoverDiffActive && suggestion ? (
          <InlineDiffPreview
            clauseId={clause.id}
            originalText={clause.current_text}
            proposedText={suggestion.proposed_text}
          />
        ) : (
          <p className="legal-document-prose text-slate-800 dark:text-slate-200">
            {clause.current_text}
          </p>
        )}
      </div>
    );
  }
);

EditorClauseItem.displayName = "EditorClauseItem";

export const ContractEditorCanvas: React.FC<ContractEditorCanvasProps> = ({
  clauses,
  redlines,
  documentTitle = "Master Commercial Agreement — Review Copy",
}) => {
  const { t } = useI18n();
  const selectClause = useWorkspaceStore((state) => state.selectClause);
  const negotiationStance = useWorkspaceStore(
    (state) => state.negotiationStance
  );
  const documentVersion = useWorkspaceStore((state) => state.documentVersion);
  const clauseElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const pendingRedlineCount = useMemo(
    () => redlines.filter((r) => r.status === "PENDING").length,
    [redlines]
  );

  const redlinesByClauseId = useMemo(() => {
    const map = new Map<string, RedlineSuggestionDTO>();
    for (const r of redlines) {
      map.set(r.clause_id, r);
    }
    return map;
  }, [redlines]);

  const tipTapDoc = useMemo(
    () => buildTipTapDocumentFromClauses(clauses, redlinesByClauseId),
    [clauses, redlinesByClauseId]
  );

  const editor = useEditor({
    extensions: [StarterKit, ClauseNodeExtension],
    content: tipTapDoc,
    immediatelyRender: false,
    editable: true,
    editorProps: {
      attributes: {
        class: "sr-only",
        "aria-label": "ProseMirror Contract Document Backing Model",
      },
    },
  });

  // Synchronize scroll position when selection originates from the right-hand AI Inspector
  useEffect(() => {
    const unsubscribe = useWorkspaceStore.subscribe((state) => {
      if (!state.activeClauseId || state.selectionSource !== "inspector") {
        return;
      }
      const targetNode = clauseElementRefs.current.get(state.activeClauseId);
      if (targetNode && typeof targetNode.scrollIntoView === "function") {
        targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    return unsubscribe;
  }, []);

  const handleSelectClause = useCallback(
    (clauseId: string) => {
      selectClause(clauseId, "editor");
    },
    [selectClause]
  );

  return (
    <div
      data-testid="contract-editor-canvas"
      className="bg-enterprise-canvas flex h-full w-full overflow-hidden"
    >
      <RiskHeatmapGutter
        clauses={clauses}
        redlinesByClauseId={redlinesByClauseId}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-8">
        {/* Backing TipTap ProseMirror instance with ClauseNodeExtension */}
        {editor ? <EditorContent editor={editor} /> : null}

        {/* Elevated Legal Document Sheet */}
        <div className="legal-document-sheet mx-auto my-5 max-w-4xl rounded-2xl p-6 sm:p-8">
          {/* Formal Legal Sheet Header & Compact Single-Row Summary Strip */}
          <div className="mb-5 border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                {t.editor.sheetEyebrow}
              </span>
              <span className="whitespace-nowrap rounded-md border border-slate-200/90 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300">
                {t.editor.revisionPrefix} v{documentVersion}
              </span>
            </div>

            <h2 className="mt-2 font-serif text-xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {documentTitle}
            </h2>

            {/* Compact Single-Row Executive Instrument Summary Strip */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/75 px-3.5 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-2.5 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {t.editor.agreementLabel}
                </span>
                <span
                  aria-hidden="true"
                  className="text-slate-300 dark:text-slate-700"
                >
                  ·
                </span>
                <span className="font-mono">
                  {t.editor.posturePrefix}{" "}
                  <strong className="font-semibold uppercase text-indigo-700 dark:text-indigo-300">
                    {negotiationStance}
                  </strong>
                </span>
                <span
                  aria-hidden="true"
                  className="text-slate-300 dark:text-slate-700"
                >
                  ·
                </span>
                <span className="font-mono tabular-nums">
                  {clauses.length} {t.editor.provisionsSuffix}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] font-semibold">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    pendingRedlineCount > 0 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={
                    pendingRedlineCount > 0
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  }
                >
                  {pendingRedlineCount > 0
                    ? `${pendingRedlineCount} ${t.editor.flaggedSuffix}`
                    : t.editor.verifiedStatus}
                </span>
              </span>
            </div>
          </div>

          {/* Cohesive Clause Sections */}
          <div className="divide-y divide-slate-100/90 dark:divide-slate-800/60">
            {clauses.map((clause) => (
              <EditorClauseItem
                key={clause.id}
                clause={clause}
                suggestion={redlinesByClauseId.get(clause.id)}
                onRef={(el) => {
                  if (el) {
                    clauseElementRefs.current.set(clause.id, el);
                  } else {
                    clauseElementRefs.current.delete(clause.id);
                  }
                }}
                onSelect={handleSelectClause}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
