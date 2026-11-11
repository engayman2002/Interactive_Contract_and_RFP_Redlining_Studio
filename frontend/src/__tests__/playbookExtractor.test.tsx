import React from "react";
import { deflateRawSync } from "zlib";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlaybooksPage from "@/app/playbooks/page";
import { QuickHelpModal } from "@/components/workspace/QuickHelpModal";
import {
  extractPlaybookFromFile,
  getLocalPlaybookStorageKey,
  listPlaybookRules,
  resetOfflineAISettings,
  updateAISettings,
} from "@/services/apiClient";
import { HELP_FAQ_ITEMS, HELP_GUIDE_MODULES } from "@/services/helpContent";
import { useWorkspaceStore } from "@/store/workspaceStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/playbooks",
}));

describe("AI Feature #6: AI Playbook Auto-Extractor & Rule Generator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    useWorkspaceStore.getState().resetWorkspaceState();
    resetOfflineAISettings();
  });

  afterEach(() => {
    resetOfflineAISettings();
    useWorkspaceStore.getState().resetWorkspaceState();
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

  function buildRealBinaryDocxBytes(
    documentXml: string,
    useDeflate: boolean = true
  ): Uint8Array {
    const encoder = new TextEncoder();
    const entries = [
      {
        name: "word/numbering.xml",
        data: encoder.encode(
          `<?xml version="1.0" encoding="UTF-8"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"/></w:numbering>`
        ),
      },
      {
        name: "word/document.xml",
        data: encoder.encode(documentXml),
      },
    ];

    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.name);
      const rawData = entry.data;
      const compressedData = useDeflate
        ? new Uint8Array(deflateRawSync(rawData))
        : rawData;
      const method = useDeflate ? 8 : 0;

      const lfh = new Uint8Array(30 + nameBytes.length);
      const lfhView = new DataView(lfh.buffer);
      lfhView.setUint32(0, 0x04034b50, true); // PK\x03\x04
      lfhView.setUint16(4, 20, true);
      lfhView.setUint16(6, 0x0008, true); // Bit 3 data descriptor flag
      lfhView.setUint16(8, method, true);
      lfhView.setUint32(18, 0, true); // size omitted in LFH (data descriptor style)
      lfhView.setUint32(22, 0, true);
      lfhView.setUint16(26, nameBytes.length, true);
      lfhView.setUint16(28, 0, true);
      lfh.set(nameBytes, 30);

      const dd = new Uint8Array(16);
      const ddView = new DataView(dd.buffer);
      ddView.setUint32(0, 0x08074b50, true);
      ddView.setUint32(4, 0, true);
      ddView.setUint32(8, compressedData.length, true);
      ddView.setUint32(12, rawData.length, true);

      localParts.push(lfh, compressedData, dd);

      const cdh = new Uint8Array(46 + nameBytes.length);
      const cdhView = new DataView(cdh.buffer);
      cdhView.setUint32(0, 0x02014b50, true);
      cdhView.setUint16(4, 20, true);
      cdhView.setUint16(6, 20, true);
      cdhView.setUint16(8, 0x0008, true);
      cdhView.setUint16(10, method, true);
      cdhView.setUint32(20, compressedData.length, true);
      cdhView.setUint32(24, rawData.length, true);
      cdhView.setUint16(28, nameBytes.length, true);
      cdhView.setUint32(42, offset, true);
      cdh.set(nameBytes, 46);
      centralParts.push(cdh);

      offset += lfh.length + compressedData.length + dd.length;
    }

    const cdOffset = offset;
    const cdSize = centralParts.reduce((sum, p) => sum + p.length, 0);
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(8, entries.length, true);
    eocdView.setUint16(10, entries.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdOffset, true);

    const totalSize = cdOffset + cdSize + eocd.length;
    const archive = new Uint8Array(totalSize);
    let cursor = 0;
    for (const part of [...localParts, ...centralParts, eocd]) {
      archive.set(part, cursor);
      cursor += part.length;
    }
    return archive;
  }

  it("parses real deflate-compressed binary .docx OpenXML archives cleanly without PK\\x03\\x04 garbage, prevents duplicates, and supports Delete/Clear All", async () => {
    const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>1. Warranty: Supplier warrants all electronic components for 24 months from delivery.</w:t></w:r></w:p>
          <w:p><w:r><w:t>2. Liability: Aggregate liability shall not exceed total purchase order value.</w:t></w:r></w:p>
        </w:body>
      </w:document>`;

    const zipBytes = buildRealBinaryDocxBytes(docxXml, true);
    const realDocxFile = new File(
      [zipBytes.buffer as ArrayBuffer],
      "Legal Terms and Conditions for Electronic Component Procurement.docx",
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    );

    // Seed a corrupt cached rule from earlier buggy version to verify auto-purge
    localStorage.setItem(
      getLocalPlaybookStorageKey(),
      JSON.stringify([
        {
          id: "corrupt-legacy-id",
          org_id: "a0000000-0000-4000-8000-000000000001",
          category: "Commercial Terms",
          standard_position:
            "Maintain approved corporate policy baseline: PK\u0003\u0004...word/numbering.xml",
          fallback_position: "Fallback",
          unacceptable_triggers: "trigger",
          embedding_dim: 1536,
        },
      ])
    );

    render(<PlaybooksPage />);

    await waitFor(() => {
      expect(screen.getByTestId("extractor-mode-file")).toBeInTheDocument();
    });

    // Poisoned rule should have been purged immediately
    expect(screen.queryByTestId("playbook-rule-card-corrupt-legacy-id")).toBeNull();

    fireEvent.click(screen.getByTestId("extractor-mode-file"));
    const fileInput = screen.getByTestId("extractor-file-input");
    fireEvent.change(fileInput, { target: { files: [realDocxFile] } });

    await act(async () => {
      fireEvent.click(screen.getByTestId("run-playbook-extractor-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("extracted-rules-results")).toBeInTheDocument();
    });

    const resultsText =
      screen.getByTestId("extracted-rules-results").textContent ?? "";
    expect(resultsText).toContain("Warranty");
    expect(resultsText).toContain("Liability");
    expect(resultsText).toContain("electronic components");
    expect(resultsText).not.toContain("PK");
    expect(resultsText).not.toContain("word/numbering.xml");

    const rulesAfterFirstRun = await listPlaybookRules();
    const warrantyCardsAfterFirst = rulesAfterFirstRun.filter((r) =>
      r.category.includes("Warranty")
    );
    expect(warrantyCardsAfterFirst).toHaveLength(1);
    const savedIds = rulesAfterFirstRun.map((r) => r.id);
    expect(new Set(savedIds).size).toBe(savedIds.length);

    // Re-running extraction with auto_save=true MUST NOT duplicate cards
    await act(async () => {
      fireEvent.click(screen.getByTestId("run-playbook-extractor-btn"));
    });

    await waitFor(() => {
      const cards = screen.getAllByTestId(/^playbook-rule-card-/);
      const renderedIds = cards.map((c) => c.getAttribute("data-testid"));
      expect(new Set(renderedIds).size).toBe(renderedIds.length);
    });

    const rulesAfterSecondRun = await listPlaybookRules();
    expect(
      rulesAfterSecondRun.filter((r) => r.category.includes("Warranty"))
    ).toHaveLength(1);

    // Per-card Delete Rule button removes single rule cleanly
    const firstCardDeleteId = rulesAfterSecondRun[0].id;
    await act(async () => {
      fireEvent.click(
        screen.getByTestId(`delete-playbook-rule-${firstCardDeleteId}`)
      );
    });
    expect(
      screen.queryByTestId(`playbook-rule-card-${firstCardDeleteId}`)
    ).toBeNull();

    // Clear All Rules empties grid cleanly
    await act(async () => {
      fireEvent.click(screen.getByTestId("clear-all-playbook-rules-btn"));
    });
    expect(screen.getByTestId("clean-playbooks-empty-state")).toBeInTheDocument();
  });

  it("invokes configured live Groq LPU model directly in Local Workspace mode when extracting real .docx files", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await updateAISettings({
      llm_provider: "groq",
      llm_model_name: "openai/gpt-oss-120b",
      llm_api_key: "gsk_live_test_secret_123456",
      llm_temperature: 0.1,
      embedding_provider: "deterministic",
      embedding_model_name: "deterministic-hash-1536",
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    category: "Warranty & Defective Components",
                    standard_position:
                      "24-month electronic component warranty with RMA replacement.",
                    fallback_position:
                      "18-month warranty with batch recall above 2%.",
                    unacceptable_triggers: [
                      "sold as-is",
                      "no epidemic failure remedy",
                    ],
                    source_clause_excerpt:
                      "Supplier warrants all electronic components for 24 months.",
                    confidence_score: 96,
                  },
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 180, completion_tokens: 95 },
      }),
    } as Response);

    const docxXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>1. Warranty: Supplier warrants all electronic components for 24 months and covers RMA shipping.</w:t></w:r></w:p>
        </w:body>
      </w:document>`;
    const realDocx = new File(
      [buildRealBinaryDocxBytes(docxXml, true).buffer as ArrayBuffer],
      "procurement.docx",
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    );

    const response = await extractPlaybookFromFile(realDocx, {
      auto_save: true,
      max_rules: 6,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [endpoint, reqInit] = fetchSpy.mock.calls[0];
    expect(endpoint).toBe("https://api.groq.com/openai/v1/chat/completions");
    const parsedBody = JSON.parse(String(reqInit?.body));
    expect(parsedBody.model).toBe("openai/gpt-oss-120b");
    expect(parsedBody.messages[1].content).toContain("electronic components");
    expect(parsedBody.messages[1].content).not.toContain("PK\u0003\u0004");

    expect(response.extracted_count).toBe(1);
    expect(response.candidates[0].category).toBe(
      "Warranty & Defective Components"
    );
    expect(response.saved_rules).toHaveLength(1);
  });
});

