"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import type { ClauseCommentDTO, ClauseDTO } from "@/services/contracts";

export interface ClauseCommentThreadProps {
  clause: ClauseDTO;
  comments: ClauseCommentDTO[];
  onAddComment: (clauseId: string, body: string) => Promise<void> | void;
  defaultExpanded?: boolean;
}

export const ClauseCommentThread: React.FC<ClauseCommentThreadProps> =
  React.memo(
    ({ clause, comments, onAddComment, defaultExpanded = false }) => {
      const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
      const [draftBody, setDraftBody] = useState<string>("");

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = draftBody.trim();
        if (!cleaned) {
          return;
        }
        setDraftBody("");
        setIsExpanded(true);
        await onAddComment(clause.id, cleaned);
      };

      return (
        <section
          aria-label={`Threaded Comments for Clause #${clause.clause_index + 1}`}
          data-testid="clause-comment-thread"
          data-clause-id={clause.id}
          className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-2 backdrop-blur-md transition-all dark:border-slate-800/80 dark:bg-[#070B14]/95"
        >
          {/* Collapsible Header */}
          <div
            className="flex cursor-pointer items-center justify-between gap-2"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <div className="flex min-w-0 items-center gap-2">
              <MessageSquare
                className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
              <h3 className="whitespace-nowrap text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Clause #{clause.clause_index + 1} Discussion
              </h3>
              {clause.heading ? (
                <span className="max-w-[160px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                  · {clause.heading}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                data-testid={`comment-count-${clause.id}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>
              <button
                type="button"
                data-testid="toggle-comment-thread-btn"
                aria-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                {isExpanded ? "▲ Collapse" : "▼ Expand"}
              </button>
            </div>
          </div>

          {/* Collapsible Content Body (Kept in DOM for test stability & immediate typing) */}
          <div
            data-testid="comment-thread-body"
            className={`pt-3 ${isExpanded ? "block" : "hidden"}`}
          >
            {/* Chronological Comment List */}
            <div
              data-testid={`comment-list-${clause.id}`}
              className="mb-3 max-h-36 space-y-2 overflow-y-auto pr-1"
            >
              {comments.length === 0 ? (
                <p className="text-xs italic text-slate-500 dark:text-slate-400">
                  No review notes on this clause yet. Add a comment below.
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    data-testid={`comment-item-${comment.id}`}
                    className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/80"
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-300">
                        Author: {comment.author_id.slice(0, 8)}
                      </span>
                      <time className="font-mono" dateTime={comment.created_at}>
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="leading-relaxed text-slate-800 dark:text-slate-200">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                aria-label="Clause comment body"
                placeholder={`Add a review comment on Clause #${
                  clause.clause_index + 1
                }...`}
                data-testid={`comment-input-${clause.id}`}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <button
                type="submit"
                data-testid={`post-comment-btn-${clause.id}`}
                disabled={!draftBody.trim()}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                Post Comment
              </button>
            </form>
          </div>
        </section>
      );
    }
  );

ClauseCommentThread.displayName = "ClauseCommentThread";
