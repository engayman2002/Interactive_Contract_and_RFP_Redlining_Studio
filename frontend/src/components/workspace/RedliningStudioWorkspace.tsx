"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Cpu,
  Download,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { ContractEditorCanvas } from "@/components/editor/ContractEditorCanvas";
import { AiInspectorPanel } from "@/components/inspector/AiInspectorPanel";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { useI18n } from "@/i18n/useI18n";
import {
  localizeDemoDocumentTitle,
  localizeDocumentStatus,
} from "@/i18n/domainLocalization";
import { useDocumentStream } from "@/hooks/useDocumentStream";
import {
  DEMO_WORKSPACE_DATA,
  fetchAISettings,
  fetchDocumentWorkspace,
  triggerDocumentAnalysis,
} from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import type { DocumentWorkspaceDTO, ExportMode } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { AISettingsModal, formatActiveAIBadge } from "./AISettingsModal";
import { QuickHelpModal } from "./QuickHelpModal";
import { UploadModal } from "./UploadModal";

export interface RedliningStudioWorkspaceProps {
  documentId?: string;
  initialWorkspace?: DocumentWorkspaceDTO;
  token?: string;
}

export const RedliningStudioWorkspace: React.FC<
  RedliningStudioWorkspaceProps
> = ({ documentId, initialWorkspace = DEMO_WORKSPACE_DATA, token }) => {
  const { t, locale } = useI18n();
  const clauses = useWorkspaceStore((state) => state.clauses);
  const redlines = useWorkspaceStore((state) => state.redlines);
  const comments = useWorkspaceStore((state) => state.comments);
  const auditLogs = useWorkspaceStore((state) => state.auditLogs);
  const documentVersion = useWorkspaceStore((state) => state.documentVersion);
  const conflictError = useWorkspaceStore((state) => state.conflictError);
  const isExporting = useWorkspaceStore((state) => state.isExporting);
  const lastExportedFilename = useWorkspaceStore(
    (state) => state.lastExportedFilename
  );
  const splitRatio = useWorkspaceStore((state) => state.splitRatio);
  const setSplitRatio = useWorkspaceStore((state) => state.setSplitRatio);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrateWorkspace);
  const dismissConflictError = useWorkspaceStore(
    (state) => state.dismissConflictError
  );
  const acceptSuggestion = useWorkspaceStore((state) => state.acceptSuggestion);
  const modifySuggestion = useWorkspaceStore((state) => state.modifySuggestion);
  const rejectSuggestion = useWorkspaceStore((state) => state.rejectSuggestion);
  const addClauseComment = useWorkspaceStore((state) => state.addClauseComment);
  const exportDocument = useWorkspaceStore((state) => state.exportDocument);
  const activeLLMProvider = useWorkspaceStore(
    (state) => state.activeLLMProvider
  );
  const activeLLMModel = useWorkspaceStore((state) => state.activeLLMModel);
  const setActiveAIEngine = useWorkspaceStore(
    (state) => state.setActiveAIEngine
  );
  const negotiationStance = useWorkspaceStore(
    (state) => state.negotiationStance
  );
  const setNegotiationStance = useWorkspaceStore(
    (state) => state.setNegotiationStance
  );
  const { session } = useAuthSession();
  const effectiveToken = token ?? session.token ?? undefined;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const resolvedDocId = documentId ?? initialWorkspace.document_id;

  const [currentTitle, setCurrentTitle] = useState<string>(
    initialWorkspace.title
  );
  const [currentStatus, setCurrentStatus] = useState<string>(
    initialWorkspace.status
  );
  const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isQuickHelpOpen, setIsQuickHelpOpen] = useState<boolean>(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!effectiveToken) {
      return;
    }
    void fetchAISettings(effectiveToken).then((settings) => {
      setActiveAIEngine({
        llmProvider: settings.llm_provider,
        llmModel: settings.llm_model_name,
        embeddingProvider: settings.embedding_provider,
        embeddingModel: settings.embedding_model_name,
      });
    });
  }, [effectiveToken, setActiveAIEngine]);

  // Load document workspace if a specific documentId is provided
  useEffect(() => {
    let isMounted = true;

    if (
      documentId &&
      documentId !== DEMO_WORKSPACE_DATA.document_id &&
      documentId !== "demo"
    ) {
      void fetchDocumentWorkspace(documentId, token).then((data) => {
        if (isMounted) {
          hydrateWorkspace(data);
          setCurrentTitle(data.title);
          setCurrentStatus(data.status);
        }
      });
    } else {
      hydrateWorkspace(initialWorkspace);
      setCurrentTitle(initialWorkspace.title);
      setCurrentStatus(initialWorkspace.status);
    }

    return () => {
      isMounted = false;
    };
  }, [documentId, initialWorkspace, hydrateWorkspace, token]);

  const handleStreamComplete = useCallback(async () => {
    const updated = await fetchDocumentWorkspace(resolvedDocId, token);
    hydrateWorkspace(updated);
    setCurrentTitle(updated.title);
    setCurrentStatus("ANALYZED");
    void useWorkspaceStore.getState().refreshAITelemetry(token);
  }, [resolvedDocId, token, hydrateWorkspace]);

  const { startStream, streamProgress } = useDocumentStream({
    documentId: resolvedDocId,
    totalClauses: clauses.length,
    token,
    stance: negotiationStance,
    onStreamComplete: handleStreamComplete,
  });

  const handleTriggerAiAnalysis = useCallback(async () => {
    await triggerDocumentAnalysis(resolvedDocId, token, negotiationStance);
    await startStream();
  }, [resolvedDocId, token, negotiationStance, startStream]);

  const handleAcceptSuggestion = useCallback(
    async (suggestionId: string) => {
      await acceptSuggestion(suggestionId, token);
    },
    [acceptSuggestion, token]
  );

  const handleModifySuggestion = useCallback(
    async (suggestionId: string, modifiedText: string) => {
      await modifySuggestion(suggestionId, modifiedText, token);
    },
    [modifySuggestion, token]
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionId: string) => {
      await rejectSuggestion(suggestionId, token);
    },
    [rejectSuggestion, token]
  );

  const handleAddComment = useCallback(
    async (clauseId: string, body: string) => {
      await addClauseComment(clauseId, body, token);
    },
    [addClauseComment, token]
  );

  const handleExport = useCallback(
    async (mode: ExportMode) => {
      await exportDocument(resolvedDocId, mode, token);
    },
    [exportDocument, resolvedDocId, token]
  );

  const handleDividerMouseDown = useCallback(() => {
    isDraggingRef.current = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const nextRatio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(nextRatio);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [setSplitRatio]);

  const hasClauses = clauses.length > 0;
  const isAnalyzedStage = currentStatus === "ANALYZED" || redlines.length > 0;
  const hasResolvedRedlines = redlines.some((r) => r.status !== "PENDING");
  const hasExportedStage = Boolean(lastExportedFilename);

  return (
    <div
      data-testid="redlining-studio-workspace"
      className="bg-enterprise-canvas flex h-screen w-screen flex-col overflow-hidden text-slate-900 dark:text-slate-100"
    >
      {/* Tier 1: Primary Studio Header — Maximum 3 Clean Clusters Fitting Within 1280px */}
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#070B14]/95">
        {/* Left Cluster: Back + Title + Single Status Pill (flex-1 min-w-0 ensures title truncates instead of pushing Right Cluster off-screen) */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/"
            data-testid="back-to-dashboard-btn"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>{t.studio.backToDashboard}</span>
          </Link>

          <div
            className="h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />

          <h1 className="min-w-0 max-w-[320px] truncate whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {localizeDemoDocumentTitle(currentTitle, locale)}
          </h1>

          <span
            className={`micro-badge shrink-0 whitespace-nowrap font-mono ${
              currentStatus === "ANALYZED"
                ? "border-emerald-200/90 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-sky-200/90 bg-sky-50/80 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300"
            }`}
          >
            <span
              className={`micro-badge-dot ${
                currentStatus === "ANALYZED" ? "bg-emerald-500" : "bg-sky-500"
              }`}
              aria-hidden="true"
            />
            <span>
              v{documentVersion} • {localizeDocumentStatus(currentStatus, locale)}
            </span>
          </span>
        </div>

        {/* Center Cluster: AI Control Pod */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/85 p-1 dark:border-slate-800 dark:bg-slate-900/90">
          <div
            data-testid="negotiation-stance-selector"
            className="inline-flex h-7 shrink-0 items-center rounded-lg border border-slate-200/80 bg-white p-0.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
            role="group"
            aria-label="AI Negotiation Stance"
          >
            <button
              type="button"
              data-testid="stance-option-strict"
              onClick={() => setNegotiationStance("strict")}
              className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium transition-all ${
                negotiationStance === "strict"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
              title={t.studio.stanceStrictTitle}
            >
              {t.studio.stanceStrict}
            </button>
            <button
              type="button"
              data-testid="stance-option-balanced"
              onClick={() => setNegotiationStance("balanced")}
              className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium transition-all ${
                negotiationStance === "balanced"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
              title={t.studio.stanceBalancedTitle}
            >
              {t.studio.stanceBalanced}
            </button>
            <button
              type="button"
              data-testid="stance-option-commercial"
              onClick={() => setNegotiationStance("commercial")}
              className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-xs font-medium transition-all ${
                negotiationStance === "commercial"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
              title={t.studio.stanceCommercialTitle}
            >
              {t.studio.stanceCommercial}
            </button>
          </div>

          <button
            type="button"
            data-testid="trigger-sse-audit-btn"
            onClick={handleTriggerAiAnalysis}
            disabled={streamProgress.isStreaming}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(79,70,229,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {streamProgress.isStreaming
                ? t.studio.auditing
                : t.studio.analyzeContract}
            </span>
          </button>

          <button
            type="button"
            data-testid="open-ai-settings-btn"
            onClick={() => setIsAISettingsOpen(true)}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200/80 bg-white px-2.5 font-mono text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[140px] truncate">
              {formatActiveAIBadge(activeLLMProvider, activeLLMModel)}
            </span>
          </button>
        </div>

        {/* Right Cluster: Primary File Actions + Theme Toggle */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            data-testid="studio-upload-new-btn"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.studio.upload}</span>
          </button>

          <button
            type="button"
            data-testid="export-track-changes-btn"
            aria-label="Export Track Changes (.docx)"
            onClick={() => void handleExport("track_changes")}
            disabled={isExporting}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-300/80 bg-emerald-50/75 px-2.5 text-xs font-semibold text-emerald-800 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-100/75 disabled:opacity-50 dark:border-emerald-500/35 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-900/45"
          >
            <Download className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{t.studio.trackChangesBtn}</span>
          </button>

          <button
            type="button"
            data-testid="export-clean-btn"
            aria-label="Export Clean (.docx)"
            onClick={() => void handleExport("clean")}
            disabled={isExporting}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>{t.studio.cleanBtn}</span>
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Tier 2: Secondary Sub-Header (Always Accessible Workflow Progress + Language Switcher + Playbooks / Tutorial / Help) */}
      <div
        data-testid="studio-quick-guide-banner"
        className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-slate-50/95 px-4 text-[11px] text-slate-600 dark:border-slate-800/70 dark:bg-[#080C16] dark:text-slate-400"
      >
        {/* Left side: 4-step progress strip (dismissible without hiding utilities) */}
        {!isGuideDismissed ? (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto whitespace-nowrap">
            {[
              {
                num: 1,
                label: t.studio.step1,
                done: hasClauses,
                active: !hasClauses,
              },
              {
                num: 2,
                label: t.studio.step2,
                done: isAnalyzedStage,
                active: hasClauses && !isAnalyzedStage,
              },
              {
                num: 3,
                label: t.studio.step3,
                done: hasResolvedRedlines,
                active: isAnalyzedStage && !hasResolvedRedlines,
              },
              {
                num: 4,
                label: t.studio.step4,
                done: hasExportedStage,
                active: hasResolvedRedlines && !hasExportedStage,
              },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <div
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors ${
                    step.done
                      ? "font-medium text-slate-700 dark:text-slate-300"
                      : step.active
                      ? "font-semibold text-slate-900 dark:text-white"
                      : "font-normal text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2
                      className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : step.active ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>{step.label}</span>
                </div>
                {idx < arr.length - 1 ? (
                  <span
                    className="shrink-0 text-slate-300 dark:text-slate-700"
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : null}
              </React.Fragment>
            ))}

            <button
              type="button"
              data-testid="dismiss-quick-guide-btn"
              onClick={() => setIsGuideDismissed(true)}
              className="ml-1 shrink-0 whitespace-nowrap rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
              title={t.studio.hideGuideTitle}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsGuideDismissed(false)}
              className="whitespace-nowrap font-mono text-[10px] font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
            >
              {t.studio.showGuide}
            </button>
          </div>
        )}

        {/* Right side: Workspace Navigation, Language Switcher & Help Links */}
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher compact />

          <Link
            href="/playbooks"
            data-testid="header-playbook-link"
            className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800"
          >
            <BookOpen
              className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>{t.studio.playbooks}</span>
          </Link>

          <Link
            href="/help"
            data-testid="open-interactive-tutorial-btn"
            className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800"
          >
            <GraduationCap
              className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>{t.studio.tutorial}</span>
          </Link>

          <button
            type="button"
            data-testid="open-quick-help-btn"
            onClick={() => setIsQuickHelpOpen(true)}
            className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2.5 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800"
          >
            <HelpCircle className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>{t.studio.help}</span>
          </button>
        </div>
      </div>

      {/* Optimistic Concurrency Version Conflict (409) Banner */}
      {conflictError ? (
        <div
          role="alert"
          data-testid="version-conflict-banner"
          className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-6 py-2.5 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/90 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              {t.studio.conflictBadge}
            </span>
            <span className="font-medium">{conflictError}</span>
          </div>
          <button
            type="button"
            data-testid="dismiss-conflict-banner-btn"
            onClick={dismissConflictError}
            className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-900/60 dark:text-rose-100 dark:hover:bg-rose-800/70"
          >
            {t.studio.dismiss}
          </button>
        </div>
      ) : null}

      {/* Split-Pane Resizable Container */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
        data-testid="split-screen-container"
      >
        {/* Left Pane: Risk Heatmap Gutter + Elevated Legal Document Sheet */}
        <section
          aria-label="Contract Editor Left Pane"
          style={{ width: `${splitRatio}%` }}
          className="h-full overflow-hidden"
        >
          <ContractEditorCanvas
            clauses={clauses}
            redlines={redlines}
            documentTitle={currentTitle}
          />
        </section>

        {/* Draggable Split-Pane Divider */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Split Screen"
          data-testid="split-pane-resizer"
          onMouseDown={handleDividerMouseDown}
          className="group flex w-1.5 shrink-0 cursor-col-resize items-center justify-center border-x border-slate-200/80 bg-slate-100 transition-colors hover:bg-indigo-500/90 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-indigo-500/80"
        >
          <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100">
            <span className="h-1 w-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="h-1 w-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="h-1 w-0.5 rounded-full bg-slate-400 group-hover:bg-white" />
          </div>
        </div>

        {/* Right Pane: Executive AI Redline Inspector */}
        <section
          aria-label="AI Inspector Right Pane"
          style={{ width: `${100 - splitRatio}%` }}
          className="h-full overflow-hidden"
        >
          <AiInspectorPanel
            clauses={clauses}
            redlines={redlines}
            comments={comments}
            auditLogs={auditLogs}
            onAcceptSuggestion={handleAcceptSuggestion}
            onModifySuggestion={handleModifySuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            onAddComment={handleAddComment}
            onTriggerAudit={handleTriggerAiAnalysis}
          />
        </section>
      </div>

      {/* Floating Export Status Toast Pill (Never overflows header) */}
      {lastExportedFilename ? (
        <div
          role="status"
          data-testid="export-status-badge"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200/90 bg-white/95 px-3.5 py-2 font-mono text-xs font-medium text-emerald-700 shadow-lg backdrop-blur-md dark:border-emerald-500/30 dark:bg-slate-900/95 dark:text-emerald-300"
        >
          <CheckCircle2
            className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">
            {t.studio.exportedPrefix} {lastExportedFilename}
          </span>
        </div>
      ) : null}

      {/* Quick Upload Modal */}
      {isUploadModalOpen ? (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      ) : null}

      {/* Contextual Quick Help Modal */}
      {isQuickHelpOpen ? (
        <QuickHelpModal
          isOpen={isQuickHelpOpen}
          onClose={() => setIsQuickHelpOpen(false)}
        />
      ) : null}

      {/* AI Engine & Model Switcher Modal */}
      {isAISettingsOpen ? (
        <AISettingsModal
          isOpen={isAISettingsOpen}
          onClose={() => setIsAISettingsOpen(false)}
          token={effectiveToken}
          userRole={session.userRole}
        />
      ) : null}
    </div>
  );
};
