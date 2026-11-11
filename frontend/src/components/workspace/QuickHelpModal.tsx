"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, HelpCircle, X } from "lucide-react";
import { getLocalizedHelpContent } from "@/services/helpContent";
import { QUICK_HELP_BODY_COPY } from "@/i18n/quickHelpTranslations";
import { useI18n } from "@/i18n/useI18n";

export interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuickHelpTab =
  | "workflow"
  | "copilot"
  | "radar"
  | "critic"
  | "pushback"
  | "stance"
  | "heatmap"
  | "export"
  | "extractor"
  | "telemetry";

export const QuickHelpModal: React.FC<QuickHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<QuickHelpTab>("workflow");

  if (!isOpen) {
    return null;
  }

  const helpContent = getLocalizedHelpContent(locale);
  const quickStartModule = helpContent.modules[0];
  const bodyCopy = QUICK_HELP_BODY_COPY[locale];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-Studio Quick Help & Reference Guide"
      data-testid="quick-help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-black/75"
    >
      <div className="surface-card flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.quickHelp.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.quickHelp.subtitle}
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

        {/* Full Interactive Tutorial CTA Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50/60 to-white px-6 py-2.5 dark:border-indigo-500/20 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t.quickHelp.tutorialCtaPrompt}</span>
          </div>
          <Link
            href="/help"
            data-testid="quick-help-launch-tutorial-btn"
            onClick={onClose}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3 text-[11px] font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600"
          >
            <span>{t.quickHelp.tutorialCtaBtn}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>

        {/* Scrollable Pill Navigation */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-slate-50 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
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
            {t.quickHelp.tabWorkflow}
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
            {t.quickHelp.tabCopilot}
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
            {t.quickHelp.tabRadar}
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
            {t.quickHelp.tabCritic}
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-pushback"
            onClick={() => setActiveTab("pushback")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "pushback"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.quickHelp.tabPushback}
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
            {t.quickHelp.tabStance}
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
            {t.quickHelp.tabHeatmap}
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
            {t.quickHelp.tabExport}
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-extractor"
            onClick={() => setActiveTab("extractor")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "extractor"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.quickHelp.tabExtractor}
          </button>
          <button
            type="button"
            data-testid="quick-help-tab-telemetry"
            onClick={() => setActiveTab("telemetry")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "telemetry"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.quickHelp.tabTelemetry}
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
                    {bodyCopy.copilot.heading}
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    {bodyCopy.copilot.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.copilot.introPrefix}
                  <strong className="text-indigo-700 dark:text-indigo-300">
                    {bodyCopy.copilot.introStrong}
                  </strong>
                  {bodyCopy.copilot.introSuffix}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {bodyCopy.copilot.chips.map((chip) => (
                  <div
                    key={chip.title}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {chip.title}
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {chip.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 dark:border-emerald-500/25 dark:bg-slate-950">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {bodyCopy.copilot.footerTitle}
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.copilot.footerPrefix}
                  <code className="font-mono text-[11px]">
                    {bodyCopy.copilot.footerCode}
                  </code>
                  {bodyCopy.copilot.footerSuffix}
                </p>
              </div>
            </div>
          )}

          {activeTab === "radar" && (
            <div data-testid="quick-help-content-radar" className="space-y-3">
              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    {bodyCopy.radar.heading}
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    {bodyCopy.radar.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.radar.introPrefix}
                  <strong className="text-indigo-700 dark:text-indigo-300">
                    {bodyCopy.radar.introStrong}
                  </strong>
                  {bodyCopy.radar.introSuffix}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                      {bodyCopy.radar.categories[0].title}
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.radar.categories[0].body}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      {bodyCopy.radar.categories[1].title}
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.radar.categories[1].body}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/40 dark:bg-sky-950/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <h4 className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                      {bodyCopy.radar.categories[2].title}
                    </h4>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.radar.categories[2].body}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {bodyCopy.radar.footerTitle}
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {bodyCopy.radar.footerBeforeSource}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {bodyCopy.radar.footerSourceBtn}
                  </span>
                  {bodyCopy.radar.footerBetween}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {bodyCopy.radar.footerTargetBtn}
                  </span>
                  {bodyCopy.radar.footerAfterTarget}
                </p>
              </div>
            </div>
          )}

          {activeTab === "critic" && (
            <div data-testid="quick-help-content-critic" className="space-y-3">
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    {bodyCopy.critic.heading}
                  </span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {bodyCopy.critic.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.critic.introPrefix}
                  <strong className="text-slate-900 dark:text-white">
                    {bodyCopy.critic.introStrong1}
                  </strong>
                  {bodyCopy.critic.introMiddle}
                  <strong className="text-emerald-800 dark:text-emerald-300">
                    {bodyCopy.critic.introStrong2}
                  </strong>
                  {bodyCopy.critic.introSuffix}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {bodyCopy.critic.gates[0].title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.critic.gates[0].body}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {bodyCopy.critic.gates[1].title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.critic.gates[1].body}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {bodyCopy.critic.gates[2].title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.critic.gates[2].body}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {bodyCopy.critic.footerTitle}
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>{bodyCopy.critic.footerVerifiedStrong}</strong>
                  {bodyCopy.critic.footerVerifiedText}
                  <strong>{bodyCopy.critic.footerRefinedStrong}</strong>
                  {bodyCopy.critic.footerRefinedText}
                  <strong>{bodyCopy.critic.footerReviewStrong}</strong>
                  {bodyCopy.critic.footerReviewText}
                  <strong>{bodyCopy.critic.footerReverifyStrong}</strong>
                  {bodyCopy.critic.footerReverifySuffix}
                  <code className="font-mono text-[11px]">
                    SUGGESTION_VERIFIED
                  </code>
                  .
                </p>
              </div>
            </div>
          )}

          {activeTab === "pushback" && (
            <div data-testid="quick-help-content-pushback" className="space-y-3">
              <div className="rounded-xl border border-orange-200/90 bg-orange-50/50 p-4 dark:border-orange-500/30 dark:bg-orange-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                    {bodyCopy.pushback.heading}
                  </span>
                  <span className="rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 dark:border-orange-500/40 dark:bg-orange-900/50 dark:text-orange-200">
                    {bodyCopy.pushback.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.pushback.introPrefix}
                  <strong className="text-orange-800 dark:text-orange-300">
                    {bodyCopy.pushback.introStrong}
                  </strong>
                  {bodyCopy.pushback.introSuffix}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {bodyCopy.pushback.card1Title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.pushback.card1Prefix}
                    <strong>{bodyCopy.pushback.card1Range}</strong>
                    {bodyCopy.pushback.card1Suffix}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {bodyCopy.pushback.card2Title}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.pushback.card2Prefix}
                    <strong>{bodyCopy.pushback.card2Strong}</strong>
                    {bodyCopy.pushback.card2Suffix}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 dark:border-emerald-500/25 dark:bg-slate-950">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {bodyCopy.pushback.footerTitle}
                </span>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.pushback.footerPrefix}
                  <strong>{bodyCopy.pushback.footerStrong}</strong>
                  {bodyCopy.pushback.footerMiddle}
                  <code className="font-mono text-[11px]">
                    PUSHBACK_SIMULATED
                  </code>
                  {bodyCopy.pushback.footerSuffix}
                </p>
              </div>
            </div>
          )}

          {activeTab === "stance" && (
            <div data-testid="quick-help-content-stance" className="space-y-3">
              <div className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-4 dark:border-rose-500/30 dark:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    {bodyCopy.stance.strictTitle}
                  </span>
                  <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-900/50 dark:text-rose-200">
                    {bodyCopy.stance.strictBadge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.stance.strictPrefix}
                  <code className="text-[11px] font-mono">
                    {bodyCopy.stance.strictCode}
                  </code>
                  {bodyCopy.stance.strictSuffix}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    {bodyCopy.stance.balancedTitle}
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    {bodyCopy.stance.balancedBadge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.stance.balancedPrefix}
                  <code className="text-[11px] font-mono">
                    {bodyCopy.stance.balancedCode}
                  </code>
                  {bodyCopy.stance.balancedSuffix}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {bodyCopy.stance.commercialTitle}
                  </span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {bodyCopy.stance.commercialBadge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.stance.commercialPrefix}
                  <code className="text-[11px] font-mono">
                    {bodyCopy.stance.commercialCode}
                  </code>
                  {bodyCopy.stance.commercialSuffix}
                </p>
              </div>
            </div>
          )}

          {activeTab === "heatmap" && (
            <div data-testid="quick-help-content-heatmap" className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {helpContent.heatmapLegend.map((item) => (
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
                        {item.localizedLevel}
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
                  {bodyCopy.heatmap.diffTitle}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.heatmap.diffHoverPrefix}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {bodyCopy.heatmap.diffApplyLabel}
                  </span>
                  {bodyCopy.heatmap.diffToPreview}
                  <span className="rounded bg-rose-100 px-1 text-rose-800 line-through dark:bg-rose-500/25 dark:text-rose-200">
                    {bodyCopy.heatmap.diffDeleted}
                  </span>
                  {bodyCopy.heatmap.diffAnd}
                  <span className="rounded bg-emerald-100 px-1 font-medium text-emerald-900 underline dark:bg-emerald-500/25 dark:text-emerald-200">
                    {bodyCopy.heatmap.diffInserted}
                  </span>
                  {bodyCopy.heatmap.diffSuffix}
                </p>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div data-testid="quick-help-content-export" className="space-y-3">
              {helpContent.exportComparison.map((row) => (
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
                        {bodyCopy.exportTab.trackChangesPrefix}{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {row.trackChanges}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {bodyCopy.exportTab.cleanCopyPrefix}{" "}
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

          {activeTab === "extractor" && (
            <div data-testid="quick-help-content-extractor" className="space-y-3">
              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/25">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    {bodyCopy.extractor.heading}
                  </span>
                  <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-900/50 dark:text-indigo-200">
                    /playbooks
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.extractor.introOpen}
                  <Link href="/playbooks" className="font-semibold underline">
                    {bodyCopy.extractor.linkLabel}
                  </Link>
                  {bodyCopy.extractor.introMiddle}
                  <strong>{bodyCopy.extractor.introSample}</strong>
                  {bodyCopy.extractor.introUpload}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {bodyCopy.extractor.card1Title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.extractor.card1Prefix}
                    <strong>{bodyCopy.extractor.card1Strong}</strong>
                    {bodyCopy.extractor.card1Suffix}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs dark:border-amber-500/20 dark:bg-amber-950/20">
                  <div className="font-semibold text-amber-800 dark:text-amber-300">
                    {bodyCopy.extractor.card2Title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.extractor.card2Prefix}
                    <strong>{bodyCopy.extractor.card2Strong}</strong>
                    {bodyCopy.extractor.card2Suffix}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "telemetry" && (
            <div data-testid="quick-help-content-telemetry" className="space-y-3">
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/25">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {bodyCopy.telemetry.heading}
                  </span>
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {bodyCopy.telemetry.badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {bodyCopy.telemetry.introOpen}
                  <strong>{bodyCopy.telemetry.introStrong}</strong>
                  {bodyCopy.telemetry.introSuffix}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {bodyCopy.telemetry.card1Title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.telemetry.card1Prefix}
                    {bodyCopy.telemetry.card1Suffix}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {bodyCopy.telemetry.card2Title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {bodyCopy.telemetry.card2Prefix}
                    <strong>{bodyCopy.telemetry.card2Strong}</strong>
                    {bodyCopy.telemetry.card2Suffix}
                  </p>
                </div>
              </div>
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
            <span>{bodyCopy.footer.openFullGuide}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {bodyCopy.footer.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
