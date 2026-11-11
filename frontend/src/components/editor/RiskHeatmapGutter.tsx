"use client";

import React, { useCallback } from "react";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  ClauseRiskBadge,
  resolveClauseRiskBadge,
} from "./ClauseNodeExtension";

export interface RiskHeatmapGutterProps {
  clauses: ClauseDTO[];
  redlinesByClauseId: ReadonlyMap<string, RedlineSuggestionDTO>;
}

const HEATMAP_COLOR_MAP: Record<
  ClauseRiskBadge,
  { bg: string; label: string; tone: string }
> = {
  CRITICAL: {
    bg: "bg-rose-500 border-rose-600/25 dark:border-rose-400/60",
    label: "Critical Risk (Crimson)",
    tone: "crimson",
  },
  HIGH: {
    bg: "bg-amber-500 border-amber-600/25 dark:border-amber-400/60",
    label: "High Risk (Amber)",
    tone: "amber",
  },
  MEDIUM: {
    bg: "bg-sky-500 border-sky-600/25 dark:bg-sky-400 dark:border-sky-300/60",
    label: "Medium Risk (Sky)",
    tone: "sky",
  },
  LOW: {
    bg: "bg-sky-400/85 border-sky-500/25 dark:border-sky-400/50",
    label: "Low Risk",
    tone: "sky",
  },
  COMPLIANT: {
    bg: "bg-emerald-500 border-emerald-600/25 dark:border-emerald-400/60",
    label: "Compliant (Emerald)",
    tone: "emerald",
  },
};

const HeatmapPin = React.memo(
  ({
    clause,
    suggestion,
    onSelect,
  }: {
    clause: ClauseDTO;
    suggestion?: RedlineSuggestionDTO;
    onSelect: (clauseId: string) => void;
  }) => {
    const isSelected = useWorkspaceStore(
      (state) => state.activeClauseId === clause.id
    );
    const riskBadge = resolveClauseRiskBadge(suggestion);
    const styleInfo = HEATMAP_COLOR_MAP[riskBadge];

    return (
      <button
        type="button"
        data-testid={`heatmap-marker-${clause.id}`}
        data-clause-id={clause.id}
        data-risk-level={riskBadge}
        data-heatmap-tone={styleInfo.tone}
        title={`Clause #${clause.clause_index + 1}: ${
          clause.heading ?? "Provision"
        } — ${styleInfo.label}`}
        onClick={() => onSelect(clause.id)}
        className={`group relative flex h-7 w-full items-center justify-center rounded-md transition-all ${
          isSelected
            ? "bg-indigo-50 ring-1 ring-indigo-500/40 dark:bg-indigo-500/15 dark:ring-indigo-400/50"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
        }`}
      >
        <span
          className={`h-4 w-2 rounded-full border transition-transform group-hover:scale-110 ${
            styleInfo.bg
          } ${isSelected ? "scale-110" : "opacity-85 group-hover:opacity-100"}`}
        />
      </button>
    );
  }
);

HeatmapPin.displayName = "HeatmapPin";

export const RiskHeatmapGutter: React.FC<RiskHeatmapGutterProps> = ({
  clauses,
  redlinesByClauseId,
}) => {
  const selectClause = useWorkspaceStore((state) => state.selectClause);

  const handleSelect = useCallback(
    (clauseId: string) => {
      selectClause(clauseId, "editor");
    },
    [selectClause]
  );

  return (
    <aside
      aria-label="Risk Heatmap Gutter"
      data-testid="risk-heatmap-gutter"
      className="flex w-11 shrink-0 flex-col items-center gap-2 border-r border-slate-200/80 bg-white/80 py-5 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#070B14]/85"
    >
      <span className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Map
      </span>
      <div className="flex w-full flex-col items-center gap-1.5 px-1.5">
        {clauses.map((clause) => (
          <HeatmapPin
            key={clause.id}
            clause={clause}
            suggestion={redlinesByClauseId.get(clause.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </aside>
  );
};
