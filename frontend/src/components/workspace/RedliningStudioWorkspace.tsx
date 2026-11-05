"use client";

import React, { useCallback, useRef, useState } from "react";
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
  const [workspace, setWorkspace] =
    useState<DocumentWorkspaceDTO>(initialWorkspace);
  const splitRatio = useWorkspaceStore((state) => state.splitRatio);
  const setSplitRatio = useWorkspaceStore((state) => state.setSplitRatio);
  const setHoveredSuggestion = useWorkspaceStore(
    (state) => state.setHoveredSuggestion
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const { startStream, streamProgress } = useDocumentStream({
    documentId: documentId ?? workspace.document_id,
    totalClauses: workspace.clauses.length,
    token,
  });

  const handleLocalApplyPreview = useCallback(
    (clauseId: string, proposedText: string) => {
      setHoveredSuggestion(null);
      setWorkspace((prev) => ({
        ...prev,
        clauses: prev.clauses.map((c) =>
          c.id === clauseId
            ? { ...c, current_text: proposedText, version: c.version + 1 }
            : c
        ),
        redlines: prev.redlines.map((r) =>
          r.clause_id === clauseId ? { ...r, status: "ACCEPTED" } : r
        ),
      }));
    },
    [setHoveredSuggestion]
  );

  const handleLocalRejectPreview = useCallback(
    (suggestionId: string) => {
      setHoveredSuggestion(null);
      setWorkspace((prev) => ({
        ...prev,
        redlines: prev.redlines.map((r) =>
          r.id === suggestionId ? { ...r, status: "REJECTED" } : r
        ),
      }));
    },
    [setHoveredSuggestion]
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
              {workspace.title}
            </h1>
            <p className="text-[11px] text-slate-400">
              Document v{workspace.version} · {workspace.clauses.length} Clauses
              · Status: {workspace.status}
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
          <ContractEditorCanvas
            clauses={workspace.clauses}
            redlines={workspace.redlines}
          />
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
            clauses={workspace.clauses}
            redlines={workspace.redlines}
            onLocalApplyPreview={handleLocalApplyPreview}
            onLocalRejectPreview={handleLocalRejectPreview}
          />
        </section>
      </div>
    </div>
  );
};

