"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, X } from "lucide-react";
import {
  EXPORT_MODE_COMPARISON,
  HELP_GUIDE_MODULES,
  RISK_HEATMAP_LEGEND,
} from "@/services/helpContent";

export interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuickHelpTab =
  | "workflow"
  | "copilot"
  | "radar"
  | "critic"
  | "stance"
  | "heatmap"
  | "export";

export const QuickHelpModal: React.FC<QuickHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<QuickHelpTab>("workflow");

  if (!isOpen) {
    return null;
  }

  const quickStartModule = HELP_GUIDE_MODULES[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-Studio Quick Help & Reference Guide"
      data-testid="quick-help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-black/75"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Studio Quick-Reference Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contextual cheat-sheet for redlining, risk colors, and Word
                exports
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-quick-help-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close Quick Help Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Tab Bar */}
        <div className="flex gap-1 border-b border-slate-200/80 bg-slate-50 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <button
            type="button"
            data-testid="quick-help-tab-workflow"
            onClick={() => setActiveTab("workflow")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "workflow"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            1. Workflow
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-copilot"
            onClick={() => setActiveTab("copilot")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "copilot"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            2. ✨ AI Copilot
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-radar"
            onClick={() => setActiveTab("radar")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "radar"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            3. 🎯 Radar
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-critic"
            onClick={() => setActiveTab("critic")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "critic"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            4. 🛡️ Critic Guard
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-stance"
            onClick={() => setActiveTab("stance")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "stance"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            5. AI Stances
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-heatmap"
            onClick={() => setActiveTab("heatmap")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "heatmap"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            6. Risk Heatmap
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-export"
            onClick={() => setActiveTab("export")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "export"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            7. Export (.docx)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {activeTab === "workflow" && (
            <div data-testid="quick-help-content-workflow" className="space-y-3">
              {quickStartModule.steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <h3 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "copilot" && (
            <div data-testid="quick-help-content-copilot" className="space-y-3">
              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Inline Clause AI Copilot &amp; Custom Prompting
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    COPILOT
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Steer AI redlining on any individual clause. Click the <strong className="text-indigo-700 dark:text-indigo-300">✨ AI Copilot</strong> button on any redline card to open the copilot drawer with one-click quick directive chips or type custom natural-language instructions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Make Strictly Mutual
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Converts unilateral covenants into bilateral obligations (&ldquo;Each party shall...&rdquo;) and carves out indirect or consequential damages.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Cap Liability at $100,000
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Replaces fee-multiple formulas with an explicit, predictable dollar ceiling ($100,000) for aggregate commercial exposure.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Add 30-Day Cure Period
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Inserts standard written notice and a 30-day opportunity to cure prior to any termination for cause or service cancellation.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Soften Tone for Partner
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Softens contentious language while preserving core IP and confidentiality boundaries—ideal for strategic alliance negotiations.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 dark:border-emerald-500/25 dark:bg-slate-950">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Compliance Audit Trail Guarantee
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Every refinement logs an immutable <code className="font-mono text-[11px]">SUGGESTION_REFINED</code> event with the exact prompt instruction, actor role, timestamp, and generated rationale.
                </p>
              </div>
            </div>
          )}

          {activeTab === "radar" && (
            <div data-testid="quick-help-content-radar" className="space-y-3">
              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Cross-Clause Integrity &amp; Contradiction Radar
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    RADAR
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Evaluates the entire contract graph to catch multi-clause structural conflicts that single-clause redlines miss. Switch to the <strong className="text-indigo-700 dark:text-indigo-300">Cross-Clause Radar</strong> tab in the right-hand Inspector to trigger or view real-time diagnostics.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                      Contradictions
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Opposing obligations, monetary liability caps vs uncapped indemnities, or conflicting payment terms (Net 30 vs Net 15).
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Broken References
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Citations referencing sections, articles, or exhibits that do not exist anywhere in the agreement body.
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/40 dark:bg-sky-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <h4 className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                      Undefined Terms
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Capitalized terms used in operative commitments without prior definitions in the preamble or Section 1.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Dynamic Document Integrity Score (0-100%) &amp; Clause Navigation
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Starts at 100% and deducts weighted penalties for each unresolved issue. Click the interactive <span className="font-semibold text-indigo-600 dark:text-indigo-400">Source: Clause #X</span> and <span className="font-semibold text-rose-600 dark:text-rose-400">Conflicts with: Clause #Y</span> jump buttons to instantly highlight and scroll to either clause in the live editor.
                </p>
              </div>
            </div>
          )}

          {activeTab === "critic" && (
            <div data-testid="quick-help-content-critic" className="space-y-3">
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Critic-Refiner Multi-Agent Loop &amp; Hallucination Guard
                  </span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200">
                    AGENT 2 GUARD
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Every redline runs through a 2-agent pipeline: <strong className="text-slate-900 dark:text-white">Agent 1</strong> drafts the proposed revision and <strong className="text-emerald-800 dark:text-emerald-300">Agent 2 (Critic Verifier)</strong> enforces 3 safety gates and auto-repairs defects before display.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    ✓ Policy Grounded
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Ensures zero banned Playbook triggers leak into the proposed text and aligns wording with standard/fallback rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    ✓ Hallucination-Free
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Scrubs LLM placeholder tokens (<code className="font-mono">[TBD]</code>, <code className="font-mono">[INSERT]</code>) and ungrounded concessions.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    ✓ Numbering Preserved
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Restores clause numbering prefixes (e.g., <code className="font-mono">1.1</code>) if omitted so Word Track Changes stays aligned.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Verification Badges &amp; On-Demand Re-Verification
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Badges classify outputs as <strong>🛡️ Verified</strong> (85–99%), <strong>✨ Auto-Refined</strong> (auto-repaired by Agent 2), or <strong>⚠️ Review Needed</strong> (&lt;75%). After custom edits or Copilot refinements, click <strong>Re-Verify with Critic</strong> to validate and log <code className="font-mono text-[11px]">SUGGESTION_VERIFIED</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "stance" && (
            <div data-testid="quick-help-content-stance" className="space-y-3">
              <div className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-4 dark:border-rose-500/30 dark:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Strict Posture (Zero Compromise)
                  </span>
                  <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-900/50 dark:text-rose-200">
                    STRICT
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Strictly enforces your organization&apos;s standard position. Escalates borderline risks to Critical/High, prefixes rationales with <code className="text-[11px] font-mono">[Strict Protective Stance]</code>, and crafts firm, non-negotiable talking points. Best for high-liability infrastructure and core IP.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    Balanced Posture (Reciprocal Bilateral — Default)
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    BALANCED
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Converts one-sided clauses into fair, mutual (&ldquo;Each party...&rdquo;) terms while defending core corporate boundaries. Rationale is prefixed with <code className="text-[11px] font-mono">[Balanced Mutual Stance]</code>. Standard for 80% of routine commercial transactions.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Commercial Posture (Fast-Close Deal Velocity)
                  </span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200">
                    COMMERCIAL
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Prioritizes deal closing velocity. Automatically adopts pre-approved fallback positions from your Playbook (e.g., 2x fee cap instead of strict 12-month cap), marks acceptable fallback provisions compliant, prefixes rationales with <code className="text-[11px] font-mono">[Commercial Fast-Close Stance]</code>, and crafts deal-closing talking points.
                </p>
              </div>
            </div>
          )}

          {activeTab === "heatmap" && (
            <div data-testid="quick-help-content-heatmap" className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {RISK_HEATMAP_LEGEND.map((item) => (
                  <div
                    key={item.level}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3.5 w-2 rounded-full border ${item.dotClass}`}
                        />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.colorName}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.badgeClass}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.meaning}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 dark:border-emerald-500/25 dark:bg-slate-950">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Live Word-Level Diff Preview
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Hover over{" "}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Apply Redline
                  </span>{" "}
                  to preview{" "}
                  <span className="rounded bg-rose-100 px-1 text-rose-800 line-through dark:bg-rose-500/25 dark:text-rose-200">
                    deleted words
                  </span>{" "}
                  and{" "}
                  <span className="rounded bg-emerald-100 px-1 font-medium text-emerald-900 underline dark:bg-emerald-500/25 dark:text-emerald-200">
                    inserted Playbook words
                  </span>{" "}
                  directly inside the contract sheet before committing.
                </p>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div data-testid="quick-help-content-export" className="space-y-3">
              {EXPORT_MODE_COMPARISON.map((row) => (
                <div
                  key={row.feature}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.feature}
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                        Track Changes (.docx):{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {row.trackChanges}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Clean (.docx):{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {row.cleanCopy}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950/80">
          <Link
            href="/help"
            data-testid="quick-help-full-guide-link"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <span>Open Full Help Center &amp; Playbook Templates</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
