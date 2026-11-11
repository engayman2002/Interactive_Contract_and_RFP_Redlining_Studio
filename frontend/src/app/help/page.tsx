"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Search,
  Sparkles,
} from "lucide-react";
import { InteractiveTutorialWizard } from "@/components/help/InteractiveTutorialWizard";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import {
  getLocalizedHelpContent,
  getModuleLearningTrack,
  type LearningTrackId,
  type PlaybookRuleTemplate,
} from "@/services/helpContent";
import { useI18n } from "@/i18n/useI18n";

const INLINE_DIFF_DEMO_COPY = {
  en: {
    heading: 'Live Inline Word-Diff Preview Example (When Hovering "Apply Redline")',
    clauseBadge: "Clause #1 · Limitation of Liability",
    prefix: "Total aggregate liability shall not exceed ",
    deleted: "five hundred dollars ($500)",
    inserted1: "twelve (12) months of fees paid immediately preceding the claim",
    middle: ", and neither party shall be liable for ",
    inserted2: "indirect, special, or",
    suffix: " consequential damages.",
  },
  es: {
    heading: 'Ejemplo de Previsualización Palabra por Palabra (Al Pasar Sobre "Aplicar Cambio")',
    clauseBadge: "Cláusula #1 · Limitación de Responsabilidad",
    prefix: "La responsabilidad agregada total no excederá de ",
    deleted: "quinientos dólares ($500)",
    inserted1: "doce (12) meses de tarifas pagadas inmediatamente anteriores a la reclamación",
    middle: ", y ninguna parte responderá por daños ",
    inserted2: "indirectos, especiales o",
    suffix: " consecuentes.",
  },
  fr: {
    heading: 'Exemple d\'Aperçu Mot à Mot en Ligne (Au Survol de « Appliquer »)',
    clauseBadge: "Clause #1 · Limitation de Responsabilité",
    prefix: "La responsabilité cumulée totale n'excédera pas ",
    deleted: "cinq cents dollars (500 $)",
    inserted1: "douze (12) mois de redevances versées précédant immédiatement la réclamation",
    middle: ", et aucune partie ne répondra des dommages ",
    inserted2: "indirects, spéciaux ou",
    suffix: " consécutifs.",
  },
} as const;

