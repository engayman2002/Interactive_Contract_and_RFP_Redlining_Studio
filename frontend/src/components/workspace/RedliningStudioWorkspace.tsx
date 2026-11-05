"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { ContractEditorCanvas } from "@/components/editor/ContractEditorCanvas";
import { AiInspectorPanel } from "@/components/inspector/AiInspectorPanel";
import { useDocumentStream } from "@/hooks/useDocumentStream";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import type { DocumentWorkspaceDTO } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

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
  const documentVersion = useWorkspaceStore((state) => state.documentVersion);
  const conflictError = useWorkspaceStore((state) => state.conflictError);
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    hydrateWorkspace(initialWorkspace);
  }, [initialWorkspace, hydrateWorkspace]);

  const { startStream, streamProgress } = useDocumentStream({
    documentId: documentId ?? initialWorkspace.document_id,
    totalClauses: clauses.length,
    token,
  });

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
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6">
        <div className="flex items-center gap-3">
          <span className="rounded bg-indigo-600 px-2 py-1 text-xs font-bold tracking-wider text-white">
            REDLINE STUDIO
          </span>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              {initialWorkspace.title}
            </h1>
            <p className="text-[11px] text-slate-400">
              Document v{documentVersion} · {clauses.length} Clauses · Status:{" "}
              {initialWorkspace.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">
            Split: {splitRatio}% / {100 - splitRatio}%
          </span>
          <button
            type="button"
            data-testid="trigger-sse-audit-btn"
            onClick={() => startStream()}
            disabled={streamProgress.isStreaming}
            className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {streamProgress.isStreaming
              ? "Auditing Clauses..."
              : "Run Live SSE Audit"}
          </button>
        </div>
      </header>

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
          className="flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-800 transition-colors hover:bg-indigo-500"
        >
          <span className="h-8 w-0.5 rounded bg-slate-600" />
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
            onAcceptSuggestion={handleAcceptSuggestion}
            onModifySuggestion={handleModifySuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            onAddComment={handleAddComment}
          />
        </section>
      </div>
    </div>
  );
};
