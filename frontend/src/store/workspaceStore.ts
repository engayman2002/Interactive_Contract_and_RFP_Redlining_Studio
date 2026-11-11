import { create } from "zustand";
import {
  DEFAULT_DEMO_MODE,
  DEMO_DOCUMENT_ID,
  DEMO_ORG_ID,
  DEMO_USER_ID,
  DEMO_WORKSPACE_DATA,
  VersionConflictError,
  clearAISemanticCache,
  createClauseComment,
  exportDocumentDocx,
  fetchAITelemetry,
  getIsDemoMode,
  readStoredDemoMode,
  recordOfflineAITelemetryEvent,
  refineRedlineSuggestion,
  resolveSuggestion,
  runCrossClauseCheck,
  setIsDemoMode,
  simulateCounterpartyPushback,
  verifyRedlineSuggestion,
  getLocalDocumentWorkspace,
  saveLocalDocumentWorkspace,
} from "@/services/apiClient";
import type {
  AITelemetrySummaryDTO,
  AuditAction,
  AuditLogEntryDTO,
  ClauseCommentDTO,
  ClauseDTO,
  ClearAICacheResponseDTO,
  CrossClauseAnalysisReportDTO,
  DocumentWorkspaceDTO,
  ExportMode,
  NegotiationStance,
  RedlineSuggestionDTO,
  SimulatePushbackResponseDTO,
  VerifySuggestionResponseDTO,
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
  activeLLMProvider: string;
  activeLLMModel: string;
  activeEmbeddingProvider: string;
  activeEmbeddingModel: string;
  negotiationStance: NegotiationStance;
  crossClauseReport: CrossClauseAnalysisReportDTO | null;
  isRunningCrossClauseCheck: boolean;
  pushbackSimulations: Record<string, SimulatePushbackResponseDTO>;
  aiTelemetry: AITelemetrySummaryDTO | null;
  isLoadingTelemetry: boolean;
  telemetryStatusMessage: string | null;
  refreshAITelemetry: (token?: string) => Promise<void>;
  purgeAISemanticCache: (token?: string) => Promise<ClearAICacheResponseDTO>;
  runDocumentCrossClauseCheck: (
    documentId?: string,
    token?: string
  ) => Promise<void>;
  setNegotiationStance: (stance: NegotiationStance) => void;
  setActiveAIEngine: (config: {
    llmProvider: string;
    llmModel: string;
    embeddingProvider: string;
    embeddingModel: string;
  }) => void;
  isDemoMode: boolean;
  hasDemoHydrated: boolean;
  setDemoMode: (enabled: boolean) => void;
  hydrateDemoMode: () => void;
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
  refineSuggestionWithAI: (
    suggestionId: string,
    instruction: string,
    token?: string
  ) => Promise<{ talkingPoint: string }>;
  verifySuggestionWithCritic: (
    suggestionId: string,
    token?: string
  ) => Promise<VerifySuggestionResponseDTO | null>;
  simulateSuggestionPushback: (
    suggestionId: string,
    token?: string
  ) => Promise<SimulatePushbackResponseDTO | null>;
  applyPushbackCompromise: (suggestionId: string) => Promise<void>;
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
  isDemoMode: getIsDemoMode(),
  hasDemoHydrated: false,
  clauses: getIsDemoMode() ? DEMO_WORKSPACE_DATA.clauses : [],
  redlines: getIsDemoMode() ? DEMO_WORKSPACE_DATA.redlines : [],
  comments: getIsDemoMode() ? DEMO_WORKSPACE_DATA.comments : [],
  auditLogs: getIsDemoMode() ? DEMO_WORKSPACE_DATA.audit_logs : [],
  documentVersion: getIsDemoMode() ? DEMO_WORKSPACE_DATA.version : 1,
  conflictError: null,
  isExporting: false,
  lastExportedFilename: null,
  activeLLMProvider: "deterministic",
  activeLLMModel: "policy-deterministic-v1",
  activeEmbeddingProvider: "deterministic",
  activeEmbeddingModel: "deterministic-hash-1536",
  negotiationStance: "balanced",
  crossClauseReport: null,
  isRunningCrossClauseCheck: false,
  pushbackSimulations: {},
  aiTelemetry: null,
  isLoadingTelemetry: false,
  telemetryStatusMessage: null,

  setNegotiationStance: (stance) => set({ negotiationStance: stance }),

  setActiveAIEngine: ({
    llmProvider,
    llmModel,
    embeddingProvider,
    embeddingModel,
  }) =>
    set({
      activeLLMProvider: llmProvider,
      activeLLMModel: llmModel,
      activeEmbeddingProvider: embeddingProvider,
      activeEmbeddingModel: embeddingModel,
    }),

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
      pushbackSimulations: {},
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

  refineSuggestionWithAI: async (suggestionId, instruction, token) => {
    const state = get();
    const suggestion = state.redlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return { talkingPoint: "" };
    }

    const res = await refineRedlineSuggestion(
      suggestionId,
      {
        instruction,
        stance: state.negotiationStance,
      },
      token
    );

    const auditEntry: AuditLogEntryDTO = {
      id: `audit-opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      org_id: DEMO_ORG_ID,
      document_id: DEMO_DOCUMENT_ID,
      clause_id: res.suggestion.clause_id,
      actor_user_id: DEMO_USER_ID,
      actor_role: "LEGAL_COUNSEL",
      action: "SUGGESTION_REFINED",
      details: {
        suggestion_id: suggestionId,
        instruction,
        stance: state.negotiationStance,
      },
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      redlines: s.redlines.map((r) =>
        r.id === suggestionId ? res.suggestion : r
      ),
      auditLogs: [...s.auditLogs, auditEntry],
    }));

    return { talkingPoint: res.negotiation_talking_point };
  },

  verifySuggestionWithCritic: async (suggestionId, token) => {
    const state = get();
    const suggestion = state.redlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return null;
    }
    const clause = state.clauses.find((c) => c.id === suggestion.clause_id);
    const res = await verifyRedlineSuggestion(
      suggestionId,
      token,
      state.negotiationStance,
      { suggestion, clause }
    );

    const auditEntry = buildOptimisticAuditEntry(
      "SUGGESTION_VERIFIED",
      res.suggestion.clause_id,
      {
        suggestion_id: suggestionId,
        verification_status: res.verification_status,
        confidence_score: res.confidence_score,
        auto_corrected: String(res.auto_corrected),
      },
      clause?.document_id ?? DEMO_DOCUMENT_ID
    );

    set((s) => ({
      redlines: s.redlines.map((r) =>
        r.id === suggestionId ? res.suggestion : r
      ),
      auditLogs: [...s.auditLogs, auditEntry],
    }));

    if (!token) {
      recordOfflineAITelemetryEvent({
        operation: "CRITIC_VERIFY",
        promptTokens: 190,
        completionTokens: 82,
        latencyMs: 3.8,
      });
    }
    void get().refreshAITelemetry(token);

    return res;
  },

  simulateSuggestionPushback: async (suggestionId, token) => {
    const state = get();
    const suggestion = state.redlines.find((r) => r.id === suggestionId);
    if (!suggestion) {
      return null;
    }
    const clause = state.clauses.find((c) => c.id === suggestion.clause_id);
    const res = await simulateCounterpartyPushback(
      suggestionId,
      { stance: state.negotiationStance },
      token,
      { suggestion, clause }
    );

    const auditEntry = buildOptimisticAuditEntry(
      "PUSHBACK_SIMULATED",
      res.clause_id,
      {
        suggestion_id: suggestionId,
        acceptance_probability: res.acceptance_probability,
        pushback_severity: res.pushback_severity,
        stance: state.negotiationStance,
      },
      clause?.document_id ?? DEMO_DOCUMENT_ID
    );

    set((s) => ({
      pushbackSimulations: {
        ...s.pushbackSimulations,
        [suggestionId]: res,
      },
      auditLogs: [...s.auditLogs, auditEntry],
    }));

    if (!token) {
      recordOfflineAITelemetryEvent({
        operation: "PUSHBACK_SIMULATION",
        promptTokens: 320,
        completionTokens: 165,
        latencyMs: 6.1,
      });
    }
    void get().refreshAITelemetry(token);

    return res;
  },

  applyPushbackCompromise: async (suggestionId) => {
    const state = get();
    const sim = state.pushbackSimulations[suggestionId];
    const suggestion = state.redlines.find((r) => r.id === suggestionId);
    if (!sim || !suggestion) {
      return;
    }
    const clause = state.clauses.find((c) => c.id === suggestion.clause_id);
    const updatedSuggestion: RedlineSuggestionDTO = {
      ...suggestion,
      proposed_text: sim.fallback_compromise_text,
      rationale: `[Round-2 Compromise Applied] Adopted balanced commercial fallback position. | Talking Point: ${sim.rebuttal_talking_point}`,
      status: "PENDING",
      verification_status: "VERIFIED",
      confidence_score: Math.max(85, sim.acceptance_probability),
    };

    if (typeof window !== "undefined" && clause?.document_id) {
      try {
        const localWs = getLocalDocumentWorkspace(clause.document_id);
        if (localWs) {
          localWs.redlines = localWs.redlines.map((r) =>
            r.id === suggestionId ? updatedSuggestion : r
          );
          saveLocalDocumentWorkspace(localWs);
        }
      } catch {
        // Ignore storage errors
      }
    }

    set((s) => ({
      redlines: s.redlines.map((r) =>
        r.id === suggestionId ? updatedSuggestion : r
      ),
    }));
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

  runDocumentCrossClauseCheck: async (documentId, token) => {
    const docId = documentId ?? DEMO_DOCUMENT_ID;
    set({ isRunningCrossClauseCheck: true });
    try {
      const report = await runCrossClauseCheck(docId, token);
      const auditEntry = buildOptimisticAuditEntry(
        "CROSS_CLAUSE_CHECKED",
        null,
        {
          total_findings: String(report.total_findings),
          contradiction_count: String(report.contradiction_count),
          broken_reference_count: String(report.broken_reference_count),
          undefined_term_count: String(report.undefined_term_count),
          integrity_score: String(report.integrity_score),
        },
        docId
      );
      set((state) => ({
        crossClauseReport: report,
        isRunningCrossClauseCheck: false,
        auditLogs: [...state.auditLogs, auditEntry],
      }));
      if (!token) {
        recordOfflineAITelemetryEvent({
          operation: "CROSS_CLAUSE_RADAR",
          promptTokens: 480,
          completionTokens: 190,
          latencyMs: 5.4,
        });
      }
      void get().refreshAITelemetry(token);
    } catch (err) {
      set({ isRunningCrossClauseCheck: false });
      throw err;
    }
  },

  refreshAITelemetry: async (token) => {
    set({ isLoadingTelemetry: true });
    try {
      const summary = await fetchAITelemetry(token);
      set({
        aiTelemetry: summary,
        isLoadingTelemetry: false,
      });
    } catch {
      set({ isLoadingTelemetry: false });
    }
  },

  purgeAISemanticCache: async (token) => {
    set({ telemetryStatusMessage: null });
    const res = await clearAISemanticCache(token);
    const updatedSummary = await fetchAITelemetry(token);
    const auditEntry = buildOptimisticAuditEntry("AI_CACHE_CLEARED", null, {
      cleared_entries: res.cleared_entries,
    });
    set((state) => ({
      aiTelemetry: updatedSummary,
      telemetryStatusMessage: res.message,
      auditLogs: [...state.auditLogs, auditEntry],
    }));
    return res;
  },

  setDemoMode: (enabled) => {
    setIsDemoMode(enabled);
    if (enabled) {
      set({
        isDemoMode: true,
        hasDemoHydrated: true,
        activeClauseId: null,
        selectionSource: null,
        hoveredSuggestionId: null,
        clauses: DEMO_WORKSPACE_DATA.clauses,
        redlines: DEMO_WORKSPACE_DATA.redlines,
        comments: DEMO_WORKSPACE_DATA.comments,
        auditLogs: DEMO_WORKSPACE_DATA.audit_logs,
        documentVersion: DEMO_WORKSPACE_DATA.version,
        conflictError: null,
        crossClauseReport: null,
        pushbackSimulations: {},
      });
    } else {
      set({
        isDemoMode: false,
        hasDemoHydrated: true,
        activeClauseId: null,
        selectionSource: null,
        hoveredSuggestionId: null,
        clauses: [],
        redlines: [],
        comments: [],
        auditLogs: [],
        documentVersion: 1,
        conflictError: null,
        crossClauseReport: null,
        pushbackSimulations: {},
        lastExportedFilename: null,
      });
    }
  },

  hydrateDemoMode: () => {
    if (get().hasDemoHydrated) {
      return;
    }
    const stored = readStoredDemoMode();
    if (stored === true && !get().isDemoMode) {
      get().setDemoMode(true);
      return;
    }
    if (stored === false && get().isDemoMode) {
      get().setDemoMode(false);
      return;
    }
    set({ hasDemoHydrated: true });
  },

  resetWorkspaceState: () => {
    setIsDemoMode(DEFAULT_DEMO_MODE);
    set({
      activeClauseId: null,
      selectionSource: null,
      hoveredSuggestionId: null,
      riskFilter: "ALL",
      splitRatio: 55,
      streamProgress: INITIAL_STREAM_PROGRESS,
      isDemoMode: DEFAULT_DEMO_MODE,
      hasDemoHydrated: false,
      clauses: DEFAULT_DEMO_MODE ? DEMO_WORKSPACE_DATA.clauses : [],
      redlines: DEFAULT_DEMO_MODE ? DEMO_WORKSPACE_DATA.redlines : [],
      comments: DEFAULT_DEMO_MODE ? DEMO_WORKSPACE_DATA.comments : [],
      auditLogs: DEFAULT_DEMO_MODE ? DEMO_WORKSPACE_DATA.audit_logs : [],
      documentVersion: DEFAULT_DEMO_MODE ? DEMO_WORKSPACE_DATA.version : 1,
      conflictError: null,
      isExporting: false,
      lastExportedFilename: null,
      activeLLMProvider: "deterministic",
      activeLLMModel: "policy-deterministic-v1",
      activeEmbeddingProvider: "deterministic",
      activeEmbeddingModel: "deterministic-hash-1536",
      negotiationStance: "balanced",
      crossClauseReport: null,
      isRunningCrossClauseCheck: false,
      pushbackSimulations: {},
      aiTelemetry: null,
      isLoadingTelemetry: false,
      telemetryStatusMessage: null,
    });
  },
}));
