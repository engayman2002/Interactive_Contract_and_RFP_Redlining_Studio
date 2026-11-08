import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedlineCard } from "@/components/inspector/RedlineCard";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { HELP_GUIDE_MODULES, HELP_FAQ_ITEMS } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #2: Inline Clause AI Copilot & Custom Prompting", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the AI Copilot toggle button on every RedlineCard", () => {
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    const copilotToggle = screen.getByTestId(
      `toggle-copilot-btn-${suggestion.id}`
    );
    expect(copilotToggle).toBeInTheDocument();
    expect(copilotToggle).toHaveTextContent("AI Copilot");

    // Drawer is closed initially
    expect(
      screen.queryByTestId(`copilot-drawer-${suggestion.id}`)
    ).not.toBeInTheDocument();
  });

  it("toggles the AI Copilot drawer open and closed", () => {
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    const copilotToggle = screen.getByTestId(
      `toggle-copilot-btn-${suggestion.id}`
    );

    // Open drawer
    fireEvent.click(copilotToggle);
    expect(
      screen.getByTestId(`copilot-drawer-${suggestion.id}`)
    ).toBeInTheDocument();

    // Close drawer
    fireEvent.click(copilotToggle);
    expect(
      screen.queryByTestId(`copilot-drawer-${suggestion.id}`)
    ).not.toBeInTheDocument();
  });

  it("populates instruction input when quick directive chips are clicked", () => {
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    // Open drawer
    fireEvent.click(screen.getByTestId(`toggle-copilot-btn-${suggestion.id}`));

    const input = screen.getByTestId(
      `copilot-instruction-input-${suggestion.id}`
    ) as HTMLTextAreaElement;
    expect(input.value).toBe("");

    // Click Mutual chip
    fireEvent.click(screen.getByTestId(`copilot-chip-mutual-${suggestion.id}`));
    expect(input.value).toContain("mutual");

    // Click Cap chip
    fireEvent.click(screen.getByTestId(`copilot-chip-cap-${suggestion.id}`));
    expect(input.value).toContain("$100,000");

    // Click Cure chip
    fireEvent.click(screen.getByTestId(`copilot-chip-cure-${suggestion.id}`));
    expect(input.value).toContain("30-day");

    // Click Soften chip
    fireEvent.click(screen.getByTestId(`copilot-chip-soften-${suggestion.id}`));
    expect(input.value).toContain("Soften");
  });

  it("submits prompt instruction, refines suggestion, and records SUGGESTION_REFINED in audit trail", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);

    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    // Open Copilot drawer
    fireEvent.click(screen.getByTestId(`toggle-copilot-btn-${suggestion.id}`));

    // Click Cap Liability chip
    fireEvent.click(screen.getByTestId(`copilot-chip-cap-${suggestion.id}`));

    const submitBtn = screen.getByTestId(`copilot-submit-btn-${suggestion.id}`);
    expect(submitBtn).toBeEnabled();

    // Submit refinement
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      const updatedSuggestion = useWorkspaceStore
        .getState()
        .redlines.find((r) => r.id === suggestion.id);
      expect(updatedSuggestion?.proposed_text).toContain("$100,000");
      expect(updatedSuggestion?.rationale).toContain("[AI Copilot Refined:");
    });

    // Check that audit trail recorded SUGGESTION_REFINED
    const auditLogs = useWorkspaceStore.getState().auditLogs;
    const refinedEntry = auditLogs.find(
      (log) => log.action === "SUGGESTION_REFINED"
    );
    expect(refinedEntry).toBeDefined();
    expect(refinedEntry?.details?.suggestion_id).toBe(suggestion.id);
  });

  it("renders AI Copilot documentation tab in QuickHelpModal", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const copilotTab = screen.getByTestId("quick-help-tab-copilot");
    expect(copilotTab).toBeInTheDocument();
    expect(copilotTab).toHaveTextContent(/copilot/i);

    fireEvent.click(copilotTab);

    const copilotContent = screen.getByTestId("quick-help-content-copilot");
    expect(copilotContent).toBeInTheDocument();
    expect(copilotContent.textContent).toContain("Make Strictly Mutual");
    expect(copilotContent.textContent).toContain("Cap Liability at $100,000");
    expect(copilotContent.textContent).toContain("Add 30-Day Cure Period");
    expect(copilotContent.textContent).toContain("SUGGESTION_REFINED");
  });

  it("verifies Help Content Module #9 and FAQ items exist for AI Copilot", () => {
    const module9 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "inline-clause-ai-copilot"
    );
    expect(module9).toBeDefined();
    expect(module9?.number).toBe(9);
    expect(module9?.title).toContain("Inline Clause AI Copilot");

    const faqCopilot = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-inline-clause-copilot"
    );
    expect(faqCopilot).toBeDefined();
    expect(faqCopilot?.question).toContain("Inline Clause AI Copilot");

    const faqAudit = HELP_FAQ_ITEMS.find((f) => f.id === "faq-copilot-audit-trail");
    expect(faqAudit).toBeDefined();
    expect(faqAudit?.answer).toContain("SUGGESTION_REFINED");
  });
});
