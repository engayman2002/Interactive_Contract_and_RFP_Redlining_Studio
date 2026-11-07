"""Immutable Pydantic v2 DTOs for Runtime AI Provider & Model Configuration and Live Testing."""

from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator

from src.application.dtos import ImmutableDTO

_BLOCKED_METADATA_HOSTS: frozenset[str] = frozenset(
    {
        "169.254.169.254",
        "metadata.google.internal",
        "metadata.goog",
        "100.100.100.200",
    }
)


def _validate_optional_base_url(value: str | None) -> str | None:
    """Validate custom provider Base URL uses HTTP(S) and blocks cloud metadata SSRF targets."""
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return ""
    parsed = urlparse(cleaned)
    if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc:
        raise ValueError("Base URL must start with http:// or https:// and include a valid host.")
    hostname = (parsed.hostname or "").strip().lower()
    if hostname in _BLOCKED_METADATA_HOSTS:
        raise ValueError("Base URL host is not permitted by SSRF security policy.")
    return cleaned


class ProviderCatalogItemDTO(ImmutableDTO):
    """Metadata and model presets for an available LLM / Vector Embedding provider."""

    provider_id: str
    display_name: str
    supports_llm: bool
    supports_embeddings: bool
    requires_api_key: bool
    supports_base_url: bool
    default_llm_model: str | None = None
    recommended_llm_models: list[str] = Field(default_factory=list)
    default_embedding_model: str | None = None
    recommended_embedding_models: list[str] = Field(default_factory=list)


class AISettingsResponseDTO(ImmutableDTO):
    """Sanitized active runtime AI settings response (never exposes raw API keys)."""

    llm_provider: str
    llm_model_name: str
    llm_base_url: str | None = None
    llm_has_api_key: bool
    llm_api_key_masked: str | None = None
    llm_temperature: float
    embedding_provider: str
    embedding_model_name: str
    embedding_base_url: str | None = None
    embedding_has_api_key: bool
    embedding_api_key_masked: str | None = None
    available_providers: list[ProviderCatalogItemDTO] = Field(default_factory=list)


class UpdateAISettingsRequestDTO(ImmutableDTO):
    """ADMIN request DTO to update active runtime LLM and/or Embedding configuration."""

    llm_provider: str | None = Field(default=None, min_length=1, max_length=64)
    llm_model_name: str | None = Field(default=None, min_length=1, max_length=160)
    llm_base_url: str | None = Field(default=None, max_length=512)
    llm_api_key: str | None = Field(default=None, max_length=512)
    llm_temperature: float | None = Field(default=None, ge=0.0, le=1.0)
    embedding_provider: str | None = Field(default=None, min_length=1, max_length=64)
    embedding_model_name: str | None = Field(default=None, min_length=1, max_length=160)
    embedding_base_url: str | None = Field(default=None, max_length=512)
    embedding_api_key: str | None = Field(default=None, max_length=512)

    @field_validator("llm_base_url", "embedding_base_url")
    @classmethod
    def validate_base_urls(cls, value: str | None) -> str | None:
        return _validate_optional_base_url(value)


class TestAIConnectionRequestDTO(ImmutableDTO):
    """Candidate AI configuration payload for pre-save live connectivity verification."""

    target: Literal["llm", "embedding", "both"] = "both"
    llm_provider: str | None = Field(default=None, min_length=1, max_length=64)
    llm_model_name: str | None = Field(default=None, max_length=160)
    llm_base_url: str | None = Field(default=None, max_length=512)
    llm_api_key: str | None = Field(default=None, max_length=512)
    llm_temperature: float | None = Field(default=None, ge=0.0, le=1.0)
    embedding_provider: str | None = Field(default=None, min_length=1, max_length=64)
    embedding_model_name: str | None = Field(default=None, max_length=160)
    embedding_base_url: str | None = Field(default=None, max_length=512)
    embedding_api_key: str | None = Field(default=None, max_length=512)

    @field_validator("llm_base_url", "embedding_base_url")
    @classmethod
    def validate_base_urls(cls, value: str | None) -> str | None:
        return _validate_optional_base_url(value)


class TestAIConnectionResponseDTO(ImmutableDTO):
    """Live diagnostic result returned by `POST /api/v1/ai-settings/test-connection`."""

    success: bool
    llm_ok: bool | None = None
    embedding_ok: bool | None = None
    latency_ms: float
    provider_tested: str
    model_tested: str
    message: str
    sample_output_preview: str | None = None


__all__ = [
    "AISettingsResponseDTO",
    "ProviderCatalogItemDTO",
    "TestAIConnectionRequestDTO",
    "TestAIConnectionResponseDTO",
    "UpdateAISettingsRequestDTO",
]

