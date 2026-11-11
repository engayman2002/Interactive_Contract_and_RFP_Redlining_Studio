"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Cpu,
  DollarSign,
  Loader2,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { useAuthSession } from "@/services/authSession";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useI18n } from "@/i18n/useI18n";

export const AITelemetryPanel: React.FC = () => {
  const { t } = useI18n();
  const { session, token } = useAuthSession();
  const isViewer = session?.userRole === "VIEWER";

  const aiTelemetry = useWorkspaceStore((state) => state.aiTelemetry);
  const isLoadingTelemetry = useWorkspaceStore(
    (state) => state.isLoadingTelemetry
  );
  const telemetryStatusMessage = useWorkspaceStore(
    (state) => state.telemetryStatusMessage
  );
  const refreshAITelemetry = useWorkspaceStore(
    (state) => state.refreshAITelemetry
  );
  const purgeAISemanticCache = useWorkspaceStore(
    (state) => state.purgeAISemanticCache
  );

  const [isPurging, setIsPurging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void refreshAITelemetry(token ?? undefined);
  }, [refreshAITelemetry, token]);

  const handleRefresh = async () => {
    setErrorMsg(null);
    await refreshAITelemetry(token ?? undefined);
  };

  const handlePurgeCache = async () => {
    setErrorMsg(null);
    setIsPurging(true);
    try {
      await purgeAISemanticCache(token ?? undefined);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to purge Semantic Clause Audit Cache."
      );
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div
      data-testid="ai-telemetry-panel"
      className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4"
    >
      {/* Header & Controls */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {t.telemetry.title}
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {t.telemetry.engineLabel}{" "}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {aiTelemetry?.active_provider ?? "deterministic"} /{" "}
                {aiTelemetry?.active_model ?? "policy-deterministic-v1"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="refresh-telemetry-btn"
              onClick={() => void handleRefresh()}
              disabled={isLoadingTelemetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isLoadingTelemetry ? "animate-spin" : ""
                }`}
              />
              <span>{t.telemetry.refreshBtn}</span>
            </button>

            <button
              type="button"
              data-testid="clear-semantic-cache-btn"
              onClick={() => void handlePurgeCache()}
              disabled={isPurging || isViewer}
              title={
                isViewer
                  ? "Viewer role cannot purge AI Semantic Cache"
                  : undefined
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-rose-600"
            >
              {isPurging ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{t.telemetry.purgeBtn}</span>
            </button>
          </div>
        </div>

        {telemetryStatusMessage ? (
          <div
            data-testid="telemetry-status-banner"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            {telemetryStatusMessage}
          </div>
        ) : null}

        {errorMsg ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        ) : null}
      </div>

      {/* 4 FinOps KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Card 1: Semantic Cache Hit Rate */}
        <div
          data-testid="telemetry-cache-hit-rate"
          className="surface-card rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.telemetry.cacheHitRate}
            </span>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            {(aiTelemetry?.cache_hit_rate_pct ?? 0).toFixed(1)}%
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>
              {aiTelemetry?.cache_hits ?? 0} {t.telemetry.hitsLabel} /{" "}
              {aiTelemetry?.total_requests ?? 0} {t.telemetry.totalLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {aiTelemetry?.cached_entries_count ?? 0}{" "}
              {t.telemetry.cachedClausesSuffix}
            </span>
          </div>
        </div>

        {/* Card 2: Total Tokens & Savings */}
        <div
          data-testid="telemetry-tokens-saved"
          className="surface-card rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.telemetry.tokensUsedSaved}
            </span>
            <Cpu className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            {(aiTelemetry?.total_tokens ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {aiTelemetry?.prompt_tokens ?? 0} in /{" "}
              {aiTelemetry?.completion_tokens ?? 0} out
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
              {(aiTelemetry?.estimated_tokens_saved ?? 0).toLocaleString()}{" "}
              {t.telemetry.tokensSavedSuffix}
            </span>
          </div>
        </div>

        {/* Card 3: Avg AI Latency */}
        <div
          data-testid="telemetry-avg-latency"
          className="surface-card rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.telemetry.avgLatency}
            </span>
            <Activity className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            {(aiTelemetry?.avg_latency_ms ?? 0).toFixed(2)} ms
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {t.telemetry.cacheLatencySub}
          </p>
        </div>

        {/* Card 4: Estimated FinOps Cost & Savings */}
        <div
          data-testid="telemetry-cost-saved"
          className="surface-card rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.telemetry.estSpend}
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
            ${(aiTelemetry?.estimated_cost_usd ?? 0).toFixed(4)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {t.telemetry.avoidedSpend}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
              {t.telemetry.savedPrefix} $
              {(aiTelemetry?.estimated_cost_saved_usd ?? 0).toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Per-Operation Breakdown */}
      {aiTelemetry && aiTelemetry.operation_metrics.length > 0 ? (
        <div className="surface-card rounded-xl p-3.5">
          <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.telemetry.opBreakdownTitle}
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {aiTelemetry.operation_metrics.map((op) => (
              <div
                key={op.operation}
                className="rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-[11px] dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="truncate font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {op.operation}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>
                    {op.total_calls} {t.telemetry.callsSuffix}
                  </span>
                  <span>{op.avg_latency_ms.toFixed(1)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent AI Telemetry Events */}
      <div
        data-testid="telemetry-recent-events"
        className="surface-card rounded-xl p-3.5"
      >
        <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.telemetry.recentEventsTitle}
        </h4>
        {!aiTelemetry || aiTelemetry.recent_events.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {t.telemetry.noEvents}
          </p>
        ) : (
          <div className="space-y-2">
            {aiTelemetry.recent_events.map((evt) => (
              <div
                key={evt.event_id}
                data-testid={`telemetry-event-${evt.event_id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {evt.cache_hit ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Zap className="h-3 w-3" />
                      <span>{t.telemetry.cacheHitBadge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <Bot className="h-3 w-3" />
                      <span>🤖 {t.telemetry.liveInferenceBadge}</span>
                    </span>
                  )}
                  <span className="font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                    {evt.operation}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {evt.provider}/{evt.model}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                  {evt.cache_hit ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      +{evt.tokens_saved} saved
                    </span>
                  ) : (
                    <span>
                      {evt.prompt_tokens + evt.completion_tokens} tok
                    </span>
                  )}
                  <span>{evt.latency_ms.toFixed(2)} ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

