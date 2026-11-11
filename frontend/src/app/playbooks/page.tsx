"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import {
  createPlaybookRule,
  deletePlaybookRule,
  listPlaybookRules,
} from "@/services/apiClient";
import { AIPlaybookExtractorPanel } from "@/components/playbooks/AIPlaybookExtractorPanel";
import { useAuthSession } from "@/services/authSession";
import type { PlaybookRuleDTO } from "@/services/contracts";
import { useI18n } from "@/i18n/useI18n";

export default function PlaybooksPage() {
  const { t } = useI18n();
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
      setFormError(
        "All fields are required to formulate a vector playbook rule."
      );
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
      className="bg-enterprise-canvas flex min-h-screen flex-col text-slate-900 dark:text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-6 py-8">
        {/* Executive Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80 md:flex-row md:items-end">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t.playbooks.backToDashboard}</span>
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              {t.playbooks.title}
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t.playbooks.subtitle}
            </p>
          </div>

          <button
            type="button"
            data-testid="add-rule-toggle-btn"
            onClick={() => setIsAdding((prev) => !prev)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold shadow-sm transition-all ${
              isAdding
                ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                : "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white ring-1 ring-inset ring-white/20 hover:from-indigo-400 hover:to-indigo-600"
            }`}
          >
            {isAdding ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>{t.playbooks.cancelBtn}</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>{t.playbooks.addRuleBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* AI Playbook Auto-Extractor (Feature #6) */}
        <AIPlaybookExtractorPanel
          onRulesSaved={(savedRules) =>
            setRules((prev) => {
              const savedIds = new Set(savedRules.map((r) => r.id));
              return [
                ...savedRules,
                ...prev.filter((r) => !savedIds.has(r.id)),
              ];
            })
          }
        />

        {/* Add Rule Form Card */}
        {isAdding ? (
          <form
            onSubmit={handleCreateRule}
            data-testid="create-rule-form"
            className="surface-card space-y-5 rounded-2xl border-indigo-200/80 p-6 shadow-md dark:border-indigo-500/30"
          >
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.playbooks.formTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.playbooks.formHintPrefix}{" "}
                <Link
                  href="/help"
                  className="font-semibold text-indigo-600 underline dark:text-indigo-400"
                >
                  {t.playbooks.formHintLink}
                </Link>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.playbooks.categoryLabel}
                </label>
                <input
                  type="text"
                  required
                  data-testid="rule-category-input"
                  placeholder={t.playbooks.categoryPlaceholder}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {t.playbooks.standardLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  data-testid="rule-standard-input"
                  placeholder={t.playbooks.standardPlaceholder}
                  value={standardPosition}
                  onChange={(e) => setStandardPosition(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs leading-relaxed text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {t.playbooks.fallbackLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  data-testid="rule-fallback-input"
                  placeholder={t.playbooks.fallbackPlaceholder}
                  value={fallbackPosition}
                  onChange={(e) => setFallbackPosition(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs leading-relaxed text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {t.playbooks.triggersLabel}
                </label>
                <textarea
                  required
                  rows={2}
                  data-testid="rule-unacceptable-input"
                  placeholder={t.playbooks.triggersPlaceholder}
                  value={unacceptableTriggers}
                  onChange={(e) => setUnacceptableTriggers(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-rose-200 bg-rose-50/30 px-3.5 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500/30 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
                {formError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t.playbooks.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="rule-save-btn"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting
                  ? t.playbooks.savingVectorsBtn
                  : t.playbooks.saveEmbedBtn}
              </button>
            </div>
          </form>
        ) : null}

        {/* Playbook Rules Cards Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
            {t.playbooks.loadingRules}
          </div>
        ) : rules.length === 0 ? (
          <div className="surface-card rounded-2xl py-16 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.playbooks.emptyTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.playbooks.emptyDesc}
            </p>
          </div>
        ) : (
          <div
            data-testid="playbook-rules-grid"
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {rules.map((rule) => (
              <div
                key={rule.id}
                data-testid={`playbook-rule-card-${rule.id}`}
                className="surface-card flex flex-col justify-between space-y-4 rounded-2xl p-6 transition-all hover:border-slate-300/90 hover:shadow-md dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="micro-badge border-indigo-200/90 bg-indigo-50/90 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{rule.category}</span>
                    </span>
                    <button
                      type="button"
                      data-testid={`delete-rule-btn-${rule.id}`}
                      onClick={() => void handleDeleteRule(rule.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      title="Delete Rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Standard Position */}
                  <div className="mt-4 space-y-1">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {t.playbooks.standardPosHeading}
                    </span>
                    <p className="font-serif text-[14.5px] leading-[1.65] text-slate-800 dark:text-slate-200">
                      {rule.standard_position}
                    </p>
                  </div>

                  {/* Fallback Position */}
                  <div className="mt-3.5 space-y-1">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      {t.playbooks.fallbackPosHeading}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {rule.fallback_position}
                    </p>
                  </div>

                  {/* Unacceptable Triggers */}
                  <div className="mt-4 space-y-1 rounded-xl border border-rose-200/80 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-950/20">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      {t.playbooks.triggersHeading}
                    </span>
                    <p className="font-mono text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                      {rule.unacceptable_triggers}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <span>ID: {rule.id.slice(0, 10)}</span>
                  <span>{t.playbooks.vectorIndexed}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
