"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { useAuthSession } from "@/services/authSession";
import {
  createPlaybookRule,
  extractPlaybookFromFile,
  extractPlaybookFromText,
} from "@/services/apiClient";
import {
  ExtractedPlaybookRuleCandidateDTO,
  ExtractPlaybookResponseDTO,
  PlaybookRuleDTO,
} from "@/services/contracts";

const SAMPLE_GOLDEN_CONTRACT_TEXT = `1. Limitation of Liability. Except for confidentiality and IP indemnification breaches, neither party's aggregate cumulative liability shall exceed the total fees paid by Customer in the twelve (12) months immediately preceding the claim, and neither party shall be liable for indirect, special, or consequential damages.

2. Data Privacy & AI Safeguards. Vendor shall maintain strict GDPR and CCPA data processing safeguards, shall never use Customer Data or Customer Confidential Information to train public or third-party AI foundation models, and shall notify Customer within 24 hours of any confirmed security breach.

3. Service Level Agreement (SLA). Vendor guarantees a minimum 99.9% monthly production uptime availability excluding scheduled maintenance, backed by tiered monthly service credits up to 25% and termination rights for chronic SLA misses.

4. Term and Termination Notice. Either party may terminate for material breach only after providing at least 30 days prior written notice specifying the breach with a full 30-day opportunity to cure, and Vendor shall refund any prepaid unused subscription fees on a pro-rata basis.`;

interface AIPlaybookExtractorPanelProps {
  onRulesSaved: (savedRules: PlaybookRuleDTO[]) => void;
}

