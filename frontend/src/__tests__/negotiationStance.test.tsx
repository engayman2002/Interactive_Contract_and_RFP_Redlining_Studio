import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import {
  DEMO_WORKSPACE_DATA,
  getLocalDocumentWorkspace,
  saveLocalDocumentWorkspace,
  triggerDocumentAnalysis,
} from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AI Feature #1: Negotiation Stance Selector (Strict vs Balanced vs Commercial)", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  it("renders the negotiation stance selector with strict, balanced, and commercial buttons in the studio header", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const selector = screen.getByTestId("negotiation-stance-selector");
    expect(selector).toBeInTheDocument();

    const strictBtn = screen.getByTestId("stance-option-strict");
    const balancedBtn = screen.getByTestId("stance-option-balanced");
    const commercialBtn = screen.getByTestId("stance-option-commercial");

    expect(strictBtn).toBeInTheDocument();
    expect(balancedBtn).toBeInTheDocument();
    expect(commercialBtn).toBeInTheDocument();

    // Default active stance is balanced
    expect(useWorkspaceStore.getState().negotiationStance).toBe("balanced");
    expect(balancedBtn.className).toContain("bg-indigo-600");

    // Inspector active stance badge should reflect balanced
    const inspectorBadge = screen.getByTestId("inspector-active-stance-badge");
    expect(inspectorBadge).toHaveTextContent(/stance:\s*balanced/i);
  });

  it("switches negotiation stance to commercial and updates the inspector badge and store", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const commercialBtn = screen.getByTestId("stance-option-commercial");
    act(() => {
      fireEvent.click(commercialBtn);
    });

    expect(useWorkspaceStore.getState().negotiationStance).toBe("commercial");
    expect(commercialBtn.className).toContain("bg-emerald-600");

    const inspectorBadge = screen.getByTestId("inspector-active-stance-badge");
    expect(inspectorBadge).toHaveTextContent(/stance:\s*commercial/i);
  });

  it("switches negotiation stance to strict and updates the inspector badge and store", () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const strictBtn = screen.getByTestId("stance-option-strict");
    act(() => {
      fireEvent.click(strictBtn);
    });

    expect(useWorkspaceStore.getState().negotiationStance).toBe("strict");
    expect(strictBtn.className).toContain("bg-rose-600");

    const inspectorBadge = screen.getByTestId("inspector-active-stance-badge");
    expect(inspectorBadge).toHaveTextContent(/stance:\s*strict/i);
  });

  it("applies commercial fallback redlines and fast-close rationales when triggerDocumentAnalysis is run with commercial stance", async () => {
    const testDocId = "test-doc-stance-comm";
    saveLocalDocumentWorkspace({
      ...DEMO_WORKSPACE_DATA,
      document_id: testDocId,
      redlines: [],
    });

    const summary = await triggerDocumentAnalysis(testDocId, undefined, "commercial");
    expect(summary.stance).toBe("commercial");

    const workspace = getLocalDocumentWorkspace(testDocId);
    expect(workspace).not.toBeNull();
    expect(workspace?.redlines.length).toBeGreaterThan(0);

    const firstRedline = workspace?.redlines[0];
    expect(firstRedline?.proposed_text).toContain("two times (2x)");
    expect(firstRedline?.rationale).toContain("[Commercial Fast-Close Stance]");
  });

  it("applies strict standard redlines and protective rationales when triggerDocumentAnalysis is run with strict stance", async () => {
    const testDocId = "test-doc-stance-strict";
    saveLocalDocumentWorkspace({
      ...DEMO_WORKSPACE_DATA,
      document_id: testDocId,
      redlines: [],
    });

    const summary = await triggerDocumentAnalysis(testDocId, undefined, "strict");
    expect(summary.stance).toBe("strict");

    const workspace = getLocalDocumentWorkspace(testDocId);
    expect(workspace).not.toBeNull();
    expect(workspace?.redlines.length).toBeGreaterThan(0);

    const firstRedline = workspace?.redlines[0];
    expect(firstRedline?.proposed_text).toContain("twelve (12) months");
    expect(firstRedline?.rationale).toContain("[Strict Protective Stance]");
  });

  it("renders the AI Stances tab and documentation in QuickHelpModal", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const stanceTab = screen.getByTestId("quick-help-tab-stance");
    expect(stanceTab).toBeInTheDocument();

    act(() => {
      fireEvent.click(stanceTab);
    });

    const stanceContent = screen.getByTestId("quick-help-content-stance");
    expect(stanceContent).toBeInTheDocument();
    expect(stanceContent).toHaveTextContent("Strict Posture");
    expect(stanceContent).toHaveTextContent("Balanced Posture");
    expect(stanceContent).toHaveTextContent("Commercial Posture");
    expect(stanceContent).toHaveTextContent("[Strict Protective Stance]");
    expect(stanceContent).toHaveTextContent("[Commercial Fast-Close Stance]");
  });
});
