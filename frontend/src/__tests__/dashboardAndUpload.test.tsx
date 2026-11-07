import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";
import { ContractUploadDropzone } from "@/components/workspace/ContractUploadDropzone";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import * as apiClient from "@/services/apiClient";
import { DEMO_WORKSPACE_DATA } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Dashboard, Upload Hub & Ergonomic Studio UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Dashboard, navigation bar, connection status, dropzone, and recent documents table on /", async () => {
    vi.spyOn(apiClient, "listDocuments").mockResolvedValue([
      {
        id: "doc-101",
        org_id: apiClient.DEMO_ORG_ID,
        title: "Enterprise Master Services Agreement",
        status: "ANALYZED",
        version: 2,
        created_by: apiClient.DEMO_USER_ID,
        created_at: "2026-11-06T12:00:00Z",
        clause_count: 6,
      },
      {
        id: "doc-102",
        org_id: apiClient.DEMO_ORG_ID,
        title: "Cloud Infrastructure Procurement RFP",
        status: "READY",
        version: 1,
        created_by: apiClient.DEMO_USER_ID,
        created_at: "2026-11-07T08:30:00Z",
        clause_count: 5,
      },
    ]);

    render(<DashboardPage />);

    // Top Navigation & Connection Status
    expect(screen.getByTestId("top-nav-bar")).toBeInTheDocument();
    expect(screen.getByTestId("backend-connection-badge")).toBeInTheDocument();

    // Dashboard root container & Hero
    expect(screen.getByTestId("contract-dashboard-page")).toBeInTheDocument();
    expect(screen.getByTestId("try-demo-contract-btn")).toHaveAttribute(
      "href",
      "/documents/demo"
    );

    // Hero Dropzone
    expect(screen.getByTestId("contract-upload-dropzone")).toBeInTheDocument();

    // My Documents Table & Rows
    await waitFor(() => {
      expect(screen.getByTestId("document-row-doc-101")).toBeInTheDocument();
      expect(screen.getByTestId("document-row-doc-102")).toBeInTheDocument();
    });

    expect(screen.getByTestId("document-status-doc-101")).toHaveTextContent(
      "ANALYZED"
    );
    expect(screen.getByTestId("document-status-doc-102")).toHaveTextContent(
      "READY"
    );
    expect(screen.getByTestId("open-studio-btn-doc-101")).toHaveAttribute(
      "href",
      "/documents/doc-101"
    );
  });

  it("handles .docx and .pdf file upload via dropzone with multi-stage progress and navigation to /documents/[id]", async () => {
    const uploadSpy = vi
      .spyOn(apiClient, "uploadDocument")
      .mockResolvedValue({ document_id: "doc-uploaded-999" });

    render(<ContractUploadDropzone />);

    const fileInput = screen.getByTestId("upload-file-input");
    const testDocx = new File(["dummy docx content"], "Procurement_Agreement.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(fileInput, { target: { files: [testDocx] } });

    // Custom title auto-derivation
    const titleInput = screen.getByTestId(
      "upload-document-title-input"
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("Procurement_Agreement");

    fireEvent.change(titleInput, {
      target: { value: "Procurement Master Agreement 2026" },
    });

    const submitBtn = screen.getByTestId("upload-submit-btn");
    fireEvent.click(submitBtn);

    // Multi-stage upload indicator shows progress
    await waitFor(() => {
      expect(screen.getByTestId("upload-progress-indicator")).toBeInTheDocument();
    });

    // Upload call made with file and custom title
    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        testDocx,
        "Procurement Master Agreement 2026",
        undefined
      );
      expect(mockPush).toHaveBeenCalledWith("/documents/doc-uploaded-999");
    });
  });

  it("opens the in-studio Upload Modal and toggles the collapsible ClauseCommentThread", async () => {
    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    // 1. In-Studio Quick Upload Modal
    expect(screen.queryByTestId("upload-modal")).not.toBeInTheDocument();

    const uploadModalBtn = screen.getByTestId("studio-upload-new-btn");
    fireEvent.click(uploadModalBtn);

    expect(screen.getByTestId("upload-modal")).toBeInTheDocument();

    const closeModalBtn = screen.getByTestId("close-upload-modal-btn");
    fireEvent.click(closeModalBtn);

    expect(screen.queryByTestId("upload-modal")).not.toBeInTheDocument();

    // 2. Collapsible ClauseCommentThread Panel
    const commentThread = screen.getByTestId("clause-comment-thread");
    expect(commentThread).toBeInTheDocument();

    const toggleBtn = screen.getByTestId("toggle-comment-thread-btn");
    const threadBody = screen.getByTestId("comment-thread-body");

    // Initially collapsed to maximize vertical reading space for AI redline cards
    expect(threadBody).toHaveClass("hidden");
    expect(toggleBtn).toHaveTextContent("▼ Expand");

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(threadBody).toHaveClass("block");
    expect(toggleBtn).toHaveTextContent("▲ Collapse");

    // Click to collapse again
    fireEvent.click(toggleBtn);
    expect(threadBody).toHaveClass("hidden");
    expect(toggleBtn).toHaveTextContent("▼ Expand");
  });

  it("toggles between Executive Light Mode (default) and Refined Slate Dark Mode and copies Negotiation Talking Points", async () => {
    window.localStorage.removeItem("redline_studio_theme");
    document.documentElement.classList.remove("dark");

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    // 1. Executive Light Mode is default
    const themeToggleBtn = screen.getByTestId("theme-toggle-btn");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Switch to Refined Slate Dark Mode
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("redline_studio_theme")).toBe("dark");

    // Switch back to Executive Light Mode
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("redline_studio_theme")).toBe("light");

    // 2. Copy Negotiation Talking Point button in RedlineCard
    const firstClauseId = DEMO_WORKSPACE_DATA.clauses[0].id;
    const copyBtn = screen.getByTestId(`copy-talking-point-btn-${firstClauseId}`);
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(copyBtn).toHaveTextContent("Copied");
    });
  });
});