export function AIPlaybookExtractorPanel({
  onRulesSaved,
}: AIPlaybookExtractorPanelProps) {
  const { session, token } = useAuthSession();
  const isViewer = session?.userRole === "VIEWER";

  const [mode, setMode] = useState<"text" | "file">("text");
  const [referenceText, setReferenceText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [maxRules, setMaxRules] = useState(6);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractPlaybookResponseDTO | null>(null);
  const [savingCandidateIdx, setSavingCandidateIdx] = useState<number | null>(
    null
  );
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

  const handleLoadSample = () => {
    setMode("text");
    setReferenceText(SAMPLE_GOLDEN_CONTRACT_TEXT);
    setErrorMsg(null);
  };

  const handleRunExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    setSavedIndices(new Set());

    if (mode === "text" && referenceText.trim().length < 20) {
      setErrorMsg(
        "Please paste at least 20 characters of golden contract text or load the sample MSA."
      );
      return;
    }
    if (mode === "file" && !selectedFile) {
      setErrorMsg("Please select a .docx or .pdf golden contract file.");
      return;
    }

    setIsExtracting(true);
    try {
      const response =
        mode === "text"
          ? await extractPlaybookFromText(
              {
                reference_text: referenceText.trim(),
                max_rules: maxRules,
                auto_save: autoSave,
              },
              token ?? undefined
            )
          : await extractPlaybookFromFile(
              selectedFile as File,
              {
                auto_save: autoSave,
                max_rules: maxRules,
              },
              token ?? undefined
            );

      setResult(response);
      if (response.auto_saved && response.saved_rules.length > 0) {
        onRulesSaved(response.saved_rules);
        setSavedIndices(
          new Set(response.candidates.map((_, idx) => idx))
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to extract Playbook rules from golden contract."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveSingleCandidate = async (
    candidate: ExtractedPlaybookRuleCandidateDTO,
    idx: number
  ) => {
    setErrorMsg(null);
    setSavingCandidateIdx(idx);
    try {
      const created = await createPlaybookRule(
        {
          category: candidate.category,
          standard_position: candidate.standard_position,
          fallback_position: candidate.fallback_position,
          unacceptable_triggers: candidate.unacceptable_triggers.join(", "),
        },
        token ?? undefined
      );
      onRulesSaved([created]);
      setSavedIndices((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save extracted rule."
      );
    } finally {
      setSavingCandidateIdx(null);
    }
  };

  return (
    <section
      data-testid="ai-playbook-extractor-panel"
      className="surface-card rounded-2xl border-indigo-200/80 bg-gradient-to-br from-indigo-50/55 via-white to-violet-50/35 p-6 dark:border-indigo-500/25 dark:from-indigo-950/25 dark:via-[#0D1322] dark:to-violet-950/20"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-indigo-100/90 pb-4 dark:border-indigo-500/20 sm:flex-row sm:items-center">
        <div>
          <div className="micro-badge border-indigo-200/90 bg-white/95 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Feature #6 — Golden Contract Auto-Extractor</span>
          </div>
          <h2 className="mt-2.5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Generate Playbook Rules from a Golden Contract
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Paste approved MSA clauses or upload a signed{" "}
            <code className="font-mono">.docx</code>/
            <code className="font-mono">.pdf</code> template. The AI distills
            standard positions, fallback boundaries, and counterparty red-flag
            triggers, then automatically embeds and indexes them.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex shrink-0 rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            data-testid="extractor-mode-text"
            onClick={() => {
              setMode("text");
              setErrorMsg(null);
            }}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
              mode === "text"
                ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-inset ring-white/20"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Paste Clauses</span>
          </button>
          <button
            type="button"
            data-testid="extractor-mode-file"
            onClick={() => {
              setMode("file");
              setErrorMsg(null);
            }}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${
              mode === "file"
                ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm ring-1 ring-inset ring-white/20"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>Upload DOCX/PDF</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleRunExtraction} className="mt-5 space-y-4">
        {mode === "text" ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="extractor-reference-textarea"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Golden Contract Clauses / Reference Policy Text
              </label>
              <button
                type="button"
                data-testid="extractor-load-sample-btn"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
              >
                <Sparkles className="h-3 w-3" />
                <span>Load Sample Golden MSA</span>
              </button>
            </div>
            <textarea
              id="extractor-reference-textarea"
              data-testid="extractor-reference-textarea"
              rows={5}
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Paste numbered clauses from your signed Golden MSA, DPA, or SLA template..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-300 bg-white/80 p-5 text-center dark:border-indigo-500/40 dark:bg-slate-950/60">
            <Upload className="mx-auto h-6 w-6 text-indigo-500" />
            <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200">
              Select a signed Golden Contract or Template (.docx or .pdf)
            </p>
            <input
              type="file"
              accept=".docx,.pdf,.txt"
              data-testid="extractor-file-input"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="mt-3 block w-full cursor-pointer text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-300 dark:file:bg-indigo-950/60 dark:file:text-indigo-300"
            />
            {selectedFile ? (
              <p className="mt-2 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                Ready to parse: {selectedFile.name} (
                {Math.max(1, Math.round(selectedFile.size / 1024))} KB)
              </p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                data-testid="extractor-auto-save-checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-save &amp; generate 1536-d vector embeddings</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Max Rules:</span>
              <select
                value={maxRules}
                onChange={(e) => setMaxRules(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isExtracting || isViewer}
            data-testid="run-playbook-extractor-btn"
            title={
              isViewer
                ? "Viewer role cannot run Playbook Auto-Extractor"
                : undefined
            }
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extracting Playbook Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Auto-Extract Playbook Rules</span>
              </>
            )}
          </button>
        </div>
      </form>

      {errorMsg ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {errorMsg}
        </div>
      ) : null}

      {result ? (
        <div
          data-testid="extracted-rules-results"
          className="mt-6 space-y-4 border-t border-indigo-100 pt-5 dark:border-indigo-500/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Extracted {result.extracted_count} Playbook{" "}
                {result.extracted_count === 1 ? "Rule" : "Rules"} in{" "}
                {Math.round(result.latency_ms)} ms
              </span>
              {result.auto_saved ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  Auto-Saved &amp; Indexed
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                  Preview Mode
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.candidates.map((candidate, idx) => {
              const isSaved = savedIndices.has(idx);
              return (
                <div
                  key={`${candidate.category}-${idx}`}
                  data-testid={`extracted-candidate-card-${idx}`}
                  className="surface-card flex flex-col justify-between space-y-3 rounded-xl p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <ShieldCheck className="h-3 w-3" />
                        <span>{candidate.category}</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {candidate.confidence_score}% confidence
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Standard Position
                      </span>
                      <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                        {candidate.standard_position}
                      </p>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        Fallback Position
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {candidate.fallback_position}
                      </p>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {candidate.unacceptable_triggers.map((trigger, tIdx) => (
                        <span
                          key={tIdx}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300"
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2.5 border-l-2 border-indigo-200 pl-2.5 text-[11px] italic text-slate-500 dark:border-indigo-500/30 dark:text-slate-400">
                      &ldquo;{candidate.source_clause_excerpt}&rdquo;
                    </p>
                  </div>

                  {!result.auto_saved ? (
                    <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isSaved || savingCandidateIdx === idx}
                        data-testid={`save-extracted-candidate-btn-${idx}`}
                        onClick={() =>
                          void handleSaveSingleCandidate(candidate, idx)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Saved to Playbook</span>
                          </>
                        ) : savingCandidateIdx === idx ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Save Rule</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

