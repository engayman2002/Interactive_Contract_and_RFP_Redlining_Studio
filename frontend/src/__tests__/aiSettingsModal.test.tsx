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
    expect(llmModelInput.value).toBe("llama3.1:8b");
    expect(embModelInput.value).toBe("nomic-embed-text");

    const baseUrlInput = screen.getByTestId(
      "ai-settings-base-url-input"
    ) as HTMLInputElement;
    expect(baseUrlInput).toBeInTheDocument();
    expect(baseUrlInput.value).toBe("http://localhost:11434");
    expect(screen.getByTestId("ai-settings-key-status-badge")).toHaveTextContent(
      "No Key Required"
    );
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

