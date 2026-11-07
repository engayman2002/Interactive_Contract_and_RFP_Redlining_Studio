"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import {
  createPlaybookRule,
  deletePlaybookRule,
  listPlaybookRules,
} from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import type { PlaybookRuleDTO } from "@/services/contracts";

export default function PlaybooksPage() {
  const { token, isLoading: isAuthLoading } = useAuthSession();
  const [rules, setRules] = useState<PlaybookRuleDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Form state
  const [category, setCategory] = useState<string>("");
  const [standardPosition, setStandardPosition] = useState<string>("");
  const [fallbackPosition, setFallbackPosition] = useState<string>("");
  const [unacceptableTriggers, setUnacceptableTriggers] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listPlaybookRules(token);
      setRules(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthLoading) {
      void loadRules();
    }
  }, [isAuthLoading, loadRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !category.trim() ||
      !standardPosition.trim() ||
      !fallbackPosition.trim() ||
      !unacceptableTriggers.trim()
    ) {
      setFormError("All fields are required to formulate a vector playbook rule.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await createPlaybookRule(
        {
          category: category.trim(),
          standard_position: standardPosition.trim(),
          fallback_position: fallbackPosition.trim(),
          unacceptable_triggers: unacceptableTriggers.trim(),
        },
        token
      );
      setRules((prev) => [created, ...prev]);
      setCategory("");
      setStandardPosition("");
      setFallbackPosition("");
      setUnacceptableTriggers("");
      setIsAdding(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to persist playbook rule."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deletePlaybookRule(ruleId, token);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      // ignore
    }
  };

  return (
    <div
      data-testid="playbooks-manager-page"
      className="flex min-h-screen flex-col bg-slate-950 text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Link href="/" className="hover:underline">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-white">
              Company Playbook Rules Manager
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Define standard corporate positions, fallback negotiating
              boundaries, and unacceptable triggers. The LangChain AI engine
              uses dense vector embeddings and BM25 hybrid search to benchmark
              every ingested contract clause against these rules.
            </p>
          </div>

          <button
            type="button"
            data-testid="add-rule-toggle-btn"
            onClick={() => setIsAdding((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors hover:bg-indigo-500 shrink-0"
          >
            <span>{isAdding ? "✕ Cancel" : "+ Add New Playbook Rule"}</span>
          </button>
        </div>

        {/* Add Rule Form Modal / Inline Card */}
        {isAdding ? (
          <form
            onSubmit={handleCreateRule}
            data-testid="create-rule-form"
            className="rounded-xl border border-indigo-500/40 bg-slate-900/90 p-6 shadow-xl space-y-4"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Create New Company Playbook Rule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-300">
                  Clause Category / Legal Subject
                </label>
                <input
                  type="text"
                  required
                  data-testid="rule-category-input"
                  placeholder="e.g. Limitation of Liability, Indemnification, SLA..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Standard Position (Preferred corporate baseline)
                </label>
                <textarea
                  required
                  rows={3}
                  data-testid="rule-standard-input"
                  placeholder="e.g. Mutual 12 months fees paid cap; mutual waiver of consequential damages..."
                  value={standardPosition}
                  onChange={(e) => setStandardPosition(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Fallback Position (Acceptable negotiating floor)
                </label>
                <textarea
                  required
                  rows={3}
                  data-testid="rule-fallback-input"
                  placeholder="e.g. Mutual 2x fees paid cap with mutual consequential damages waiver..."
                  value={fallbackPosition}
                  onChange={(e) => setFallbackPosition(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-rose-300">
                  Unacceptable Triggers (Deal-breaker provisions)
                </label>
                <textarea
                  required
                  rows={2}
                  data-testid="rule-unacceptable-input"
                  placeholder="e.g. Uncapped customer liability, unilateral liability caps for vendor, waiver of gross negligence..."
                  value={unacceptableTriggers}
                  onChange={(e) => setUnacceptableTriggers(e.target.value)}
                  className="mt-1 w-full rounded-md border border-rose-500/40 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {formError ? (
              <div className="rounded border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                {formError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="rule-save-btn"
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Generating Vectors..." : "Save Rule & Embed Vectors"}
              </button>
            </div>
          </form>
        ) : null}

        {/* Playbook Rules Cards */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading corporate playbook knowledge base...
          </div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No playbook rules found. Click &ldquo;+ Add New Playbook Rule&rdquo; to define
            your corporate negotiation standards.
          </div>
        ) : (
          <div
            data-testid="playbook-rules-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {rules.map((rule) => (
              <div
                key={rule.id}
                data-testid={`playbook-rule-card-${rule.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                      {rule.category}
                    </span>
                    <button
                      type="button"
                      data-testid={`delete-rule-btn-${rule.id}`}
                      onClick={() => handleDeleteRule(rule.id)}
                      className="rounded p-1 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400"
                      title="Delete Rule"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Standard Position */}
                  <div className="mt-3.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Standard Position:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {rule.standard_position}
                    </p>
                  </div>

                  {/* Fallback Position */}
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Fallback Position:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rule.fallback_position}
                    </p>
                  </div>

                  {/* Unacceptable Triggers */}
                  <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                      Unacceptable Triggers:
                    </span>
                    <p className="text-xs text-rose-200 leading-relaxed">
                      {rule.unacceptable_triggers}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
                  <span>Rule ID: {rule.id.slice(0, 10)}...</span>
                  <span>1536-dim Vector Indexed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

