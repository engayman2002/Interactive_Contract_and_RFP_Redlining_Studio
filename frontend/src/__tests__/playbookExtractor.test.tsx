import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlaybooksPage from "@/app/playbooks/page";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/playbooks",
}));

describe("AI Feature #6: AI Playbook Auto-Extractor & Rule Generator", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads sample golden contract, auto-extracts rules, and appends them to Playbook Rules grid", async () => {
    render(<PlaybooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-playbook-extractor-panel")).toBeInTheDocument();
    });

    const loadSampleBtn = screen.getByTestId("extractor-load-sample-btn");
    fireEvent.click(loadSampleBtn);

    const textarea = screen.getByTestId(
      "extractor-reference-textarea"
    ) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Limitation of Liability");
    expect(textarea.value).toContain("Data Privacy & AI Safeguards");

    const autoSaveCheckbox = screen.getByTestId(
      "extractor-auto-save-checkbox"
    ) as HTMLInputElement;
    expect(autoSaveCheckbox.checked).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-playbook-extractor-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("extracted-rules-results")).toBeInTheDocument();
    });

    const resultsBox = screen.getByTestId("extracted-rules-results");
    expect(resultsBox.textContent).toContain("Auto-Saved & Indexed");
    expect(resultsBox.textContent).toContain("Liability");
    expect(resultsBox.textContent).toContain("Data Privacy & AI");
    expect(resultsBox.textContent).toContain("SLA & Uptime");
    expect(resultsBox.textContent).toContain("Termination");

    const grid = screen.getByTestId("playbook-rules-grid");
    expect(grid.textContent).toContain("Data Privacy & AI");
    expect(grid.textContent).toContain("SLA & Uptime");
  });

  it("supports safe Preview Mode with selective single-card Save Rule action", async () => {
    render(<PlaybooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-playbook-extractor-panel")).toBeInTheDocument();
    });

    const autoSaveCheckbox = screen.getByTestId(
      "extractor-auto-save-checkbox"
    ) as HTMLInputElement;
    fireEvent.click(autoSaveCheckbox);
    expect(autoSaveCheckbox.checked).toBe(false);

    const textarea = screen.getByTestId("extractor-reference-textarea");
    fireEvent.change(textarea, {
      target: {
        value:
          "1. Payment Terms. All undisputed invoices shall be paid Net 45 from receipt of a valid invoice.",
      },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-playbook-extractor-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("extracted-rules-results")).toBeInTheDocument();
    });

    const resultsBox = screen.getByTestId("extracted-rules-results");
    expect(resultsBox.textContent).toContain("Preview Mode");

    const saveCardBtn = screen.getByTestId("save-extracted-candidate-btn-0");
    expect(saveCardBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveCardBtn);
    });

    await waitFor(() => {
      expect(saveCardBtn.textContent).toContain("Saved to Playbook");
    });

    expect(screen.getByTestId("playbook-rules-grid").textContent).toContain(
      "Payment Terms"
    );
  });

  it("supports Golden Contract file upload mode via extractor-mode-file and extractor-file-input", async () => {
    render(<PlaybooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId("extractor-mode-file")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("extractor-mode-file"));

    const fileInput = screen.getByTestId("extractor-file-input");
    const mockFile = new File(
      [
        "1. Indemnification. Vendor shall indemnify Customer for third-party IP infringement claims.",
      ],
      "golden_msa.docx",
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    );

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-playbook-extractor-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("extracted-rules-results")).toBeInTheDocument();
    });

    expect(
      screen.getByTestId("extracted-rules-results").textContent
    ).toContain("Extracted");
  });

  it("renders Golden Playbook Extractor documentation tab in QuickHelpModal and Help Center data", () => {
    render(<QuickHelpModal isOpen={true} onClose={() => {}} />);

    const tab = screen.getByTestId("quick-help-tab-extractor");
    expect(tab).toBeInTheDocument();
    fireEvent.click(tab);

    const content = screen.getByTestId("quick-help-content-extractor");
    expect(content).toBeInTheDocument();
    expect(content.textContent).toContain("Auto-Save & 1536-d Indexing");
    expect(content.textContent).toContain("Safe Preview Mode");

    const module13 = HELP_GUIDE_MODULES.find(
      (m) => m.id === "ai-playbook-extractor"
    );
    expect(module13).toBeDefined();
    expect(module13?.number).toBe(13);
    expect(module13?.title).toContain("AI Playbook Auto-Extractor");

    const faqExtractor = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-playbook-auto-extractor"
    );
    expect(faqExtractor).toBeDefined();
    expect(faqExtractor?.answer).toContain("1536-d");

    const faqRbac = HELP_FAQ_ITEMS.find(
      (f) => f.id === "faq-playbook-extractor-rbac"
    );
    expect(faqRbac).toBeDefined();
    expect(faqRbac?.answer).toContain("403 Forbidden");
  });
});

