"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { ContractUploadDropzone } from "@/components/workspace/ContractUploadDropzone";
import { listDocuments } from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import type { DocumentListItemDTO } from "@/services/contracts";

export default function DashboardPage() {
  const { token, isLoading: isAuthLoading } = useAuthSession();
  const [documents, setDocuments] = useState<DocumentListItemDTO[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await listDocuments(token);
      setDocuments(docs);
    } catch {
      // Fallback
    } finally {
      setIsLoadingDocs(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthLoading) {
      void loadDocuments();
    }
  }, [isAuthLoading, loadDocuments]);

  return (
    <div
      data-testid="contract-dashboard-page"
      className="flex min-h-screen flex-col bg-slate-950 text-slate-100"
    >
      <TopNavBar />

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <span>✦</span> Next-Gen Contract & RFP Redlining Studio
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Contract Dashboard & Upload Hub
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Upload commercial contracts or RFPs (.docx / .pdf) to benchmark
              every clause against your corporate playbook, surface critical
              legal risks, preview word-by-word diffs, and export redlined Word
              documents.
            </p>
          </div>

          {/* Quick CTA to Demo Sample Contract */}
          <div className="flex shrink-0">
            <Link
              href="/documents/demo"
              data-testid="try-demo-contract-btn"
              className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-2.5 text-xs font-semibold text-indigo-200 transition-all hover:bg-indigo-600/30 hover:border-indigo-500"
            >
              <span>⚖️</span>
              <span>Try Interactive Sample Contract →</span>
            </Link>
          </div>
        </div>

        {/* Upload Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Drag-and-Drop Area */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Upload New Contract or RFP
              </h2>
              <span className="text-xs text-slate-500">
                Automatic Clause Segmentation
              </span>
            </div>
            <ContractUploadDropzone onUploadComplete={() => void loadDocuments()} />
          </div>

          {/* Interactive Demo CTA Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-lg">
                🚀
              </div>
              <h3 className="mt-4 text-base font-bold text-white">
                Explore Sample Contract
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Test the split-screen editor, bidirectional clause focus sync,
                optimistic concurrency, and live Track Changes DOCX export on
                our enterprise demo agreement.
              </p>

              <div className="mt-4 space-y-2 rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>3 Critical Liability & Indemnity Risks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>1 High-Risk SLA Best-Efforts Waiver</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>1 Fully Compliant Governing Law Clause</span>
                </div>
              </div>
            </div>

            <Link
              href="/documents/demo"
              data-testid="open-demo-studio-card-btn"
              className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              Open Sample Contract Studio →
            </Link>
          </div>
        </div>

        {/* My Documents Table */}
        <section
          aria-label="Recent Contracts & RFPs"
          data-testid="my-documents-section"
          className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                My Documents & Redline Workspaces
              </h2>
              <p className="text-xs text-slate-400">
                Manage all uploaded agreements, clause extractions, and AI audit
                states.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDocuments}
              className="rounded-md border border-slate-800 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Refresh ⟳
            </button>
          </div>

          {isLoadingDocs ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading workspace documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No documents in this workspace yet. Upload your first contract
              above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="documents-table"
                className="w-full text-left text-xs"
              >
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-semibold">
                    <th className="pb-2.5 font-medium">Contract Title</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium">Clauses</th>
                    <th className="pb-2.5 font-medium">Version</th>
                    <th className="pb-2.5 font-medium">Date Created</th>
                    <th className="pb-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      data-testid={`document-row-${doc.id}`}
                      className="group transition-colors hover:bg-slate-850/60"
                    >
                      <td className="py-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📄</span>
                          <span className="max-w-md truncate font-semibold">
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          data-testid={`document-status-${doc.id}`}
                          className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                            doc.status === "ANALYZED"
                              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {doc.clause_count ?? "6"} clauses
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        v{doc.version}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(doc.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/documents/${doc.id}`}
                          data-testid={`open-studio-btn-${doc.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-600 hover:text-white"
                        >
                          <span>Open in Studio →</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
