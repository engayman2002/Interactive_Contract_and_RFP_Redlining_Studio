import { create } from "zustand";
import {
  DEMO_DOCUMENT_ID,
  DEMO_ORG_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_DATA,
  VersionConflictError,
  createClauseComment,
  exportDocumentDocx,
  resolveSuggestion,
} from "@/services/apiClient";
import type {
  AuditAction,
  AuditLogEntryDTO,
  ClauseCommentDTO,
  ClauseDTO,
  DocumentWorkspaceDTO,
  ExportMode,
  RedlineSuggestionDTO,
} from "@/services/contracts";

export type RiskFilterMode =
  | "ALL"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "COMPLIANT";

export type SelectionSource = "editor" | "inspector";

export interface StreamProgressState {
  completed: number;
  total: number;
  isStreaming: boolean;
}

export interface WorkspaceStoreState {
  activeClauseId: string | null;
  selectionSource: SelectionSource | null;
  hoveredSuggestionId: string | null;
  riskFilter: RiskFilterMode;
  splitRatio: number;
  streamProgress: StreamProgressState;
  clauses: ClauseDTO[];
  redlines: RedlineSuggestionDTO[];
  comments: ClauseCommentDTO[];
  auditLogs: AuditLogEntryDTO[];
  documentVersion: number;
  conflictError: string | null;
  isExporting: boolean;
  lastExportedFilename: string | null;
  selectClause: (clauseId: string | null, source: SelectionSource) => void;
  setHoveredSuggestion: (suggestionId: string | null) => void;
  setRiskFilter: (filter: RiskFilterMode) => void;
  setSplitRatio: (ratio: number) => void;
  updateStreamProgress: (progress: Partial<StreamProgressState>) => void;
  hydrateWorkspace: (workspace: DocumentWorkspaceDTO) => void;
  dismissConflictError: () => void;
  setConflictError: (message: string | null) => void;
  acceptSuggestion: (suggestionId: string, token?: string) => Promise<void>;
  modifySuggestion: (
    suggestionId: string,
    modifiedText: string,
    token?: string
  ) => Promise<void>;
  rejectSuggestion: (suggestionId: string, token?: string) => Promise<void>;
  addClauseComment: (
    clauseId: string,
    body: string,
    token?: string,
    authorId?: string
  ) => Promise<void>;
  exportDocument: (
    documentId: string,
    mode: ExportMode,
    token?: string
  ) => Promise<string>;
  resetWorkspaceState: () => void;
}

const INITIAL_STREAM_PROGRESS: StreamProgressState = {
  completed: 0,
  total: 0,
  isStreaming: false,
};

function isVersionConflict(err: unknown): boolean {
  if (err instanceof VersionConflictError) {
    return true;
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: unknown }).status === 409
  ) {
    return true;
  }
  return false;
}

