"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Link2Off,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type {
  ClauseDTO,
  CrossClauseIssueType,
  RiskLevel,
} from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useI18n } from "@/i18n/useI18n";
import {
  localizeCrossClauseFindingForDisplay,
  localizeCrossClauseIssueType,
  localizeRiskLabel,
  STUDIO_DRAWER_UI_COPY,
} from "@/i18n/domainLocalization";

export interface CrossClauseRadarPanelProps {
  documentId?: string;
  clauses?: ClauseDTO[];
}

type FilterCategory = "ALL" | CrossClauseIssueType;

const SEVERITY_BADGES: Record<RiskLevel, string> = {
  CRITICAL:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  MEDIUM:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
};

const ISSUE_TYPE_CONFIG: Record<
  CrossClauseIssueType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  CONTRADICTION: {
    label: "Contradiction",
    icon: ShieldAlert,
    color: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/30",
  },
  BROKEN_REFERENCE: {
    label: "Broken Reference",
    icon: Link2Off,
    color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30",
  },
  UNDEFINED_TERM: {
    label: "Undefined Term",
    icon: AlertTriangle,
    color: "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/30",
  },
};

export const CrossClauseRadarPanel: React.FC<CrossClauseRadarPanelProps> = ({
  documentId,
}) => {
  const { t, locale } = useI18n();
  const drawerCopy = STUDIO_DRAWER_UI_COPY[locale];
  const report = useWorkspaceStore((state) => state.crossClauseReport);
  const isRunning = useWorkspaceStore(
    (state) => state.isRunningCrossClauseCheck
  );
  const runCheck = useWorkspaceStore(
    (state) => state.runDocumentCrossClauseCheck
  );
  const selectClause = useWorkspaceStore((state) => state.selectClause);

  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");

  const handleScan = async () => {
    try {
      await runCheck(documentId);
    } catch {
      // Handled in store
    }
  };

  const filteredFindings = useMemo(() => {
    if (!report) {
      return [];
    }
    if (activeFilter === "ALL") {
      return report.findings;
    }
    return report.findings.filter((f) => f.issue_type === activeFilter);
  }, [report, activeFilter]);

  const scoreColor = useMemo(() => {
    if (!report) {
      return "text-indigo-600 dark:text-indigo-400";
    }
    if (report.integrity_score >= 85) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (report.integrity_score >= 60) {
      return "text-amber-600 dark:text-amber-400";
    }
    return "text-rose-600 dark:text-rose-400";
  }, [report]);

  return (
    <div
      data-testid="cross-clause-radar-panel"
      className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4"
    >
      {/* Header Banner */}
      <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50/60 p-4 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-300 bg-white text-indigo-600 shadow-sm dark:border-indigo-500/40 dark:bg-slate-800 dark:text-indigo-300">
              <FileSearch className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.radar.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.radar.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="run-cross-clause-check-btn"
            disabled={isRunning}
            onClick={handleScan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t.radar.scanningBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{report ? t.radar.rescanBtn : t.radar.scanBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Score & Metric Counters */}
        {report && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="surface-card rounded-lg p-2.5 text-center">
              <div
                data-testid="cross-clause-integrity-score"
                className={`text-xl font-bold font-mono tabular-nums ${scoreColor}`}
              >
                {report.integrity_score}%
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.radar.integrityScore}
              </div>
            </div>

            <div className="surface-card rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {report.contradiction_count}
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.radar.contradictions}
              </div>
            </div>

            <div className="surface-card rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {report.broken_reference_count}
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.radar.brokenRefs}
              </div>
            </div>

            <div className="surface-card rounded-lg p-2.5 text-center">
              <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {report.undefined_term_count}
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.radar.undefinedTerms}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {report && report.total_findings > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-slate-200/80 pb-2.5 dark:border-slate-800">
          <button
            type="button"
            data-testid="radar-filter-ALL"
            onClick={() => setActiveFilter("ALL")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.radar.filterAllIssues} ({report.total_findings})
          </button>
          <button
            type="button"
            data-testid="radar-filter-CONTRADICTION"
            onClick={() => setActiveFilter("CONTRADICTION")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeFilter === "CONTRADICTION"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.radar.filterContradictions} ({report.contradiction_count})
          </button>
          <button
            type="button"
            data-testid="radar-filter-BROKEN_REFERENCE"
            onClick={() => setActiveFilter("BROKEN_REFERENCE")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeFilter === "BROKEN_REFERENCE"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.radar.filterBrokenRefs} ({report.broken_reference_count})
          </button>
          <button
            type="button"
            data-testid="radar-filter-UNDEFINED_TERM"
            onClick={() => setActiveFilter("UNDEFINED_TERM")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeFilter === "UNDEFINED_TERM"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.radar.filterUndefinedTerms} ({report.undefined_term_count})
          </button>
        </div>
      )}

      {/* Findings List */}
      {!report && !isRunning && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
          <FileSearch className="mb-2 h-8 w-8 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {drawerCopy.emptyScanTitle}
          </h4>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {drawerCopy.emptyScanDesc}
          </p>
        </div>
      )}

      {report && filteredFindings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/40 p-8 text-center dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            {t.radar.noIssuesFilterTitle}
          </h4>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
            {t.radar.noIssuesFilterDesc}
          </p>
        </div>
      )}

      {filteredFindings.map((finding) => {
        const typeCfg = ISSUE_TYPE_CONFIG[finding.issue_type];
        const IconComponent = typeCfg.icon;
        const localizedFinding = localizeCrossClauseFindingForDisplay(
          finding,
          locale
        );

        return (
          <article
            key={finding.id}
            data-testid={`cross-clause-finding-${finding.id}`}
            className="surface-card rounded-xl p-4 transition-all hover:border-slate-300/90 hover:shadow-md dark:hover:border-slate-700"
          >
            {/* Top Row: Type Pill + Severity Pill */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${typeCfg.color}`}
              >
                <IconComponent className="h-3 w-3" />
                <span>
                  {localizeCrossClauseIssueType(finding.issue_type, locale)}
                </span>
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider ${
                  SEVERITY_BADGES[finding.severity]
                }`}
              >
                {localizeRiskLabel(finding.severity, locale)}
              </span>
            </div>

            {/* Title & Description */}
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
              {localizedFinding.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {localizedFinding.description}
            </p>

            {/* Interactive Clause Jump Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid={`jump-source-clause-${finding.id}`}
                onClick={() => selectClause(finding.source_clause_id, "inspector")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                <span>
                  {t.radar.sourceClausePrefix} #{finding.source_clause_index + 1}
                </span>
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </button>

              {finding.target_clause_id &&
              finding.target_clause_index !== null &&
              finding.target_clause_index !== undefined ? (
                <button
                  type="button"
                  data-testid={`jump-target-clause-${finding.id}`}
                  onClick={() => selectClause(finding.target_clause_id ?? null, "inspector")}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm transition-colors hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                >
                  <span>
                    {t.radar.targetClausePrefix} #{finding.target_clause_index + 1}
                  </span>
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </button>
              ) : null}
            </div>

            {/* Recommended Fix Box */}
            <div className="mt-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {t.radar.recommendedResolution}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-emerald-100">
                {localizedFinding.recommended_fix}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};
