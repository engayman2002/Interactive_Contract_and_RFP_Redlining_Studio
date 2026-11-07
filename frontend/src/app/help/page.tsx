"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import {
  EXPORT_MODE_COMPARISON,
  HELP_FAQ_ITEMS,
  HELP_GUIDE_MODULES,
  PLAYBOOK_RULE_TEMPLATES,
  type PlaybookRuleTemplate,
  RISK_HEATMAP_LEGEND,
} from "@/services/helpContent";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    "faq-offline-demo": true,
    "faq-inline-diff": true,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    return HELP_GUIDE_MODULES.filter((mod) => {
      if (selectedModuleId !== "ALL" && mod.id !== selectedModuleId) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [
        mod.title,
        mod.badge,
        mod.summary,
        ...mod.keywords,
        ...mod.steps.map((s) => `${s.title} ${s.description} ${s.tip ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, selectedModuleId]);

  const filteredTemplates = useMemo(() => {
    if (!normalizedQuery) {
      return PLAYBOOK_RULE_TEMPLATES;
    }
    return PLAYBOOK_RULE_TEMPLATES.filter((tpl) => {
      const haystack = [
        tpl.title,
        tpl.category,
        tpl.standard_position,
        tpl.fallback_position,
        tpl.unacceptable_triggers,
        tpl.why_it_works,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return HELP_FAQ_ITEMS;
    }
    return HELP_FAQ_ITEMS.filter((faq) => {
      const haystack = [faq.question, faq.answer, ...faq.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const handleCopyTemplate = async (tpl: PlaybookRuleTemplate) => {
    const formatted = [
      `Category: ${tpl.category}`,
      `Standard Position: ${tpl.standard_position}`,
      `Fallback Position: ${tpl.fallback_position}`,
      `Unacceptable Triggers: ${tpl.unacceptable_triggers}`,
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(formatted);
      }
    } catch {
      // Fallback in restricted environments
    }
    setCopiedTemplateId(tpl.id);
    setTimeout(() => {
      setCopiedTemplateId((prev) => (prev === tpl.id ? null : prev));
    }, 2000);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  };

  return (
    <div
      data-testid="help-center-page"
      className="flex min-h-screen flex-col bg-slate-950 text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-6 py-8">
        {/* Hero Banner & Search Bar */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/30 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <span>📖</span> Interactive User Guide & LegalTech Manual
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                How to Master the Contract & RFP Redlining Studio
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Everything legal counsel, contract managers, procurement leads,
                and technical reviewers need to upload agreements, craft
                high-impact Company Playbooks, review surgical AI redlines, and
                export native Microsoft Word Track Changes documents.
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/"
                data-testid="help-cta-dashboard"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500"
              >
                Go to Upload Dashboard →
              </Link>
              <Link
                href="/playbooks"
                data-testid="help-cta-playbooks"
                className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
              >
                Manage Company Playbook
              </Link>
              <Link
                href="/documents/demo"
                data-testid="help-cta-sample-studio"
                className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-900/50"
              >
                Launch Sample Studio
              </Link>
            </div>
          </div>

          {/* Instant Search Input */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                data-testid="help-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide topics, Playbook templates, heatmap colors, Track Changes, or 409 conflicts..."
                aria-label="Search Help Center"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  data-testid="clear-help-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* Main Two-Column Layout: Module Filter Sidebar + Guide Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Navigation Sidebar */}
          <aside className="space-y-4 lg:col-span-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Guide Modules
              </h2>
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  data-testid="filter-module-ALL"
                  onClick={() => setSelectedModuleId("ALL")}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    selectedModuleId === "ALL"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>All 6 Core Modules</span>
                  <span className="rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px]">
                    {HELP_GUIDE_MODULES.length}
                  </span>
                </button>

                {HELP_GUIDE_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    data-testid={`filter-module-${mod.id}`}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      selectedModuleId === mod.id
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-75">
                      0{mod.number}.
                    </span>
                    <span className="line-clamp-1">{mod.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Pro-Tip Card */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                💡 Reviewer Pro-Tip
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Inside the Redlining Studio, click the{" "}
                <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-indigo-300">
                  ? Help Guide
                </span>{" "}
                button in the top header at any time to open a compact reference
                drawer without losing your active clause focus.
              </p>
            </div>
          </aside>

          {/* Right Main Guide Column */}
          <div className="space-y-8 lg:col-span-9">
            {/* 6 Core Guide Modules */}
            <section
              aria-label="Core User Guide Modules"
              data-testid="help-modules-list"
              className="space-y-5"
            >
              {filteredModules.length === 0 ? (
                <div
                  data-testid="help-no-modules-match"
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400"
                >
                  No user guide modules matched &ldquo;{searchQuery}&rdquo;. Try
                  clearing the search filter.
                </div>
              ) : (
                filteredModules.map((mod) => (
                  <article
                    key={mod.id}
                    data-testid={`help-module-card-${mod.id}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 font-mono text-xs font-bold text-indigo-300 border border-indigo-500/30">
                          0{mod.number}
                        </span>
                        <h2 className="text-base font-bold text-white md:text-lg">
                          {mod.title}
                        </h2>
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-0.5 text-[11px] font-semibold text-slate-300">
                        {mod.badge}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {mod.summary}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {mod.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4"
                        >
                          <h3 className="text-xs font-bold text-slate-100">
                            {step.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                            {step.description}
                          </p>
                          {step.tip ? (
                            <p className="mt-2 rounded border border-indigo-500/20 bg-indigo-950/30 px-2.5 py-1.5 text-[11px] text-indigo-200">
                              <strong>Tip:</strong> {step.tip}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </section>

            {/* Visual Reference: Risk Heatmap Legend & Live Inline Diff Demo */}
            <section
              data-testid="help-heatmap-legend"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-lg font-bold text-white">
                Visual Guide: Risk Heatmap Gutter & Surgical Inline Diffs
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Understand what each color in the left-hand Risk Heatmap Gutter
                represents and how word-level redlines are previewed.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {RISK_HEATMAP_LEGEND.map((item) => (
                  <div
                    key={item.level}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-2.5 rounded-sm border ${item.dotClass}`}
                        />
                        <span className="text-xs font-bold text-white">
                          {item.colorName}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.badgeClass}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {item.meaning}
                    </p>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      <strong className="text-slate-200">Action:</strong>{" "}
                      {item.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive Inline Diff Visual Demo */}
              <div
                data-testid="help-inline-diff-demo"
                className="mt-5 rounded-lg border border-indigo-500/30 bg-slate-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Live Inline Word-Diff Preview Example (When Hovering
                    &ldquo;Apply Redline&rdquo;)
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Clause #1 · Limitation of Liability
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Total aggregate liability shall not exceed{" "}
                  <span className="rounded bg-rose-500/25 px-1.5 py-0.5 text-rose-200 line-through decoration-rose-400">
                    five hundred dollars ($500)
                  </span>{" "}
                  <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-medium text-emerald-200 underline decoration-emerald-400">
                    twelve (12) months of fees paid immediately preceding the
                    claim
                  </span>
                  , and neither party shall be liable for{" "}
                  <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-medium text-emerald-200 underline decoration-emerald-400">
                    indirect, special, or
                  </span>{" "}
                  consequential damages.
                </p>
              </div>
            </section>

            {/* Copyable Playbook Rule Templates */}
            <section
              data-testid="help-playbook-templates"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Copyable Company Playbook Rule Templates
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Use these battle-tested corporate policy templates when
                    adding rules in the{" "}
                    <Link
                      href="/playbooks"
                      className="font-semibold text-indigo-400 underline hover:text-indigo-300"
                    >
                      Playbook Manager (/playbooks)
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    data-testid={`playbook-template-${tpl.id}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                          {tpl.category}
                        </span>
                        <h3 className="mt-1.5 text-sm font-bold text-white">
                          {tpl.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        data-testid={`copy-template-btn-${tpl.id}`}
                        onClick={() => void handleCopyTemplate(tpl)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        {copiedTemplateId === tpl.id
                          ? "✓ Copied to Clipboard"
                          : "Copy Template"}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                      <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="font-semibold text-emerald-300">
                          Standard Position:
                        </span>
                        <p className="mt-1 text-slate-300">
                          {tpl.standard_position}
                        </p>
                      </div>
                      <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="font-semibold text-amber-300">
                          Fallback Position:
                        </span>
                        <p className="mt-1 text-slate-300">
                          {tpl.fallback_position}
                        </p>
                      </div>
                      <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="font-semibold text-rose-300">
                          Unacceptable Triggers:
                        </span>
                        <p className="mt-1 font-mono text-[11px] text-rose-200">
                          {tpl.unacceptable_triggers}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      <strong>Why it works:</strong> {tpl.why_it_works}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Export Mode Comparison Table */}
            <section
              data-testid="help-export-comparison-table"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-lg font-bold text-white">
                Word Export Modes: Track Changes (.docx) vs. Clean (.docx)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Choose the right Microsoft Word export mode at the end of your
                review cycle.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Capability / Dimension</th>
                      <th className="py-3 px-4 text-teal-300">
                        Export Track Changes (.docx)
                      </th>
                      <th className="py-3 px-4 text-slate-200">
                        Export Clean (.docx)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {EXPORT_MODE_COMPARISON.map((row) => (
                      <tr key={row.feature} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {row.feature}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {row.trackChanges}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {row.cleanCopy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Frequently Asked Questions (FAQ Accordion) */}
            <section
              data-testid="help-faq-section"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-lg font-bold text-white">
                Frequently Asked Questions (FAQ)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Quick answers to common questions about offline mode, playbook
                indexing, concurrency locks, and Word compatibility.
              </p>

              <div className="mt-4 space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No FAQ items matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = Boolean(expandedFaqIds[faq.id]);
                    return (
                      <div
                        key={faq.id}
                        data-testid={`faq-item-${faq.id}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/60"
                      >
                        <button
                          type="button"
                          data-testid={`faq-toggle-${faq.id}`}
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-slate-100 hover:text-white"
                        >
                          <span>{faq.question}</span>
                          <span className="ml-2 text-slate-400">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-slate-800/80 px-4 py-3 text-xs leading-relaxed text-slate-300">
                            {faq.answer}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