function buildOptimisticAuditEntry(
  action: AuditAction,
  clauseId: string | null,
  details: Record<string, string | number | null>,
  documentId: string = DEMO_DOCUMENT_ID
): AuditLogEntryDTO {
  return {
    id: `audit-opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    org_id: DEMO_ORG_ID,
    document_id: documentId,
    clause_id: clauseId,
    actor_user_id: DEMO_USER_ID,
    actor_role: "LEGAL_COUNSEL",
    action,
    details,
    created_at: new Date().toISOString(),
  };
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  activeClauseId: null,
  selectionSource: null,
  hoveredSuggestionId: null,
  riskFilter: "ALL",
  splitRatio: 55,
  streamProgress: INITIAL_STREAM_PROGRESS,
  clauses: DEMO_WORKSPACE_DATA.clauses,
  redlines: DEMO_WORKSPACE_DATA.redlines,
  comments: DEMO_WORKSPACE_DATA.comments,
  auditLogs: DEMO_WORKSPACE_DATA.audit_logs,
  documentVersion: DEMO_WORKSPACE_DATA.version,
  conflictError: null,
  isExporting: false,
  lastExportedFilename: null,

  selectClause: (clauseId, source) =>
    set({
      activeClauseId: clauseId,
      selectionSource: source,
    }),

  setHoveredSuggestion: (suggestionId) =>
    set({
      hoveredSuggestionId: suggestionId,
    }),

  setRiskFilter: (filter) =>
    set({
      riskFilter: filter,
    }),

  setSplitRatio: (ratio) =>
    set({
      splitRatio: Math.max(30, Math.min(70, Math.round(ratio))),
    }),

  updateStreamProgress: (progress) =>
    set((state) => ({
      streamProgress: {
        ...state.streamProgress,
        ...progress,
      },
    })),

  hydrateWorkspace: (workspace) =>
    set({
      clauses: workspace.clauses,
      redlines: workspace.redlines,
      comments: workspace.comments ?? [],
      auditLogs: workspace.audit_logs ?? [],
      documentVersion: workspace.version,
      conflictError: null,
    }),

  dismissConflictError: () =>
    set({
      conflictError: null,
    }),

  setConflictError: (message) =>
    set({
      conflictError: message,
    }),

  acceptSuggestion: async (suggestionId, token) => {
    const {
      clauses: prevClauses,
      redlines: prevRedlines,
      auditLogs: prevAuditLogs,
      documentVersion: prevDocVersion,
    } = get();

    const suggestion = prevRedlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return;
    }
    const clause = prevClauses.find((c) => c.id === suggestion.clause_id);
    if (!clause) {
      return;
    }

    const expectedVersion = clause.version;
    const nowIso = new Date().toISOString();
    const auditEntry = buildOptimisticAuditEntry(
      "SUGGESTION_ACCEPTED",
      clause.id,
      {
        suggestion_id: suggestion.id,
        clause_version: expectedVersion + 1,
        status: "ACCEPTED",
      },
      clause.document_id
    );

    set({
      hoveredSuggestionId: null,
      conflictError: null,
      documentVersion: prevDocVersion + 1,
      clauses: prevClauses.map((c) =>
        c.id === clause.id
          ? {
              ...c,
              current_text: suggestion.proposed_text,
              version: c.version + 1,
            }
          : c
      ),
      redlines: prevRedlines.map((r) =>
        r.id === suggestion.id
          ? {
              ...r,
              status: "ACCEPTED",
              resolved_by: DEMO_USER_ID,
              resolved_at: nowIso,
            }
          : r
      ),
      auditLogs: [...prevAuditLogs, auditEntry],
    });

    try {
      const response = await resolveSuggestion(
        suggestionId,
        {
          action: "ACCEPT",
          expected_clause_version: expectedVersion,
        },
        token
      );
      if (response) {
        set((state) => ({
          documentVersion: response.document_version,
          clauses: state.clauses.map((c) =>
            c.id === response.clause.id ? response.clause : c
          ),
          redlines: state.redlines.map((r) =>
            r.id === response.suggestion.id ? response.suggestion : r
          ),
        }));
      }
    } catch (err) {
      if (isVersionConflict(err)) {
        set({
          clauses: prevClauses,
          redlines: prevRedlines,
          auditLogs: prevAuditLogs,
          documentVersion: prevDocVersion,
          conflictError:
            err instanceof Error
              ? err.message
              : "Version conflict (409): Another user modified this clause simultaneously. Your stale edit was rolled back.",
        });
      }
    }
  },

  modifySuggestion: async (suggestionId, modifiedText, token) => {
    const cleanedText = modifiedText.trim();
    if (!cleanedText) {
      return;
    }

    const {
      clauses: prevClauses,
      redlines: prevRedlines,
      auditLogs: prevAuditLogs,
      documentVersion: prevDocVersion,
    } = get();

    const suggestion = prevRedlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return;
    }
    const clause = prevClauses.find((c) => c.id === suggestion.clause_id);
    if (!clause) {
      return;
    }

    const expectedVersion = clause.version;
    const nowIso = new Date().toISOString();
    const auditEntry = buildOptimisticAuditEntry(
      "SUGGESTION_MODIFIED",
      clause.id,
      {
        suggestion_id: suggestion.id,
        clause_version: expectedVersion + 1,
        status: "MODIFIED",
      },
      clause.document_id
    );

    set({
      hoveredSuggestionId: null,
      conflictError: null,
      documentVersion: prevDocVersion + 1,
      clauses: prevClauses.map((c) =>
        c.id === clause.id
          ? {
              ...c,
              current_text: cleanedText,
              version: c.version + 1,
            }
          : c
      ),
      redlines: prevRedlines.map((r) =>
        r.id === suggestion.id
          ? {
              ...r,
              proposed_text: cleanedText,
              status: "MODIFIED",
              resolved_by: DEMO_USER_ID,
              resolved_at: nowIso,
            }
          : r
      ),
      auditLogs: [...prevAuditLogs, auditEntry],
    });

    try {
      const response = await resolveSuggestion(
        suggestionId,
        {
          action: "MODIFY",
          expected_clause_version: expectedVersion,
          modified_text: cleanedText,
        },
        token
      );
      if (response) {
        set((state) => ({
          documentVersion: response.document_version,
          clauses: state.clauses.map((c) =>
            c.id === response.clause.id ? response.clause : c
          ),
          redlines: state.redlines.map((r) =>
            r.id === response.suggestion.id ? response.suggestion : r
          ),
        }));
      }
    } catch (err) {
      if (isVersionConflict(err)) {
        set({
          clauses: prevClauses,
          redlines: prevRedlines,
          auditLogs: prevAuditLogs,
          documentVersion: prevDocVersion,
          conflictError:
            err instanceof Error
              ? err.message
              : "Version conflict (409): Another user modified this clause simultaneously. Your stale edit was rolled back.",
        });
      }
    }
  },

  rejectSuggestion: async (suggestionId, token) => {
    const {
      clauses: prevClauses,
      redlines: prevRedlines,
      auditLogs: prevAuditLogs,
      documentVersion: prevDocVersion,
    } = get();

    const suggestion = prevRedlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return;
    }
    const clause = prevClauses.find((c) => c.id === suggestion.clause_id);
    if (!clause) {
      return;
    }

    const expectedVersion = clause.version;
    const nowIso = new Date().toISOString();
    const auditEntry = buildOptimisticAuditEntry(
      "SUGGESTION_REJECTED",
      clause.id,
      {
        suggestion_id: suggestion.id,
        clause_version: expectedVersion + 1,
        status: "REJECTED",
      },
      clause.document_id
    );

    set({
      hoveredSuggestionId: null,
      conflictError: null,
      documentVersion: prevDocVersion + 1,
      clauses: prevClauses.map((c) =>
        c.id === clause.id
          ? {
              ...c,
              version: c.version + 1,
            }
          : c
      ),
      redlines: prevRedlines.map((r) =>
        r.id === suggestion.id
          ? {
              ...r,
              status: "REJECTED",
              resolved_by: DEMO_USER_ID,
              resolved_at: nowIso,
            }
          : r
      ),
      auditLogs: [...prevAuditLogs, auditEntry],
    });

    try {
      const response = await resolveSuggestion(
        suggestionId,
        {
          action: "REJECT",
          expected_clause_version: expectedVersion,
        },
        token
      );
      if (response) {
        set((state) => ({
          documentVersion: response.document_version,
          clauses: state.clauses.map((c) =>
            c.id === response.clause.id ? response.clause : c
          ),
          redlines: state.redlines.map((r) =>
            r.id === response.suggestion.id ? response.suggestion : r
          ),
        }));
      }
    } catch (err) {
      if (isVersionConflict(err)) {
        set({
          clauses: prevClauses,
          redlines: prevRedlines,
          auditLogs: prevAuditLogs,
          documentVersion: prevDocVersion,
          conflictError:
            err instanceof Error
              ? err.message
              : "Version conflict (409): Another user modified this clause simultaneously. Your stale edit was rolled back.",
        });
      }
    }
  },

  addClauseComment: async (clauseId, body, token, authorId) => {
    const cleanedBody = body.trim();
    if (!cleanedBody) {
      return;
    }

    const optimisticId = `comment-opt-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const optimisticComment: ClauseCommentDTO = {
      id: optimisticId,
      clause_id: clauseId,
      author_id: authorId ?? DEMO_USER_ID,
      body: cleanedBody,
      created_at: new Date().toISOString(),
    };
    const auditEntry = buildOptimisticAuditEntry("COMMENT_CREATED", clauseId, {
      comment_id: optimisticId,
    });

    set((state) => ({
      comments: [...state.comments, optimisticComment],
      auditLogs: [...state.auditLogs, auditEntry],
    }));

    const created = await createClauseComment(clauseId, cleanedBody, token);
    if (created) {
      set((state) => ({
        comments: state.comments.map((cm) =>
          cm.id === optimisticId ? created : cm
        ),
      }));
    }
  },

  exportDocument: async (documentId, mode, token) => {
    set({ isExporting: true });
    try {
      const { filename } = await exportDocumentDocx(documentId, mode, token);
      const { clauses } = get();
      const auditEntry = buildOptimisticAuditEntry(
        "DOCUMENT_EXPORTED",
        null,
        {
          mode,
          filename,
          clause_count: clauses.length,
        },
        documentId
      );
      set((state) => ({
        isExporting: false,
        lastExportedFilename: filename,
        auditLogs: [...state.auditLogs, auditEntry],
      }));
      return filename;
    } catch (err) {
      set({ isExporting: false });
      throw err;
    }
  },

  resetWorkspaceState: () =>
    set({
      activeClauseId: null,
      selectionSource: null,
      hoveredSuggestionId: null,
      riskFilter: "ALL",
      splitRatio: 55,
      streamProgress: INITIAL_STREAM_PROGRESS,
      clauses: DEMO_WORKSPACE_DATA.clauses,
      redlines: DEMO_WORKSPACE_DATA.redlines,
      comments: DEMO_WORKSPACE_DATA.comments,
      auditLogs: DEMO_WORKSPACE_DATA.audit_logs,
      documentVersion: DEMO_WORKSPACE_DATA.version,
      conflictError: null,
      isExporting: false,
      lastExportedFilename: null,
    }),
}));