export default function HelpCenterPage() {
  const { t, locale } = useI18n();
  const helpContent = useMemo(() => getLocalizedHelpContent(locale), [locale]);
  const diffDemo = INLINE_DIFF_DEMO_COPY[locale];
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<"ALL" | LearningTrackId>(
    "ALL"
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    "faq-offline-demo": true,
    "faq-inline-diff": true,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const trackModules = useMemo(() => {
    if (selectedTrack === "ALL") {
      return helpContent.modules;
    }
    return helpContent.modules.filter(
      (mod) => getModuleLearningTrack(mod.id) === selectedTrack
    );
  }, [helpContent.modules, selectedTrack]);

  const filteredModules = useMemo(() => {
    return trackModules.filter((mod) => {
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
  }, [normalizedQuery, selectedModuleId, trackModules]);

  const filteredTemplates = useMemo(() => {
    if (!normalizedQuery) {
      return helpContent.templates;
    }
    return helpContent.templates.filter((tpl) => {
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
  }, [helpContent.templates, normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return helpContent.faqs;
    }
    return helpContent.faqs.filter((faq) => {
      const haystack = [faq.question, faq.answer, ...faq.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [helpContent.faqs, normalizedQuery]);

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
      className="bg-enterprise-canvas flex min-h-screen flex-col text-slate-900 dark:text-slate-100"
    >
      <TopNavBar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-6 py-8">
        {/* Executive Hero Banner & Search Bar */}
        <section className="surface-card rounded-2xl p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="micro-badge border-indigo-200/90 bg-indigo-50/90 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{t.help.eyebrow}</span>
              </span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {t.help.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {t.help.subtitle}
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                data-testid="help-cta-dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600"
              >
                <span>{t.help.ctaDashboard}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/playbooks"
                data-testid="help-cta-playbooks"
                className="inline-flex h-9 items-center rounded-xl border border-slate-200/90 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t.help.ctaPlaybooks}
              </Link>
              <Link
                href="/documents/demo"
                data-testid="help-cta-sample-studio"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.help.ctaSampleStudio}</span>
              </Link>
            </div>
          </div>

          {/* Instant Search Input */}
          <div className="mt-6">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                data-testid="help-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.help.searchPlaceholder}
                aria-label="Search Help Center"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-3 pl-10 pr-20 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-100 dark:placeholder-slate-500"
              />
              {searchQuery ? (
                <button
                  type="button"
                  data-testid="clear-help-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                >
                  {t.help.clearBtn}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* Hero Section: Interactive 5-Stage Masterclass Tutorial Wizard */}
        <InteractiveTutorialWizard />

        {/* Categorized Learning Tracks Filter Bar */}
        <section
          data-testid="help-learning-tracks"
          aria-label="Reference Guide Learning Tracks"
          className="surface-card rounded-2xl p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.help.tracksTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.help.tracksSubtitle}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {t.help.tracks.map((track) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  data-testid={track.testId}
                  onClick={() => {
                    setSelectedTrack(track.id);
                    setSelectedModuleId("ALL");
                  }}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200/80 bg-slate-50/70 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-indigo-500/40"
                  }`}
                >
                  <span className="text-xs font-semibold">{track.label}</span>
                  <span
                    className={`mt-1 text-[10px] leading-snug ${
                      isSelected
                        ? "text-indigo-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {track.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Two-Column Layout: Module Filter Sidebar + Guide Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Navigation Sidebar */}
          <aside className="space-y-4 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <h2 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.help.guideModulesHeading}
              </h2>
              <div className="mt-3 flex flex-col gap-1">
                <button
                  type="button"
                  data-testid="filter-module-ALL"
                  onClick={() => setSelectedModuleId("ALL")}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                    selectedModuleId === "ALL"
                      ? "bg-indigo-600 font-semibold text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{t.help.allTrackModules}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                      selectedModuleId === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {trackModules.length}
                  </span>
                </button>

                {trackModules.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    data-testid={`filter-module-${mod.id}`}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                      selectedModuleId === mod.id
                        ? "bg-indigo-600 font-semibold text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-75">
                      {mod.number < 10 ? `0${mod.number}` : mod.number}.
                    </span>
                    <span className="line-clamp-1">{mod.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Pro-Tip Card */}
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-500/25 dark:bg-indigo-950/20">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {t.help.proTipHeading}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {t.help.proTipBodyPrefix}{" "}
                <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300">
                  {t.help.helpGuidePill}
                </span>{" "}
                {t.help.proTipBodySuffix}
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
                  className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  {t.help.noModulesMatchPrefix} &ldquo;{searchQuery}&rdquo;.{" "}
                  {t.help.noModulesMatchSuffix}
                </div>
              ) : (
                filteredModules.map((mod) => (
                  <article
                    key={mod.id}
                    data-testid={`help-module-card-${mod.id}`}
                    className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 font-mono text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                          {mod.number < 10 ? `0${mod.number}` : mod.number}
                        </span>
                        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white md:text-lg">
                          {mod.title}
                        </h2>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {mod.badge}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {mod.summary}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {mod.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/90 dark:bg-slate-950/60"
                        >
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {step.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {step.description}
                          </p>
                          {step.tip ? (
                            <p className="mt-2.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1.5 text-[11px] text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-200">
                              <strong>{t.help.tipPrefix}</strong> {step.tip}
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
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
            >
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.help.heatmapTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.help.heatmapSubtitle}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {helpContent.heatmapLegend.map((item) => (
                  <div
                    key={item.level}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-2 rounded-full border ${item.dotClass}`}
                        />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.colorName}
                        </span>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${item.badgeClass}`}
                      >
                        {item.localizedLevel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.meaning}
                    </p>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">
                        {t.help.actionPrefix}
                      </strong>{" "}
                      {item.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive Inline Diff Visual Demo */}
              <div
                data-testid="help-inline-diff-demo"
                className="mt-5 rounded-xl border border-emerald-200/90 bg-emerald-50/35 p-5 dark:border-emerald-500/25 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {diffDemo.heading}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {diffDemo.clauseBadge}
                  </span>
                </div>
                <p className="legal-document-prose mt-3 text-slate-800 dark:text-slate-200">
                  {diffDemo.prefix}
                  <span className="rounded bg-rose-100/90 px-1.5 py-0.5 text-rose-800 line-through decoration-rose-500 dark:bg-rose-500/25 dark:text-rose-200 dark:decoration-rose-400">
                    {diffDemo.deleted}
                  </span>{" "}
                  <span className="rounded bg-emerald-100/90 px-1.5 py-0.5 font-medium text-emerald-900 underline decoration-emerald-500 dark:bg-emerald-500/25 dark:text-emerald-200 dark:decoration-emerald-400">
                    {diffDemo.inserted1}
                  </span>
                  {diffDemo.middle}
                  <span className="rounded bg-emerald-100/90 px-1.5 py-0.5 font-medium text-emerald-900 underline decoration-emerald-500 dark:bg-emerald-500/25 dark:text-emerald-200 dark:decoration-emerald-400">
                    {diffDemo.inserted2}
                  </span>
                  {diffDemo.suffix}
                </p>
              </div>
            </section>

            {/* Copyable Playbook Rule Templates */}
            <section
              data-testid="help-playbook-templates"
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {t.help.templatesTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.help.templatesSubtitle}{" "}
                  <Link
                    href="/playbooks"
                    className="font-semibold text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {t.help.ctaPlaybooks}
                  </Link>
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    data-testid={`playbook-template-${tpl.id}`}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                          {tpl.category}
                        </span>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {tpl.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        data-testid={`copy-template-btn-${tpl.id}`}
                        onClick={() => void handleCopyTemplate(tpl)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {copiedTemplateId === tpl.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.help.copiedTemplateBtn}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t.help.copyTemplateBtn}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                      <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/60">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {t.help.standardPosLabel}
                        </span>
                        <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                          {tpl.standard_position}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/60">
                        <span className="font-semibold text-amber-800 dark:text-amber-300">
                          {t.help.fallbackPosLabel}
                        </span>
                        <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                          {tpl.fallback_position}
                        </p>
                      </div>
                      <div className="rounded-lg border border-rose-200/70 bg-rose-50/40 p-3 dark:border-slate-800/80 dark:bg-slate-900/60">
                        <span className="font-semibold text-rose-700 dark:text-rose-300">
                          {t.help.triggersLabel}
                        </span>
                        <p className="mt-1 font-mono text-[11px] text-rose-800 dark:text-rose-200">
                          {tpl.unacceptable_triggers}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">
                        {t.help.whyItWorksLabel}
                      </strong>{" "}
                      {tpl.why_it_works}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Export Mode Comparison Table */}
            <section
              data-testid="help-export-comparison-table"
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {t.help.exportTableTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.help.exportTableSubtitle}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <th className="px-6 py-3.5">{t.help.colCapability}</th>
                      <th className="px-6 py-3.5 text-indigo-700 dark:text-indigo-300">
                        {t.help.colTrackChanges}
                      </th>
                      <th className="px-6 py-3.5 text-emerald-700 dark:text-emerald-300">
                        {t.help.colClean}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
                    {helpContent.exportComparison.map((row) => (
                      <tr
                        key={row.feature}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-slate-200">
                          {row.feature}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                          {row.trackChanges}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
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
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
            >
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.help.faqTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.help.faqSubtitle}
              </p>

              <div className="mt-4 space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.help.noFaqMatchPrefix} &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = Boolean(expandedFaqIds[faq.id]);
                    return (
                      <div
                        key={faq.id}
                        data-testid={`faq-item-${faq.id}`}
                        className="rounded-xl border border-slate-200/90 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/60"
                      >
                        <button
                          type="button"
                          data-testid={`faq-toggle-${faq.id}`}
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-white"
                        >
                          <span>{faq.question}</span>
                          <span className="ml-2 font-mono text-sm text-slate-400">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-slate-200/70 px-4 py-3.5 text-xs leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
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
