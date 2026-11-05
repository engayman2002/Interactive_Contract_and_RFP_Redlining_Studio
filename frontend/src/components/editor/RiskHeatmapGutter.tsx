"use client";

import React from "react";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ClauseRiskBadge, resolveClauseRiskBadge } from "./ClauseNodeExtension";

export interface RiskHeatmapGutterProps {
  clauses: ClauseDTO[];
  redlinesByClauseId: ReadonlyMap<string, RedlineSuggestionDTO>;
}

const HEATMAP_COLOR_MAP: Record<
  ClauseRiskBadge,
  { bg: string; label: string; tone: string }
> = {
  CRITICAL: {
    bg: "bg-rose-500 border-rose-400 shadow-rose-500/40",
    label: "Critical Risk (Crimson)",
    tone: "crimson",
  },
  HIGH: {
    bg: "bg-amber-500 border-amber-400 shadow-amber-500/40",
    label: "High Risk (Amber)",
    tone: "amber",
  },
  MEDIUM: {
    bg: "bg-sky-400 border-sky-300 shadow-sky-400/30",
    label: "Medium Risk (Sky)",
    tone: "sky",
  },
  LOW: {
    bg: "bg-sky-500/70 border-sky-400/70",
    label: "Low Risk",
    tone: "sky",
  },
  COMPLIANT: {
    bg: "bg-emerald-500 border-emerald-400 shadow-emerald-500/40",
    label: "Compliant (Emerald)",
    tone: "emerald",
  },
};

export const RiskHeatmapGutter: React.FC<RiskHeatmapGutterProps> = ({
  clauses,
  redlinesByClauseId,
}) => {
  const activeClauseId = useWorkspaceStore((state) => state.activeClauseId);
  const selectClause = useWorkspaceStore((state) => state.selectClause);

  return (
    <aside
      aria-label="Risk Heatmap Gutter"
      data-testid="risk-heatmap-gutter"
      className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-slate-800 bg-slate-950/90 py-4"
    >
      <span className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        Risk
      </span>
      <div className="flex w-full flex-col items-center gap-2 px-1.5">
        {clauses.map((clause) => {
          const suggestion = redlinesByClauseId.get(clause.id);
          const riskBadge = resolveClauseRiskBadge(suggestion);
          const styleInfo = HEATMAP_COLOR_MAP[riskBadge];
          const isSelected = activeClauseId === clause.id;

          return (
            <button
              key={clause.id}
              type="button"
              data-testid={`heatmap-marker-${clause.id}`}
              data-clause-id={clause.id}
              data-risk-level={riskBadge}
              data-heatmap-tone={styleInfo.tone}
              title={`Clause ${clause.clause_index + 1}: ${clause.heading ?? "Provision"} — ${styleInfo.label}`}
              onClick={() => selectClause(clause.id, "editor")}
              className={`group relative flex h-7 w-full items-center justify-center rounded transition-all ${
                isSelected
                  ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <span
                className={`h-5 w-2.5 rounded-sm border shadow-sm transition-transform group-hover:scale-110 ${styleInfo.bg}`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
};

