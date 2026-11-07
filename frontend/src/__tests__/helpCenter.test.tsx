import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HelpCenterPage from "@/app/help/page";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/help",
}));

describe("Interactive In-App Help Center & Studio Quick-Help Guide", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the /help page with all 6 core user guide modules, Risk Heatmap legend, Playbook templates, and Export comparison table", () => {
    render(<HelpCenterPage />);

    expect(screen.getByTestId("help-center-page")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-input")).toBeInTheDocument();

    // Verify all 6 guide modules render
    expect(
      screen.getByTestId("help-module-card-quick-start")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-uploading-contracts")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-writing-playbook-rules")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-mastering-studio")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-collaboration-concurrency-audit")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("help-module-card-exporting-word-docx")
    ).toBeInTheDocument();

    // Verify visual heatmap legend, inline diff demo, playbook templates, and export comparison table
    expect(screen.getByTestId("help-heatmap-legend")).toBeInTheDocument();
    expect(screen.getByTestId("help-inline-diff-demo")).toBeInTheDocument();
    expect(screen.getByTestId("help-playbook-templates")).toBeInTheDocument();
    expect(
      screen.getByTestId("help-export-comparison-table")
    ).toBeInTheDocument();
  });

  it("dynamically filters guide modules and FAQs when typing into the Help Center search input", () => {
    render(<HelpCenterPage />);

    const searchInput = screen.getByTestId(
      "help-search-input"
    ) as HTMLInputElement;

    // Filter by "track changes"
    act(() => {
      fireEvent.change(searchInput, { target: { value: "track changes" } });
    });

    expect(
      screen.getByTestId("help-module-card-exporting-word-docx")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("help-module-card-uploading-contracts")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("faq-item-faq-word-compatibility")
    ).toBeInTheDocument();

    // Clear search and verify all modules reappear
    const clearBtn = screen.getByTestId("clear-help-search-btn");
    act(() => {
      fireEvent.click(clearBtn);
    });

    expect(
      screen.getByTestId("help-module-card-uploading-contracts")
    ).toBeInTheDocument();
  });

  it("opens the contextual Quick Help modal inside RedliningStudioWorkspace without losing active clause selection", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    // Select Clause #2 in the editor
    const secondClauseId = DEMO_WORKSPACE_DATA.clauses[1].id;
    const secondClauseEl = screen.getByTestId(
      `editor-clause-${secondClauseId}`
    );
    act(() => {
      fireEvent.click(secondClauseEl);
    });
    expect(useWorkspaceStore.getState().activeClauseId).toBe(secondClauseId);

    // Click ? Help Guide button in studio header
    const openHelpBtn = screen.getByTestId("open-quick-help-btn");
    act(() => {
      fireEvent.click(openHelpBtn);
    });

    const modal = screen.getByTestId("quick-help-modal");
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByTestId("quick-help-content-workflow")
    ).toBeInTheDocument();

    // Switch to Risk Heatmap & Diff Legend tab
    act(() => {
      fireEvent.click(screen.getByTestId("quick-help-tab-heatmap"));
    });
    expect(
      screen.getByTestId("quick-help-content-heatmap")
    ).toBeInTheDocument();

    // Switch to Export Modes tab
    act(() => {
      fireEvent.click(screen.getByTestId("quick-help-tab-export"));
    });
    expect(screen.getByTestId("quick-help-content-export")).toBeInTheDocument();

    // Close modal and verify activeClauseId is preserved
    act(() => {
      fireEvent.click(screen.getByTestId("close-quick-help-modal-btn"));
    });
    expect(screen.queryByTestId("quick-help-modal")).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().activeClauseId).toBe(secondClauseId);
  });
});

