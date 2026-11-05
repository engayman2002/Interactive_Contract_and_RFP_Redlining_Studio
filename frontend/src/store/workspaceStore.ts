import { create } from "zustand";

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
  selectClause: (clauseId: string | null, source: SelectionSource) => void;
  setHoveredSuggestion: (suggestionId: string | null) => void;
  setRiskFilter: (filter: RiskFilterMode) => void;
  setSplitRatio: (ratio: number) => void;
  updateStreamProgress: (progress: Partial<StreamProgressState>) => void;
  resetWorkspaceState: () => void;
}

const INITIAL_STREAM_PROGRESS: StreamProgressState = {
  completed: 0,
  total: 0,
  isStreaming: false,
};

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  activeClauseId: null,
  selectionSource: null,
  hoveredSuggestionId: null,
  riskFilter: "ALL",
  splitRatio: 55,
  streamProgress: INITIAL_STREAM_PROGRESS,

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

  resetWorkspaceState: () =>
    set({
      activeClauseId: null,
      selectionSource: null,
      hoveredSuggestionId: null,
      riskFilter: "ALL",
      splitRatio: 55,
      streamProgress: INITIAL_STREAM_PROGRESS,
    }),
}));

