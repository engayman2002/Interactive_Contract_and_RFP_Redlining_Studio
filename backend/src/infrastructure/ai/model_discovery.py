"""Async live model discovery adapter for Cloud LLM APIs and Local Inference Servers."""

import time
from dataclasses import dataclass
from typing import Any, Final, Literal

import httpx

from src.infrastructure.ai.runtime_settings import (
    CURATED_PROVIDER_PRESET_MAP,
    sanitize_secret_from_text,
)

DiscoverySource = Literal["live_api", "unconfigured", "unreachable"]

_MANUAL_OR_LIVE_GUIDANCE: Final[str] = (
    "Provide a valid API key (or start your local server) and click Fetch Live Models "
    "to load available models from the provider, or type your model ID manually."
)

_GEMINI_DEFAULT_BASE_URL: Final[str] = "https://generativelanguage.googleapis.com/v1beta"
_GROQ_DEFAULT_BASE_URL: Final[str] = "https://api.groq.com/openai/v1"
_OPENAI_DEFAULT_BASE_URL: Final[str] = "https://api.openai.com/v1"
_OPENAI_COMPAT_DEFAULT_BASE_URL: Final[str] = "http://localhost:8000/v1"
_ANTHROPIC_DEFAULT_BASE_URL: Final[str] = "https://api.anthropic.com/v1"
_OLLAMA_DEFAULT_BASE_URL: Final[str] = "http://localhost:11434"

_EMBEDDING_KEYWORDS: Final[tuple[str, ...]] = (
    "embed",
    "bge",
    "e5-",
    "/e5",
    "minilm",
    "nomic-embed",
    "mxbai-embed",
    "arctic-embed",
)

_NON_CHAT_AUDIO_IMAGE_KEYWORDS: Final[tuple[str, ...]] = (
    "whisper",
    "tts",
    "playai",
    "orpheus",
    "dall-e",
    "gpt-image",
    "moderation",
    "davinci-002",
    "babbage-002",
    "transcribe",
)


@dataclass(frozen=True)
class DiscoveredModelsResult:
    """Typed result of live provider model discovery (zero static model fallbacks)."""

    provider_id: str
    source: DiscoverySource
    llm_models: list[str]
    embedding_models: list[str]
    latency_ms: float
    message: str


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    """Deduplicate non-empty stripped model identifiers while preserving API order."""
    seen: dict[str, None] = {}
    for raw in items:
        cleaned = raw.strip()
        if cleaned and cleaned not in seen:
            seen[cleaned] = None
    return list(seen.keys())


def _is_embedding_model_id(model_id: str) -> bool:
    low = model_id.strip().lower()
    if any(token in low for token in _EMBEDDING_KEYWORDS):
        return True
    return low.startswith("nomic") or low.startswith("mxbai")


def _is_excluded_non_text_model(model_id: str) -> bool:
    low = model_id.strip().lower()
    return any(token in low for token in _NON_CHAT_AUDIO_IMAGE_KEYWORDS)


def _build_openai_models_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/models"):
        return trimmed
    if trimmed.endswith("/v1"):
        return f"{trimmed}/models"
    return f"{trimmed}/v1/models"


def _build_ollama_tags_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/api/tags"):
        return trimmed
    if trimmed.endswith("/v1"):
        trimmed = trimmed[:-3].rstrip("/")
    return f"{trimmed}/api/tags"


