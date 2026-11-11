"""Thread-safe SHA-256 Semantic Clause Audit Cache and Real-Time AI FinOps Telemetry."""

import hashlib
import json
import threading
import time
from collections import OrderedDict, deque
from collections.abc import Sequence
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from typing import Final
from uuid import UUID, uuid4

from src.domain.entities import ClauseAuditResult, MatchedPlaybookRule
from src.domain.enums import AIOperationType, NegotiationStance

MAX_SEMANTIC_CACHE_ENTRIES: Final[int] = 2048
MAX_TELEMETRY_EVENTS: Final[int] = 100
_GLOBAL_BUCKET_KEY: Final[str] = "_global"

# Reference blended cost rates (USD per 1,000 tokens) used for live & avoided FinOps reporting.
_PROVIDER_PRICING_PER_1K: Final[dict[str, tuple[float, float]]] = {
    "openai": (0.0025, 0.0100),
    "anthropic": (0.0030, 0.0150),
    "gemini": (0.00125, 0.0050),
    "groq": (0.00059, 0.00079),
    "ollama": (0.0012, 0.0040),
    "openai_compatible": (0.0015, 0.0060),
    "deterministic": (0.0015, 0.0060),
}


def estimate_token_count(text: str) -> int:
    """Approximate BPE token count using 4-chars-per-token heuristic."""
    cleaned = text.strip()
    if not cleaned:
        return 0
    return max(1, len(cleaned) // 4)


def compute_token_cost_usd(
    provider: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> float:
    """Compute estimated USD spend (or avoided spend) for a token pair."""
    in_rate, out_rate = _PROVIDER_PRICING_PER_1K.get(
        provider.strip().lower(),
        (0.0015, 0.0060),
    )
    return ((max(0, prompt_tokens) / 1000.0) * in_rate) + (
        (max(0, completion_tokens) / 1000.0) * out_rate
    )


def build_semantic_cache_key(
    *,
    org_id: UUID,
    clause_text: str,
    heading: str | None,
    stance: NegotiationStance,
    matched_rules: Sequence[MatchedPlaybookRule],
    provider: str,
    model: str,
) -> str:
    """Compute a tenant-isolated SHA-256 fingerprint for clause audit caching."""
    sorted_rules = sorted(
        (
            {
                "id": str(match.rule.id),
                "category": match.rule.category,
                "standard": match.rule.standard_position,
                "fallback": match.rule.fallback_position,
                "triggers": match.rule.unacceptable_triggers,
            }
            for match in matched_rules
        ),
        key=lambda item: item["id"],
    )
    payload = {
        "org_id": str(org_id),
        "clause_text": clause_text.strip(),
        "heading": (heading or "").strip(),
        "stance": stance.value,
        "playbook_rules": sorted_rules,
        "provider": provider.strip().lower(),
        "model": model.strip(),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class TelemetryEventRecord:
    """Immutable snapshot of a recorded AI inference or semantic cache hit event."""

    event_id: str
    timestamp: str
    operation: AIOperationType
    provider: str
    model: str
    cache_hit: bool
    prompt_tokens: int
    completion_tokens: int
    tokens_saved: int
    latency_ms: float


@dataclass(frozen=True, slots=True)
class OperationMetricsSnapshot:
    """Aggregated telemetry breakdown for one `AIOperationType`."""

    operation: AIOperationType
    total_calls: int
    cache_hits: int
    total_tokens: int
    avg_latency_ms: float


@dataclass(frozen=True, slots=True)
class AITelemetrySnapshot:
    """Complete FinOps and telemetry snapshot scoped to an organization or runtime."""

    active_provider: str
    active_model: str
    semantic_cache_enabled: bool
    cached_entries_count: int
    total_requests: int
    cache_hits: int
    cache_misses: int
    cache_hit_rate_pct: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_tokens_saved: int
    estimated_cost_usd: float
    estimated_cost_saved_usd: float
    avg_latency_ms: float
    operation_metrics: list[OperationMetricsSnapshot]
    recent_events: list[TelemetryEventRecord]


@dataclass(slots=True)
class _OperationAccumulator:
    total_calls: int = 0
    cache_hits: int = 0
    total_tokens: int = 0
    total_latency_ms: float = 0.0


class _OrgTelemetryBucket:
    """Per-organization telemetry counters and bounded recent event ring buffer."""

    def __init__(self) -> None:
        self.total_requests: int = 0
        self.cache_hits: int = 0
        self.cache_misses: int = 0
        self.prompt_tokens: int = 0
        self.completion_tokens: int = 0
        self.estimated_tokens_saved: int = 0
        self.estimated_cost_usd: float = 0.0
        self.estimated_cost_saved_usd: float = 0.0
        self.total_latency_ms: float = 0.0
        self.operation_stats: dict[AIOperationType, _OperationAccumulator] = {
            op: _OperationAccumulator() for op in AIOperationType
        }
        self.recent_events: deque[TelemetryEventRecord] = deque(maxlen=MAX_TELEMETRY_EVENTS)


class SemanticAuditCacheAndTelemetryManager:
    """Thread-safe coordinator for Semantic Clause Caching and FinOps AI Telemetry."""

    _lock: threading.RLock = threading.RLock()
    _cache: OrderedDict[str, tuple[UUID, ClauseAuditResult]] = OrderedDict()
    _buckets: dict[str, _OrgTelemetryBucket] = {}

    @classmethod
    def _get_or_create_bucket(cls, org_id: UUID | None) -> _OrgTelemetryBucket:
        key = str(org_id) if org_id is not None else _GLOBAL_BUCKET_KEY
        bucket = cls._buckets.get(key)
        if bucket is None:
            bucket = _OrgTelemetryBucket()
            cls._buckets[key] = bucket
        return bucket

    @classmethod
    def get_cached_clause_audit(
        cls,
        cache_key: str,
        *,
        target_clause_id: UUID,
        target_clause_index: int,
    ) -> ClauseAuditResult | None:
        """Fetch cached `ClauseAuditResult`, move to MRU position, and bind target IDs."""
        started = time.perf_counter()
        with cls._lock:
            item = cls._cache.get(cache_key)
            if item is None:
                return None
            cls._cache.move_to_end(cache_key)
            _, cached_result = item
            hit_latency_ms = max(0.01, round((time.perf_counter() - started) * 1000.0, 3))
            return replace(
                cached_result,
                clause_id=target_clause_id,
                clause_index=target_clause_index,
                latency_ms=min(hit_latency_ms, 0.95),
            )

    @classmethod
    def set_cached_clause_audit(
        cls,
        cache_key: str,
        *,
        org_id: UUID,
        result: ClauseAuditResult,
    ) -> None:
        """Store `ClauseAuditResult` in LRU cache, evicting oldest entries above limit."""
        with cls._lock:
            cls._cache[cache_key] = (org_id, result)
            cls._cache.move_to_end(cache_key)
            while len(cls._cache) > MAX_SEMANTIC_CACHE_ENTRIES:
                cls._cache.popitem(last=False)

    @classmethod
    def clear_cache(cls, org_id: UUID | None = None) -> int:
        """Evict cached clause audit entries globally or strictly for `org_id`."""
        with cls._lock:
            if org_id is None:
                cleared = len(cls._cache)
                cls._cache.clear()
                return cleared

            keys_to_delete = [
                k for k, (entry_org_id, _) in cls._cache.items() if entry_org_id == org_id
            ]
            for k in keys_to_delete:
                del cls._cache[k]
            return len(keys_to_delete)

    @classmethod
    def count_cached_entries(cls, org_id: UUID | None = None) -> int:
        """Count active semantic cache entries globally or for `org_id`."""
        with cls._lock:
            if org_id is None:
                return len(cls._cache)
            return sum(1 for entry_org_id, _ in cls._cache.values() if entry_org_id == org_id)

    @classmethod
    def record_ai_event(
        cls,
        *,
        org_id: UUID | None,
        operation: AIOperationType,
        provider: str,
        model: str,
        cache_hit: bool,
        prompt_tokens: int,
        completion_tokens: int,
        tokens_saved: int = 0,
        saved_prompt_tokens: int = 0,
        saved_completion_tokens: int = 0,
        latency_ms: float = 0.0,
    ) -> TelemetryEventRecord:
        """Record an AI inference or cache hit event into tenant-scoped FinOps telemetry."""
        normalized_provider = provider.strip().lower() or "deterministic"
        cleaned_model = model.strip() or "policy-deterministic-v1"
        safe_prompt = max(0, prompt_tokens)
        safe_completion = max(0, completion_tokens)
        safe_saved = max(0, tokens_saved)
        safe_latency = max(0.0, round(latency_ms, 3))

        event = TelemetryEventRecord(
            event_id=f"evt-{uuid4().hex[:12]}",
            timestamp=datetime.now(UTC).isoformat(),
            operation=operation,
            provider=normalized_provider,
            model=cleaned_model,
            cache_hit=cache_hit,
            prompt_tokens=safe_prompt,
            completion_tokens=safe_completion,
            tokens_saved=safe_saved,
            latency_ms=safe_latency,
        )

        call_cost = compute_token_cost_usd(
            normalized_provider,
            safe_prompt,
            safe_completion,
        )
        if cache_hit and safe_saved > 0:
            est_saved_in = saved_prompt_tokens or int(safe_saved * 0.7)
            est_saved_out = saved_completion_tokens or max(0, safe_saved - est_saved_in)
            saved_cost = compute_token_cost_usd(
                normalized_provider,
                est_saved_in,
                est_saved_out,
            )
        else:
            saved_cost = 0.0

        with cls._lock:
            bucket = cls._get_or_create_bucket(org_id)
            bucket.total_requests += 1
            if cache_hit:
                bucket.cache_hits += 1
            else:
                bucket.cache_misses += 1

            bucket.prompt_tokens += safe_prompt
            bucket.completion_tokens += safe_completion
            bucket.estimated_tokens_saved += safe_saved
            bucket.estimated_cost_usd += call_cost
            bucket.estimated_cost_saved_usd += saved_cost
            bucket.total_latency_ms += safe_latency

            op_acc = bucket.operation_stats[operation]
            op_acc.total_calls += 1
            if cache_hit:
                op_acc.cache_hits += 1
            op_acc.total_tokens += safe_prompt + safe_completion
            op_acc.total_latency_ms += safe_latency

            bucket.recent_events.appendleft(event)
            return event

    @classmethod
    def get_telemetry_snapshot(
        cls,
        *,
        org_id: UUID | None,
        active_provider: str,
        active_model: str,
    ) -> AITelemetrySnapshot:
        """Return aggregated FinOps metrics, cache stats, and recent events for `org_id`."""
        with cls._lock:
            bucket = cls._get_or_create_bucket(org_id)
            cached_count = cls.count_cached_entries(org_id)
            total_reqs = bucket.total_requests
            hit_rate = (
                round((bucket.cache_hits / total_reqs) * 100.0, 2) if total_reqs > 0 else 0.0
            )
            avg_latency = (
                round(bucket.total_latency_ms / total_reqs, 3) if total_reqs > 0 else 0.0
            )
            total_tokens = bucket.prompt_tokens + bucket.completion_tokens

            op_metrics = [
                OperationMetricsSnapshot(
                    operation=op,
                    total_calls=acc.total_calls,
                    cache_hits=acc.cache_hits,
                    total_tokens=acc.total_tokens,
                    avg_latency_ms=(
                        round(acc.total_latency_ms / acc.total_calls, 3)
                        if acc.total_calls > 0
                        else 0.0
                    ),
                )
                for op, acc in bucket.operation_stats.items()
            ]

            return AITelemetrySnapshot(
                active_provider=active_provider,
                active_model=active_model,
                semantic_cache_enabled=True,
                cached_entries_count=cached_count,
                total_requests=total_reqs,
                cache_hits=bucket.cache_hits,
                cache_misses=bucket.cache_misses,
                cache_hit_rate_pct=hit_rate,
                prompt_tokens=bucket.prompt_tokens,
                completion_tokens=bucket.completion_tokens,
                total_tokens=total_tokens,
                estimated_tokens_saved=bucket.estimated_tokens_saved,
                estimated_cost_usd=round(bucket.estimated_cost_usd, 6),
                estimated_cost_saved_usd=round(bucket.estimated_cost_saved_usd, 6),
                avg_latency_ms=avg_latency,
                operation_metrics=op_metrics,
                recent_events=list(bucket.recent_events),
            )

    @classmethod
    def reset(cls) -> None:
        """Clear all semantic cache entries and FinOps telemetry buckets across tenants."""
        with cls._lock:
            cls._cache.clear()
            cls._buckets.clear()


def reset_ai_telemetry_and_cache() -> None:
    """Reset the Semantic Clause Cache and AI FinOps telemetry store cleanly."""
    SemanticAuditCacheAndTelemetryManager.reset()


__all__ = [
    "AITelemetrySnapshot",
    "MAX_SEMANTIC_CACHE_ENTRIES",
    "MAX_TELEMETRY_EVENTS",
    "OperationMetricsSnapshot",
    "SemanticAuditCacheAndTelemetryManager",
    "TelemetryEventRecord",
    "build_semantic_cache_key",
    "compute_token_cost_usd",
    "estimate_token_count",
    "reset_ai_telemetry_and_cache",
]

