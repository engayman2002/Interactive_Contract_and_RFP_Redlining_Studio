import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiInspectorPanel } from "@/components/inspector/AiInspectorPanel";
import { CrossClauseRadarPanel } from "@/components/inspector/CrossClauseRadarPanel";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #3: Cross-Clause Contradiction & Broken Reference Radar", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Cross-Clause Radar tab in AiInspectorPanel", () => {
    render(
      <AiInspectorPanel
        clauses={DEMO_WORKSPACE_DATA.clauses}
        redlines={DEMO_WORKSPACE_DATA.redlines}
      />
    );

    const radarTab = screen.getByTestId("inspector-tab-cross-clause");
    expect(radarTab).toBeInTheDocument();
    expect(radarTab).toHaveTextContent(/Radar/i);

    // Click radar tab
    fireEvent.click(radarTab);

    // Cross-Clause Radar panel should now be visible
    expect(
      screen.getByTestId("cross-clause-radar-panel")
    ).toBeInTheDocument();
  });

  it("executes cross-clause scan and displays integrity score and finding cards", async () => {
    // Populate store with clauses
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    render(
      <CrossClauseRadarPanel clauses={DEMO_WORKSPACE_DATA.clauses} />
    );

    const scanBtn = screen.getByTestId("run-cross-clause-check-btn");
    expect(scanBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(scanBtn);
    });

    await waitFor(() => {
      const scoreGauge = screen.getByTestId("cross-clause-integrity-score");
      expect(scoreGauge).toBeInTheDocument();
    });

    // Score should be clamped and formatted as a percentage
    const scoreElem = screen.getByTestId("cross-clause-integrity-score");
    expect(scoreElem.textContent).toMatch(/\d+%/);

    // Filter tabs should be present
    expect(screen.getByTestId("radar-filter-ALL")).toBeInTheDocument();
    expect(screen.getByTestId("radar-filter-CONTRADICTION")).toBeInTheDocument();
    expect(screen.getByTestId("radar-filter-BROKEN_REFERENCE")).toBeInTheDocument();
    expect(screen.getByTestId("radar-filter-UNDEFINED_TERM")).toBeInTheDocument();

    // Finding cards should be rendered
    const state = useWorkspaceStore.getState();
    expect(state.crossClauseReport).not.toBeNull();
    expect(state.crossClauseReport!.findings.length).toBeGreaterThan(0);

    const firstFinding = state.crossClauseReport!.findings[0];
    const findingCard = screen.getByTestId(
      `cross-clause-finding-${firstFinding.id}`
    );
    expect(findingCard).toBeInTheDocument();
    expect(findingCard.textContent).toContain(firstFinding.title);
  });

  it("navigates to source and conflicting clauses when jump buttons are clicked", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    render(
      <CrossClauseRadarPanel clauses={DEMO_WORKSPACE_DATA.clauses} />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-cross-clause-check-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("cross-clause-integrity-score")).toBeInTheDocument();
    });

    const report = useWorkspaceStore.getState().crossClauseReport!;
    const contradictionFinding = report.findings.find(
      (f) => f.issue_type === "CONTRADICTION" && f.target_clause_id
    );

    if (contradictionFinding) {
      const sourceJumpBtn = screen.getByTestId(
        `jump-source-clause-${contradictionFinding.id}`
      );
      expect(sourceJumpBtn).toBeInTheDocument();

      fireEvent.click(sourceJumpBtn);
      expect(useWorkspaceStore.getState().activeClauseId).toBe(
        contradictionFinding.source_clause_id
      );

      const targetJumpBtn = screen.getByTestId(
        `jump-target-clause-${contradictionFinding.id}`
      );
      expect(targetJumpBtn).toBeInTheDocument();

      fireEvent.click(targetJumpBtn);
      expect(useWorkspaceStore.getState().activeClauseId).toBe(
        contradictionFinding.target_clause_id
      );
    }
  });

  it("filters findings by issue category tab", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    render(
      <CrossClauseRadarPanel clauses={DEMO_WORKSPACE_DATA.clauses} />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-cross-clause-check-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("cross-clause-integrity-score")).toBeInTheDocument();
    });

    // Click CONTRADICTION filter
    fireEvent.click(screen.getByTestId("radar-filter-CONTRADICTION"));

    const report = useWorkspaceStore.getState().crossClauseReport!;
    const contradictions = report.findings.filter(
      (f) => f.issue_type === "CONTRADICTION"
    );

    contradictions.forEach((finding) => {
      expect(
        screen.getByTestId(`cross-clause-finding-${finding.id}`)
      ).toBeInTheDocument();
    });
  });

  it("renders Cross-Clause Radar documentation in QuickHelpModal", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const radarTab = screen.getByTestId("quick-help-tab-radar");
    expect(radarTab).toBeInTheDocument();
    expect(radarTab).toHaveTextContent(/Radar/i);

    fireEvent.click(radarTab);

    const radarContent = screen.getByTestId("quick-help-content-radar");
    expect(radarContent).toBeInTheDocument();
    expect(radarContent.textContent).toContain("Contradictions");
    expect(radarContent.textContent).toContain("Broken References");
    expect(radarContent.textContent).toContain("Undefined Terms");
    expect(radarContent.textContent).toContain("Document Integrity Score");
  });

  it("verifies Help Content Module #10 and FAQ items exist for Cross-Clause Radar", () => {
    const module10 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "cross-clause-radar"
    );
    expect(module10).toBeDefined();
    expect(module10?.number).toBe(10);
    expect(module10?.title).toContain("Cross-Clause Contradiction & Reference Radar");

    const faqRadar = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-cross-clause-radar"
    );
    expect(faqRadar).toBeDefined();
    expect(faqRadar?.question).toContain("Cross-Clause");

    const faqScore = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-integrity-score-calculation"
    );
    expect(faqScore).toBeDefined();
    expect(faqScore?.answer).toContain("Document Integrity Score");
  });
});
