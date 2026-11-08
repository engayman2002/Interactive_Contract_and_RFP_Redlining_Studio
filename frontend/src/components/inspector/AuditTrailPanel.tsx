"use client";

import React from "react";
import type { AuditAction, AuditLogEntryDTO } from "@/services/contracts";

export interface AuditTrailPanelProps {
  auditLogs: AuditLogEntryDTO[];
}

const ACTION_BADGE_STYLES: Record<AuditAction, string> = {
  DOCUMENT_INGESTED:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  DOCUMENT_ANALYZED:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
  SUGGESTION_ACCEPTED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  SUGGESTION_MODIFIED:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  SUGGESTION_REJECTED:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  SUGGESTION_REFINED:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300",
  COMMENT_CREATED:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
  DOCUMENT_EXPORTED:
    "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
  CROSS_CLAUSE_CHECKED:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300",
};

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({
  auditLogs,
}) => {
  return (
    <div
      data-testid="audit-trail-panel"
      className="flex-1 space-y-2.5 overflow-y-auto p-4"
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          Immutable Compliance Audit Trail
        </span>
        <span
          data-testid="audit-trail-count"
          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {auditLogs.length} events
        </span>
      </div>

      {auditLogs.length === 0 ? (
        <p className="text-xs italic text-slate-500 dark:text-slate-400">
          No compliance audit events recorded yet.
        </p>
      ) : (
        auditLogs.map((entry) => {
          const badgeStyle =
            ACTION_BADGE_STYLES[entry.action] ??
            "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

          return (
            <div
              key={entry.id}
              data-testid={`audit-entry-${entry.action}`}
              className="rounded-xl border border-slate-200/90 bg-white p-3.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${badgeStyle}`}
                >
                  {entry.action}
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {entry.actor_role} · {entry.actor_user_id.slice(0, 8)}
                </span>
              </div>

              {Object.keys(entry.details).length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                  {Object.entries(entry.details).map(([key, val]) => (
                    <span
                      key={key}
                      className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
};
