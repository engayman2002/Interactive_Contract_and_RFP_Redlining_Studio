"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Rocket,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { ContractUploadDropzone } from "@/components/workspace/ContractUploadDropzone";
import { useI18n } from "@/i18n/useI18n";
import {
  localizeDemoDocumentTitle,
  localizeDocumentStatus,
} from "@/i18n/domainLocalization";
import { listDocuments, listPlaybookRules } from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import type { DocumentListItemDTO } from "@/services/contracts";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { token, isLoading: isAuthLoading } = useAuthSession();
  const [documents, setDocuments] = useState<DocumentListItemDTO[]>([]);
  const [playbookCount, setPlaybookCount] = useState<number>(5);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const [docs, rules] = await Promise.all([
        listDocuments(token),
        listPlaybookRules(token).catch(() => []),
      ]);
      setDocuments(docs);
      if (rules.length > 0) {
        setPlaybookCount(rules.length);
      }
    } catch {
      // Fallback handled gracefully by apiClient
    } finally {
      setIsLoadingDocs(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthLoading) {
      void loadDashboardData();
    }
  }, [isAuthLoading, loadDashboardData]);

  const analyzedCount = documents.filter((d) => d.status === "ANALYZED").length;

  return (
    <div
      data-testid="contract-dashboard-page"
      className="bg-enterprise-canvas flex min-h-screen flex-col text-slate-900 dark:text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-6 py-8">
        {/* Executive Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="micro-badge border-indigo-200/80 bg-indigo-50/90 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
              <span className="micro-badge-dot bg-indigo-500" aria-hidden="true" />
              {t.dashboard.heroEyebrow}
            </span>
            <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              {t.dashboard.heroTitle}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {t.dashboard.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/playbooks"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.dashboard.configurePlaybook}</span>
            </Link>
            <Link
              href="/help"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t.dashboard.userGuide}</span>
            </Link>
          </div>
        </div>

        {/* First-Time Onboarding Callout */}
        <section
          data-testid="dashboard-onboarding-banner"
          className="surface-card flex flex-col justify-between gap-4 rounded-2xl border-indigo-200/70 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 p-5 dark:border-indigo-500/20 dark:from-indigo-950/30 dark:via-[#0D1322] dark:to-violet-950/20 lg:flex-row lg:items-center"
        >
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-inset ring-white/20">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.dashboard.onboardingTitle}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {t.dashboard.onboardingDesc}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/help"
              data-testid="dashboard-start-tutorial-btn"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600"
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.dashboard.startTutorialBtn}</span>
            </Link>
            <Link
              href="/documents/demo"
              data-testid="dashboard-guided-demo-btn"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200/90 bg-white px-3.5 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
            >
              <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.dashboard.launchGuidedDemoBtn}</span>
            </Link>
          </div>
        </section>

        {/* KPI Summary Ribbon (Bento Metrics Grid) */}
        <section
          aria-label="Workspace Key Performance Metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="surface-card flex flex-col justify-between rounded-2xl p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.dashboard.kpiAuditedLabel}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50/80 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <FileText className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                  {Math.max(documents.length, 1)}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  ({analyzedCount} {t.dashboard.kpiAuditedWord})
                </span>
              </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/90">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(25, Math.round((analyzedCount / Math.max(documents.length, 1)) * 100))
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="surface-card flex flex-col justify-between rounded-2xl p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.dashboard.kpiPlaybooksLabel}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                  {playbookCount}
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {t.dashboard.kpiPlaybooksSub}
                </span>
              </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/90">
              <div className="h-full w-4/5 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="surface-card flex flex-col justify-between rounded-2xl p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.dashboard.kpiRisksLabel}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                  2
                </span>
                <span className="micro-badge border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <span className="micro-badge-dot bg-rose-500" aria-hidden="true" />
                  {t.dashboard.kpiRisksBadge}
                </span>
              </div>
            </div>
            <div className="mt-4 flex h-1 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/90">
              <div className="h-full w-2/5 rounded-full bg-rose-500" />
              <div className="h-full w-1/4 rounded-full bg-amber-400" />
            </div>
          </div>

          <div className="surface-card flex flex-col justify-between rounded-2xl p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.dashboard.kpiSpeedLabel}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-100 bg-sky-50/80 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400">
                  <Clock className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                  &lt;150ms
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.dashboard.kpiSpeedSub}
                </span>
              </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/90">
              <div className="h-full w-11/12 rounded-full bg-sky-500" />
            </div>
          </div>
        </section>

        {/* Two-Column Action Hub: Upload Dropzone (2/3) + Executive Dark Bento Showcase (1/3) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ContractUploadDropzone className="h-full" />
          </div>

          {/* Executive Sample Studio Dark Bento Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-slate-900 via-[#111936] to-slate-950 p-6 text-white shadow-lg lg:col-span-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl"
            />
            <div className="relative">
              <div className="micro-badge border-indigo-400/30 bg-indigo-500/15 text-indigo-200">
                <Sparkles className="h-3 w-3 text-indigo-300" />
                <span>{t.dashboard.showcaseBadge}</span>
              </div>

              <h2 className="mt-4 text-base font-semibold tracking-tight text-white">
                {t.dashboard.showcaseTitle}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {t.dashboard.showcaseDesc}
              </p>

              <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.dashboard.showcaseRisksHeading}
                </p>
                <div className="flex items-start gap-2 text-xs text-slate-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>{t.dashboard.showcaseRisk1}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <span>{t.dashboard.showcaseRisk2}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{t.dashboard.showcaseRisk3}</span>
                </div>
              </div>
            </div>

            <div className="relative mt-6 pt-2">
              <Link
                href="/documents/demo"
                data-testid="try-demo-contract-btn"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 text-xs font-semibold text-white shadow-md ring-1 ring-inset ring-white/25 transition-all hover:from-indigo-400 hover:to-indigo-500"
              >
                <span>{t.dashboard.launchSampleStudioBtn}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Enterprise Data Table: Recent Contracts & RFPs */}
        <section className="surface-card overflow-hidden rounded-2xl">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200/80 px-6 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.dashboard.tableTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.tableSubtitle}
              </p>
            </div>
            <span className="inline-flex items-center self-start rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300 sm:self-auto">
              {documents.length}{" "}
              {documents.length === 1
                ? t.dashboard.recordSingular
                : t.dashboard.recordPlural}
            </span>
          </div>

          {isLoadingDocs ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.loadingDocs}
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.dashboard.emptyTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.emptyDesc}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <th className="px-6 py-3.5">{t.dashboard.colDocTitle}</th>
                    <th className="px-4 py-3.5">{t.dashboard.colStatus}</th>
                    <th className="px-4 py-3.5">{t.dashboard.colClauses}</th>
                    <th className="px-4 py-3.5">{t.dashboard.colVersion}</th>
                    <th className="px-4 py-3.5">{t.dashboard.colDate}</th>
                    <th className="px-6 py-3.5 text-end">{t.dashboard.colWorkspace}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-xs dark:divide-slate-800/70">
                  {documents.map((doc) => {
                    const isAnalyzed = doc.status === "ANALYZED";
                    return (
                      <tr
                        key={doc.id}
                        data-testid={`document-row-${doc.id}`}
                        className="group transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-slate-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50/60 group-hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:group-hover:border-indigo-500/30 dark:group-hover:text-indigo-300">
                              <FileText className="h-4 w-4" />
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {localizeDemoDocumentTitle(doc.title, locale)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            data-testid={`document-status-${doc.id}`}
                            className={`micro-badge ${
                              isAnalyzed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300"
                            }`}
                          >
                            <span
                              className={`micro-badge-dot ${
                                isAnalyzed ? "bg-emerald-500" : "bg-sky-500"
                              }`}
                              aria-hidden="true"
                            />
                            {localizeDocumentStatus(doc.status, locale)}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {doc.clause_count ?? "—"} {t.dashboard.clausesSuffix}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-md border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            v{doc.version}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <Link
                            href={`/documents/${doc.id}`}
                            data-testid={`open-studio-btn-${doc.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-indigo-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/70 dark:border-slate-700/80 dark:bg-slate-800 dark:text-indigo-300 dark:hover:border-indigo-500/40 dark:hover:bg-slate-700"
                          >
                            <span>{t.dashboard.openInStudioBtn}</span>
                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
