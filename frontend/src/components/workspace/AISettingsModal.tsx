"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Server,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  DEFAULT_AI_PROVIDER_CATALOG,
  fetchAISettings,
  testAIConnection,
  updateAISettings,
} from "@/services/apiClient";
import type {
  AISettingsResponseDTO,
  ProviderCatalogItemDTO,
  TestAIConnectionResponseDTO,
} from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  userRole?: string;
}

interface PresetDisplayMeta {
  tagline: string;
  badge: string;
  defaultBaseUrl?: string;
  defaultEmbeddingBaseUrl?: string;
}

const PRESET_DISPLAY_META: Record<string, PresetDisplayMeta> = {
  deterministic: {
    tagline: "Instant <5ms local policy evaluation • Zero external network calls",
    badge: "Zero API Key",
  },
  gemini: {
    tagline: "gemini-2.5-flash / gemini-2.5-pro + text-embedding-004",
    badge: "Google AI",
  },
  groq: {
    tagline: "llama-3.3-70b-versatile / deepseek-r1-distill-llama-70b",
    badge: "Ultra-Fast LPU",
  },
  openai: {
    tagline: "gpt-4o / gpt-4o-mini + text-embedding-3-small",
    badge: "OpenAI Cloud",
  },
  anthropic: {
    tagline: "claude-3-5-sonnet-latest / claude-3-5-haiku-latest",
    badge: "Legal Reasoning",
  },
  ollama: {
    tagline: "llama3.1:8b / qwen2.5:14b + nomic-embed-text (localhost:11434)",
    badge: "100% Private Local",
    defaultBaseUrl: "http://localhost:11434",
    defaultEmbeddingBaseUrl: "http://localhost:11434",
  },
  openai_compatible: {
    tagline: "vLLM, LM Studio, llama.cpp or TEI custom HTTP endpoint",
    badge: "Self-Hosted vLLM",
    defaultBaseUrl: "http://localhost:8000/v1",
    defaultEmbeddingBaseUrl: "http://localhost:8080/v1",
  },
};