def _parse_gemini_models(payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    raw_models = payload.get("models")
    if not isinstance(raw_models, list):
        return ([], [])

    llm_models: list[str] = []
    embedding_models: list[str] = []

    for entry in raw_models:
        if not isinstance(entry, dict):
            continue
        raw_name = entry.get("name")
        if not isinstance(raw_name, str) or not raw_name.strip():
            continue
        model_id = raw_name.strip()
        if model_id.startswith("models/"):
            model_id = model_id[len("models/") :]
        if not model_id:
            continue

        methods_raw = entry.get("supportedGenerationMethods")
        methods = (
            {str(m) for m in methods_raw if isinstance(m, str)}
            if isinstance(methods_raw, list)
            else set()
        )
        low = model_id.lower()

        if "embedContent" in methods or "batchEmbedContents" in methods or "embedding" in low:
            embedding_models.append(model_id)
        if "generateContent" in methods and not any(
            skip in low for skip in ("imagen", "veo", "aqa")
        ):
            llm_models.append(model_id)

    return (_dedupe_preserve_order(llm_models), _dedupe_preserve_order(embedding_models))


def _parse_openai_style_models(
    payload: dict[str, Any],
    *,
    allow_embeddings: bool,
    strict_openai_chat_filter: bool,
) -> tuple[list[str], list[str]]:
    raw_items = payload.get("data")
    if not isinstance(raw_items, list):
        raw_items = payload.get("models")
    if not isinstance(raw_items, list):
        return ([], [])

    llm_models: list[str] = []
    embedding_models: list[str] = []

    for entry in raw_items:
        model_id = ""
        if isinstance(entry, dict):
            raw_id = entry.get("id") or entry.get("name")
            if isinstance(raw_id, str):
                model_id = raw_id.strip()
        elif isinstance(entry, str):
            model_id = entry.strip()

        if not model_id:
            continue

        if _is_embedding_model_id(model_id):
            if allow_embeddings:
                embedding_models.append(model_id)
            continue

        if _is_excluded_non_text_model(model_id):
            continue

        if strict_openai_chat_filter:
            low = model_id.lower()
            if any(
                low.startswith(prefix)
                for prefix in ("gpt-", "chatgpt-", "o1", "o3", "o4", "ft:gpt-")
            ) or any(
                token in low
                for token in ("instruct", "chat", "llama", "qwen", "mistral", "deepseek")
            ):
                llm_models.append(model_id)
        else:
            llm_models.append(model_id)

    return (_dedupe_preserve_order(llm_models), _dedupe_preserve_order(embedding_models))


def _parse_ollama_tags(payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    raw_models = payload.get("models")
    if not isinstance(raw_models, list):
        return ([], [])

    llm_models: list[str] = []
    embedding_models: list[str] = []

    for entry in raw_models:
        if not isinstance(entry, dict):
            continue
        raw_name = entry.get("name") or entry.get("model")
        if not isinstance(raw_name, str) or not raw_name.strip():
            continue
        model_id = raw_name.strip()
        if _is_embedding_model_id(model_id):
            embedding_models.append(model_id)
        else:
            llm_models.append(model_id)

    return (_dedupe_preserve_order(llm_models), _dedupe_preserve_order(embedding_models))


async def discover_provider_models(
    provider_id: str,
    api_key: str | None = None,
    base_url: str | None = None,
    *,
    timeout_seconds: float = 10.0,
    http_client: httpx.AsyncClient | None = None,
) -> DiscoveredModelsResult:
    """Query a provider's live `/models` or `/api/tags` endpoint without static model fallbacks."""
    normalized = provider_id.strip().lower()
    preset = CURATED_PROVIDER_PRESET_MAP.get(normalized)
    display_name = preset.display_name if preset is not None else normalized
    cleaned_key = api_key.strip() if api_key and api_key.strip() else None
    cleaned_base = base_url.strip() if base_url and base_url.strip() else None

    if normalized == "deterministic":
        return DiscoveredModelsResult(
            provider_id="deterministic",
            source="live_api",
            llm_models=["policy-deterministic-v1"],
            embedding_models=["deterministic-hash-1536"],
            latency_ms=0.1,
            message="Offline Deterministic Engine internal rules ready (in-process).",
        )

    if preset is not None and preset.requires_api_key and not cleaned_key:
        return DiscoveredModelsResult(
            provider_id=normalized,
            source="unconfigured",
            llm_models=[],
            embedding_models=[],
            latency_ms=0.0,
            message=_MANUAL_OR_LIVE_GUIDANCE,
        )

    url: str
    headers: dict[str, str] = {"Accept": "application/json"}
    params: dict[str, str] | None = None

    if normalized == "gemini":
        root = (cleaned_base or _GEMINI_DEFAULT_BASE_URL).rstrip("/")
        url = root if root.endswith("/models") else f"{root}/models"
        headers["x-goog-api-key"] = cleaned_key or ""
        params = {"pageSize": "100"}
    elif normalized == "groq":
        root = cleaned_base or _GROQ_DEFAULT_BASE_URL
        url = _build_openai_models_url(root)
        headers["Authorization"] = f"Bearer {cleaned_key or ''}"
    elif normalized == "openai":
        root = cleaned_base or _OPENAI_DEFAULT_BASE_URL
        url = _build_openai_models_url(root)
        headers["Authorization"] = f"Bearer {cleaned_key or ''}"
    elif normalized == "anthropic":
        root = cleaned_base or _ANTHROPIC_DEFAULT_BASE_URL
        url = _build_openai_models_url(root)
        headers["x-api-key"] = cleaned_key or ""
        headers["anthropic-version"] = "2023-06-01"
    elif normalized == "ollama":
        root = cleaned_base or _OLLAMA_DEFAULT_BASE_URL
        url = _build_ollama_tags_url(root)
    elif normalized == "openai_compatible":
        root = cleaned_base or _OPENAI_COMPAT_DEFAULT_BASE_URL
        url = _build_openai_models_url(root)
        if cleaned_key:
            headers["Authorization"] = f"Bearer {cleaned_key}"
    else:
        if not cleaned_base:
            return DiscoveredModelsResult(
                provider_id=normalized,
                source="unconfigured",
                llm_models=[],
                embedding_models=[],
                latency_ms=0.0,
                message=_MANUAL_OR_LIVE_GUIDANCE,
            )
        url = _build_openai_models_url(cleaned_base)
        if cleaned_key:
            headers["Authorization"] = f"Bearer {cleaned_key}"

    started_at = time.perf_counter()
    try:
        if http_client is not None:
            response = await http_client.get(url, headers=headers, params=params)
        else:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                response = await client.get(url, headers=headers, params=params)

        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 2)

        if response.status_code >= 400:
            safe_status_body = sanitize_secret_from_text(
                response.text[:240],
                cleaned_key,
            )
            return DiscoveredModelsResult(
                provider_id=normalized,
                source="unreachable",
                llm_models=[],
                embedding_models=[],
                latency_ms=latency_ms,
                message=(
                    f"Provider returned HTTP {response.status_code} ({safe_status_body}). "
                    f"{_MANUAL_OR_LIVE_GUIDANCE}"
                ),
            )

        body = response.json()
        if not isinstance(body, dict):
            return DiscoveredModelsResult(
                provider_id=normalized,
                source="unreachable",
                llm_models=[],
                embedding_models=[],
                latency_ms=latency_ms,
                message=f"Unexpected non-object JSON payload. {_MANUAL_OR_LIVE_GUIDANCE}",
            )

        if normalized == "gemini":
            live_llm, live_emb = _parse_gemini_models(body)
        elif normalized == "ollama":
            live_llm, live_emb = _parse_ollama_tags(body)
        elif normalized in ("groq", "anthropic"):
            live_llm, live_emb = _parse_openai_style_models(
                body,
                allow_embeddings=False,
                strict_openai_chat_filter=False,
            )
        elif normalized == "openai":
            live_llm, live_emb = _parse_openai_style_models(
                body,
                allow_embeddings=True,
                strict_openai_chat_filter=True,
            )
        else:
            live_llm, live_emb = _parse_openai_style_models(
                body,
                allow_embeddings=True,
                strict_openai_chat_filter=False,
            )

        total_found = len(live_llm) + len(live_emb)
        if total_found == 0:
            return DiscoveredModelsResult(
                provider_id=normalized,
                source="unreachable",
                llm_models=[],
                embedding_models=[],
                latency_ms=latency_ms,
                message=(
                    f"Connected to {display_name}, but 0 models were returned. "
                    f"{_MANUAL_OR_LIVE_GUIDANCE}"
                ),
            )

        return DiscoveredModelsResult(
            provider_id=normalized,
            source="live_api",
            llm_models=live_llm,
            embedding_models=live_emb,
            latency_ms=latency_ms,
            message=(
                f"Fetched {len(live_llm)} LLM and {len(live_emb)} embedding models "
                f"from {display_name} ({latency_ms} ms)."
            ),
        )
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 2)
        safe_err = sanitize_secret_from_text(str(exc), cleaned_key)
        return DiscoveredModelsResult(
            provider_id=normalized,
            source="unreachable",
            llm_models=[],
            embedding_models=[],
            latency_ms=latency_ms,
            message=(
                f"Could not reach {display_name} ({safe_err}). "
                f"{_MANUAL_OR_LIVE_GUIDANCE}"
            ),
        )


__all__ = [
    "DiscoveredModelsResult",
    "DiscoverySource",
    "discover_provider_models",
]
