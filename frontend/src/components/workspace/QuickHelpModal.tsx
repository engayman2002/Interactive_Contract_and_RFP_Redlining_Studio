"use client";

import React, { useState } from "react";
import Link from "next/link";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-sm font-bold text-indigo-300 border border-indigo-500/30">
              ?
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Studio Quick-Reference Guide
              </h2>
              <p className="text-xs text-slate-400">
                Contextual cheat-sheet for redlining, risk colors, and Word
                exports
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-quick-help-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Close Quick Help Modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2.5 gap-2">
          <button
            type="button"
            data-testid="quick-help-tab-workflow"
            onClick={() => setActiveTab("workflow")}
            className={`rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "workflow"
                ? "border-indigo-500 bg-slate-900 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Workflow Cheat-Sheet
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-heatmap"
            onClick={() => setActiveTab("heatmap")}
            className={`rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "heatmap"
                ? "border-indigo-500 bg-slate-900 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Risk Heatmap & Diff Legend
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-export"
            onClick={() => setActiveTab("export")}
            className={`rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "export"
                ? "border-indigo-500 bg-slate-900 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Export Modes (.docx)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "workflow" && (
            <div data-testid="quick-help-content-workflow" className="space-y-3">
              {quickStartModule.steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5"
                >
                  <h3 className="text-xs font-bold text-indigo-300">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
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
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3.5 w-2 rounded-sm border ${item.dotClass}`}
                        />
                        <span className="text-xs font-bold text-white">
                          {item.colorName}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.badgeClass}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                      {item.meaning}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-indigo-500/30 bg-slate-950 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Live Word-Level Diff Preview
                </div>
                <p className="mt-1.5 text-xs text-slate-300">
                  Hover over{" "}
                  <span className="font-semibold text-emerald-300">
                    Apply Redline
                  </span>{" "}
                  to see{" "}
                  <span className="rounded bg-rose-500/25 px-1 text-rose-200 line-through">
                    deleted words
                  </span>{" "}
                  and{" "}
                  <span className="rounded bg-emerald-500/25 px-1 text-emerald-200 underline">
                    inserted Playbook words
                  </span>{" "}
                  inside the contract editor before committing.
                </p>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div data-testid="quick-help-content-export" className="space-y-3">
              {EXPORT_MODE_COMPARISON.map((row) => (
                <div
                  key={row.feature}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs"
                >
                  <div className="font-bold text-white">{row.feature}</div>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-teal-300">
                        Track Changes (.docx):{" "}
                      </span>
                      <span className="text-slate-300">{row.trackChanges}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">
                        Clean (.docx):{" "}
                      </span>
                      <span className="text-slate-300">{row.cleanCopy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-3.5">
          <Link
            href="/help"
            data-testid="quick-help-full-guide-link"
            className="text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Open Full Interactive Help Center & Playbook Templates →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

