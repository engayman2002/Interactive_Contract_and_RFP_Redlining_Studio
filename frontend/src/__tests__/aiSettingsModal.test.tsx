import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import * as apiClient from "@/services/apiClient";
import { DEMO_WORKSPACE_DATA, resetOfflineAISettings } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("In-App AI Provider & Model Switcher Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOfflineAISettings();
    useWorkspaceStore.getState().resetWorkspaceState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens AISettingsModal with zero hardcoded model presets on external/local providers and disables save until a Model ID is provided", async () => {
    render(<TopNavBar />);

    const openBtn = screen.getByTestId("open-ai-settings-btn");
    expect(openBtn).toHaveTextContent("AI: Deterministic");

    fireEvent.click(openBtn);

    const modal = await screen.findByTestId("ai-settings-modal");
    expect(modal).toBeInTheDocument();

    // Base URL input is hidden when Deterministic is selected
    expect(
      screen.queryByTestId("ai-settings-base-url-input")
    ).not.toBeInTheDocument();

    // Select Google Gemini preset card -> model inputs are blank, zero hardcoded model chips, save disabled
    fireEvent.click(screen.getByTestId("provider-preset-gemini"));

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;
    const embModelInput = screen.getByTestId(
      "ai-settings-embedding-model-input"
    ) as HTMLInputElement;
    expect(llmModelInput.value).toBe("");
    expect(embModelInput.value).toBe("");
    expect(
      screen.queryByTestId("ai-settings-llm-preset-select")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("ai-settings-embedding-preset-select")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("ai-settings-model-required-hint")
    ).toBeInTheDocument();
    expect(screen.getByTestId("save-ai-settings-btn")).toBeDisabled();
    expect(screen.getByTestId("ai-settings-key-status-badge")).toHaveTextContent(
      "API Key Required"
    );
    expect(
      screen.queryByTestId("ai-settings-base-url-input")
    ).not.toBeInTheDocument();

    // Select Local Ollama preset card -> reveals Base URL http://localhost:11434 with blank model IDs
    fireEvent.click(screen.getByTestId("provider-preset-ollama"));
    expect(llmModelInput.value).toBe("");
    expect(embModelInput.value).toBe("");
    expect(screen.getByTestId("save-ai-settings-btn")).toBeDisabled();

    const baseUrlInput = screen.getByTestId(
      "ai-settings-base-url-input"
    ) as HTMLInputElement;
    expect(baseUrlInput).toBeInTheDocument();
    expect(baseUrlInput.value).toBe("http://localhost:11434");
    expect(screen.getByTestId("ai-settings-key-status-badge")).toHaveTextContent(
      "No Key Required"
    );
  });

  it("allows typing and saving any manual model ID and updates the active AI badge", async () => {
    const updateSpy = vi.spyOn(apiClient, "updateAISettings");

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    fireEvent.click(screen.getByTestId("open-ai-settings-btn"));
    await screen.findByTestId("ai-settings-modal");

    fireEvent.click(screen.getByTestId("provider-preset-ollama"));

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;
    const embModelInput = screen.getByTestId(
      "ai-settings-embedding-model-input"
    ) as HTMLInputElement;

    expect(screen.getByTestId("save-ai-settings-btn")).toBeDisabled();

    fireEvent.change(llmModelInput, {
      target: { value: "my-custom-llama-finetune-v2" },
    });
    fireEvent.change(embModelInput, {
      target: { value: "my-custom-embed-v1" },
    });
    expect(llmModelInput.value).toBe("my-custom-llama-finetune-v2");
    expect(embModelInput.value).toBe("my-custom-embed-v1");
    expect(screen.getAllByText("Manual ID").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("save-ai-settings-btn")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("save-ai-settings-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByTestId("ai-settings-modal")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("open-ai-settings-btn")).toHaveTextContent(
        "AI: Ollama · my-custom-llama-finetune-v2"
      );
    });
  });

  it("fetches live models from provider API on clicking Fetch Live Models and enables saving once selected", async () => {
    const discoverSpy = vi
      .spyOn(apiClient, "discoverProviderModels")
      .mockResolvedValue({
        provider_id: "gemini",
        source: "live_api",
        llm_models: [
          "gemini-live-pro-001",
          "gemini-live-flash-001",
        ],
        embedding_models: ["gemini-embedding-live-001"],
        latency_ms: 84.2,
        message: "Fetched 2 LLM and 1 embedding models from Google Gemini.",
      });

    render(<TopNavBar />);

    fireEvent.click(screen.getByTestId("open-ai-settings-btn"));
    await screen.findByTestId("ai-settings-modal");

    fireEvent.click(screen.getByTestId("provider-preset-gemini"));
    expect(
      screen.queryByTestId("ai-settings-llm-preset-select")
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("ai-settings-api-key-input"), {
      target: { value: "AIzaSyLiveDiscoveryKey1234" },
    });

    fireEvent.click(screen.getByTestId("fetch-live-models-btn"));

    await waitFor(() => {
      expect(discoverSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_id: "gemini",
          api_key: "AIzaSyLiveDiscoveryKey1234",
        }),
        undefined
      );
      expect(screen.getByTestId("live-models-status-badge")).toHaveTextContent(
        "Fetched 2 live LLM models from provider API (84.2 ms)"
      );
    });

    expect(
      screen.getByTestId("ai-settings-llm-preset-select")
    ).toBeInTheDocument();

    const liveChip = screen.getByTestId("llm-model-chip-gemini-live-pro-001");
    expect(liveChip).toBeInTheDocument();
    fireEvent.click(liveChip);

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;
    expect(llmModelInput.value).toBe("gemini-live-pro-001");

    const liveEmbChip = screen.getByTestId(
      "embedding-model-chip-gemini-embedding-live-001"
    );
    fireEvent.click(liveEmbChip);
    const embModelInput = screen.getByTestId(
      "ai-settings-embedding-model-input"
    ) as HTMLInputElement;
    expect(embModelInput.value).toBe("gemini-embedding-live-001");
    expect(screen.getByTestId("save-ai-settings-btn")).not.toBeDisabled();
  });

  it("runs Live Connection Testing with latency diagnostics and updates the global header badge on Save & Activate", async () => {
    const testSpy = vi.spyOn(apiClient, "testAIConnection");
    const updateSpy = vi.spyOn(apiClient, "updateAISettings");

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const openBtn = screen.getByTestId("open-ai-settings-btn");
    expect(openBtn).toHaveTextContent("AI: Deterministic");

    fireEvent.click(openBtn);
    await screen.findByTestId("ai-settings-modal");

    // 1. Select Google Gemini, enter explicit model IDs, & test WITHOUT an API key -> reports diagnostic failure
    fireEvent.click(screen.getByTestId("provider-preset-gemini"));
    fireEvent.change(screen.getByTestId("ai-settings-llm-model-input"), {
      target: { value: "vendor-gemini-llm-v1" },
    });
    fireEvent.change(screen.getByTestId("ai-settings-embedding-model-input"), {
      target: { value: "vendor-gemini-embed-v1" },
    });

    fireEvent.click(screen.getByTestId("test-ai-connection-btn"));

    const failCard = await screen.findByTestId("ai-connection-test-result");
    expect(failCard).toHaveTextContent("Connection Check Failed");
    expect(failCard).toHaveTextContent("API key is required");

    // 2. Enter API Key and re-run Test Connection -> verifies 1536-d vector & displays latency badge
    const apiKeyInput = screen.getByTestId("ai-settings-api-key-input");
    fireEvent.change(apiKeyInput, {
      target: { value: "AIzaSyDemoValidTestKey9988" },
    });

    fireEvent.click(screen.getByTestId("test-ai-connection-btn"));

    await waitFor(() => {
      expect(testSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("ai-connection-test-result")).toHaveTextContent(
        "Connection Verified — Engine Ready"
      );
      expect(
        screen.getByTestId("ai-connection-latency-badge")
      ).toHaveTextContent("ms");
    });

    // 3. Click Save & Activate Engine -> closes modal and updates active header pill
    fireEvent.click(screen.getByTestId("save-ai-settings-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByTestId("ai-settings-modal")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("open-ai-settings-btn")).toHaveTextContent(
        "AI: Gemini · vendor-gemini-llm-v1"
      );
    });
  });
});

