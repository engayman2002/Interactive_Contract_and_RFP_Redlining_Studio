"use client";

import React from "react";
import type { AuditAction, AuditLogEntryDTO } from "@/services/contracts";

export interface AuditTrailPanelProps {
  auditLogs: AuditLogEntryDTO[];
}

const ACTION_BADGE_STYLES: Record<AuditAction, string> = {
  DOCUMENT_INGESTED:
    "border-sky-500/30 bg-sky-500/15 text-sky-300",
  DOCUMENT_ANALYZED:
    "border-indigo-500/30 bg-indigo-500/15 text-indigo-300",
  SUGGESTION_ACCEPTED:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  SUGGESTION_MODIFIED:
    "border-amber-500/30 bg-amber-500/15 text-amber-300",
  SUGGESTION_REJECTED:
    "border-rose-500/30 bg-rose-500/15 text-rose-300",
  COMMENT_CREATED:
    "border-purple-500/30 bg-purple-500/15 text-purple-300",
  DOCUMENT_EXPORTED:
    "border-teal-500/30 bg-teal-500/15 text-teal-300",
};

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({
  auditLogs,
}) => {
  return (
    <div
      data-testid="audit-trail-panel"
      className="flex-1 space-y-2.5 overflow-y-auto p-4"
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-semibold text-slate-200">
          Immutable Compliance Audit Trail
        </span>
        <span
          data-testid="audit-trail-count"
          className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300"
        >
          {auditLogs.length} events
        </span>
      </div>

      {auditLogs.length === 0 ? (
        <p className="text-xs italic text-slate-500">
          No compliance audit events recorded yet.
        </p>
      ) : (
        auditLogs.map((entry) => {
          const badgeStyle =
            ACTION_BADGE_STYLES[entry.action] ??
            "border-slate-700 bg-slate-800 text-slate-300";

          return (
            <div
              key={entry.id}
              data-testid={`audit-entry-${entry.action}`}
              className="rounded-lg border border-slate-800/90 bg-slate-900/50 p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeStyle}`}
                >
                  {entry.action}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {entry.actor_role} · {entry.actor_user_id.slice(0, 8)}
                </span>
              </div>

              {Object.keys(entry.details).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {Object.entries(entry.details).map(([key, val]) => (
                    <span
                      key={key}
                      className="rounded bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-slate-300"
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

