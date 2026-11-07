"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Cpu,
  Download,
  FileCheck2,
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
  }, [resolvedDocId, token, hydrateWorkspace]);

  const { startStream, streamProgress } = useDocumentStream({
    documentId: resolvedDocId,
    totalClauses: clauses.length,
    token,
    onStreamComplete: handleStreamComplete,
  });

  const handleTriggerAiAnalysis = useCallback(async () => {
    await triggerDocumentAnalysis(resolvedDocId, token);
    await startStream();
  }, [resolvedDocId, token, startStream]);

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

  return (
    <div
      data-testid="redlining-studio-workspace"
      className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100"
    >
      {/* Executive Document Toolbar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:px-6">
        {/* Left: Brand Emblem + Breadcrumb + Version & Status */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            data-testid="back-to-dashboard-btn"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
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
              <span className="shrink-0 rounded-md border border-slate-200 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                v{documentVersion}
              </span>
              <span
                className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold md:inline-block ${
                  currentStatus === "ANALYZED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{clauses.length} Clauses</span>
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
        </div>

        {/* Right: Organized Action Group */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            data-testid="open-ai-settings-btn"
            onClick={() => setIsAISettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/90 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-100/80 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">
              {formatActiveAIBadge(activeLLMProvider, activeLLMModel)}
            </span>
          </button>

          <ThemeToggle />

          {/* Secondary Subtle Buttons */}
          <button
            type="button"
            data-testid="studio-upload-new-btn"
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 lg:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            data-testid="open-quick-help-btn"
            onClick={() => setIsQuickHelpOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Help Guide</span>
          </button>

          {lastExportedFilename ? (
            <span
              data-testid="export-status-badge"
              className="hidden rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 xl:inline-block"
            >
              Exported: {lastExportedFilename}
            </span>
          ) : null}

          {/* Clean Export Buttons */}
          <button
            type="button"
            data-testid="export-track-changes-btn"
            onClick={() => void handleExport("track_changes")}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export Track Changes (.docx)</span>
          </button>

          <button
            type="button"
            data-testid="export-clean-btn"
            onClick={() => void handleExport("clean")}
            disabled={isExporting}
            className="hidden items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:inline-flex"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Clean (.docx)</span>
          </button>

          {/* Primary High-Contrast CTA */}
          <button
            type="button"
            data-testid="trigger-sse-audit-btn"
            onClick={handleTriggerAiAnalysis}
            disabled={streamProgress.isStreaming}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {streamProgress.isStreaming
                ? "Auditing Clauses..."
                : "Analyze Contract with AI"}
            </span>
          </button>
        </div>
      </header>

      {/* Dismissible 3-Step Quick Guide Banner */}
      {!isGuideDismissed ? (
        <div
          data-testid="studio-quick-guide-banner"
          className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/75 px-6 py-2 text-xs text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-950/35 dark:text-indigo-200"
        >
          <div className="flex items-center gap-5 overflow-x-auto py-0.5">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                1
              </span>
              <span>Select any clause or Risk Map pin</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600">→</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                2
              </span>
              <span>
                Hover over <strong>Apply Redline</strong> to preview word diffs
                in document
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-600">→</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                3
              </span>
              <span>
                Accept or Modify wording, then{" "}
                <strong>Export Track Changes (.docx)</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="dismiss-quick-guide-btn"
            onClick={() => setIsGuideDismissed(true)}
            className="ml-4 rounded-md p-1 text-slate-500 transition-colors hover:bg-indigo-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Dismiss Guide"
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
