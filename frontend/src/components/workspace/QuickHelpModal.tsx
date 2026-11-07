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

type QuickHelpTab = "workflow" | "heatmap" | "export";

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
            1. Workflow Cheat-Sheet
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
            2. Risk Heatmap &amp; Diff Legend
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
            3. Export Modes (.docx)
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
