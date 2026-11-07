"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InlineDiffPreview } from "@/components/diff/InlineDiffPreview";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  ClauseNodeExtension,
  ClauseRiskBadge,
  buildTipTapDocumentFromClauses,
  resolveClauseRiskBadge,
} from "./ClauseNodeExtension";
import { RiskHeatmapGutter } from "./RiskHeatmapGutter";

export interface ContractEditorCanvasProps {
  clauses: ClauseDTO[];
  redlines: RedlineSuggestionDTO[];
}

const CLAUSE_BORDER_MAP: Record<ClauseRiskBadge, string> = {
  CRITICAL: "border-l-4 border-l-rose-500",
  HIGH: "border-l-4 border-l-amber-500",
  MEDIUM: "border-l-4 border-l-sky-400",
  LOW: "border-l-4 border-l-sky-500/60",
  COMPLIANT: "border-l-4 border-l-emerald-500",
};

const RISK_PILL_STYLE_MAP: Record<ClauseRiskBadge, string> = {
  CRITICAL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  HIGH: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  MEDIUM: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  LOW: "bg-slate-700/60 text-slate-300 border-slate-600",
  COMPLIANT: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

interface EditorClauseItemProps {
  clause: ClauseDTO;
  suggestion?: RedlineSuggestionDTO;
  onRef: (el: HTMLDivElement | null) => void;
  onSelect: (clauseId: string) => void;
}

const EditorClauseItem: React.FC<EditorClauseItemProps> = React.memo(
  ({ clause, suggestion, onRef, onSelect }) => {
    const isSelected = useWorkspaceStore(
      (state) => state.activeClauseId === clause.id
    );
    const hoveredSuggestionId = useWorkspaceStore(
      (state) => state.hoveredSuggestionId
    );
    const riskBadge = resolveClauseRiskBadge(suggestion);
    const isHoverDiffActive =
      Boolean(suggestion) &&
      hoveredSuggestionId !== null &&
      suggestion?.id === hoveredSuggestionId;

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
        className={`cursor-pointer rounded-r-lg border border-slate-800/90 p-4 transition-colors ${
          CLAUSE_BORDER_MAP[riskBadge]
        } ${
          isSelected
            ? "bg-indigo-950/40 ring-2 ring-indigo-500/80"
            : "bg-slate-900/60 hover:bg-slate-900"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
              #{clause.clause_index + 1}
            </span>
            {clause.heading ? (
              <h3 className="text-sm font-semibold text-slate-100">
                {clause.heading}
              </h3>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${RISK_PILL_STYLE_MAP[riskBadge]}`}
            >
              {riskBadge}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
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
          <p className="text-sm leading-relaxed text-slate-200">
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
      className="flex h-full w-full overflow-hidden bg-slate-950"
    >
      <RiskHeatmapGutter
        clauses={clauses}
        redlinesByClauseId={redlinesByClauseId}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Backing TipTap ProseMirror instance with ClauseNodeExtension */}
        {editor ? <EditorContent editor={editor} /> : null}

        <div className="mx-auto max-w-3xl space-y-4">
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
  );
};
