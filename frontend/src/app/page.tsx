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
import { listDocuments, listPlaybookRules } from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import type { DocumentListItemDTO } from "@/services/contracts";

export default function DashboardPage() {
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
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-6 py-8">
        {/* Executive Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Enterprise Legal Operations
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Contract &amp; RFP Intelligence Workspace
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Ingest counterparty agreements, benchmark clauses against your
              vector-indexed Company Playbook, and export executive-ready
              Microsoft Word Track Changes turns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/playbooks"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Configure Playbook</span>
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>User Guide</span>
            </Link>
          </div>
        </div>

        {/* First-Time Onboarding Callout */}
        <section
          data-testid="dashboard-onboarding-banner"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60 p-5 shadow-sm dark:border-indigo-500/25 dark:from-indigo-950/35 dark:via-slate-900 dark:to-violet-950/20 lg:flex-row lg:items-center"
        >
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                New User? Start the 2-Minute Interactive Tutorial
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Walk through Golden Playbook extraction, Stance-tuned AI audits,
                Copilot prompting, Critic Guard verification, Pushback
                Simulation, and native Word Track Changes export step by step.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link
              href="/help"
              data-testid="dashboard-start-tutorial-btn"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>🎓 Start Interactive Tutorial</span>
            </Link>
            <Link
              href="/documents/demo"
              data-testid="dashboard-guided-demo-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-xs transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
            >
              <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
              <span>🚀 Launch Guided Sample Studio</span>
            </Link>
          </div>
        </section>

        {/* KPI Summary Ribbon */}
        <section
          aria-label="Workspace Key Performance Metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Contracts Audited
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {Math.max(documents.length, 1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({analyzedCount} analyzed)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Playbook Policies
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <BookOpen className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {playbookCount}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                Hybrid Vector + BM25
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Critical Risks Identified
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                2
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                Liability &amp; AI Data
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Avg. Clause Audit Speed
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                &lt;150ms
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                20x concurrent stream
              </span>
            </div>
          </div>
        </section>

        {/* Two-Column Action Hub: Upload Dropzone (2/3) + Executive Sample Studio Card (1/3) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ContractUploadDropzone className="h-full" />
          </div>

          {/* Executive Sample Studio Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Sparkles className="h-3 w-3" />
                <span>Interactive Evaluation Showcase</span>
              </div>

              <h2 className="mt-3.5 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Master Cloud &amp; Enterprise AI Agreement
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Explore a live pre-segmented enterprise agreement complete with
                Playbook deviations, inline word-level diffs, threaded comments,
                and OpenXML Word Track Changes export.
              </p>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Flagged Counterparty Risks Inside
                </p>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    <strong>Critical:</strong> Asymmetric $500 vendor liability
                    cap vs. uncapped customer exposure
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    <strong>Critical:</strong> Perpetual right to train public
                    foundation AI models on Customer Data
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>High:</strong> Unilateral indemnification &amp;
                    missing SLA financial service credits
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/documents/demo"
                data-testid="try-demo-contract-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
              >
                <span>Launch Sample Studio</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Enterprise Data Table: Recent Contracts & RFPs */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200/80 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Recent Contracts &amp; RFPs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agreements ingested in your organization workspace
              </p>
            </div>
            <span className="inline-flex items-center self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 sm:self-auto">
              {documents.length} {documents.length === 1 ? "record" : "records"}
            </span>
          </div>

          {isLoadingDocs ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500 dark:text-slate-400">
              Loading workspace agreements...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No contracts uploaded yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Drop a .docx or .pdf above or launch the Sample Studio to start
                redlining.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                    <th className="px-6 py-3.5">Document Title</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Clauses</th>
                    <th className="px-4 py-3.5">Version</th>
                    <th className="px-4 py-3.5">Ingested Date</th>
                    <th className="px-6 py-3.5 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-xs dark:divide-slate-800/70">
                  {documents.map((doc) => {
                    const isAnalyzed = doc.status === "ANALYZED";
                    return (
                      <tr
                        key={doc.id}
                        data-testid={`document-row-${doc.id}`}
                        className="transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                              <FileText className="h-4 w-4" />
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            data-testid={`document-status-${doc.id}`}
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              isAnalyzed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-600 dark:text-slate-300">
                          {doc.clause_count ?? "—"} clauses
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-md border border-slate-200 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            v{doc.version}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/documents/${doc.id}`}
                            data-testid={`open-studio-btn-${doc.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:border-indigo-500/40 dark:hover:bg-slate-700"
                          >
                            <span>Open in Studio</span>
                            <ArrowRight className="h-3.5 w-3.5" />
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
