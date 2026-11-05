import { Node, mergeAttributes } from "@tiptap/core";
import type { JSONContent } from "@tiptap/react";
import type { ClauseDTO, RedlineSuggestionDTO } from "@/services/contracts";

export type ClauseRiskBadge =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "COMPLIANT";

export interface ClauseBlockAttributes {
  clauseId: string;
  clauseIndex: number;
  heading: string | null;
  riskLevel: ClauseRiskBadge;
}

/**
 * Custom TipTap / ProseMirror Node (`clauseBlock`) that wraps every contract paragraph
 * with a persistent `data-clause-id` attribute mapped to `document_clauses.id` in PostgreSQL.
 */
export const ClauseNodeExtension = Node.create({
  name: "clauseBlock",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      clauseId: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-clause-id") ?? "",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-clause-id": String(attributes.clauseId ?? ""),
        }),
      },
      clauseIndex: {
        default: 0,
        parseHTML: (element: HTMLElement) =>
          Number(element.getAttribute("data-clause-index") ?? "0"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-clause-index": String(attributes.clauseIndex ?? 0),
        }),
      },
      heading: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-clause-heading"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.heading
            ? { "data-clause-heading": String(attributes.heading) }
            : {},
      },
      riskLevel: {
        default: "COMPLIANT",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-risk-level") ?? "COMPLIANT",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-risk-level": String(attributes.riskLevel ?? "COMPLIANT"),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-clause-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "tiptap-clause-node",
      }),
      0,
    ];
  },
});

export function resolveClauseRiskBadge(
  suggestion?: RedlineSuggestionDTO
): ClauseRiskBadge {
  if (!suggestion || suggestion.status === "REJECTED") {
    return "COMPLIANT";
  }
  if (suggestion.status === "ACCEPTED" || suggestion.status === "MODIFIED") {
    return "COMPLIANT";
  }
  return suggestion.risk;
}

export function buildTipTapDocumentFromClauses(
  clauses: ClauseDTO[],
  redlinesByClauseId: ReadonlyMap<string, RedlineSuggestionDTO>
): JSONContent {
  return {
    type: "doc",
    content: clauses.map((clause) => {
      const suggestion = redlinesByClauseId.get(clause.id);
      const riskLevel = resolveClauseRiskBadge(suggestion);
      return {
        type: "clauseBlock",
        attrs: {
          clauseId: clause.id,
          clauseIndex: clause.clause_index,
          heading: clause.heading ?? null,
          riskLevel,
        },
        content: [
          {
            type: "text",
            text: clause.current_text,
          },
        ],
      };
    }),
  };
}

