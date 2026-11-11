import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HelpCenterPage from "@/app/help/page";
import DashboardPage from "@/app/page";
import { RedlineCard } from "@/components/inspector/RedlineCard";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/help",
}));

describe("UX Overhaul & Interactive 5-Stage Masterclass Tutorial", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  it("renders Interactive 5-Stage Tutorial Wizard on /help and navigates smoothly across steps", () => {
    render(<HelpCenterPage />);

    const wizard = screen.getByTestId("interactive-tutorial-wizard");
    expect(wizard).toBeInTheDocument();

    // Stage 1 (index 0) active initially
    expect(screen.getByTestId("tutorial-step-0")).toBeInTheDocument();
    expect(screen.getByTestId("tutorial-step-0").textContent).toContain(
      "Build or Auto-Extract Your Company Playbook"
    );
    expect(screen.getByTestId("tutorial-prev-btn")).toBeDisabled();

    // Click Next -> Stage 2 (index 1)
    fireEvent.click(screen.getByTestId("tutorial-next-btn"));
    expect(screen.getByTestId("tutorial-step-1")).toBeInTheDocument();
    expect(screen.getByTestId("tutorial-step-1").textContent).toContain(
      "Upload Your Contract & Configure AI Engine"
    );

    // Jump directly to Stage 4 (index 3) via stepper pill
    fireEvent.click(screen.getByTestId("tutorial-step-btn-3"));
    const step3 = screen.getByTestId("tutorial-step-3");
    expect(step3).toBeInTheDocument();
    expect(step3.textContent).toContain("Master Clause Redlining");
    expect(screen.getByTestId("tutorial-try-live-btn")).toHaveAttribute(
      "href",
      "/documents/demo"
    );

    // Previous -> Stage 3 (index 2)
    fireEvent.click(screen.getByTestId("tutorial-prev-btn"));
    expect(screen.getByTestId("tutorial-step-2")).toBeInTheDocument();
  });

  it("filters the 14 Help Center modules cleanly via Categorized Learning Tracks", () => {
    render(<HelpCenterPage />);

    expect(screen.getByTestId("help-learning-tracks")).toBeInTheDocument();

    // Filter to 3. AI Agents & Negotiation
    fireEvent.click(screen.getByTestId("track-filter-ai-agents"));
    expect(
      screen.getByTestId("help-module-card-inline-clause-ai-copilot")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-counterparty-pushback-simulator")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("help-module-card-uploading-contracts")
    ).not.toBeInTheDocument();

    // Filter to 4. Security, Vault & FinOps
    fireEvent.click(screen.getByTestId("track-filter-ops"));
    expect(
      screen.getByTestId("help-module-card-ai-semantic-cache-telemetry")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("help-module-card-inline-clause-ai-copilot")
    ).not.toBeInTheDocument();

    // Restore All Guides (14)
    fireEvent.click(screen.getByTestId("track-filter-all"));
    expect(
      screen.getByTestId("help-module-card-uploading-contracts")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-ai-semantic-cache-telemetry")
    ).toBeInTheDocument();
  });

  it("enforces mutual-exclusion progressive disclosure between AI Copilot and Pushback Simulator drawers in RedlineCard", async () => {
    useWorkspaceStore.getState().hydrateWorkspace(DEMO_WORKSPACE_DATA);
    const clause = DEMO_WORKSPACE_DATA.clauses[0];
    const suggestion = DEMO_WORKSPACE_DATA.redlines[0];

    render(<RedlineCard clause={clause} suggestion={suggestion} />);

    // Open Copilot drawer first
    fireEvent.click(screen.getByTestId(`toggle-copilot-btn-${suggestion.id}`));
    expect(
      screen.getByTestId(`copilot-drawer-${suggestion.id}`)
    ).toBeInTheDocument();

    // Click Simulate Pushback -> Pushback drawer opens AND Copilot drawer closes automatically
    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`simulate-pushback-btn-${suggestion.id}`)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`pushback-simulator-panel-${suggestion.id}`)
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId(`copilot-drawer-${suggestion.id}`)
    ).not.toBeInTheDocument();

    // Re-click Copilot -> Copilot opens AND Pushback panel closes automatically
    fireEvent.click(screen.getByTestId(`toggle-copilot-btn-${suggestion.id}`));
    expect(
      screen.getByTestId(`copilot-drawer-${suggestion.id}`)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`pushback-simulator-panel-${suggestion.id}`)
    ).not.toBeInTheDocument();
  });

  it("renders Dashboard onboarding tutorial banner and Studio 4-step workflow bar", async () => {
    render(<DashboardPage />);

    expect(
      screen.getByTestId("dashboard-onboarding-banner")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard-start-tutorial-btn")
    ).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("dashboard-guided-demo-btn")).toHaveAttribute(
      "href",
      "/documents/demo"
    );

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);
    expect(
      screen.getByTestId("open-interactive-tutorial-btn")
    ).toHaveAttribute("href", "/help");
    expect(
      screen.getByTestId("studio-quick-guide-banner")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("studio-quick-guide-banner").textContent
    ).toContain("Upload / Select Contract");
    expect(
      screen.getByTestId("studio-quick-guide-banner").textContent
    ).toContain("Export Word (.docx)");
  });
});

