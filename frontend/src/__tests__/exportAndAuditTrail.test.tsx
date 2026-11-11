import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import * as apiClient from "@/services/apiClient";
import * as docxBuilder from "@/services/docxBrowserBuilder";
import { extractCleanTextFromFile } from "@/services/docxBrowserParser";
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

  it("builds valid PK\\x03\\x04 OpenXML .docx binary packages for both Track Changes and Clean modes and triggers OS Save As / fallback downloads", async () => {
    const clauses = [
      {
        id: "clause-exp-1",
        document_id: "doc-exp-1",
        clause_index: 0,
        heading: "1. Limitation of Liability",
        original_text: "Vendor total liability shall not exceed $500.",
        current_text:
          "Each party aggregate liability shall not exceed 12 months of fees.",
        version: 2,
      },
    ];
    const redlines = [
      {
        id: "red-exp-1",
        clause_id: "clause-exp-1",
        matched_rule_id: "rule-1",
        risk: "CRITICAL" as const,
        proposed_text:
          "Each party aggregate liability shall not exceed 12 months of fees.",
        rationale: "Replaces $500 cap with balanced 12-month policy.",
        status: "ACCEPTED" as const,
        created_at: "2026-11-11T00:00:00Z",
      },
    ];
    const comments = [
      {
        id: "cmt-exp-1",
        clause_id: "clause-exp-1",
        author_id: "counsel-1",
        body: "Approved by Risk Committee.",
        created_at: "2026-11-11T00:00:00Z",
      },
    ];

    const tcBytes = docxBuilder.buildDocxBinaryBytes({
      title: "Procurement Master Agreement",
      version: 2,
      mode: "track_changes",
      clauses,
      redlines,
      comments,
    });
    expect(tcBytes[0]).toBe(0x50);
    expect(tcBytes[1]).toBe(0x4b);
    expect(tcBytes[2]).toBe(0x03);
    expect(tcBytes[3]).toBe(0x04);

    const tcXmlString = new TextDecoder("utf-8", { fatal: false }).decode(tcBytes);
    expect(tcXmlString).toContain("word/document.xml");
    expect(tcXmlString).toContain("<w:del ");
    expect(tcXmlString).toContain("<w:delText");
    expect(tcXmlString).toContain("<w:ins ");
    expect(tcXmlString).toContain("Approved by Risk Committee.");

    const cleanBytes = docxBuilder.buildDocxBinaryBytes({
      title: "Procurement Master Agreement",
      version: 2,
      mode: "clean",
      clauses,
      redlines,
      comments,
    });
    const cleanXmlString = new TextDecoder("utf-8", { fatal: false }).decode(
      cleanBytes
    );
    expect(cleanXmlString).not.toContain("<w:del ");
    expect(cleanXmlString).not.toContain("<w:ins ");
    expect(cleanXmlString).toContain("12 months of fees");

    // Roundtrip through browser OpenXML ZIP parser cleanly
    const roundtripFile = new File(
      [cleanBytes.buffer as ArrayBuffer],
      "clean_roundtrip.docx",
      { type: docxBuilder.DOCX_MIME_TYPE }
    );
    const extracted = await extractCleanTextFromFile(roundtripFile);
    expect(extracted).toContain("12 months of fees");

    // Verify OS Save As picker flow
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn().mockResolvedValue(undefined);
    const showSaveMock = vi.fn().mockResolvedValue({
      name: "Saved_Contract_track_changes.docx",
      createWritable: async () => ({
        write: mockWrite,
        close: mockClose,
      }),
    });
    Object.defineProperty(window, "showSaveFilePicker", {
      value: showSaveMock,
      configurable: true,
      writable: true,
    });

    const tcBlob = docxBuilder.buildDocxBinaryBlob({
      title: "Procurement Master Agreement",
      version: 2,
      mode: "track_changes",
      clauses,
      redlines,
      comments,
    });
    const savedName = await docxBuilder.triggerBrowserDocxDownload(
      tcBlob,
      "Procurement_track_changes.docx",
      { forceInTest: true }
    );
    expect(showSaveMock).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalledWith(tcBlob);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(savedName).toBe("Saved_Contract_track_changes.docx");

    // Verify <a download> fallback when showSaveFilePicker is absent
    Reflect.deleteProperty(window, "showSaveFilePicker");
    const origCreateObjectUrl = Object.getOwnPropertyDescriptor(
      URL,
      "createObjectURL"
    );
    const origRevokeObjectUrl = Object.getOwnPropertyDescriptor(
      URL,
      "revokeObjectURL"
    );
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-docx-url");
    const revokeObjectUrlMock = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectUrlMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectUrlMock,
      configurable: true,
      writable: true,
    });
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      await docxBuilder.triggerBrowserDocxDownload(
        tcBlob,
        "Procurement_clean.docx",
        { forceInTest: true }
      );
      expect(createObjectUrlMock).toHaveBeenCalledWith(tcBlob);
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    } finally {
      if (origCreateObjectUrl) {
        Object.defineProperty(URL, "createObjectURL", origCreateObjectUrl);
      } else {
        Reflect.deleteProperty(URL, "createObjectURL");
      }
      if (origRevokeObjectUrl) {
        Object.defineProperty(URL, "revokeObjectURL", origRevokeObjectUrl);
      } else {
        Reflect.deleteProperty(URL, "revokeObjectURL");
      }
    }
  });

  it("wires exportDocument to triggerBrowserDocxDownload and bootstraps live backend workspace JWT cleanly", async () => {
    window.localStorage.clear();
    const downloadSpy = vi
      .spyOn(docxBuilder, "triggerBrowserDocxDownload")
      .mockResolvedValue("Master_Cloud_track_changes.docx");

    await useWorkspaceStore
      .getState()
      .exportDocument(apiClient.DEMO_DOCUMENT_ID, "track_changes", undefined);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [downloadedBlob, downloadedFilename] = downloadSpy.mock.calls[0];
    expect(downloadedBlob.size).toBeGreaterThan(500);
    expect(downloadedFilename).toContain("track_changes.docx");

    // Test auto-bootstrap session handshake against live backend
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return {
          ok: true,
          json: async () => ({ status: "ok" }),
        } as Response;
      }
      if (url.endsWith("/auth/workspace-session")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "signed.jwt.workspace.token",
            token_type: "bearer",
            expires_in: 1800,
            user: {
              id: "u0000000-0000-4000-8000-000000000001",
              org_id: "a0000000-0000-4000-8000-000000000001",
              email: "counsel@redlinestudio.local",
              role: "ADMIN",
              created_at: "2026-11-11T00:00:00Z",
            },
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const session = await apiClient.ensureLiveBackendSession(true);
    expect(session).not.toBeNull();
    expect(session?.token).toBe("signed.jwt.workspace.token");
    expect(session?.userRole).toBe("ADMIN");
    expect(window.localStorage.getItem("redline_session_token")).toBe(
      "signed.jwt.workspace.token"
    );
  });
});
