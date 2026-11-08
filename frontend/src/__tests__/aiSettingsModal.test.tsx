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

  it("opens AISettingsModal from TopNavBar and dynamically updates presets for Google Gemini and Local Ollama", async () => {
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

    // Select Google Gemini preset card
    fireEvent.click(screen.getByTestId("provider-preset-gemini"));

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;
    const embModelInput = screen.getByTestId(
      "ai-settings-embedding-model-input"
    ) as HTMLInputElement;
    expect(llmModelInput.value).toBe("gemini-2.5-flash");
    expect(embModelInput.value).toBe("text-embedding-004");
    expect(screen.getByTestId("ai-settings-key-status-badge")).toHaveTextContent(
      "API Key Required"
    );
    expect(
      screen.queryByTestId("ai-settings-base-url-input")
    ).not.toBeInTheDocument();

    // Select Local Ollama preset card -> reveals Base URL pre-populated with http://localhost:11434
    fireEvent.click(screen.getByTestId("provider-preset-ollama"));
    expect(llmModelInput.value).toBe("llama3.3");
    expect(embModelInput.value).toBe("nomic-embed-text");

    const baseUrlInput = screen.getByTestId(
      "ai-settings-base-url-input"
    ) as HTMLInputElement;
    expect(baseUrlInput).toBeInTheDocument();
    expect(baseUrlInput.value).toBe("http://localhost:11434");
    expect(screen.getByTestId("ai-settings-key-status-badge")).toHaveTextContent(
      "No Key Required"
    );

    await waitFor(() => {
      expect(screen.getByTestId("live-models-status-badge")).toBeInTheDocument();
    });
  });

  it("allows typing and saving any free-form custom model ID and updates the active AI badge", async () => {
    const updateSpy = vi.spyOn(apiClient, "updateAISettings");

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    fireEvent.click(screen.getByTestId("open-ai-settings-btn"));
    await screen.findByTestId("ai-settings-modal");

    fireEvent.click(screen.getByTestId("provider-preset-ollama"));
    await waitFor(() => {
      expect(screen.getByTestId("live-models-status-badge")).toBeInTheDocument();
    });

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;

    fireEvent.change(llmModelInput, {
      target: { value: "my-custom-llama-finetune-v2" },
    });
    expect(llmModelInput.value).toBe("my-custom-llama-finetune-v2");
    expect(screen.getByText("Custom ID")).toBeInTheDocument();

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

  it("fetches live models from provider API on clicking Fetch Live Models and allows picking a discovered model", async () => {
    const discoverSpy = vi
      .spyOn(apiClient, "discoverProviderModels")
      .mockResolvedValue({
        provider_id: "gemini",
        source: "live_api",
        llm_models: [
          "gemini-2.5-pro-preview-live",
          "gemini-2.5-flash-live-001",
        ],
        embedding_models: ["gemini-embedding-exp-live"],
        latency_ms: 84.2,
        message: "Fetched 2 LLM and 1 embedding models from Google Gemini.",
      });

    render(<TopNavBar />);

    fireEvent.click(screen.getByTestId("open-ai-settings-btn"));
    await screen.findByTestId("ai-settings-modal");

    fireEvent.click(screen.getByTestId("provider-preset-gemini"));
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

    const liveChip = screen.getByTestId(
      "llm-model-chip-gemini-2.5-pro-preview-live"
    );
    expect(liveChip).toBeInTheDocument();
    fireEvent.click(liveChip);

    const llmModelInput = screen.getByTestId(
      "ai-settings-llm-model-input"
    ) as HTMLInputElement;
    expect(llmModelInput.value).toBe("gemini-2.5-pro-preview-live");

    const liveEmbChip = screen.getByTestId(
      "embedding-model-chip-gemini-embedding-exp-live"
    );
    fireEvent.click(liveEmbChip);
    const embModelInput = screen.getByTestId(
      "ai-settings-embedding-model-input"
    ) as HTMLInputElement;
    expect(embModelInput.value).toBe("gemini-embedding-exp-live");
  });

  it("runs Live Connection Testing with latency diagnostics and updates the global header badge on Save & Activate", async () => {
    const testSpy = vi.spyOn(apiClient, "testAIConnection");
    const updateSpy = vi.spyOn(apiClient, "updateAISettings");

    render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);

    const openBtn = screen.getByTestId("open-ai-settings-btn");
    expect(openBtn).toHaveTextContent("AI: Deterministic");

    fireEvent.click(openBtn);
    await screen.findByTestId("ai-settings-modal");

    // 1. Select Google Gemini & test WITHOUT an API key -> reports diagnostic failure
    fireEvent.click(screen.getByTestId("provider-preset-gemini"));
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
        "AI: Gemini · gemini-2.5-flash"
      );
    });
  });
});

