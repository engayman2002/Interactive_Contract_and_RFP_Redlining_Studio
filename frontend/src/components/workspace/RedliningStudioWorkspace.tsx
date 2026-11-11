"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Plus,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import { ContractEditorCanvas } from "@/components/editor/ContractEditorCanvas";
import { AiInspectorPanel } from "@/components/inspector/AiInspectorPanel";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
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
      {/* Executive Glassmorphic Studio Command Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#070B14]/85 md:px-6">
        {/* Left Zone: Dashboard Link + Title/Status + Learning Triggers */}
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            data-testid="back-to-dashboard-btn"
            className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-b from-indigo-500 to-indigo-600 text-white ring-1 ring-inset ring-white/20">
              <Scale className="h-3 w-3" aria-hidden="true" />
            </span>
            <span>Dashboard</span>
          </Link>

          <ChevronRight
            className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:inline-block"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {currentTitle}
              </h1>
              <span className="shrink-0 rounded-md border border-slate-200/90 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                v{documentVersion}
              </span>
              <span
                className={`micro-badge hidden shrink-0 md:inline-flex ${
                  currentStatus === "ANALYZED"
                    ? "border-emerald-200/90 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-sky-200/90 bg-sky-50/80 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300"
                }`}
              >
                <span
                  className={`micro-badge-dot ${
                    currentStatus === "ANALYZED"
                      ? "bg-emerald-500"
                      : "bg-sky-500"
                  }`}
                />
                <span>{currentStatus}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono">{clauses.length} Clauses</span>
              <span>·</span>
              <Link
                href="/playbooks"
                data-testid="header-playbook-link"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Playbook Policies
              </Link>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 pl-2 xl:flex">
            <Link
              href="/help"
              data-testid="open-interactive-tutorial-btn"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
            >
              <GraduationCap
                className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
              <span>🎓 Tutorial</span>
            </Link>
            <button
              type="button"
              data-testid="open-quick-help-btn"
              onClick={() => setIsQuickHelpOpen(true)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>? Quick Help</span>
            </button>
          </div>
        </div>

        {/* Right Zone: Group 1 (AI Audit Controls) | Group 2 (Document Actions) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickHelpOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 xl:hidden"
            title="Quick Help Guide"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </button>

          {/* Group 1: AI Audit Controls */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/75 p-1 dark:border-slate-800 dark:bg-slate-900/90">
            <div
              data-testid="negotiation-stance-selector"
              className="inline-flex h-7 items-center rounded-lg border border-slate-200/80 bg-white p-0.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="AI Negotiation Stance"
            >
              <button
                type="button"
                data-testid="stance-option-strict"
                onClick={() => setNegotiationStance("strict")}
                className={`h-6 rounded-md px-2 text-[11px] font-medium transition-all ${
                  negotiationStance === "strict"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
                title="Strict / Protective Posture: Zero-compromise standard playbook enforcement"
              >
                Strict
              </button>
              <button
                type="button"
                data-testid="stance-option-balanced"
                onClick={() => setNegotiationStance("balanced")}
                className={`h-6 rounded-md px-2 text-[11px] font-medium transition-all ${
                  negotiationStance === "balanced"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
                title="Balanced / Mutual Posture (Default): Bilateral terms protecting core boundaries"
              >
                Balanced
              </button>
              <button
                type="button"
                data-testid="stance-option-commercial"
                onClick={() => setNegotiationStance("commercial")}
                className={`h-6 rounded-md px-2 text-[11px] font-medium transition-all ${
                  negotiationStance === "commercial"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
                title="Commercial / Fast-Close Posture: Pre-approved fallback positions for rapid deal velocity"
              >
                Commercial
              </button>
            </div>

            <button
              type="button"
              data-testid="trigger-sse-audit-btn"
              onClick={handleTriggerAiAnalysis}
              disabled={streamProgress.isStreaming}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(79,70,229,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {streamProgress.isStreaming
                  ? "Auditing Clauses..."
                  : "Analyze Contract with AI"}
              </span>
            </button>

            <button
              type="button"
              data-testid="open-ai-settings-btn"
              onClick={() => setIsAISettingsOpen(true)}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-indigo-200/80 bg-white px-2.5 font-mono text-[11px] font-semibold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
            >
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {formatActiveAIBadge(activeLLMProvider, activeLLMModel)}
              </span>
            </button>
          </div>

          <div
            className="hidden h-5 w-px bg-slate-200/90 dark:bg-slate-800 sm:block"
            aria-hidden="true"
          />

          {/* Group 2: Document Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="studio-upload-new-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="hidden h-8 items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 lg:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload</span>
            </button>

            {lastExportedFilename ? (
              <span
                data-testid="export-status-badge"
                className="hidden h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 font-mono text-[11px] font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 xl:inline-flex"
              >
                Exported: {lastExportedFilename}
              </span>
            ) : null}

            <button
              type="button"
              data-testid="export-track-changes-btn"
              onClick={() => void handleExport("track_changes")}
              disabled={isExporting}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50/70 px-3 text-xs font-semibold text-emerald-800 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-100/70 disabled:opacity-50 dark:border-emerald-500/35 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-900/45"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Track Changes (.docx)</span>
            </button>

            <button
              type="button"
              data-testid="export-clean-btn"
              onClick={() => void handleExport("clean")}
              disabled={isExporting}
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 md:inline-flex"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export Clean (.docx)</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Precision Horizontal 4-Step Lifecycle Breadcrumb Stepper */}
      {!isGuideDismissed ? (
        <div
          data-testid="studio-quick-guide-banner"
          className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-2 text-xs text-slate-700 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#070B14]/90 dark:text-slate-200"
        >
          <div className="flex flex-1 items-center gap-2 overflow-x-auto py-0.5">
            {[
              {
                num: 1,
                label: "1. Upload / Select Contract",
                done: hasClauses,
                active: !hasClauses,
              },
              {
                num: 2,
                label: "2. Choose Stance & Analyze",
                done: isAnalyzedStage,
                active: hasClauses && !isAnalyzedStage,
              },
              {
                num: 3,
                label: "3. Review Diffs, Copilot & Radar",
                done: hasResolvedRedlines,
                active: isAnalyzedStage && !hasResolvedRedlines,
              },
              {
                num: 4,
                label: "4. Export Word (.docx)",
                done: hasExportedStage,
                active: hasResolvedRedlines && !hasExportedStage,
              },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    step.done
                      ? "border-emerald-200/90 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : step.active
                      ? "border-indigo-500 bg-indigo-600 font-semibold text-white shadow-sm"
                      : "border-slate-200/80 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                        step.active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {step.num}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>
                {idx < arr.length - 1 ? (
                  <div
                    className="h-px w-4 shrink-0 bg-slate-200 dark:bg-slate-800 sm:w-6"
                    aria-hidden="true"
                  />
                ) : null}
              </React.Fragment>
            ))}
          </div>
          <button
            type="button"
            data-testid="dismiss-quick-guide-btn"
            onClick={() => setIsGuideDismissed(true)}
            className="ml-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Dismiss Workflow Bar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Optimistic Concurrency Version Conflict (409) Banner */}
      {conflictError ? (
        <div
          role="alert"
          data-testid="version-conflict-banner"
          className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-6 py-2.5 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/90 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              409 Conflict
            </span>
            <span className="font-medium">{conflictError}</span>
          </div>
          <button
            type="button"
            data-testid="dismiss-conflict-banner-btn"
            onClick={dismissConflictError}
            className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-900/60 dark:text-rose-100 dark:hover:bg-rose-800/70"
          >
            Dismiss
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
