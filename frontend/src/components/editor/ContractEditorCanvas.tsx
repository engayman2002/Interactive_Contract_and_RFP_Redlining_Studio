"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InlineDiffPreview } from "@/components/diff/InlineDiffPreview";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";
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
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  MEDIUM:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  LOW: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  COMPLIANT:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
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
        className={`cursor-pointer border-b border-slate-100 py-5 pl-5 pr-4 transition-all last:border-b-0 dark:border-slate-800/60 ${
          CLAUSE_ACCENT_BAR_MAP[riskBadge]
        } ${
          isSelected
            ? "rounded-lg bg-indigo-50/50 ring-1 ring-indigo-500/20 dark:bg-indigo-950/25 dark:ring-indigo-500/30"
            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
        }`}
      >
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              #{clause.clause_index + 1}
            </span>
            {clause.heading ? (
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {clause.heading}
              </h3>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${RISK_PILL_STYLE_MAP[riskBadge]}`}
            >
              {riskBadge}
            </span>
            <span className="rounded border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
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
  const selectClause = useWorkspaceStore((state) => state.selectClause);
  const clauseElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
      className="flex h-full w-full overflow-hidden bg-slate-100/70 dark:bg-[#0B0F19]"
    >
      <RiskHeatmapGutter
        clauses={clauses}
        redlinesByClauseId={redlinesByClauseId}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-8">
        {/* Backing TipTap ProseMirror instance with ClauseNodeExtension */}
        {editor ? <EditorContent editor={editor} /> : null}

        {/* Elevated Legal Document Sheet */}
        <div className="mx-auto my-6 max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          {/* Formal Legal Sheet Header */}
          <div className="mb-6 border-b border-slate-200/80 pb-6 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Confidential Legal Review Instrument
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {clauses.length} Segmented Provisions
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {documentTitle}
            </h2>
          </div>

          {/* Cohesive Clause Sections */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
