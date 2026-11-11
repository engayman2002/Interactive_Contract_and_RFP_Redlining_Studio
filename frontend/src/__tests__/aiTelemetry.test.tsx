import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #7: Semantic Clause Audit Cache & Live AI Telemetry / FinOps", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens AI Telemetry tab, displays FinOps KPI cards and recent events, and purges semantic cache", async () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const telemetryTab = screen.getByTestId("inspector-tab-telemetry");
    expect(telemetryTab).toBeInTheDocument();
    expect(telemetryTab).toHaveTextContent(/AI Telemetry/i);

    await act(async () => {
      fireEvent.click(telemetryTab);
    });

    await waitFor(() => {
      expect(screen.getByTestId("ai-telemetry-panel")).toBeInTheDocument();
    });

    const hitRateCard = screen.getByTestId("telemetry-cache-hit-rate");
    expect(hitRateCard).toBeInTheDocument();
    expect(hitRateCard.textContent).toMatch(/\d+\.\d%/);
    expect(hitRateCard.textContent).toContain("Cached Clauses");

    const tokensCard = screen.getByTestId("telemetry-tokens-saved");
    expect(tokensCard).toBeInTheDocument();
    expect(tokensCard.textContent).toContain("Tokens Saved");

    const latencyCard = screen.getByTestId("telemetry-avg-latency");
    expect(latencyCard).toBeInTheDocument();
    expect(latencyCard.textContent).toMatch(/\d+\.\d+ ms/);

    const costCard = screen.getByTestId("telemetry-cost-saved");
    expect(costCard).toBeInTheDocument();
    expect(costCard.textContent).toContain("Saved $");

    const eventsBox = screen.getByTestId("telemetry-recent-events");
    expect(eventsBox).toBeInTheDocument();
    expect(eventsBox.textContent).toContain("CACHE HIT");
    expect(eventsBox.textContent).toContain("LIVE INFERENCE");

    // Purge Semantic Cache
    const clearBtn = screen.getByTestId("clear-semantic-cache-btn");
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId("telemetry-status-banner")).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("telemetry-status-banner").textContent
    ).toMatch(/Purged \d+ cached clause audit/i);
    expect(hitRateCard.textContent).toContain("0 Cached Clauses");

    // Confirm Audit Trail recorded AI_CACHE_CLEARED
    fireEvent.click(screen.getByTestId("inspector-tab-audit"));
    expect(
      screen.getByTestId("audit-entry-AI_CACHE_CLEARED")
    ).toBeInTheDocument();
  });

  it("renders AI Telemetry documentation tab in QuickHelpModal and Help Center data", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const tab = screen.getByTestId("quick-help-tab-telemetry");
    expect(tab).toBeInTheDocument();
    fireEvent.click(tab);

    const content = screen.getByTestId("quick-help-content-telemetry");
    expect(content).toBeInTheDocument();
    expect(content.textContent).toContain("SHA-256");
    expect(content.textContent).toContain("Purge Semantic Cache");

    const module14 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "ai-semantic-cache-telemetry"
    );
    expect(module14).toBeDefined();
    expect(module14?.number).toBe(14);
    expect(module14?.title).toContain("Semantic Clause Audit Cache");

    const faqFreshness = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-semantic-cache-freshness"
    );
    expect(faqFreshness).toBeDefined();
    expect(faqFreshness?.answer).toContain("SHA-256");

    const faqPurge = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-telemetry-purge-cache"
    );
    expect(faqPurge).toBeDefined();
    expect(faqPurge?.answer).toContain("VIEWER");
  });
});

