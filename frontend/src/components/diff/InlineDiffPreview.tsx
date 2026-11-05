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
      className="rounded-md border border-emerald-500/30 bg-slate-900/90 p-3 text-sm leading-relaxed text-slate-100 shadow-inner"
    >
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400">
        <span>Live Surgical Redline Preview</span>
        <span className="text-[11px] font-normal text-slate-400">
          Deletions in Crimson · Insertions in Emerald
        </span>
      </div>
      <p className="leading-relaxed">
        {diffTokens.map((token, idx) => {
          const key = `${token.type}-${idx}`;
          if (token.type === "delete") {
            return (
              <span
                key={key}
                data-testid="diff-token-delete"
                className="mx-0.5 rounded bg-rose-500/15 px-1 py-0.5 text-rose-400 line-through decoration-rose-400/80"
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
                className="mx-0.5 rounded bg-emerald-500/20 px-1 py-0.5 font-medium text-emerald-300"
              >
                {token.text}
              </span>
            );
          }
          return (
            <span
              key={key}
              data-testid="diff-token-equal"
              className="mx-0.5 text-slate-200"
            >
              {token.text}
            </span>
          );
        })}
      </p>
    </div>
  );
};

