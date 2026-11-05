import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import * as apiClient from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("Phase 7: DOCX Export Controls & Immutable Compliance Audit Trail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  it("exports Track Changes and Clean .docx files and updates the export status badge", async () => {
    const exportSpy = vi
      .spyOn(apiClient, "exportDocumentDocx")
      .mockImplementation(async (_docId, mode) => ({
        filename: `Master_Cloud_Agreement_${mode}.docx`,
        blob: new Blob(["PK\x03\x04"], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      }));

    render(<RedliningStudioWorkspace />);

    const trackChangesBtn = screen.getByTestId("export-track-changes-btn");
    fireEvent.click(trackChangesBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith(
        apiClient.DEMO_DOCUMENT_ID,
        "track_changes",
        undefined
      );
      expect(screen.getByTestId("export-status-badge")).toHaveTextContent(
        "Exported: Master_Cloud_Agreement_track_changes.docx"
      );
    });

    const cleanBtn = screen.getByTestId("export-clean-btn");
    fireEvent.click(cleanBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith(
        apiClient.DEMO_DOCUMENT_ID,
        "clean",
        undefined
      );
      expect(screen.getByTestId("export-status-badge")).toHaveTextContent(
        "Exported: Master_Cloud_Agreement_clean.docx"
      );
    });
  });

  it("records lifecycle events and displays them in the Compliance Audit Trail tab", async () => {
    vi.spyOn(apiClient, "resolveSuggestion").mockResolvedValue(null);
    vi.spyOn(apiClient, "createClauseComment").mockResolvedValue(null);
    vi.spyOn(apiClient, "exportDocumentDocx").mockResolvedValue({
      filename: "Master_Cloud_Agreement_track_changes.docx",
      blob: new Blob(["PK\x03\x04"]),
    });

    render(<RedliningStudioWorkspace />);

    // 1. Accept first redline suggestion on Clause 1
    const clause1Id = "c0000000-0000-4000-8000-000000000101";
    const acceptBtn = screen.getByTestId(`apply-redline-btn-${clause1Id}`);
    fireEvent.click(acceptBtn);

    // 2. Post a threaded comment on Clause 1
    const commentInput = screen.getByTestId(`comment-input-${clause1Id}`);
    fireEvent.change(commentInput, {
      target: { value: "Verified mutual 12-month liability cap." },
    });
    fireEvent.click(screen.getByTestId(`post-comment-btn-${clause1Id}`));

    // 3. Export Track Changes DOCX
    fireEvent.click(screen.getByTestId("export-track-changes-btn"));

    await waitFor(() => {
      expect(useWorkspaceStore.getState().auditLogs.length).toBe(5);
    });

    // 4. Switch to Compliance Audit Trail tab
    const auditTabBtn = screen.getByTestId("inspector-tab-audit");
    fireEvent.click(auditTabBtn);

    expect(screen.getByTestId("audit-trail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("audit-trail-count")).toHaveTextContent(
      "5 events"
    );
    expect(
      screen.getByTestId("audit-entry-DOCUMENT_INGESTED")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("audit-entry-DOCUMENT_ANALYZED")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("audit-entry-SUGGESTION_ACCEPTED")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("audit-entry-COMMENT_CREATED")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("audit-entry-DOCUMENT_EXPORTED")
    ).toBeInTheDocument();
  });
});
