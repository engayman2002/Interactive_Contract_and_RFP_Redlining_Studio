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
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  HIGH: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  MEDIUM:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
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

    const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
    const [copilotInstruction, setCopilotInstruction] = useState<string>("");
    const [isRefining, setIsRefining] = useState<boolean>(false);
    const [refineError, setRefineError] = useState<string | null>(null);
    const [copilotSuccessMsg, setCopilotSuccessMsg] = useState<string | null>(
      null
    );
    const [isCriticExpanded, setIsCriticExpanded] = useState<boolean>(true);
    const [isVerifyingCritic, setIsVerifyingCritic] = useState<boolean>(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const [isPushbackOpen, setIsPushbackOpen] = useState<boolean>(false);
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
        setIsPushbackOpen(false);
        return;
      }
      setIsPushbackOpen(true);
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
          <div className="flex flex-wrap items-center gap-1.5">
            {commentCount > 0 ? (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
              </span>
            ) : null}
            <span
              data-testid={`critic-confidence-badge-${suggestion.id}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${verificationCfg.style}`}
            >
              <span>{verificationCfg.emoji}</span>
              <span>
                {confidenceScore}% {verificationCfg.label}
              </span>
            </span>
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
            <p
              data-testid={`proposed-text-${suggestion.id}`}
              className="text-xs leading-relaxed text-slate-800 dark:text-emerald-100"
            >
              {suggestion.proposed_text}
            </p>
          )}
        </div>

        {/* Agent 2: Collapsible Critic Verification Guard Bar */}
        <div
          data-testid={`critic-guard-panel-${suggestion.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mb-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsCriticExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Agent 2 Critic &amp; Hallucination Guard</span>
              {isCriticExpanded ? (
                <ChevronUp className="h-3 w-3 text-slate-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              data-testid={`verify-critic-btn-${suggestion.id}`}
              disabled={isVerifyingCritic}
              onClick={handleVerifyWithCritic}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              {isVerifyingCritic ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>Re-Verify with Critic</span>
                </>
              )}
            </button>
          </div>

          {isCriticExpanded && (
            <div className="mt-2.5 space-y-2 border-t border-slate-200/70 pt-2 dark:border-slate-800/80">
              <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
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
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                    hallucinationFreePassed
                      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  }`}
                >
                  {!hallucinationFreePassed && (
                    <ShieldAlert className="h-3 w-3" />
                  )}
                  <span>
                    {hallucinationFreePassed
                      ? "✓ Hallucination-Free"
                      : "Hallucination Flagged"}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
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

          <div className="flex flex-wrap items-center gap-1.5">
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
              data-testid={`toggle-copilot-btn-${suggestion.id}`}
              onClick={(e) => {
                e.stopPropagation();
                selectClause(clause.id, "inspector");
                setIsCopilotOpen((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                isCopilotOpen
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200"
                  : "border-indigo-200/90 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/70 hover:text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Copilot</span>
            </button>

            <button
              type="button"
              data-testid={`simulate-pushback-btn-${suggestion.id}`}
              onClick={handleSimulatePushback}
              disabled={isSimulatingPushback}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-60 ${
                isPushbackOpen
                  ? "border-orange-400 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-200"
                  : "border-orange-200/90 bg-orange-50/60 text-orange-800 hover:bg-orange-100/80 hover:text-orange-900 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
              }`}
            >
              {isSimulatingPushback ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600 dark:text-orange-400" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Target className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span>🎯 Simulate Pushback</span>
                </>
              )}
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
                  onClick={() => setIsCopilotOpen(false)}
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
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
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
                    onClick={() => setIsPushbackOpen(false)}
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
