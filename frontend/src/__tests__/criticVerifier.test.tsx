import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedlineCard } from "@/components/inspector/RedlineCard";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #4: Critic-Refiner Multi-Agent Verification Loop & Hallucination Guard", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Critic confidence badge and 3 verification gates on every RedlineCard", () => {
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    const badge = screen.getByTestId(
      `critic-confidence-badge-${suggestion.id}`
    );
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain(`${suggestion.confidence_score}%`);
    expect(badge.textContent).toContain("Verified");

    const panel = screen.getByTestId(`critic-guard-panel-${suggestion.id}`);
    expect(panel).toBeInTheDocument();
    expect(panel.textContent).toContain("Policy Grounded");
    expect(panel.textContent).toContain("Hallucination-Free");
    expect(panel.textContent).toContain("Obligations & Numbering Preserved");

    const verifyBtn = screen.getByTestId(`verify-critic-btn-${suggestion.id}`);
    expect(verifyBtn).toBeInTheDocument();
    expect(verifyBtn).toHaveTextContent("Re-Verify with Critic");
  });

  it("auto-repairs placeholders and missing numbering when Re-Verify with Critic is clicked", async () => {
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const brokenSuggestion = {
      ...DEMO_WORKSPACE_DATA.redlines[0],
      proposed_text:
        "Each party's aggregate cumulative liability shall not exceed [TBD] twelve (12) months of fees.",
      confidence_score: 71,
      verification_status: "NEEDS_HUMAN_REVIEW" as const,
      critic_notes: "Initial draft contains unverified placeholder [TBD].",
      hallucination_free_passed: false,
      obligation_preservation_passed: false,
    };

    useWorkspaceStore.getState().hydrateWorkspace({
      ...DEMO_WORKSPACE_DATA,
      redlines: [brokenSuggestion, ...DEMO_WORKSPACE_DATA.redlines.slice(1)],
    });

    const WrappedCard = () => {
      const latest = useWorkspaceStore((s) =>
        s.redlines.find((r) => r.id === brokenSuggestion.id)
      )!;
      return <RedlineCard clause={clause} suggestion={latest} />;
    };

    render(<WrappedCard />);

    const initialBadge = screen.getByTestId(
      `critic-confidence-badge-${brokenSuggestion.id}`
    );
    expect(initialBadge.textContent).toContain("Review Needed");

    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`verify-critic-btn-${brokenSuggestion.id}`)
      );
    });

    await waitFor(() => {
      const updatedBadge = screen.getByTestId(
        `critic-confidence-badge-${brokenSuggestion.id}`
      );
      expect(updatedBadge.textContent).toContain("Auto-Refined");
    });

    const updatedState = useWorkspaceStore.getState();
    const updatedSuggestion = updatedState.redlines.find(
      (r) => r.id === brokenSuggestion.id
    )!;
    expect(updatedSuggestion.proposed_text.startsWith("1.1 ")).toBe(true);
    expect(updatedSuggestion.proposed_text).not.toContain("[TBD]");
    expect(updatedSuggestion.critic_notes).toContain("Critic Auto-Refined");

    const auditEntry = updatedState.auditLogs.find(
      (log) => log.action === "SUGGESTION_VERIFIED"
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry?.details?.suggestion_id).toBe(brokenSuggestion.id);
  });

  it("appends SUGGESTION_VERIFIED in the Compliance Audit Trail tab when clicking Re-Verify in workspace", async () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const targetSuggestion = DEMO_WORKSPACE_DATA.redlines[0];
    const verifyBtn = screen.getByTestId(
      `verify-critic-btn-${targetSuggestion.id}`
    );

    await act(async () => {
      fireEvent.click(verifyBtn);
    });

    await waitFor(() => {
      expect(
        useWorkspaceStore
          .getState()
          .auditLogs.some((log) => log.action === "SUGGESTION_VERIFIED")
      ).toBe(true);
    });

    fireEvent.click(screen.getByTestId("inspector-tab-audit"));

    expect(
      screen.getByTestId("audit-entry-SUGGESTION_VERIFIED")
    ).toBeInTheDocument();
  });

  it("renders Critic Guard documentation tab in QuickHelpModal", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const criticTab = screen.getByTestId("quick-help-tab-critic");
    expect(criticTab).toBeInTheDocument();
    expect(criticTab).toHaveTextContent(/Critic Guard/i);

    fireEvent.click(criticTab);

    const criticContent = screen.getByTestId("quick-help-content-critic");
    expect(criticContent).toBeInTheDocument();
    expect(criticContent.textContent).toContain("Policy Grounded");
    expect(criticContent.textContent).toContain("Hallucination-Free");
    expect(criticContent.textContent).toContain("SUGGESTION_VERIFIED");
  });

  it("verifies Help Content Module #11 and FAQ items exist for Critic-Refiner Loop", () => {
    const module11 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "critic-verifier-guard"
    );
    expect(module11).toBeDefined();
    expect(module11?.number).toBe(11);
    expect(module11?.title).toContain("Critic-Refiner Multi-Agent Loop");

    const faqLoop = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-critic-verifier-loop"
    );
    expect(faqLoop).toBeDefined();
    expect(faqLoop?.answer).toContain("Critic & Hallucination Guard");

    const faqGates = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-critic-verification-gates"
    );
    expect(faqGates).toBeDefined();
    expect(faqGates?.answer).toContain("Re-Verify with Critic");
  });
});

