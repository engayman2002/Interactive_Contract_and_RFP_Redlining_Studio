"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type {
  ClauseDTO,
  PushbackSeverity,
  RedlineSuggestionDTO,
  RiskLevel,
  VerificationStatus,
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
    "bg-rose-50/90 text-rose-700 border-rose-200/90 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25",
  HIGH: "bg-amber-50/90 text-amber-800 border-amber-200/90 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  MEDIUM:
    "bg-sky-50/90 text-sky-700 border-sky-200/90 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25",
  LOW: "bg-emerald-50/90 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
};

const RISK_BORDER_ACCENT: Record<RiskLevel, string> = {
  CRITICAL: "border-l-[3px] border-l-rose-500",
  HIGH: "border-l-[3px] border-l-amber-500",
  MEDIUM: "border-l-[3px] border-l-sky-500",
  LOW: "border-l-[3px] border-l-emerald-500",
};

const RISK_DOT_COLORS: Record<RiskLevel, string> = {
  CRITICAL: "bg-rose-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-sky-500",
  LOW: "bg-emerald-500",
};

const VERIFICATION_BADGE_CONFIG: Record<
  VerificationStatus,
  { style: string; label: string; emoji: string }
> = {
  VERIFIED: {
    style:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    label: "Verified",
    emoji: "🛡️",
  },
  AUTO_REFINED: {
    style:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300",
    label: "Auto-Refined",
    emoji: "✨",
  },
  NEEDS_HUMAN_REVIEW: {
    style:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    label: "Review Needed",
    emoji: "⚠️",
  },
};

