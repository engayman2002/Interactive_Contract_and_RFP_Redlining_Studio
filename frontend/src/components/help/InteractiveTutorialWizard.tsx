"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Play,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/i18n/useI18n";

export const InteractiveTutorialWizard: React.FC = () => {
  const { t } = useI18n();
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);

  const stages = t.help.tutorialStages;
  const totalStages = stages.length;
  const currentStage = stages[activeStageIdx] ?? stages[0];
  const progressPct = Math.round(((activeStageIdx + 1) / totalStages) * 100);

  return (
    <section
      data-testid="interactive-tutorial-wizard"
      aria-label="Interactive 5-Stage Masterclass Tutorial"
      className="surface-card overflow-hidden rounded-2xl border-indigo-200/80 bg-gradient-to-br from-indigo-50/55 via-white to-violet-50/35 dark:border-indigo-500/25 dark:from-indigo-950/30 dark:via-[#0D1322] dark:to-violet-950/20"
    >
      {/* Wizard Header + Progress Bar */}
      <div className="border-b border-indigo-100/90 px-6 py-5 dark:border-indigo-500/20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <span className="micro-badge border-indigo-200 bg-white text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-300">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.help.tutorialEyebrow}</span>
            </span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white md:text-xl">
              {t.help.tutorialHeading}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {t.help.tutorialStepPrefix} {activeStageIdx + 1}{" "}
              {t.help.tutorialOf} {totalStages}
            </span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-indigo-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-200 dark:bg-indigo-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clickable Stage Stepper Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {stages.map((stage) => {
            const isActive = stage.index === activeStageIdx;
            const isCompleted = stage.index < activeStageIdx;
            return (
              <button
                key={stage.id}
                type="button"
                data-testid={`tutorial-step-btn-${stage.index}`}
                onClick={() => setActiveStageIdx(stage.index)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200/90 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {stage.index + 1}
                  </span>
                )}
                <span>{stage.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Content */}
      <div
        data-testid={`tutorial-step-${activeStageIdx}`}
        className="space-y-5 p-6"
      >
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white md:text-lg">
            {currentStage.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 md:text-sm">
            {currentStage.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: What You Will Do Checklist */}
          <div className="surface-card rounded-xl p-4 lg:col-span-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t.help.checklistHeading}</span>
            </div>
            <ol className="space-y-2.5">
              {currentStage.checklist.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: Interactive Visual Preview Example */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl border border-indigo-200/80 bg-slate-900 p-4 text-slate-100 shadow-sm dark:border-indigo-500/30 dark:bg-slate-950 lg:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.help.previewHeading}</span>
              </span>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-200">
                {currentStage.visualPreview.badge}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-slate-700/80 bg-slate-800/70 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {currentStage.visualPreview.promptOrInputLabel}
                </div>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-200">
                  {currentStage.visualPreview.promptOrInput}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  {currentStage.visualPreview.outputLabel}
                </div>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-emerald-100">
                  {currentStage.visualPreview.output}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tip Callout */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="font-semibold">
              {t.help.proTipHeadingWiz}
            </strong>{" "}
            {currentStage.proTip}
          </div>
        </div>
      </div>

      {/* Footer Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 bg-white/80 px-6 py-3.5 dark:border-indigo-500/20 dark:bg-slate-900/80">
        <button
          type="button"
          data-testid="tutorial-prev-btn"
          disabled={activeStageIdx === 0}
          onClick={() => setActiveStageIdx((prev) => Math.max(0, prev - 1))}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t.help.prevBtn}</span>
        </button>

        <Link
          href={currentStage.ctaHref}
          data-testid="tutorial-try-live-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-emerald-400 hover:to-emerald-600"
        >
          <Play className="h-3.5 w-3.5" />
          <span>{currentStage.ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          data-testid="tutorial-next-btn"
          disabled={activeStageIdx === totalStages - 1}
          onClick={() =>
            setActiveStageIdx((prev) => Math.min(totalStages - 1, prev + 1))
          }
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{t.help.nextBtn}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
};

