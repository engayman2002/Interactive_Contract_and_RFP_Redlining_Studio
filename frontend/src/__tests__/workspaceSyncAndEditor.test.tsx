import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("Phase 5 Split-Screen Interactive Editor & Clause Binding", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  it("renders every contract clause with a persistent data-clause-id attribute mapped to its UUID", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    for (const clause of DEMO_WORKSPACE_DATA.clauses) {
      const clauseNode = screen.getByTestId(`editor-clause-${clause.id}`);
      expect(clauseNode).toBeInTheDocument();
      expect(clauseNode.getAttribute("data-clause-id")).toBe(clause.id);
      expect(clauseNode.getAttribute("data-clause-index")).toBe(
        String(clause.clause_index)
      );
    }
  });

  it("renders the Risk Heatmap Gutter with Crimson (CRITICAL), Amber (HIGH), and Emerald (COMPLIANT) indicators", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const gutter = screen.getByTestId("risk-heatmap-gutter");
    expect(gutter).toBeInTheDocument();

    // Clause 101: CRITICAL -> crimson
    const criticalMarker = screen.getByTestId(
      "heatmap-marker-c0000000-0000-4000-8000-000000000101"
    );
    expect(criticalMarker.getAttribute("data-risk-level")).toBe("CRITICAL");
    expect(criticalMarker.getAttribute("data-heatmap-tone")).toBe("crimson");

    // Clause 103: HIGH -> amber
    const highMarker = screen.getByTestId(
      "heatmap-marker-c0000000-0000-4000-8000-000000000103"
    );
    expect(highMarker.getAttribute("data-risk-level")).toBe("HIGH");
    expect(highMarker.getAttribute("data-heatmap-tone")).toBe("amber");

    // Clause 106: COMPLIANT -> emerald
    const compliantMarker = screen.getByTestId(
      "heatmap-marker-c0000000-0000-4000-8000-000000000106"
    );
    expect(compliantMarker.getAttribute("data-risk-level")).toBe("COMPLIANT");
    expect(compliantMarker.getAttribute("data-heatmap-tone")).toBe("emerald");
  });

  it("Phase 5 Acceptance Criteria: selecting any clause highlights its matching AI card within 16ms (60 FPS) with zero layout shift", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const splitContainer = screen.getByTestId("split-screen-container");
    const leftPaneBefore = splitContainer.children[0] as HTMLElement;
    const widthBefore = leftPaneBefore.style.width;

    for (const clause of DEMO_WORKSPACE_DATA.clauses) {
      const editorClauseEl = screen.getByTestId(`editor-clause-${clause.id}`);
      const inspectorCardEl = screen.getByTestId(`redline-card-${clause.id}`);

      const startTime = performance.now();
      act(() => {
        fireEvent.click(editorClauseEl);
      });
      const elapsedMs = performance.now() - startTime;

      expect(useWorkspaceStore.getState().activeClauseId).toBe(clause.id);
      expect(editorClauseEl.getAttribute("data-active")).toBe("true");
      expect(inspectorCardEl.getAttribute("data-active")).toBe("true");
      expect(elapsedMs).toBeLessThan(16);
    }

    // Verify zero layout shift in split-screen panes
    const leftPaneAfter = splitContainer.children[0] as HTMLElement;
    expect(leftPaneAfter.style.width).toBe(widthBefore);
  });

  it("renders live inline word-level diff inside the editor when hovering over Apply Redline", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const targetClauseId = "c0000000-0000-4000-8000-000000000101";
    const applyButton = screen.getByTestId(
      `apply-redline-btn-${targetClauseId}`
    );

    // Before hovering, inline diff preview is not shown
    expect(screen.queryByTestId("inline-diff-preview")).toBeNull();

    // Hover over Apply Redline button
    act(() => {
      fireEvent.mouseEnter(applyButton);
    });

    const diffPreview = screen.getByTestId("inline-diff-preview");
    expect(diffPreview).toBeInTheDocument();
    expect(diffPreview.getAttribute("data-diff-clause-id")).toBe(
      targetClauseId
    );

    const deleteTokens = screen.getAllByTestId("diff-token-delete");
    const insertTokens = screen.getAllByTestId("diff-token-insert");
    expect(deleteTokens.length).toBeGreaterThan(0);
    expect(insertTokens.length).toBeGreaterThan(0);
    expect(deleteTokens.map((el) => el.textContent).join(" ")).toContain(
      "$500,"
    );
    expect(insertTokens.map((el) => el.textContent).join(" ")).toContain(
      "twelve (12) months"
    );

    // Mouse leave restores standard clause display
    act(() => {
      fireEvent.mouseLeave(applyButton);
    });
    expect(screen.queryByTestId("inline-diff-preview")).toBeNull();
  });
});