export function formatActiveAIBadge(provider: string, model: string): string {
  const normalized = provider.trim().toLowerCase();
  const providerLabels: Record<string, string> = {
    deterministic: "Deterministic",
    gemini: "Gemini",
    groq: "Groq LPU",
    openai: "OpenAI",
    anthropic: "Claude",
    ollama: "Ollama",
    openai_compatible: "Local vLLM",
  };
  const label = providerLabels[normalized] ?? provider;
  if (normalized === "deterministic") {
    return "AI: Deterministic";
  }
  const shortModel = model.trim() || "default";
  return `AI: ${label} · ${shortModel}`;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  token,
  userRole = "ADMIN",
}) => {
  const setActiveAIEngine = useWorkspaceStore(
    (state) => state.setActiveAIEngine
  );

  const [catalog, setCatalog] = useState<ProviderCatalogItemDTO[]>(
    DEFAULT_AI_PROVIDER_CATALOG
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);

  // LLM Reasoning Engine State
  const [llmProvider, setLlmProvider] = useState<string>("deterministic");
  const [llmModelName, setLlmModelName] = useState<string>(
    "policy-deterministic-v1"
  );
  const [llmBaseUrl, setLlmBaseUrl] = useState<string>("");
  const [llmApiKeyInput, setLlmApiKeyInput] = useState<string>("");
  const [llmHasStoredKey, setLlmHasStoredKey] = useState<boolean>(false);
  const [llmMaskedKey, setLlmMaskedKey] = useState<string | null>(null);
  const [llmTemperature, setLlmTemperature] = useState<number>(0.0);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Vector Embedding Engine State
  const [embeddingProvider, setEmbeddingProvider] =
    useState<string>("deterministic");
  const [embeddingModelName, setEmbeddingModelName] = useState<string>(
    "deterministic-hash-1536"
  );
  const [embeddingBaseUrl, setEmbeddingBaseUrl] = useState<string>("");
  const [embeddingApiKeyInput, setEmbeddingApiKeyInput] = useState<string>("");
  const [embeddingHasStoredKey, setEmbeddingHasStoredKey] =
    useState<boolean>(false);
  const [embeddingMaskedKey, setEmbeddingMaskedKey] = useState<string | null>(
    null
  );

  // Connection Test & Save State
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] =
    useState<TestAIConnectionResponseDTO | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(
    null
  );

  const applyFetchedSettings = useCallback(
    (data: AISettingsResponseDTO) => {
      if (data.available_providers && data.available_providers.length > 0) {
        setCatalog(data.available_providers);
      }
      setLlmProvider(data.llm_provider);
      setLlmModelName(data.llm_model_name);
      setLlmBaseUrl(data.llm_base_url ?? "");
      setLlmHasStoredKey(data.llm_has_api_key);
      setLlmMaskedKey(data.llm_api_key_masked ?? null);
      setLlmTemperature(data.llm_temperature);
      setLlmApiKeyInput("");

      setEmbeddingProvider(data.embedding_provider);
      setEmbeddingModelName(data.embedding_model_name);
      setEmbeddingBaseUrl(data.embedding_base_url ?? "");
      setEmbeddingHasStoredKey(data.embedding_has_api_key);
      setEmbeddingMaskedKey(data.embedding_api_key_masked ?? null);
      setEmbeddingApiKeyInput("");

      setActiveAIEngine({
        llmProvider: data.llm_provider,
        llmModel: data.llm_model_name,
        embeddingProvider: data.embedding_provider,
        embeddingModel: data.embedding_model_name,
      });
    },
    [setActiveAIEngine]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setTestResult(null);
    setSaveError(null);
    setSaveSuccessBanner(null);
    setIsLoadingSettings(true);

    void fetchAISettings(token ?? undefined)
      .then((settings) => {
        applyFetchedSettings(settings);
      })
      .finally(() => {
        setIsLoadingSettings(false);
      });
  }, [isOpen, token, applyFetchedSettings]);

  const selectedLlmCatalog = useMemo(
    () => catalog.find((item) => item.provider_id === llmProvider),
    [catalog, llmProvider]
  );

  const selectedEmbeddingCatalog = useMemo(
    () => catalog.find((item) => item.provider_id === embeddingProvider),
    [catalog, embeddingProvider]
  );

  const embeddingCapableProviders = useMemo(
    () => catalog.filter((item) => item.supports_embeddings),
    [catalog]
  );

  const llmCapableProviders = useMemo(
    () => catalog.filter((item) => item.supports_llm),
    [catalog]
  );

  if (!isOpen) {
    return null;
  }

  const handleSelectPresetCard = (preset: ProviderCatalogItemDTO) => {
    setTestResult(null);
    setSaveError(null);
    setSaveSuccessBanner(null);

    const meta = PRESET_DISPLAY_META[preset.provider_id];
    if (preset.supports_llm) {
      setLlmProvider(preset.provider_id);
      if (preset.default_llm_model) {
        setLlmModelName(preset.default_llm_model);
      }
      setLlmBaseUrl(
        preset.supports_base_url ? meta?.defaultBaseUrl ?? "" : ""
      );
    }

    if (preset.supports_embeddings) {
      setEmbeddingProvider(preset.provider_id);
      if (preset.default_embedding_model) {
        setEmbeddingModelName(preset.default_embedding_model);
      }
      setEmbeddingBaseUrl(
        preset.supports_base_url ? meta?.defaultEmbeddingBaseUrl ?? "" : ""
      );
    }
  };

  const handleLlmProviderSelect = (nextProviderId: string) => {
    setTestResult(null);
    setSaveError(null);
    setLlmProvider(nextProviderId);
    const found = catalog.find((item) => item.provider_id === nextProviderId);
    const meta = PRESET_DISPLAY_META[nextProviderId];
    if (found?.default_llm_model) {
      setLlmModelName(found.default_llm_model);
    }
    setLlmBaseUrl(found?.supports_base_url ? meta?.defaultBaseUrl ?? "" : "");
  };

  const handleEmbeddingProviderSelect = (nextProviderId: string) => {
    setTestResult(null);
    setSaveError(null);
    setEmbeddingProvider(nextProviderId);
    const found = catalog.find((item) => item.provider_id === nextProviderId);
    const meta = PRESET_DISPLAY_META[nextProviderId];
    if (found?.default_embedding_model) {
      setEmbeddingModelName(found.default_embedding_model);
    }
    setEmbeddingBaseUrl(
      found?.supports_base_url ? meta?.defaultEmbeddingBaseUrl ?? "" : ""
    );
  };

  const resolveEffectiveEmbeddingKeyPayload = (): string | undefined => {
    if (embeddingApiKeyInput.trim()) {
      return embeddingApiKeyInput.trim();
    }
    if (embeddingProvider === llmProvider && llmApiKeyInput.trim()) {
      return llmApiKeyInput.trim();
    }
    return undefined;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveError(null);

    try {
      const result = await testAIConnection(
        {
          target: "both",
          llm_provider: llmProvider,
          llm_model_name: llmModelName,
          llm_base_url: selectedLlmCatalog?.supports_base_url
            ? llmBaseUrl.trim() || null
            : null,
          llm_api_key: llmApiKeyInput.trim() || undefined,
          llm_temperature: llmTemperature,
          embedding_provider: embeddingProvider,
          embedding_model_name: embeddingModelName,
          embedding_base_url: selectedEmbeddingCatalog?.supports_base_url
            ? embeddingBaseUrl.trim() || null
            : null,
          embedding_api_key: resolveEffectiveEmbeddingKeyPayload(),
        },
        token ?? undefined
      );
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        llm_ok: false,
        embedding_ok: false,
        latency_ms: 0,
        provider_tested: llmProvider,
        model_tested: llmModelName,
        message:
          err instanceof Error
            ? err.message
            : "Unexpected error while testing AI provider connection.",
        sample_output_preview: null,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndActivate = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccessBanner(null);

    try {
      const updated = await updateAISettings(
        {
          llm_provider: llmProvider,
          llm_model_name: llmModelName.trim(),
          llm_base_url: selectedLlmCatalog?.supports_base_url
            ? llmBaseUrl.trim() || null
            : null,
          llm_api_key: llmApiKeyInput.trim() ? llmApiKeyInput.trim() : undefined,
          llm_temperature: llmTemperature,
          embedding_provider: embeddingProvider,
          embedding_model_name: embeddingModelName.trim(),
          embedding_base_url: selectedEmbeddingCatalog?.supports_base_url
            ? embeddingBaseUrl.trim() || null
            : null,
          embedding_api_key: resolveEffectiveEmbeddingKeyPayload(),
        },
        token ?? undefined
      );

      applyFetchedSettings(updated);
      setSaveSuccessBanner(
        `Activated ${updated.llm_provider} (${updated.llm_model_name}) + ${updated.embedding_provider} embeddings.`
      );
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save AI Engine configuration."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnlyRole = Boolean(token && userRole !== "ADMIN");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Engine & Model Configuration"
      data-testid="ai-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-black/75"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  AI Inference &amp; Vector Engine Switcher
                </h2>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                  Zero-Restart Hot Swap
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dynamically configure, test, and switch Cloud LLMs, Local Ollama/vLLM servers, and 1536-d Vector Embeddings in real time.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-ai-settings-modal-btn"
            onClick={onClose}
            aria-label="Close AI Settings Modal"
            className="rounded-lg border border-slate-200/90 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {isLoadingSettings ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Synchronizing active runtime AI configuration...</span>
            </div>
          ) : null}

          {/* Quick-Select Provider Preset Cards */}
          <section aria-label="AI Provider Presets">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick-Select Provider Presets
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click a preset to auto-populate recommended LLM &amp; Embedding models
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.map((preset) => {
                const isSelected = llmProvider === preset.provider_id;
                const meta = PRESET_DISPLAY_META[preset.provider_id] ?? {
                  tagline: preset.default_llm_model ?? "Custom Plugin Provider",
                  badge: preset.requires_api_key ? "API Key" : "Local / Custom",
                };

                return (
                  <button
                    key={preset.provider_id}
                    type="button"
                    data-testid={`provider-preset-${preset.provider_id}`}
                    onClick={() => handleSelectPresetCard(preset)}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30 dark:ring-indigo-500/30"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {preset.display_name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            !preset.requires_api_key
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                          }`}
                        >
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {meta.tagline}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {preset.supports_llm ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">
                          LLM
                        </span>
                      ) : null}
                      {preset.supports_embeddings ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">
                          1536-d Vec
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dual Engine Configuration Panels */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Panel 1: LLM Reasoning Engine */}
            <section
              aria-label="LLM Reasoning Engine Configuration"
              className="space-y-4 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    1. LLM Reasoning Engine
                  </h3>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Clause Auditor
                </span>
              </div>

              {/* LLM Provider Select */}
              <div>
                <label
                  htmlFor="ai-llm-provider-select"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Active LLM Provider
                </label>
                <select
                  id="ai-llm-provider-select"
                  data-testid="ai-settings-llm-provider-select"
                  value={llmProvider}
                  onChange={(e) => handleLlmProviderSelect(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {llmCapableProviders.map((item) => (
                    <option key={item.provider_id} value={item.provider_id}>
                      {item.display_name} ({item.provider_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recommended Model Presets + Custom Model Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="ai-llm-model-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Model ID (Preset or Custom)
                  </label>
                  {selectedLlmCatalog &&
                  selectedLlmCatalog.recommended_llm_models.length > 0 ? (
                    <select
                      aria-label="Recommended LLM Model Presets"
                      data-testid="ai-settings-llm-preset-select"
                      value={
                        selectedLlmCatalog.recommended_llm_models.includes(
                          llmModelName
                        )
                          ? llmModelName
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          setLlmModelName(e.target.value);
                        }
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300"
                    >
                      <option value="" disabled>
                        Select preset...
                      </option>
                      {selectedLlmCatalog.recommended_llm_models.map((m) => (
                        <option key={m} value={m}>
                          Preset: {m}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
                <input
                  id="ai-llm-model-input"
                  type="text"
                  data-testid="ai-settings-llm-model-input"
                  value={llmModelName}
                  onChange={(e) => setLlmModelName(e.target.value)}
                  placeholder="e.g., gemini-2.5-flash or llama3.1:8b"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Conditional Base URL Input for Local Ollama / OpenAI-Compatible */}
              {selectedLlmCatalog?.supports_base_url ? (
                <div>
                  <label
                    htmlFor="ai-llm-base-url-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Globe className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Server Base URL</span>
                  </label>
                  <input
                    id="ai-llm-base-url-input"
                    type="url"
                    data-testid="ai-settings-base-url-input"
                    value={llmBaseUrl}
                    onChange={(e) => setLlmBaseUrl(e.target.value)}
                    placeholder={
                      llmProvider === "ollama"
                        ? "http://localhost:11434"
                        : "http://localhost:8000/v1"
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : null}

              {/* API Key Input with Masked Key Status */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="ai-llm-api-key-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>API Key</span>
                  </label>
                  <span
                    data-testid="ai-settings-key-status-badge"
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      !selectedLlmCatalog?.requires_api_key
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : llmHasStoredKey && llmMaskedKey
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                  >
                    {!selectedLlmCatalog?.requires_api_key
                      ? "No Key Required"
                      : llmHasStoredKey && llmMaskedKey
                      ? `Key Configured: ${llmMaskedKey}`
                      : "API Key Required"}
                  </span>
                </div>

                <div className="relative mt-1.5">
                  <input
                    id="ai-llm-api-key-input"
                    type={showApiKey ? "text" : "password"}
                    autoComplete="off"
                    data-testid="ai-settings-api-key-input"
                    value={llmApiKeyInput}
                    onChange={(e) => setLlmApiKeyInput(e.target.value)}
                    placeholder={
                      !selectedLlmCatalog?.requires_api_key
                        ? "Optional bearer key (not required for local engine)"
                        : llmHasStoredKey && llmMaskedKey
                        ? `Stored (${llmMaskedKey}) — enter new key to replace`
                        : "Paste provider API key (never returned in plaintext)"
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Temperature Control */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="ai-llm-temperature-input"
                    className="font-medium text-slate-700 dark:text-slate-300"
                  >
                    Sampling Temperature
                  </label>
                  <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {llmTemperature.toFixed(2)} (0.00 = Deterministic Legal Audit)
                  </span>
                </div>
                <input
                  id="ai-llm-temperature-input"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  data-testid="ai-settings-temperature-input"
                  value={llmTemperature}
                  onChange={(e) => setLlmTemperature(Number(e.target.value))}
                  className="mt-1.5 w-full accent-indigo-600"
                />
              </div>
            </section>

            {/* Panel 2: Vector Embedding Engine */}
            <section
              aria-label="Vector Embedding Engine Configuration"
              className="space-y-4 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    2. Vector Embedding Engine
                  </h3>
                </div>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  1536-d Auto-Adapted
                </span>
              </div>

              {/* Embedding Provider Select */}
              <div>
                <label
                  htmlFor="ai-embedding-provider-select"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Active Embedding Provider
                </label>
                <select
                  id="ai-embedding-provider-select"
                  data-testid="ai-settings-embedding-provider-select"
                  value={embeddingProvider}
                  onChange={(e) =>
                    handleEmbeddingProviderSelect(e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {embeddingCapableProviders.map((item) => (
                    <option key={item.provider_id} value={item.provider_id}>
                      {item.display_name} ({item.provider_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Embedding Model Input + Presets */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="ai-embedding-model-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Embedding Model ID
                  </label>
                  {selectedEmbeddingCatalog &&
                  selectedEmbeddingCatalog.recommended_embedding_models.length >
                    0 ? (
                    <select
                      aria-label="Recommended Embedding Model Presets"
                      data-testid="ai-settings-embedding-preset-select"
                      value={
                        selectedEmbeddingCatalog.recommended_embedding_models.includes(
                          embeddingModelName
                        )
                          ? embeddingModelName
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          setEmbeddingModelName(e.target.value);
                        }
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300"
                    >
                      <option value="" disabled>
                        Select preset...
                      </option>
                      {selectedEmbeddingCatalog.recommended_embedding_models.map(
                        (m) => (
                          <option key={m} value={m}>
                            Preset: {m}
                          </option>
                        )
                      )}
                    </select>
                  ) : null}
                </div>
                <input
                  id="ai-embedding-model-input"
                  type="text"
                  data-testid="ai-settings-embedding-model-input"
                  value={embeddingModelName}
                  onChange={(e) => setEmbeddingModelName(e.target.value)}
                  placeholder="e.g., text-embedding-004 or nomic-embed-text"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Conditional Embedding Base URL */}
              {selectedEmbeddingCatalog?.supports_base_url ? (
                <div>
                  <label
                    htmlFor="ai-embedding-base-url-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Embedding Server Base URL</span>
                  </label>
                  <input
                    id="ai-embedding-base-url-input"
                    type="url"
                    data-testid="ai-settings-embedding-base-url-input"
                    value={embeddingBaseUrl}
                    onChange={(e) => setEmbeddingBaseUrl(e.target.value)}
                    placeholder={
                      embeddingProvider === "ollama"
                        ? "http://localhost:11434"
                        : "http://localhost:8080/v1"
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : null}

              {/* Embedding API Key (optional override when using a different provider from LLM) */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="ai-embedding-api-key-input"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Embedding API Key
                  </label>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {!selectedEmbeddingCatalog?.requires_api_key
                      ? "No Key Required"
                      : embeddingHasStoredKey && embeddingMaskedKey
                      ? `Stored: ${embeddingMaskedKey}`
                      : embeddingProvider === llmProvider
                      ? "Inherits LLM API Key if blank"
                      : "Separate Key Required"}
                  </span>
                </div>
                <input
                  id="ai-embedding-api-key-input"
                  type={showApiKey ? "text" : "password"}
                  autoComplete="off"
                  data-testid="ai-settings-embedding-api-key-input"
                  value={embeddingApiKeyInput}
                  onChange={(e) => setEmbeddingApiKeyInput(e.target.value)}
                  placeholder={
                    embeddingProvider === llmProvider
                      ? "Leave blank to reuse LLM API key above"
                      : "Optional separate embedding provider API key"
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Architectural Note on Isometric Dimension Adaptation */}
              <div className="rounded-lg border border-slate-200/80 bg-white p-3 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Automatic 1536-d pgvector Adaptation:
                </strong>{" "}
                Any 384-d, 768-d (e.g.{" "}
                <code className="font-mono">text-embedding-004</code>,{" "}
                <code className="font-mono">nomic-embed-text</code>), or 3072-d
                vector is automatically adapted and L2-normalized to unit length
                with zero database schema migrations.
              </div>
            </section>
          </div>

          {/* Live Connection Diagnostic Result Card */}
          {testResult ? (
            <div
              data-testid="ai-connection-test-result"
              className={`rounded-xl border p-4 ${
                testResult.success
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="text-xs font-semibold">
                    {testResult.success
                      ? "Connection Verified — Engine Ready"
                      : "Connection Check Failed"}
                  </span>
                </div>

                <span
                  data-testid="ai-connection-latency-badge"
                  className="rounded-full border border-current/20 bg-white/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold dark:bg-slate-900/80"
                >
                  {testResult.latency_ms} ms
                </span>
              </div>

              <p className="mt-1.5 text-xs leading-relaxed">
                {testResult.message}
              </p>

              {testResult.sample_output_preview ? (
                <div className="mt-2.5 rounded-lg border border-emerald-200/80 bg-white/80 px-3 py-2 font-mono text-[11px] text-slate-700 dark:border-emerald-500/20 dark:bg-slate-900/80 dark:text-slate-300">
                  Sample Audit Probe: {testResult.sample_output_preview}
                </div>
              ) : null}
            </div>
          ) : null}

          {saveError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {saveError}
            </div>
          ) : null}

          {saveSuccessBanner ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
              {saveSuccessBanner}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="test-ai-connection-btn"
              disabled={isTesting || isSaving}
              onClick={() => void handleTestConnection()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-indigo-500/40 dark:hover:bg-slate-700"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
              <span>{isTesting ? "Testing Engine..." : "Test Connection"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              data-testid="save-ai-settings-btn"
              disabled={isSaving || isReadOnlyRole}
              title={
                isReadOnlyRole
                  ? "Only ADMIN users can mutate active workspace AI settings"
                  : "Save & Activate AI Engine"
              }
              onClick={() => void handleSaveAndActivate()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              <span>
                {isSaving ? "Activating..." : "Save & Activate Engine"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

