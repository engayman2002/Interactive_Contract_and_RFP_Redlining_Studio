"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ContractEditorCanvas } from "@/components/editor/ContractEditorCanvas";
import { AiInspectorPanel } from "@/components/inspector/AiInspectorPanel";
import { useDocumentStream } from "@/hooks/useDocumentStream";
import {
  DEMO_WORKSPACE_DATA,
  fetchDocumentWorkspace,
  triggerDocumentAnalysis,
} from "@/services/apiClient";
import type { DocumentWorkspaceDTO, ExportMode } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const resolvedDocId = documentId ?? initialWorkspace.document_id;

  const currentTitle = initialWorkspace.title;
  const [currentStatus, setCurrentStatus] = useState<string>(
    initialWorkspace.status
  );
  const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isQuickHelpOpen, setIsQuickHelpOpen] = useState<boolean>(false);

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
        }
      });
    } else {
      hydrateWorkspace(initialWorkspace);
    }

    return () => {
      isMounted = false;
    };
  }, [documentId, initialWorkspace, hydrateWorkspace, token]);

  const handleStreamComplete = useCallback(async () => {
    const updated = await fetchDocumentWorkspace(resolvedDocId, token);
    hydrateWorkspace(updated);
    setCurrentStatus("ANALYZED");
  }, [resolvedDocId, token, hydrateWorkspace]);

  const { startStream, streamProgress } = useDocumentStream({
    documentId: resolvedDocId,
    totalClauses: clauses.length,
    token,
    onStreamComplete: handleStreamComplete,
  });

  const handleTriggerAiAnalysis = useCallback(async () => {
    try {
      void triggerDocumentAnalysis(resolvedDocId, token);
    } catch {
      // Non-fatal, stream fallback handles demo
    }
    startStream();
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
      className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100"
    >
      {/* Top Studio Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            data-testid="back-to-dashboard-btn"
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>

          <Link
            href="/playbooks"
            data-testid="header-playbook-link"
            className="hidden rounded-md border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white sm:inline-block"
          >
            Playbook
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              {currentTitle}
            </h1>
            <p className="text-[11px] text-slate-400">
              Document v{documentVersion} · {clauses.length} Clauses · Status:{" "}
              <span className="font-medium text-indigo-300">
                {currentStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* In-Studio Quick Help Guide Button */}
          <button
            type="button"
            data-testid="open-quick-help-btn"
            onClick={() => setIsQuickHelpOpen(true)}
            className="flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-950/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-900/60 hover:text-white"
          >
            <span>?</span>
            <span>Help Guide</span>
          </button>

          {/* Quick In-Studio Upload Modal Button */}
          <button
            type="button"
            data-testid="studio-upload-new-btn"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <span>+</span>
            <span>Upload New File</span>
          </button>

          {lastExportedFilename ? (
            <span
              data-testid="export-status-badge"
              className="rounded border border-teal-500/40 bg-teal-500/15 px-2.5 py-1 font-mono text-[11px] text-teal-300"
            >
              Exported: {lastExportedFilename}
            </span>
          ) : null}

          <button
            type="button"
            data-testid="export-track-changes-btn"
            onClick={() => void handleExport("track_changes")}
            disabled={isExporting}
            className="rounded-md border border-teal-500/40 bg-teal-600/20 px-3 py-1.5 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-600/30 disabled:opacity-50"
          >
            Export Track Changes (.docx)
          </button>

          <button
            type="button"
            data-testid="export-clean-btn"
            onClick={() => void handleExport("clean")}
            disabled={isExporting}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            Export Clean (.docx)
          </button>

          <button
            type="button"
            data-testid="trigger-sse-audit-btn"
            onClick={handleTriggerAiAnalysis}
            disabled={streamProgress.isStreaming}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <span>✨</span>
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
          className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-950/40 px-6 py-2 text-xs text-indigo-200"
        >
          <div className="flex items-center gap-6 overflow-x-auto py-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                1
              </span>
              <span className="text-slate-300">
                Click any clause or Risk Heatmap bar to focus
              </span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                2
              </span>
              <span className="text-slate-300">
                Hover over <strong>Apply Redline</strong> to preview word diffs
                inline
              </span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                3
              </span>
              <span className="text-slate-300">
                Accept or Modify wording, then{" "}
                <strong>Export Track Changes (.docx)</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="dismiss-quick-guide-btn"
            onClick={() => setIsGuideDismissed(true)}
            className="ml-4 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Dismiss Guide"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Optimistic Concurrency Version Conflict (409) Banner */}
      {conflictError ? (
        <div
          role="alert"
          data-testid="version-conflict-banner"
          className="flex items-center justify-between border-b border-rose-500/40 bg-rose-950/90 px-6 py-2.5 text-xs text-rose-200"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              409 Conflict
            </span>
            <span>{conflictError}</span>
          </div>
          <button
            type="button"
            data-testid="dismiss-conflict-banner-btn"
            onClick={dismissConflictError}
            className="rounded border border-rose-500/40 bg-rose-900/60 px-2.5 py-1 text-[11px] font-medium text-rose-100 hover:bg-rose-800/70"
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
        {/* Left Pane: Risk Heatmap Gutter + TipTap Contract Editor Canvas */}
        <section
          aria-label="Contract Editor Left Pane"
          style={{ width: `${splitRatio}%` }}
          className="h-full overflow-hidden"
        >
          <ContractEditorCanvas clauses={clauses} redlines={redlines} />
        </section>

        {/* Draggable Split-Pane Divider */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Split Screen"
          data-testid="split-pane-resizer"
          onMouseDown={handleDividerMouseDown}
          className="group flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-slate-900 transition-colors hover:bg-indigo-600/80"
        >
          <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100">
            <span className="h-1 w-1 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="h-1 w-1 rounded-full bg-slate-400 group-hover:bg-white" />
            <span className="h-1 w-1 rounded-full bg-slate-400 group-hover:bg-white" />
          </div>
        </div>

        {/* Right Pane: AI Redline Inspector */}
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
    </div>
  );
};