const PUSHBACK_SEVERITY_STYLES: Record<PushbackSeverity, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  MODERATE:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
  DEALBREAKER:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
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
    const refineSuggestionWithAI = useWorkspaceStore(
      (state) => state.refineSuggestionWithAI
    );
    const verifySuggestionWithCritic = useWorkspaceStore(
      (state) => state.verifySuggestionWithCritic
    );
    const pushbackSim = useWorkspaceStore(
      (state) => state.pushbackSimulations[suggestion.id]
    );
    const simulateSuggestionPushback = useWorkspaceStore(
      (state) => state.simulateSuggestionPushback
    );
    const applyPushbackCompromise = useWorkspaceStore(
      (state) => state.applyPushbackCompromise
    );

    const [isEditingModify, setIsEditingModify] = useState<boolean>(false);
    const [modifiedDraft, setModifiedDraft] = useState<string>(
      suggestion.proposed_text
    );
    const [copiedTalkingPoint, setCopiedTalkingPoint] =
      useState<boolean>(false);

    const [activeToolDrawer, setActiveToolDrawer] = useState<
      "copilot" | "pushback" | null
    >(null);
    const isCopilotOpen = activeToolDrawer === "copilot";
    const isPushbackOpen = activeToolDrawer === "pushback";

    const [copilotInstruction, setCopilotInstruction] = useState<string>("");
    const [isRefining, setIsRefining] = useState<boolean>(false);
    const [refineError, setRefineError] = useState<string | null>(null);
    const [copilotSuccessMsg, setCopilotSuccessMsg] = useState<string | null>(
      null
    );
    const [isCriticExpanded, setIsCriticExpanded] = useState<boolean>(false);
    const [isVerifyingCritic, setIsVerifyingCritic] = useState<boolean>(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const [isSimulatingPushback, setIsSimulatingPushback] =
      useState<boolean>(false);
    const [pushbackError, setPushbackError] = useState<string | null>(null);
    const [copiedRebuttal, setCopiedRebuttal] = useState<boolean>(false);
    const [compromiseAppliedMsg, setCompromiseAppliedMsg] = useState<
      string | null
    >(null);

    const confidenceScore = suggestion.confidence_score ?? 95;
    const verificationStatus: VerificationStatus =
      suggestion.verification_status ?? "VERIFIED";
    const policyPassed = suggestion.policy_alignment_passed ?? true;
    const hallucinationFreePassed =
      suggestion.hallucination_free_passed ?? true;
    const obligationPreservedPassed =
      suggestion.obligation_preservation_passed ?? true;
    const criticNotes =
      suggestion.critic_notes ??
      "Verified by Critic Agent against Playbook policy and hallucination guard.";
    const verificationCfg = VERIFICATION_BADGE_CONFIG[verificationStatus];

    const handleVerifyWithCritic = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isVerifyingCritic) {
        return;
      }
      setIsVerifyingCritic(true);
      setVerifyError(null);
      try {
        await verifySuggestionWithCritic(suggestion.id);
      } catch (err) {
        setVerifyError(
          err instanceof Error
            ? err.message
            : "Critic verification check failed."
        );
      } finally {
        setIsVerifyingCritic(false);
      }
    };

    const handleSimulatePushback = async (e: React.MouseEvent) => {
      e.stopPropagation();
      selectClause(clause.id, "inspector");
      if (isPushbackOpen && pushbackSim) {
        setActiveToolDrawer(null);
        return;
      }
      setActiveToolDrawer("pushback");
      if (isSimulatingPushback) {
        return;
      }
      setIsSimulatingPushback(true);
      setPushbackError(null);
      setCompromiseAppliedMsg(null);
      try {
        await simulateSuggestionPushback(suggestion.id);
      } catch (err) {
        setPushbackError(
          err instanceof Error
            ? err.message
            : "Failed to simulate counterparty pushback."
        );
      } finally {
        setIsSimulatingPushback(false);
      }
    };

    const handleResimulatePushback = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSimulatingPushback) {
        return;
      }
      setIsSimulatingPushback(true);
      setPushbackError(null);
      setCompromiseAppliedMsg(null);
      try {
        await simulateSuggestionPushback(suggestion.id);
      } catch (err) {
        setPushbackError(
          err instanceof Error
            ? err.message
            : "Failed to simulate counterparty pushback."
        );
      } finally {
        setIsSimulatingPushback(false);
      }
    };

    const handleCopyRebuttal = async (e: React.MouseEvent, text: string) => {
      e.stopPropagation();
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        // Ignore clipboard errors in headless environments
      }
      setCopiedRebuttal(true);
      setTimeout(() => setCopiedRebuttal(false), 1800);
    };

    const handleApplyCompromise = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await applyPushbackCompromise(suggestion.id);
      setCompromiseAppliedMsg("Round-2 compromise applied to proposed wording.");
      setTimeout(() => setCompromiseAppliedMsg(null), 3500);
    };

    useEffect(() => {
      setModifiedDraft(suggestion.proposed_text);
    }, [suggestion.proposed_text]);

    const { rationale, talkingPoint } = useMemo(
      () => splitRationaleAndTalkingPoint(suggestion.rationale),
      [suggestion.rationale]
    );

    const handleRefineSubmit = async (
      e: React.FormEvent | React.MouseEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = copilotInstruction.trim();
      if (!trimmed || isRefining) {
        return;
      }
      setIsRefining(true);
      setRefineError(null);
      setCopilotSuccessMsg(null);
      try {
        const res = await refineSuggestionWithAI(suggestion.id, trimmed);
        setCopilotSuccessMsg(
          res.talkingPoint
            ? `Refined: "${res.talkingPoint}"`
            : "Clause refined successfully!"
        );
        setTimeout(() => setCopilotSuccessMsg(null), 4000);
      } catch (err) {
        setRefineError(
          err instanceof Error ? err.message : "Failed to refine clause."
        );
      } finally {
        setIsRefining(false);
      }
    };

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
        className={`surface-card cursor-pointer rounded-xl p-4 transition-all ${
          RISK_BORDER_ACCENT[suggestion.risk]
        } ${
          isSelected
            ? "border-indigo-400/90 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500/80 dark:ring-indigo-500/35"
            : "hover:border-slate-300/90 hover:shadow-md dark:hover:border-slate-700"
        }`}
      >
        {/* Top Row: Clause Badge + Title + Semantic Risk Pill */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 whitespace-nowrap rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Clause #{clause.clause_index + 1}
            </span>
            <h4 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {clause.heading ?? `Section ${clause.clause_index + 1}`}
            </h4>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {commentCount > 0 ? (
              <span className="micro-badge shrink-0 whitespace-nowrap border-indigo-200 bg-indigo-50 font-mono text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
              </span>
            ) : null}
            <span
              data-testid={`critic-confidence-badge-${suggestion.id}`}
              className={`micro-badge shrink-0 whitespace-nowrap font-mono ${verificationCfg.style}`}
            >
              <span>{verificationCfg.emoji}</span>
              <span>
                {confidenceScore}% {verificationCfg.label}
              </span>
            </span>
            <span
              className={`micro-badge shrink-0 whitespace-nowrap tracking-wider ${
                RISK_BADGE_STYLES[suggestion.risk]
              }`}
            >
              <span
                className={`micro-badge-dot ${
                  RISK_DOT_COLORS[suggestion.risk]
                }`}
                aria-hidden="true"
              />
              {suggestion.risk}
            </span>
          </div>
        </div>

        {/* Risk Assessment */}
        <p className="mb-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {rationale}
        </p>

        {/* Negotiation Talking Point Executive Callout */}
        {talkingPoint ? (
          <div className="mb-2.5 rounded-r-lg border-l-2 border-indigo-500 bg-slate-50/90 p-2.5 dark:bg-slate-800/55">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Negotiation Talking Point
              </span>
              <button
                type="button"
                data-testid={`copy-talking-point-btn-${clause.id}`}
                onClick={(e) => void handleCopyTalkingPoint(e, talkingPoint)}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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

        {/* Proposed Playbook Wording Legal Diff Block */}
        <div className="mb-3 overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/35 dark:border-emerald-500/20 dark:bg-emerald-950/15">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-200/70 bg-emerald-50/80 px-3 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-950/45">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Proposed Playbook Wording
            </span>
            <span className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
              Hover Apply to preview inline diff
            </span>
          </div>

          <div className="p-2.5">
            {isEditingModify ? (
              <div
                className="space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  aria-label="Modify proposed redline wording"
                  data-testid={`modify-redline-textarea-${clause.id}`}
                  rows={3}
                  value={modifiedDraft}
                  onChange={(e) => setModifiedDraft(e.target.value)}
                  className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 font-serif text-[14px] leading-relaxed text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/40 dark:bg-slate-950 dark:text-emerald-100"
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
                    className="h-7 shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid={`save-modified-redline-btn-${clause.id}`}
                    onClick={handleSaveModified}
                    className="h-7 shrink-0 whitespace-nowrap rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 hover:from-emerald-400 hover:to-emerald-600"
                  >
                    Save Modified Redline
                  </button>
                </div>
              </div>
            ) : (
              <p
                data-testid={`proposed-text-${suggestion.id}`}
                className="font-serif text-[14px] leading-[1.6] text-slate-800 dark:text-emerald-100"
              >
                {suggestion.proposed_text}
              </p>
            )}
          </div>
        </div>

        {/* Primary Decision Row (Prominent & Immediately Accessible Below Proposed Wording) */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Status:{" "}
              <strong
                data-testid={`suggestion-status-${clause.id}`}
                className="font-mono text-slate-800 dark:text-slate-200"
              >
                {suggestion.status}
              </strong>
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
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
              className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-emerald-400 hover:to-emerald-600 ${
                isHoveringApply ? "ring-2 ring-emerald-500/40" : ""
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
              className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
              className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-transparent px-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              Reject
            </button>
          </div>
        </div>

        {/* Secondary AI Power Tools & Critic Guard Verification Dock */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="divide-y divide-slate-200/70 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/75 dark:divide-slate-800/70 dark:border-slate-800/80 dark:bg-slate-950/50"
        >
          {/* Upper Band: AI Power Tools Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AI Power Tools
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                data-testid={`toggle-copilot-btn-${suggestion.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  selectClause(clause.id, "inspector");
                  setActiveToolDrawer((prev) =>
                    prev === "copilot" ? null : "copilot"
                  );
                }}
                className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-semibold transition-all ${
                  isCopilotOpen
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200/80 bg-white text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/70 dark:border-slate-700/80 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>✨ AI Copilot</span>
              </button>

              <button
                type="button"
                data-testid={`simulate-pushback-btn-${suggestion.id}`}
                onClick={handleSimulatePushback}
                disabled={isSimulatingPushback}
                className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-semibold transition-all disabled:opacity-60 ${
                  isPushbackOpen
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-slate-200/80 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50/70 dark:border-slate-700/80 dark:bg-slate-900 dark:text-orange-300 dark:hover:bg-slate-800"
                }`}
              >
                {isSimulatingPushback ? (
                  <>
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <Target className="h-3 w-3 shrink-0" />
                    <span>🎯 Simulate Pushback</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid={`toggle-critic-btn-${suggestion.id}`}
                onClick={() => setIsCriticExpanded((prev) => !prev)}
                className={`inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-semibold transition-all ${
                  isCriticExpanded
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200/80 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldCheck
                  className={`h-3 w-3 shrink-0 ${
                    isCriticExpanded
                      ? "text-white"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                />
                <span>🛡️ Critic Guard</span>
                {isCriticExpanded ? (
                  <ChevronUp className="h-3 w-3 shrink-0 opacity-80" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                )}
              </button>
            </div>
          </div>

          {/* Lower Band: Compact Critic Verification Gates Strip */}
          <div
            data-testid={`critic-guard-panel-${suggestion.id}`}
            className="px-2.5 py-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold">
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 ${
                    policyPassed
                      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  }`}
                >
                  {!policyPassed && <ShieldAlert className="h-3 w-3" />}
                  <span>
                    {policyPassed ? "✓ Policy Grounded" : "Policy Review Needed"}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 ${
                    hallucinationFreePassed
                      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  }`}
                >
                  {!hallucinationFreePassed && <ShieldAlert className="h-3 w-3" />}
                  <span>
                    {hallucinationFreePassed
                      ? "✓ Hallucination-Free"
                      : "Hallucination Flagged"}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 ${
                    obligationPreservedPassed
                      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                  }`}
                >
                  {!obligationPreservedPassed && (
                    <ShieldAlert className="h-3 w-3" />
                  )}
                  <span>
                    {obligationPreservedPassed
                      ? "✓ Obligations & Numbering Preserved"
                      : "Numbering Altered"}
                  </span>
                </span>
              </div>

              <button
                type="button"
                data-testid={`verify-critic-btn-${suggestion.id}`}
                disabled={isVerifyingCritic}
                onClick={handleVerifyWithCritic}
                className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                {isVerifyingCritic ? (
                  <>
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span>Re-Verify with Critic</span>
                  </>
                )}
              </button>
            </div>

            {isCriticExpanded && (
              <div className="mt-2 space-y-1.5 border-t border-slate-200/70 pt-2 dark:border-slate-800/80">
                <p
                  data-testid={`critic-notes-${suggestion.id}`}
                  className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400"
                >
                  {criticNotes}
                </p>
                {verifyError && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                    {verifyError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inline Clause AI Copilot Drawer */}
        {isCopilotOpen && (
          <div
            data-testid={`copilot-drawer-${suggestion.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-3.5 shadow-sm dark:border-indigo-500/30 dark:from-slate-900 dark:to-slate-950"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  Inline AI Clause Copilot
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Steer wording with custom prompt
              </span>
            </div>

            {/* Quick Directive Chips */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                data-testid={`copilot-chip-mutual-${suggestion.id}`}
                onClick={() =>
                  setCopilotInstruction(
                    "Make this obligation strictly mutual and exclude indirect damages."
                  )
                }
                className="rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                Make Strictly Mutual
              </button>
              <button
                type="button"
                data-testid={`copilot-chip-cap-${suggestion.id}`}
                onClick={() =>
                  setCopilotInstruction(
                    "Cap aggregate liability at $100,000 instead of 12 months of fees."
                  )
                }
                className="rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                Cap Liability at $100,000
              </button>
              <button
                type="button"
                data-testid={`copilot-chip-cure-${suggestion.id}`}
                onClick={() =>
                  setCopilotInstruction(
                    "Add a 30-day written notice and cure period before any termination."
                  )
                }
                className="rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                Add 30-Day Cure Period
              </button>
              <button
                type="button"
                data-testid={`copilot-chip-soften-${suggestion.id}`}
                onClick={() =>
                  setCopilotInstruction(
                    "Soften the legal tone for a strategic partner while keeping core IP protection."
                  )
                }
                className="rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                Soften Tone for Partner
              </button>
            </div>

            {/* Custom Instruction Input */}
            <form onSubmit={handleRefineSubmit} className="space-y-2">
              <textarea
                aria-label="Custom AI Copilot prompt instruction"
                data-testid={`copilot-instruction-input-${suggestion.id}`}
                rows={2}
                value={copilotInstruction}
                onChange={(e) => setCopilotInstruction(e.target.value)}
                placeholder="e.g., Cap liability at $100,000 and add a 30-day notice and cure period..."
                className="w-full rounded-lg border border-indigo-200/80 bg-white p-2.5 text-xs leading-relaxed text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-indigo-100"
              />

              {copilotSuccessMsg && (
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {copilotSuccessMsg}
                </p>
              )}
              {refineError && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {refineError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveToolDrawer(null)}
                  className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  data-testid={`copilot-submit-btn-${suggestion.id}`}
                  disabled={isRefining || !copilotInstruction.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Refining...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      <span>Refine with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Adversarial Counterparty Pushback Simulator Drawer */}
        {isPushbackOpen && (
          <div
            data-testid={`pushback-simulator-panel-${suggestion.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 rounded-xl border border-orange-200/90 bg-gradient-to-b from-orange-50/40 to-white p-4 shadow-sm dark:border-orange-500/30 dark:from-slate-900 dark:to-slate-950"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/70 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Counterparty Pushback Simulator &amp; Round-2 Strategy
                  </span>
                  {pushbackSim && (
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Simulated Persona: {pushbackSim.counterparty_persona}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {pushbackSim && (
                  <>
                    <span
                      data-testid={`pushback-probability-badge-${suggestion.id}`}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Acceptance Likelihood: {pushbackSim.acceptance_probability}%
                    </span>
                    <span
                      data-testid={`pushback-severity-badge-${suggestion.id}`}
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        PUSHBACK_SEVERITY_STYLES[pushbackSim.pushback_severity]
                      }`}
                    >
                      {pushbackSim.pushback_severity} PUSHBACK
                    </span>
                  </>
                )}
              </div>
            </div>

            {isSimulatingPushback && !pushbackSim ? (
              <div className="flex items-center gap-2 py-4 text-xs text-slate-600 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                <span>Simulating opposing counsel negotiation response...</span>
              </div>
            ) : null}

            {pushbackError && (
              <p className="mb-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                {pushbackError}
              </p>
            )}

            {pushbackSim && (
              <div className="space-y-3">
                {/* Expected Counterparty Objection */}
                <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-950/20">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    Expected Counterparty Objection
                  </div>
                  <p
                    data-testid={`pushback-objection-text-${suggestion.id}`}
                    className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-rose-100"
                  >
                    {pushbackSim.expected_objection}
                  </p>
                </div>

                {/* Round-2 Rebuttal Script */}
                <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/50 p-3 dark:border-indigo-500/25 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                      Round-2 Rebuttal Script
                    </span>
                    <button
                      type="button"
                      data-testid={`copy-rebuttal-btn-${suggestion.id}`}
                      onClick={(e) =>
                        void handleCopyRebuttal(
                          e,
                          pushbackSim.rebuttal_talking_point
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {copiedRebuttal ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Rebuttal</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p
                    data-testid={`pushback-rebuttal-text-${suggestion.id}`}
                    className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-indigo-100"
                  >
                    {pushbackSim.rebuttal_talking_point}
                  </p>
                </div>

                {/* Round-2 Fallback Compromise Wording */}
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Round-2 Fallback Compromise Wording
                    </span>
                    <button
                      type="button"
                      data-testid={`apply-compromise-btn-${suggestion.id}`}
                      onClick={handleApplyCompromise}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
                    >
                      <Check className="h-3 w-3" />
                      <span>Use Compromise Wording</span>
                    </button>
                  </div>
                  <p
                    data-testid={`pushback-compromise-text-${suggestion.id}`}
                    className="mt-1.5 text-xs leading-relaxed text-slate-800 dark:text-emerald-100"
                  >
                    {pushbackSim.fallback_compromise_text}
                  </p>
                  {compromiseAppliedMsg && (
                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {compromiseAppliedMsg}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResimulatePushback}
                    disabled={isSimulatingPushback}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Re-Simulate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveToolDrawer(null)}
                    className="rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    );
  }
);

RedlineCard.displayName = "RedlineCard";
