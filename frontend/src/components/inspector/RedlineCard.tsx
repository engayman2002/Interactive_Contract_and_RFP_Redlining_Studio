"use client";

import React from "react";
import type {
  ClauseDTO,
  RedlineSuggestionDTO,
  RiskLevel,
} from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

export interface RedlineCardProps {
  clause: ClauseDTO;
  suggestion: RedlineSuggestionDTO;
  onLocalApplyPreview?: (clauseId: string, proposedText: string) => void;
  onLocalRejectPreview?: (suggestionId: string) => void;
}

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  HIGH: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  MEDIUM: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  LOW: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

function splitRationaleAndTalkingPoint(rawRationale: string): {
  rationale: string;
  talkingPoint: string | null;
} {
  const marker = " | Talking Point: ";
  const idx = rawRationale.indexOf(marker);
  if (idx === -1) {
    return { rationale: rawRationale, talkingPoint: null };
  }
  return {
    rationale: rawRationale.slice(0, idx).trim(),
    talkingPoint: rawRationale.slice(idx + marker.length).trim(),
  };
}

export const RedlineCard: React.FC<RedlineCardProps> = ({
  clause,
  suggestion,
  onLocalApplyPreview,
  onLocalRejectPreview,
}) => {
  const activeClauseId = useWorkspaceStore((state) => state.activeClauseId);
  const hoveredSuggestionId = useWorkspaceStore(
    (state) => state.hoveredSuggestionId
  );
  const selectClause = useWorkspaceStore((state) => state.selectClause);
  const setHoveredSuggestion = useWorkspaceStore(
    (state) => state.setHoveredSuggestion
  );

  const isSelected = activeClauseId === clause.id;
  const isHoveringApply = hoveredSuggestionId === suggestion.id;
  const { rationale, talkingPoint } = splitRationaleAndTalkingPoint(
    suggestion.rationale
  );

  return (
    <article
      data-testid={`redline-card-${clause.id}`}
      data-suggestion-id={suggestion.id}
      data-clause-id={clause.id}
      data-risk-level={suggestion.risk}
      data-active={isSelected ? "true" : "false"}
      onClick={() => selectClause(clause.id, "inspector")}
      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
        isSelected
          ? "border-indigo-500 bg-indigo-950/35 ring-2 ring-indigo-500/80"
          : "border-slate-800 bg-slate-900/75 hover:border-slate-700"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
            Clause #{clause.clause_index + 1}
          </span>
          <h4 className="text-sm font-semibold text-slate-100">
            {clause.heading ?? `Section ${clause.clause_index + 1}`}
          </h4>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${RISK_BADGE_STYLES[suggestion.risk]}`}
        >
          {suggestion.risk}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-300">{rationale}</p>

      {talkingPoint ? (
        <div className="mb-3 rounded border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Negotiation Talking Point:{" "}
          </span>
          {talkingPoint}
        </div>
      ) : null}

      <div className="mb-3 rounded-md border border-emerald-500/25 bg-emerald-950/20 p-2.5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          Proposed Playbook Wording
        </div>
        <p className="text-xs leading-relaxed text-emerald-100">
          {suggestion.proposed_text}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-medium text-slate-400">
          Status:{" "}
          <strong className="text-slate-200">{suggestion.status}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid={`apply-redline-btn-${clause.id}`}
            onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
            onMouseLeave={() => setHoveredSuggestion(null)}
            onFocus={() => setHoveredSuggestion(suggestion.id)}
            onBlur={() => setHoveredSuggestion(null)}
            onClick={(e) => {
              e.stopPropagation();
              selectClause(clause.id, "inspector");
              onLocalApplyPreview?.(clause.id, suggestion.proposed_text);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              isHoveringApply
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                : "bg-emerald-600/90 text-white hover:bg-emerald-500"
            }`}
          >
            Apply Redline
          </button>

          <button
            type="button"
            data-testid={`modify-redline-btn-${clause.id}`}
            onClick={(e) => {
              e.stopPropagation();
              selectClause(clause.id, "inspector");
            }}
            className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Modify
          </button>

          <button
            type="button"
            data-testid={`reject-redline-btn-${clause.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onLocalRejectPreview?.(suggestion.id);
            }}
            className="rounded-md border border-rose-500/30 bg-rose-950/30 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40"
          >
            Reject
          </button>
        </div>
      </div>
    </article>
  );
};

