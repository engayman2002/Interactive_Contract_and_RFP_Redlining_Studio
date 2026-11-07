"use client";

import React, { useMemo } from "react";
import { computeWordDiff } from "./wordDiff";

export interface InlineDiffPreviewProps {
  originalText: string;
  proposedText: string;
  clauseId?: string;
}

export const InlineDiffPreview: React.FC<InlineDiffPreviewProps> = ({
  originalText,
  proposedText,
  clauseId,
}) => {
  const diffTokens = useMemo(
    () => computeWordDiff(originalText, proposedText),
    [originalText, proposedText]
  );

  return (
    <div
      data-testid="inline-diff-preview"
      data-diff-clause-id={clauseId}
      className="rounded-xl border border-emerald-200/90 bg-emerald-50/35 p-4 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-950/20"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:text-emerald-300">
        <span>Live Surgical Redline Preview</span>
        <span className="font-sans text-[11px] font-normal normal-case text-slate-500 dark:text-slate-400">
          <span className="font-medium text-rose-700 dark:text-rose-300">
            Strikethrough
          </span>{" "}
          deletions ·{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            Highlighted
          </span>{" "}
          insertions
        </span>
      </div>
      <p className="legal-document-prose text-slate-800 dark:text-slate-100">
        {diffTokens.map((token, idx) => {
          const key = `${token.type}-${idx}`;
          if (token.type === "delete") {
            return (
              <span
                key={key}
                data-testid="diff-token-delete"
                className="mx-0.5 rounded bg-rose-100/90 px-1 py-0.5 text-rose-800 line-through decoration-rose-500/80 dark:bg-rose-500/20 dark:text-rose-300 dark:decoration-rose-400/80"
              >
                {token.text}
              </span>
            );
          }
          if (token.type === "insert") {
            return (
              <span
                key={key}
                data-testid="diff-token-insert"
                className="mx-0.5 rounded bg-emerald-100/90 px-1 py-0.5 font-medium text-emerald-900 underline decoration-emerald-500/80 dark:bg-emerald-500/20 dark:text-emerald-200 dark:decoration-emerald-400"
              >
                {token.text}
              </span>
            );
          }
          return (
            <span
              key={key}
              data-testid="diff-token-equal"
              className="mx-0.5 text-slate-800 dark:text-slate-200"
            >
              {token.text}
            </span>
          );
        })}
      </p>
    </div>
  );
};
