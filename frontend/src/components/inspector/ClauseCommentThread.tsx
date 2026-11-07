"use client";

import React, { useState } from "react";
import type { ClauseCommentDTO, ClauseDTO } from "@/services/contracts";

export interface ClauseCommentThreadProps {
  clause: ClauseDTO;
  comments: ClauseCommentDTO[];
  onAddComment: (clauseId: string, body: string) => Promise<void> | void;
  defaultExpanded?: boolean;
}

export const ClauseCommentThread: React.FC<ClauseCommentThreadProps> = React.memo(({
  clause,
  comments,
  onAddComment,
  defaultExpanded = false,
}) => {
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
      className="border-t border-slate-800 bg-slate-900/95 px-4 py-2.5 transition-all"
    >
      {/* Collapsible Header */}
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-400">💬</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Clause #{clause.clause_index + 1} Discussion Thread
          </h3>
          {clause.heading ? (
            <span className="max-w-[160px] truncate text-[11px] text-slate-400">
              ({clause.heading})
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid={`comment-count-${clause.id}`}
            className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300"
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
            className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            {isExpanded ? "▲ Collapse" : "▼ Expand"}
          </button>
        </div>
      </div>

      {/* Collapsible Content Body (Kept in DOM for test stability & immediate typing) */}
      <div
        data-testid="comment-thread-body"
        className={`pt-2.5 ${isExpanded ? "block" : "hidden"}`}
      >
        {/* Chronological Comment List */}
        <div
          data-testid={`comment-list-${clause.id}`}
          className="mb-3 max-h-36 space-y-2 overflow-y-auto pr-1"
        >
          {comments.length === 0 ? (
            <p className="text-xs italic text-slate-500">
              No comments on this clause yet. Start a review thread below.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                data-testid={`comment-item-${comment.id}`}
                className="rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs"
              >
                <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono font-semibold text-indigo-300">
                    Author: {comment.author_id.slice(0, 8)}
                  </span>
                  <time dateTime={comment.created_at}>
                    {new Date(comment.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="leading-relaxed text-slate-200">{comment.body}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Clause comment body"
            placeholder={`Add a comment on Clause #${clause.clause_index + 1}...`}
            data-testid={`comment-input-${clause.id}`}
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            data-testid={`post-comment-btn-${clause.id}`}
            disabled={!draftBody.trim()}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            Post Comment
          </button>
        </form>
      </div>
    </section>
  );
});

ClauseCommentThread.displayName = "ClauseCommentThread";

