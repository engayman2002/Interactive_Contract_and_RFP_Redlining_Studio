"""Thread-safe Runtime AI Configuration Manager for live LLM and Embedding provider switching."""

import threading
from dataclasses import dataclass
from typing import Final

from src.domain.ports import ClauseAuditorPort, EmbeddingGeneratorPort
from src.infrastructure.ai.provider_registry import LLMProviderRegistry, create_llm_runnable
from src.infrastructure.ai.redline_chain import LangChainClauseAuditor
from src.infrastructure.config import Settings, get_settings
from src.infrastructure.vector.provider_registry import (
    EmbeddingProviderRegistry,
    UnsupportedAIProviderError,
    create_embedding_generator,
)

_SENTINEL: Final[object] = object()


@dataclass(frozen=True)
class CuratedProviderPreset:
    """Capability metadata for a built-in AI provider (zero hardcoded external model lists)."""

    provider_id: str
    display_name: str
    supports_llm: bool
    supports_embeddings: bool
    requires_api_key: bool
    supports_base_url: bool
    default_llm_model: str | None
    recommended_llm_models: tuple[str, ...]
    default_embedding_model: str | None
    recommended_embedding_models: tuple[str, ...]


CURATED_PROVIDER_PRESETS: Final[tuple[CuratedProviderPreset, ...]] = (
    CuratedProviderPreset(
        provider_id="deterministic",
        display_name="Offline Deterministic Engine",
        supports_llm=True,
        supports_embeddings=True,
        requires_api_key=False,
        supports_base_url=False,
        default_llm_model="policy-deterministic-v1",
        recommended_llm_models=("policy-deterministic-v1",),
        default_embedding_model="deterministic-hash-1536",
        recommended_embedding_models=("deterministic-hash-1536",),
    ),
    CuratedProviderPreset(
        provider_id="gemini",
        display_name="Google Gemini",
        supports_llm=True,
        supports_embeddings=True,
        requires_api_key=True,
        supports_base_url=False,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
    CuratedProviderPreset(
        provider_id="groq",
        display_name="Groq Cloud LPU",
        supports_llm=True,
        supports_embeddings=False,
        requires_api_key=True,
        supports_base_url=False,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
    CuratedProviderPreset(
        provider_id="openai",
        display_name="OpenAI",
        supports_llm=True,
        supports_embeddings=True,
        requires_api_key=True,
        supports_base_url=False,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
    CuratedProviderPreset(
        provider_id="anthropic",
        display_name="Anthropic Claude",
        supports_llm=True,
        supports_embeddings=False,
        requires_api_key=True,
        supports_base_url=False,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
    CuratedProviderPreset(
        provider_id="ollama",
        display_name="Local Ollama",
        supports_llm=True,
        supports_embeddings=True,
        requires_api_key=False,
        supports_base_url=True,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
    CuratedProviderPreset(
        provider_id="openai_compatible",
        display_name="OpenAI-Compatible Local Server",
        supports_llm=True,
        supports_embeddings=True,
        requires_api_key=False,
        supports_base_url=True,
        default_llm_model=None,
        recommended_llm_models=(),
        default_embedding_model=None,
        recommended_embedding_models=(),
    ),
)

CURATED_PROVIDER_PRESET_MAP: Final[dict[str, CuratedProviderPreset]] = {
    preset.provider_id: preset for preset in CURATED_PROVIDER_PRESETS
}


def mask_api_key(key: str | None) -> str | None:
    """Return a masked preview of an API key (e.g., `'AIza...7b1c'`) without exposing plaintext."""
    if key is None:
        return None
    cleaned = key.strip()
    if not cleaned:
        return None
    if len(cleaned) <= 8:
        return "****"
    return f"{cleaned[:4]}...{cleaned[-4:]}"


def sanitize_secret_from_text(message: str, *secrets_to_scrub: str | None) -> str:
    """Scrub any candidate or active API keys from diagnostic error strings."""
    sanitized = message
    for secret in secrets_to_scrub:
        if secret:
            cleaned = secret.strip()
            if cleaned and cleaned in sanitized:
                masked = mask_api_key(cleaned) or "****"
                sanitized = sanitized.replace(cleaned, masked)
    return sanitized


@dataclass
class _RuntimeAIOverrides:
    """Mutable internal state protected by `RuntimeAISettingsManager._lock`."""

    llm_provider: str
    llm_model_name: str
    llm_base_url: str | None
    llm_api_key: str | None
    llm_temperature: float
    embedding_provider: str
    embedding_model_name: str
    embedding_base_url: str | None
    embedding_api_key: str | None


class RuntimeAISettingsManager:
    """Singleton thread-safe runtime AI configuration manager.

    Allows dynamic inspection, connection testing, and live switching of LLM and
    Vector Embedding providers without restarting containers or mutating `.env` files.
    """

    _lock: threading.RLock = threading.RLock()
    _overrides: _RuntimeAIOverrides | None = None
    _cached_auditor: ClauseAuditorPort | None = None
    _cached_embedder: EmbeddingGeneratorPort | None = None

    @classmethod
    def _ensure_initialized(cls) -> _RuntimeAIOverrides:
        """Initialize runtime state lazily from base `Settings` on first access."""
        with cls._lock:
            if cls._overrides is None:
                base = get_settings()
                init_llm_provider = base.LLM_PROVIDER.strip().lower()
                init_llm_model = base.LLM_MODEL_NAME.strip() or (
                    "policy-deterministic-v1" if init_llm_provider == "deterministic" else ""
                )
                init_emb_provider = base.EMBEDDING_PROVIDER.strip().lower()
                init_emb_model = base.EMBEDDING_MODEL_NAME.strip() or (
                    "deterministic-hash-1536" if init_emb_provider == "deterministic" else ""
                )
                cls._overrides = _RuntimeAIOverrides(
                    llm_provider=init_llm_provider,
                    llm_model_name=init_llm_model,
                    llm_base_url=base.LLM_BASE_URL,
                    llm_api_key=None,
                    llm_temperature=base.LLM_TEMPERATURE,
                    embedding_provider=init_emb_provider,
                    embedding_model_name=init_emb_model,
                    embedding_base_url=base.EMBEDDING_BASE_URL,
                    embedding_api_key=None,
                )
            return cls._overrides

    @classmethod
    def reset(cls) -> None:
        """Reset runtime overrides back to base environment `Settings` and clear caches."""
        with cls._lock:
            cls._overrides = None
            cls._cached_auditor = None
            cls._cached_embedder = None

    @staticmethod
    def _resolve_provider_llm_key(
        provider: str,
        override_key: str | None,
        base: Settings,
    ) -> str | None:
        if override_key is not None and override_key.strip():
            return override_key.strip()
        normalized = provider.strip().lower()
        if normalized in ("deterministic", "ollama"):
            return None
        if normalized == "gemini":
            return base.GEMINI_API_KEY or base.LLM_API_KEY
        if normalized == "groq":
            return base.GROQ_API_KEY or base.LLM_API_KEY
        if normalized == "openai":
            return base.OPENAI_API_KEY or base.LLM_API_KEY
        if normalized == "anthropic":
            return base.ANTHROPIC_API_KEY or base.LLM_API_KEY
        if normalized == "openai_compatible":
            return base.LLM_API_KEY or base.OPENAI_API_KEY
        return base.LLM_API_KEY

    @staticmethod
    def _resolve_provider_embedding_key(
        provider: str,
        override_key: str | None,
        base: Settings,
    ) -> str | None:
        if override_key is not None and override_key.strip():
            return override_key.strip()
        normalized = provider.strip().lower()
        if normalized in ("deterministic", "ollama"):
            return None
        if normalized == "gemini":
            return base.GEMINI_API_KEY or base.EMBEDDING_API_KEY
        if normalized == "openai":
            return base.OPENAI_API_KEY or base.EMBEDDING_API_KEY
        if normalized == "openai_compatible":
            return base.EMBEDDING_API_KEY or base.OPENAI_API_KEY
        return base.EMBEDDING_API_KEY

    @classmethod
    def get_effective_settings(cls) -> Settings:
        """Return a cloned `Settings` object with current runtime AI overrides applied."""
        with cls._lock:
            state = cls._ensure_initialized()
            base = get_settings()
            effective_llm_key = cls._resolve_provider_llm_key(
                provider=state.llm_provider,
                override_key=state.llm_api_key,
                base=base,
            )
            effective_emb_key = cls._resolve_provider_embedding_key(
                provider=state.embedding_provider,
                override_key=state.embedding_api_key,
                base=base,
            )
            return base.model_copy(
                update={
                    "LLM_PROVIDER": state.llm_provider,
                    "LLM_MODEL_NAME": state.llm_model_name,
                    "LLM_BASE_URL": state.llm_base_url,
                    "LLM_API_KEY": effective_llm_key,
                    "LLM_TEMPERATURE": state.llm_temperature,
                    "EMBEDDING_PROVIDER": state.embedding_provider,
                    "EMBEDDING_MODEL_NAME": state.embedding_model_name,
                    "EMBEDDING_BASE_URL": state.embedding_base_url,
                    "EMBEDDING_API_KEY": effective_emb_key,
                    # Prevent cross-provider fallback leakage when a specific provider has no key
                    "GROQ_API_KEY": effective_llm_key if state.llm_provider == "groq" else None,
                    "OPENAI_API_KEY": (
                        effective_llm_key
                        if state.llm_provider in ("openai", "openai_compatible")
                        else effective_emb_key
                        if state.embedding_provider in ("openai", "openai_compatible")
                        else None
                    ),
                    "ANTHROPIC_API_KEY": (
                        effective_llm_key if state.llm_provider == "anthropic" else None
                    ),
                    "GEMINI_API_KEY": (
                        effective_llm_key
                        if state.llm_provider == "gemini"
                        else effective_emb_key
                        if state.embedding_provider == "gemini"
                        else None
                    ),
                }
            )

    @classmethod
    def build_candidate_settings(
        cls,
        *,
        llm_provider: str | None = None,
        llm_model_name: str | None = None,
        llm_base_url: str | None = None,
        llm_api_key: str | None = None,
        llm_temperature: float | None = None,
        embedding_provider: str | None = None,
        embedding_model_name: str | None = None,
        embedding_base_url: str | None = None,
        embedding_api_key: str | None = None,
        timeout_seconds: float = 20.0,
    ) -> Settings:
        """Build an isolated candidate `Settings` snapshot for pre-save connection testing."""
        with cls._lock:
            state = cls._ensure_initialized()
            base = get_settings()

            cand_llm_provider = (
                llm_provider.strip().lower() if llm_provider else state.llm_provider
            )
            if llm_model_name is not None and llm_model_name.strip():
                cand_llm_model = llm_model_name.strip()
            elif cand_llm_provider == "deterministic":
                cand_llm_model = "policy-deterministic-v1"
            elif cand_llm_provider == state.llm_provider and llm_model_name is None:
                cand_llm_model = state.llm_model_name
            else:
                cand_llm_model = ""
            cand_llm_base_url = (
                llm_base_url.strip()
                if llm_base_url is not None and llm_base_url.strip()
                else (
                    state.llm_base_url
                    if cand_llm_provider == state.llm_provider and llm_base_url is None
                    else None
                )
            )
            cand_llm_override = (
                llm_api_key.strip()
                if llm_api_key is not None and llm_api_key.strip()
                else (state.llm_api_key if cand_llm_provider == state.llm_provider else None)
            )
            cand_llm_key = cls._resolve_provider_llm_key(
                provider=cand_llm_provider,
                override_key=cand_llm_override,
                base=base,
            )
            cand_temp = (
                llm_temperature if llm_temperature is not None else state.llm_temperature
            )

            cand_emb_provider = (
                embedding_provider.strip().lower()
                if embedding_provider
                else state.embedding_provider
            )
            if embedding_model_name is not None and embedding_model_name.strip():
                cand_emb_model = embedding_model_name.strip()
            elif cand_emb_provider == "deterministic":
                cand_emb_model = "deterministic-hash-1536"
            elif cand_emb_provider == state.embedding_provider and embedding_model_name is None:
                cand_emb_model = state.embedding_model_name
            else:
                cand_emb_model = ""
            cand_emb_base_url = (
                embedding_base_url.strip()
                if embedding_base_url is not None and embedding_base_url.strip()
                else (
                    state.embedding_base_url
                    if cand_emb_provider == state.embedding_provider
                    and embedding_base_url is None
                    else None
                )
            )
            cand_emb_override = (
                embedding_api_key.strip()
                if embedding_api_key is not None and embedding_api_key.strip()
                else (
                    state.embedding_api_key
                    if cand_emb_provider == state.embedding_provider
                    else None
                )
            )
            cand_emb_key = cls._resolve_provider_embedding_key(
                provider=cand_emb_provider,
                override_key=cand_emb_override,
                base=base,
            )

            return base.model_copy(
                update={
                    "LLM_PROVIDER": cand_llm_provider,
                    "LLM_MODEL_NAME": cand_llm_model,
                    "LLM_BASE_URL": cand_llm_base_url,
                    "LLM_API_KEY": cand_llm_key,
                    "LLM_TEMPERATURE": cand_temp,
                    "LLM_TIMEOUT_SECONDS": timeout_seconds,
                    "EMBEDDING_PROVIDER": cand_emb_provider,
                    "EMBEDDING_MODEL_NAME": cand_emb_model,
                    "EMBEDDING_BASE_URL": cand_emb_base_url,
                    "EMBEDDING_API_KEY": cand_emb_key,
                    "EMBEDDING_TIMEOUT_SECONDS": timeout_seconds,
                    "GROQ_API_KEY": cand_llm_key if cand_llm_provider == "groq" else None,
                    "OPENAI_API_KEY": (
                        cand_llm_key
                        if cand_llm_provider in ("openai", "openai_compatible")
                        else cand_emb_key
                        if cand_emb_provider in ("openai", "openai_compatible")
                        else None
                    ),
                    "ANTHROPIC_API_KEY": (
                        cand_llm_key if cand_llm_provider == "anthropic" else None
                    ),
                    "GEMINI_API_KEY": (
                        cand_llm_key
                        if cand_llm_provider == "gemini"
                        else cand_emb_key
                        if cand_emb_provider == "gemini"
                        else None
                    ),
                }
            )

    @classmethod
    def update_runtime_ai_settings(
        cls,
        *,
        llm_provider: str | None = None,
        llm_model_name: str | None = None,
        llm_base_url: str | None | object = _SENTINEL,
        llm_api_key: str | None = None,
        llm_temperature: float | None = None,
        embedding_provider: str | None = None,
        embedding_model_name: str | None = None,
        embedding_base_url: str | None | object = _SENTINEL,
        embedding_api_key: str | None = None,
    ) -> Settings:
        """Validate providers, update active in-memory settings, and clear cached AI adapters."""
        with cls._lock:
            state = cls._ensure_initialized()

            registered_llm = LLMProviderRegistry.available_providers()
            registered_emb = EmbeddingProviderRegistry.available_providers()

            next_llm_provider = (
                llm_provider.strip().lower() if llm_provider is not None else state.llm_provider
            )
            if next_llm_provider not in registered_llm:
                raise UnsupportedAIProviderError(
                    provider_name=next_llm_provider,
                    provider_kind="llm",
                    available_providers=registered_llm,
                )

            next_emb_provider = (
                embedding_provider.strip().lower()
                if embedding_provider is not None
                else state.embedding_provider
            )
            if next_emb_provider not in registered_emb:
                raise UnsupportedAIProviderError(
                    provider_name=next_emb_provider,
                    provider_kind="embedding",
                    available_providers=registered_emb,
                )

            provider_changed_llm = next_llm_provider != state.llm_provider
            provider_changed_emb = next_emb_provider != state.embedding_provider

            state.llm_provider = next_llm_provider
            if llm_model_name is not None and llm_model_name.strip():
                state.llm_model_name = llm_model_name.strip()
            elif next_llm_provider == "deterministic" and (
                provider_changed_llm or not state.llm_model_name
            ):
                state.llm_model_name = "policy-deterministic-v1"
            elif provider_changed_llm:
                state.llm_model_name = ""

            if llm_base_url is not _SENTINEL:
                cleaned_llm_url = (
                    str(llm_base_url).strip() if llm_base_url is not None else ""
                )
                state.llm_base_url = cleaned_llm_url or None
            elif provider_changed_llm:
                state.llm_base_url = None

            if llm_api_key is not None:
                cleaned_llm_key = llm_api_key.strip()
                state.llm_api_key = cleaned_llm_key or None
            elif provider_changed_llm:
                state.llm_api_key = None

            if llm_temperature is not None:
                state.llm_temperature = llm_temperature

            state.embedding_provider = next_emb_provider
            if embedding_model_name is not None and embedding_model_name.strip():
                state.embedding_model_name = embedding_model_name.strip()
            elif next_emb_provider == "deterministic" and (
                provider_changed_emb or not state.embedding_model_name
            ):
                state.embedding_model_name = "deterministic-hash-1536"
            elif provider_changed_emb:
                state.embedding_model_name = ""

            if embedding_base_url is not _SENTINEL:
                cleaned_emb_url = (
                    str(embedding_base_url).strip() if embedding_base_url is not None else ""
                )
                state.embedding_base_url = cleaned_emb_url or None
            elif provider_changed_emb:
                state.embedding_base_url = None

            if embedding_api_key is not None:
                cleaned_emb_key = embedding_api_key.strip()
                state.embedding_api_key = cleaned_emb_key or None
            elif provider_changed_emb:
                state.embedding_api_key = None

            # Clear cached singleton instances so next request resolves the new provider/model
            cls._cached_auditor = None
            cls._cached_embedder = None

            return cls.get_effective_settings()

    @classmethod
    def resolve_discovery_credentials(
        cls,
        *,
        provider_id: str,
        candidate_api_key: str | None = None,
        candidate_base_url: str | None = None,
    ) -> tuple[str | None, str | None]:
        """Resolve `(api_key, base_url)` for live model discovery without mutating state."""
        with cls._lock:
            state = cls._ensure_initialized()
            base = get_settings()
            normalized = provider_id.strip().lower()

            stored_override_key: str | None = None
            if state.llm_provider == normalized and state.llm_api_key:
                stored_override_key = state.llm_api_key
            elif state.embedding_provider == normalized and state.embedding_api_key:
                stored_override_key = state.embedding_api_key

            effective_override_key = (
                candidate_api_key.strip()
                if candidate_api_key is not None and candidate_api_key.strip()
                else stored_override_key
            )
            resolved_key = cls._resolve_provider_llm_key(
                provider=normalized,
                override_key=effective_override_key,
                base=base,
            ) or cls._resolve_provider_embedding_key(
                provider=normalized,
                override_key=effective_override_key,
                base=base,
            )

            resolved_base_url: str | None = None
            if candidate_base_url is not None and candidate_base_url.strip():
                resolved_base_url = candidate_base_url.strip()
            elif state.llm_provider == normalized and state.llm_base_url:
                resolved_base_url = state.llm_base_url
            elif state.embedding_provider == normalized and state.embedding_base_url:
                resolved_base_url = state.embedding_base_url

            return resolved_key, resolved_base_url

    @classmethod
    def get_active_embedding_generator(cls) -> EmbeddingGeneratorPort:
        """Return cached `EmbeddingGeneratorPort` for the active runtime settings."""
        with cls._lock:
            if cls._cached_embedder is None:
                effective = cls.get_effective_settings()
                cls._cached_embedder = create_embedding_generator(effective)
            return cls._cached_embedder

    @classmethod
    def get_active_clause_auditor(cls) -> ClauseAuditorPort:
        """Return cached `ClauseAuditorPort` for the active runtime settings."""
        with cls._lock:
            if cls._cached_auditor is None:
                effective = cls.get_effective_settings()
                llm_runnable = create_llm_runnable(effective)
                cls._cached_auditor = LangChainClauseAuditor(
                    llm_runnable=llm_runnable,
                    max_retries=effective.REDLINE_MAX_RETRIES,
                    temperature=effective.LLM_TEMPERATURE,
                )
            return cls._cached_auditor


__all__ = [
    "CURATED_PROVIDER_PRESETS",
    "CURATED_PROVIDER_PRESET_MAP",
    "CuratedProviderPreset",
    "RuntimeAISettingsManager",
    "mask_api_key",
    "sanitize_secret_from_text",
]
