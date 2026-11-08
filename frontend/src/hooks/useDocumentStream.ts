"use client";

import { useCallback, useEffect, useRef } from "react";
import { API_BASE_URL, DEMO_DOCUMENT_ID } from "@/services/apiClient";
import { AuditProgressEventDTOSchema, NegotiationStance } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

export interface UseDocumentStreamOptions {
  documentId: string;
  totalClauses: number;
  token?: string;
  stance?: NegotiationStance;
  onStreamComplete?: () => void;
}

export function useDocumentStream({
  documentId,
  totalClauses,
  token,
  stance = "balanced",
  onStreamComplete,
}: UseDocumentStreamOptions) {
  const streamProgress = useWorkspaceStore((state) => state.streamProgress);
  const updateStreamProgress = useWorkspaceStore(
    (state) => state.updateStreamProgress
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    updateStreamProgress({ isStreaming: false });
  }, [updateStreamProgress]);

  const startStream = useCallback(() => {
    stopStream();

    // Demo mode or when EventSource is unavailable in test environment
    if (
      !documentId ||
      documentId === DEMO_DOCUMENT_ID ||
      !token ||
      typeof EventSource === "undefined"
    ) {
      const total = Math.max(1, totalClauses);
      updateStreamProgress({
        completed: 0,
        total,
        isStreaming: true,
      });

      let step = 0;
      demoTimerRef.current = setInterval(() => {
        step += 1;
        if (step >= total) {
          if (demoTimerRef.current) {
            clearInterval(demoTimerRef.current);
            demoTimerRef.current = null;
          }
          updateStreamProgress({
            completed: total,
            total,
            isStreaming: false,
          });
          onStreamComplete?.();
        } else {
          updateStreamProgress({
            completed: step,
            total,
            isStreaming: true,
          });
        }
      }, 45);
      return;
    }

    const url = `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/stream?stance=${encodeURIComponent(stance)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    updateStreamProgress({
      completed: 0,
      total: totalClauses,
      isStreaming: true,
    });

    const handleClauseAudited = (ev: MessageEvent) => {
      try {
        const parsed = AuditProgressEventDTOSchema.parse(JSON.parse(ev.data));
        updateStreamProgress({
          completed: parsed.completed_count,
          total: parsed.total_count,
          isStreaming: true,
        });
      } catch {
        // Ignore malformed frame
      }
    };

    const handleCompleted = (ev: MessageEvent) => {
      try {
        const parsed = AuditProgressEventDTOSchema.parse(JSON.parse(ev.data));
        updateStreamProgress({
          completed: parsed.completed_count,
          total: parsed.total_count,
          isStreaming: false,
        });
      } finally {
        es.close();
        eventSourceRef.current = null;
        onStreamComplete?.();
      }
    };

    es.addEventListener("clause_audited", handleClauseAudited);
    es.addEventListener("completed", handleCompleted);
    es.onerror = () => {
      stopStream();
    };
  }, [
    documentId,
    onStreamComplete,
    stance,
    stopStream,
    token,
    totalClauses,
    updateStreamProgress,
  ]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    streamProgress,
    startStream,
    stopStream,
  };
}

