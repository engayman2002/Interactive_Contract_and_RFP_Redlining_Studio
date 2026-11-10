import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedlineCard } from "@/components/inspector/RedlineCard";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #5: Counterparty Pushback Simulator & Round-2 Rebuttal Engine", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clicks Simulate Pushback and displays probability, severity, objection, rebuttal, and Round-2 compromise", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    const simBtn = screen.getByTestId(`simulate-pushback-btn-${suggestion.id}`);
    expect(simBtn).toBeInTheDocument();
    expect(simBtn).toHaveTextContent(/Simulate Pushback/i);

    await act(async () => {
      fireEvent.click(simBtn);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`pushback-simulator-panel-${suggestion.id}`)
      ).toBeInTheDocument();
    });

    const probBadge = screen.getByTestId(
      `pushback-probability-badge-${suggestion.id}`
    );
    expect(probBadge.textContent).toMatch(/Acceptance Likelihood:\s*\d+%/);

    const sevBadge = screen.getByTestId(
      `pushback-severity-badge-${suggestion.id}`
    );
    expect(sevBadge.textContent).toMatch(/(LOW|MODERATE|HIGH|DEALBREAKER)/);

    const objectionEl = screen.getByTestId(
      `pushback-objection-text-${suggestion.id}`
    );
    expect(objectionEl.textContent?.length).toBeGreaterThan(20);

    const rebuttalEl = screen.getByTestId(
      `pushback-rebuttal-text-${suggestion.id}`
    );
    expect(rebuttalEl.textContent?.length).toBeGreaterThan(20);

    const compromiseEl = screen.getByTestId(
      `pushback-compromise-text-${suggestion.id}`
    );
    expect(compromiseEl.textContent).toContain("1.1");
  });

  it("applies Round-2 Compromise Wording to the suggestion card when clicking Use Compromise Wording", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestionId = DEMO_WORKSPACE_DATA.redlines[0].id;

    const WrappedCard = () => {
      const latest = useWorkspaceStore((s) =>
        s.redlines.find((r) => r.id === suggestionId)
      )!;
      return <RedlineCard clause={clause} suggestion={latest} />;
    };

    render(<WrappedCard />);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`simulate-pushback-btn-${suggestionId}`)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`apply-compromise-btn-${suggestionId}`)
      ).toBeInTheDocument();
    });

    const expectedCompromise =
      useWorkspaceStore.getState().pushbackSimulations[suggestionId]
        .fallback_compromise_text;

    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`apply-compromise-btn-${suggestionId}`)
      );
    });

    const updatedSuggestion = useWorkspaceStore
      .getState()
      .redlines.find((r) => r.id === suggestionId)!;
    expect(updatedSuggestion.proposed_text).toBe(expectedCompromise);
    expect(
      screen.getByTestId(`proposed-text-${suggestionId}`).textContent
    ).toBe(expectedCompromise);
  });

  it("records PUSHBACK_SIMULATED in the Compliance Audit Trail tab inside workspace", async () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const targetSuggestion = DEMO_WORKSPACE_DATA.redlines[0];

    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`simulate-pushback-btn-${targetSuggestion.id}`)
      );
    });

    await waitFor(() => {
      expect(
        useWorkspaceStore
          .getState()
          .auditLogs.some((log) => log.action === "PUSHBACK_SIMULATED")
      ).toBe(true);
    });

    fireEvent.click(screen.getByTestId("inspector-tab-audit"));

    expect(
      screen.getByTestId("audit-entry-PUSHBACK_SIMULATED")
    ).toBeInTheDocument();
  });

  it("renders Pushback Simulator documentation tab in QuickHelpModal", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const pushbackTab = screen.getByTestId("quick-help-tab-pushback");
    expect(pushbackTab).toBeInTheDocument();
    expect(pushbackTab).toHaveTextContent(/Pushback Sim/i);

    fireEvent.click(pushbackTab);

    const pushbackContent = screen.getByTestId("quick-help-content-pushback");
    expect(pushbackContent).toBeInTheDocument();
    expect(pushbackContent.textContent).toContain("Acceptance Likelihood");
    expect(pushbackContent.textContent).toContain("Use Compromise Wording");
    expect(pushbackContent.textContent).toContain("PUSHBACK_SIMULATED");
  });

  it("verifies Help Content Module #12 and FAQ items exist for Counterparty Pushback Simulator", () => {
    const module12 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "counterparty-pushback-simulator"
    );
    expect(module12).toBeDefined();
    expect(module12?.number).toBe(12);
    expect(module12?.title).toContain("Counterparty Pushback Simulator");

    const faqSim = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-pushback-simulator"
    );
    expect(faqSim).toBeDefined();
    expect(faqSim?.answer).toContain("Acceptance Probability");

    const faqComp = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-pushback-compromise"
    );
    expect(faqComp).toBeDefined();
    expect(faqComp?.answer).toContain("Use Compromise Wording");
  });
});
