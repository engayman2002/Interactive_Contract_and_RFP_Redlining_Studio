import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import * as apiClient from "@/services/apiClient";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("Phase 6: Collaboration, Threaded Comments & One-Click Resolution", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Acceptance Criteria 1: clicking Apply Redline immediately updates editor DOM text, increments version badge (v1 -> v2), and transitions card to ACCEPTED", async () => {
    const resolveSpy = vi
      .spyOn(apiClient, "resolveSuggestion")
      .mockResolvedValue(null);

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const targetClause = DEMO_WORKSPACE_DATA.clauses[0];
    const targetSuggestion = DEMO_WORKSPACE_DATA.redlines[0];

    const editorClauseNode = screen.getByTestId(
      `editor-clause-${targetClause.id}`
    );
    expect(editorClauseNode.textContent).toContain("v1");
    expect(editorClauseNode.textContent).toContain(
      "Vendor's aggregate cumulative liability exceed $500"
    );

    const applyButton = screen.getByTestId(
      `apply-redline-btn-${targetClause.id}`
    );
    fireEvent.click(applyButton);

    // Editor DOM immediately reflects the accepted playbook wording and v2 badge
    expect(editorClauseNode.textContent).toContain(
      targetSuggestion.proposed_text
    );
    expect(editorClauseNode.textContent).toContain("v2");

    // Inspector card status transitions to ACCEPTED
    const cardStatus = screen.getByTestId(
      `suggestion-status-${targetClause.id}`
    );
    expect(cardStatus.textContent).toBe("ACCEPTED");

    expect(resolveSpy).toHaveBeenCalledWith(
      targetSuggestion.id,
      {
        action: "ACCEPT",
        expected_clause_version: 1,
      },
      undefined
    );
  });

  it("Acceptance Criteria 2: clicking Modify allows editing proposed wording and applying custom text to the editor DOM", async () => {
    const resolveSpy = vi
      .spyOn(apiClient, "resolveSuggestion")
      .mockResolvedValue(null);

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const targetClause = DEMO_WORKSPACE_DATA.clauses[1];
    const targetSuggestion = DEMO_WORKSPACE_DATA.redlines[1];

    const modifyBtn = screen.getByTestId(
      `modify-redline-btn-${targetClause.id}`
    );
    fireEvent.click(modifyBtn);

    const textarea = screen.getByTestId(
      `modify-redline-textarea-${targetClause.id}`
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe(targetSuggestion.proposed_text);

    const customWording =
      "2.1 Mutual fault-based indemnification capped at 2x annual fees paid under this Agreement.";
    fireEvent.change(textarea, { target: { value: customWording } });

    const saveBtn = screen.getByTestId(
      `save-modified-redline-btn-${targetClause.id}`
    );
    fireEvent.click(saveBtn);

    const editorClauseNode = screen.getByTestId(
      `editor-clause-${targetClause.id}`
    );
    expect(editorClauseNode.textContent).toContain(customWording);
    expect(editorClauseNode.textContent).toContain("v2");

    const cardStatus = screen.getByTestId(
      `suggestion-status-${targetClause.id}`
    );
    expect(cardStatus.textContent).toBe("MODIFIED");

    expect(resolveSpy).toHaveBeenCalledWith(
      targetSuggestion.id,
      {
        action: "MODIFY",
        expected_clause_version: 1,
        modified_text: customWording,
      },
      undefined
    );
  });

  it("Acceptance Criteria 3: posting a comment in the inspector immediately appends it to the clause's threaded discussion", async () => {
    const commentSpy = vi
      .spyOn(apiClient, "createClauseComment")
      .mockResolvedValue(null);

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const firstClause = DEMO_WORKSPACE_DATA.clauses[0];
    const commentInput = screen.getByTestId(`comment-input-${firstClause.id}`);
    const postBtn = screen.getByTestId(`post-comment-btn-${firstClause.id}`);

    fireEvent.change(commentInput, {
      target: {
        value: "Legal Counsel: Ensure 12-month mutual cap is non-negotiable.",
      },
    });
    fireEvent.click(postBtn);

    const commentList = screen.getByTestId(`comment-list-${firstClause.id}`);
    expect(commentList.textContent).toContain(
      "Legal Counsel: Ensure 12-month mutual cap is non-negotiable."
    );
    expect(
      screen.getByTestId(`comment-count-${firstClause.id}`).textContent
    ).toContain("1 comment");

    expect(commentSpy).toHaveBeenCalledWith(
      firstClause.id,
      "Legal Counsel: Ensure 12-month mutual cap is non-negotiable.",
      undefined
    );
  });

  it("Acceptance Criteria 4: simulating a 409 Conflict from the API rolls back the stale edit and renders the version conflict alert banner", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "CONCURRENCY_CONFLICT",
            message:
              "Clause version conflict on clause #1: another user modified this clause simultaneously.",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    render(
      <RedliningStudioWorkspace
        initialWorkspace={DEMO_WORKSPACE_DATA}
        token="test-jwt-token"
      />
    );

    const targetClause = DEMO_WORKSPACE_DATA.clauses[0];
    const editorClauseNode = screen.getByTestId(
      `editor-clause-${targetClause.id}`
    );

    const applyButton = screen.getByTestId(
      `apply-redline-btn-${targetClause.id}`
    );
    fireEvent.click(applyButton);

    // Wait for the 409 response to trigger rollback and display the conflict banner
    const conflictBanner = await waitFor(() =>
      screen.getByTestId("version-conflict-banner")
    );
    expect(conflictBanner.textContent).toContain("409 Conflict");
    expect(conflictBanner.textContent).toContain(
      "another user modified this clause simultaneously"
    );

    // Verify optimistic edit was rolled back to original text and v1
    expect(editorClauseNode.textContent).toContain(targetClause.original_text);
    expect(editorClauseNode.textContent).toContain("v1");
    expect(
      screen.getByTestId(`suggestion-status-${targetClause.id}`).textContent
    ).toBe("PENDING");
  });
});

