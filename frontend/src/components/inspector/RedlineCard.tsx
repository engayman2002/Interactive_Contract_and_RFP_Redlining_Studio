"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type {
  ClauseDTO,
  RedlineSuggestionDTO,
  RiskLevel,
} from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

export interface RedlineCardProps {
  clause: ClauseDTO;
  suggestion: RedlineSuggestionDTO;
  commentCount?: number;
  onAcceptSuggestion?: (suggestionId: string) => Promise<void> | void;
  onModifySuggestion?: (
    suggestionId: string,
    modifiedText: string
  ) => Promise<void> | void;
  onRejectSuggestion?: (suggestionId: string) => Promise<void> | void;
  onLocalApplyPreview?: (clauseId: string, proposedText: string) => void;
  onLocalRejectPreview?: (suggestionId: string) => void;
}

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  CRITICAL:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  HIGH: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  MEDIUM:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
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

export const RedlineCard: React.FC<RedlineCardProps> = React.memo(
  ({
    clause,
    suggestion,
    commentCount = 0,
    onAcceptSuggestion,
    onModifySuggestion,
    onRejectSuggestion,
    onLocalApplyPreview,
    onLocalRejectPreview,
  }) => {
    const isSelected = useWorkspaceStore(
      (state) => state.activeClauseId === clause.id
    );
    const isHoveringApply = useWorkspaceStore(
      (state) => state.hoveredSuggestionId === suggestion.id
    );
    const selectClause = useWorkspaceStore((state) => state.selectClause);
    const setHoveredSuggestion = useWorkspaceStore(
      (state) => state.setHoveredSuggestion
    );

    const [isEditingModify, setIsEditingModify] = useState<boolean>(false);
    const [modifiedDraft, setModifiedDraft] = useState<string>(
      suggestion.proposed_text
    );
    const [copiedTalkingPoint, setCopiedTalkingPoint] =
      useState<boolean>(false);

    useEffect(() => {
      setModifiedDraft(suggestion.proposed_text);
    }, [suggestion.proposed_text]);

    const { rationale, talkingPoint } = useMemo(
      () => splitRationaleAndTalkingPoint(suggestion.rationale),
      [suggestion.rationale]
    );

    const handleCopyTalkingPoint = async (
      e: React.MouseEvent,
      text: string
    ) => {
      e.stopPropagation();
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        // Ignore clipboard errors in headless environments
      }
      setCopiedTalkingPoint(true);
      setTimeout(() => setCopiedTalkingPoint(false), 1800);
    };

    const handleSaveModified = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const cleaned = modifiedDraft.trim();
      if (!cleaned) {
        return;
      }
      setIsEditingModify(false);
      selectClause(clause.id, "inspector");
      if (onModifySuggestion) {
        await onModifySuggestion(suggestion.id, cleaned);
      } else {
        onLocalApplyPreview?.(clause.id, cleaned);
      }
    };

    return (
      <article
        data-testid={`redline-card-${clause.id}`}
        data-suggestion-id={suggestion.id}
        data-clause-id={clause.id}
        data-risk-level={suggestion.risk}
        data-active={isSelected ? "true" : "false"}
        onClick={() => selectClause(clause.id, "inspector")}
        className={`cursor-pointer rounded-xl border p-5 transition-all ${
          isSelected
            ? "border-indigo-500 bg-white shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-slate-900 dark:ring-indigo-500/35"
            : "border-slate-200/90 bg-white shadow-sm hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        }`}
      >
        {/* Top Row: Clause Badge + Title + Semantic Risk Pill */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 font-mono text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Clause #{clause.clause_index + 1}
            </span>
            <h4 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {clause.heading ?? `Section ${clause.clause_index + 1}`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {commentCount > 0 ? (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
              </span>
            ) : null}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wider ${
                RISK_BADGE_STYLES[suggestion.risk]
              }`}
            >
              {suggestion.risk}
            </span>
          </div>
        </div>

        {/* Risk Assessment */}
        <p className="mb-3.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {rationale}
        </p>

        {/* Negotiation Talking Point Executive Callout */}
        {talkingPoint ? (
          <div className="mb-3.5 rounded-r-lg border-l-2 border-indigo-500 bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Negotiation Talking Point
              </span>
              <button
                type="button"
                data-testid={`copy-talking-point-btn-${clause.id}`}
                onClick={(e) => void handleCopyTalkingPoint(e, talkingPoint)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {copiedTalkingPoint ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {talkingPoint}
            </p>
          </div>
        ) : null}

        {/* Proposed Playbook Wording Box */}
        <div className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Proposed Playbook Wording
            </span>
            <span className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
              Hover over Apply Redline to preview word-level diff in document
            </span>
          </div>

          {isEditingModify ? (
            <div
              className="mt-2 space-y-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                aria-label="Modify proposed redline wording"
                data-testid={`modify-redline-textarea-${clause.id}`}
                rows={3}
                value={modifiedDraft}
                onChange={(e) => setModifiedDraft(e.target.value)}
                className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs leading-relaxed text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/40 dark:bg-slate-950 dark:text-emerald-100"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  data-testid={`cancel-modify-redline-btn-${clause.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingModify(false);
                    setModifiedDraft(suggestion.proposed_text);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid={`save-modified-redline-btn-${clause.id}`}
                  onClick={handleSaveModified}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  Save Modified Redline
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-slate-800 dark:text-emerald-100">
              {suggestion.proposed_text}
            </p>
          )}
        </div>

        {/* Card Footer: Status & Balanced Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Status:{" "}
            <strong
              data-testid={`suggestion-status-${clause.id}`}
              className="font-mono text-slate-800 dark:text-slate-200"
            >
              {suggestion.status}
            </strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid={`apply-redline-btn-${clause.id}`}
              onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
              onMouseLeave={() => setHoveredSuggestion(null)}
              onFocus={() => setHoveredSuggestion(suggestion.id)}
              onBlur={() => setHoveredSuggestion(null)}
              onClick={async (e) => {
                e.stopPropagation();
                selectClause(clause.id, "inspector");
                if (onAcceptSuggestion) {
                  await onAcceptSuggestion(suggestion.id);
                } else {
                  onLocalApplyPreview?.(clause.id, suggestion.proposed_text);
                }
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all ${
                isHoveringApply
                  ? "bg-emerald-500 ring-2 ring-emerald-500/30"
                  : "bg-emerald-600 hover:bg-emerald-500"
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
                setIsEditingModify((prev) => !prev);
              }}
              className="rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Modify
            </button>

            <button
              type="button"
              data-testid={`reject-redline-btn-${clause.id}`}
              onClick={async (e) => {
                e.stopPropagation();
                if (onRejectSuggestion) {
                  await onRejectSuggestion(suggestion.id);
                } else {
                  onLocalRejectPreview?.(suggestion.id);
                }
              }}
              className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              Reject
            </button>
          </div>
        </div>
      </article>
    );
  }
);

RedlineCard.displayName = "RedlineCard";
