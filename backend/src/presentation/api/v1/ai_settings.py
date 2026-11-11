"""FastAPI v1 router for dynamic AI Provider & Model Configuration and Live Connection Testing."""

import time
from typing import Annotated, Final
from uuid import uuid4

from fastapi import APIRouter, Depends, status
from pydantic import ValidationError

from src.application.dtos import (
    AIOperationMetricsDTO,
    AISettingsResponseDTO,
    AITelemetryEventDTO,
    AITelemetrySummaryDTO,
    ClearAICacheResponseDTO,
    DiscoverModelsRequestDTO,
    DiscoverModelsResponseDTO,
    EncryptedAIVaultEnvelopeDTO,
    ExportAIVaultRequestDTO,
    ImportAIVaultRequestDTO,
    ProviderCatalogItemDTO,
    TestAIConnectionRequestDTO,
    TestAIConnectionResponseDTO,
    TokenPayloadDTO,
    UpdateAISettingsRequestDTO,
)
from src.domain.entities import ClauseAuditInput
from src.domain.enums import UserRole
from src.domain.exceptions import DomainValidationError
from src.infrastructure.ai import (
    CURATED_PROVIDER_PRESETS,
    EncryptedAIVaultEnvelope,
    LangChainClauseAuditor,
    LLMProviderRegistry,
    RuntimeAISettingsManager,
    SemanticAuditCacheAndTelemetryManager,
    UnsupportedAIProviderError,
    create_llm_runnable,
    decrypt_ai_settings_vault,
    discover_provider_models,
    encrypt_ai_settings_vault,
    mask_api_key,
    sanitize_secret_from_text,
)
from src.infrastructure.ai.runtime_settings import _SENTINEL
from src.infrastructure.config import Settings
from src.infrastructure.vector import (
    EmbeddingProviderRegistry,
    create_embedding_generator,
)
from src.presentation.dependencies import get_current_user, require_roles

ai_settings_router = APIRouter(prefix="/ai-settings", tags=["AI Engine Configuration"])

_BUILTIN_PROVIDER_CATALOG: Final[tuple[ProviderCatalogItemDTO, ...]] = tuple(
    ProviderCatalogItemDTO(
        provider_id=preset.provider_id,
        display_name=preset.display_name,
        supports_llm=preset.supports_llm,
        supports_embeddings=preset.supports_embeddings,
        requires_api_key=preset.requires_api_key,
        supports_base_url=preset.supports_base_url,
        default_llm_model=preset.default_llm_model,
        recommended_llm_models=list(preset.recommended_llm_models),
        default_embedding_model=preset.default_embedding_model,
        recommended_embedding_models=list(preset.recommended_embedding_models),
    )
    for preset in CURATED_PROVIDER_PRESETS
)


def _build_provider_catalog() -> list[ProviderCatalogItemDTO]:
    """Build catalog combining built-in presets with any dynamically registered plugins."""
    catalog = list(_BUILTIN_PROVIDER_CATALOG)
    known_ids = {item.provider_id for item in catalog}

    llm_registered = set(LLMProviderRegistry.available_providers())
    emb_registered = set(EmbeddingProviderRegistry.available_providers())
    extra_ids = sorted((llm_registered | emb_registered) - known_ids)

    for extra_id in extra_ids:
        catalog.append(
            ProviderCatalogItemDTO(
                provider_id=extra_id,
                display_name=extra_id.replace("_", " ").title(),
                supports_llm=extra_id in llm_registered,
                supports_embeddings=extra_id in emb_registered,
                requires_api_key=False,
                supports_base_url=True,
                default_llm_model=None,
                recommended_llm_models=[],
                default_embedding_model=None,
                recommended_embedding_models=[],
            )
        )
    return catalog


def _build_settings_response(effective: Settings) -> AISettingsResponseDTO:
    """Convert effective `Settings` into a sanitized `AISettingsResponseDTO` with masked keys."""
    llm_key = effective.resolve_llm_api_key()
    emb_key = effective.resolve_embedding_api_key()

    if effective.LLM_PROVIDER.strip().lower() in ("deterministic", "ollama"):
        llm_key = effective.LLM_API_KEY
    if effective.EMBEDDING_PROVIDER.strip().lower() in ("deterministic", "ollama"):
        emb_key = effective.EMBEDDING_API_KEY

    llm_masked = mask_api_key(llm_key)
    emb_masked = mask_api_key(emb_key)

    return AISettingsResponseDTO(
        llm_provider=effective.LLM_PROVIDER,
        llm_model_name=effective.LLM_MODEL_NAME,
        llm_base_url=effective.LLM_BASE_URL,
        llm_has_api_key=llm_masked is not None,
        llm_api_key_masked=llm_masked,
        llm_temperature=effective.LLM_TEMPERATURE,
        embedding_provider=effective.EMBEDDING_PROVIDER,
        embedding_model_name=effective.EMBEDDING_MODEL_NAME,
        embedding_base_url=effective.EMBEDDING_BASE_URL,
        embedding_has_api_key=emb_masked is not None,
        embedding_api_key_masked=emb_masked,
        available_providers=_build_provider_catalog(),
    )


@ai_settings_router.get(
    "",
    response_model=AISettingsResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def get_ai_settings(
    _current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
) -> AISettingsResponseDTO:
    """Return active runtime AI provider settings (masked keys) and full provider catalog."""
    effective = RuntimeAISettingsManager.get_effective_settings()
    return _build_settings_response(effective)


@ai_settings_router.put(
    "",
    response_model=AISettingsResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def update_ai_settings(
    payload: UpdateAISettingsRequestDTO,
    _current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN)),
    ],
) -> AISettingsResponseDTO:
    """Dynamically update runtime LLM and/or Embedding provider configuration (ADMIN only)."""
    llm_base_arg: str | None | object = (
        payload.llm_base_url if "llm_base_url" in payload.model_fields_set else _SENTINEL
    )
    emb_base_arg: str | None | object = (
        payload.embedding_base_url
        if "embedding_base_url" in payload.model_fields_set
        else _SENTINEL
    )

    updated = RuntimeAISettingsManager.update_runtime_ai_settings(
        llm_provider=payload.llm_provider,
        llm_model_name=payload.llm_model_name,
        llm_base_url=llm_base_arg,
        llm_api_key=payload.llm_api_key,
        llm_temperature=payload.llm_temperature,
        embedding_provider=payload.embedding_provider,
        embedding_model_name=payload.embedding_model_name,
        embedding_base_url=emb_base_arg,
        embedding_api_key=payload.embedding_api_key,
    )
    return _build_settings_response(updated)


@ai_settings_router.post(
    "/test-connection",
    response_model=TestAIConnectionResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def test_ai_connection(
    payload: TestAIConnectionRequestDTO,
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
) -> TestAIConnectionResponseDTO:
    """Test live connectivity and round-trip latency against candidate LLM / Embedding settings."""
    candidate = RuntimeAISettingsManager.build_candidate_settings(
        llm_provider=payload.llm_provider,
        llm_model_name=payload.llm_model_name,
        llm_base_url=payload.llm_base_url,
        llm_api_key=payload.llm_api_key,
        llm_temperature=payload.llm_temperature,
        embedding_provider=payload.embedding_provider,
        embedding_model_name=payload.embedding_model_name,
        embedding_base_url=payload.embedding_base_url,
        embedding_api_key=payload.embedding_api_key,
        timeout_seconds=15.0,
    )

    secrets_to_scrub = (
        payload.llm_api_key,
        payload.embedding_api_key,
        candidate.LLM_API_KEY,
        candidate.EMBEDDING_API_KEY,
    )

    started_at = time.perf_counter()
    llm_ok: bool | None = None
    embedding_ok: bool | None = None
    messages: list[str] = []
    preview: str | None = None

    if payload.target in ("embedding", "both"):
        try:
            embedder = create_embedding_generator(candidate)
            vector = await embedder.embed_text(
                "Mutual limitation of liability capped at twelve months of paid fees."
            )
            if len(vector) != candidate.EMBEDDING_DIMENSION:
                embedding_ok = False
                messages.append(
                    f"Embedding dimension mismatch: expected {candidate.EMBEDDING_DIMENSION}, "
                    f"received {len(vector)}."
                )
            else:
                embedding_ok = True
                emb_label = f"{candidate.EMBEDDING_PROVIDER}/{candidate.EMBEDDING_MODEL_NAME}"
                messages.append(
                    f"Embeddings OK ({emb_label}, {len(vector)}-d unit vector verified)."
                )
        except Exception as exc:
            embedding_ok = False
            safe_err = sanitize_secret_from_text(str(exc), *secrets_to_scrub)
            messages.append(f"Embedding check failed: {safe_err}")

    if payload.target in ("llm", "both"):
        try:
            llm_runnable = create_llm_runnable(candidate)
            auditor = LangChainClauseAuditor(
                llm_runnable=llm_runnable,
                max_retries=0,
                temperature=candidate.LLM_TEMPERATURE,
                enable_deterministic_fallback=False,
            )
            probe_input = ClauseAuditInput(
                org_id=current_user.org_id,
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=0,
                heading="1. Limitation of Liability",
                clause_text=(
                    "Vendor aggregate cumulative liability shall not exceed $500, and "
                    "Customer shall have uncapped liability for all consequential damages."
                ),
                bypass_cache=True,
            )
            audit_result = await auditor.audit_clause(probe_input, matched_rules=[])
            llm_ok = True
            messages.append(
                f"LLM Inference OK ({candidate.LLM_PROVIDER}/{candidate.LLM_MODEL_NAME})."
            )
            raw_preview = f"[{audit_result.risk.value}] {audit_result.rationale}"
            preview = sanitize_secret_from_text(raw_preview[:200], *secrets_to_scrub)
        except Exception as exc:
            llm_ok = False
            safe_err = sanitize_secret_from_text(str(exc), *secrets_to_scrub)
            messages.append(f"LLM check failed: {safe_err}")

    latency_ms = round((time.perf_counter() - started_at) * 1000.0, 2)

    if payload.target == "llm":
        overall_success = bool(llm_ok)
        provider_tested = candidate.LLM_PROVIDER
        model_tested = candidate.LLM_MODEL_NAME
    elif payload.target == "embedding":
        overall_success = bool(embedding_ok)
        provider_tested = candidate.EMBEDDING_PROVIDER
        model_tested = candidate.EMBEDDING_MODEL_NAME
    else:
        overall_success = bool(llm_ok) and bool(embedding_ok)
        provider_tested = (
            candidate.LLM_PROVIDER
            if candidate.LLM_PROVIDER == candidate.EMBEDDING_PROVIDER
            else f"{candidate.LLM_PROVIDER} + {candidate.EMBEDDING_PROVIDER}"
        )
        model_tested = f"{candidate.LLM_MODEL_NAME} + {candidate.EMBEDDING_MODEL_NAME}"

    return TestAIConnectionResponseDTO(
        success=overall_success,
        llm_ok=llm_ok,
        embedding_ok=embedding_ok,
        latency_ms=latency_ms,
        provider_tested=provider_tested,
        model_tested=model_tested,
        message=" ".join(messages),
        sample_output_preview=preview,
    )


@ai_settings_router.post(
    "/discover-models",
    response_model=DiscoverModelsResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def discover_ai_models(
    payload: DiscoverModelsRequestDTO,
    _current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
) -> DiscoverModelsResponseDTO:
    """Dynamically fetch live available LLM and Embedding models from a provider API."""
    known_providers = sorted(
        set(LLMProviderRegistry.available_providers())
        | set(EmbeddingProviderRegistry.available_providers())
    )
    if payload.provider_id not in known_providers:
        raise UnsupportedAIProviderError(
            provider_name=payload.provider_id,
            provider_kind="llm",
            available_providers=known_providers,
        )

    effective_key, effective_base_url = RuntimeAISettingsManager.resolve_discovery_credentials(
        provider_id=payload.provider_id,
        candidate_api_key=payload.api_key,
        candidate_base_url=payload.base_url,
    )

    discovered = await discover_provider_models(
        provider_id=payload.provider_id,
        api_key=effective_key,
        base_url=effective_base_url,
    )
    return DiscoverModelsResponseDTO(
        provider_id=discovered.provider_id,
        source=discovered.source,
        llm_models=discovered.llm_models,
        embedding_models=discovered.embedding_models,
        latency_ms=discovered.latency_ms,
        message=discovered.message,
    )


@ai_settings_router.post(
    "/export-vault",
    response_model=EncryptedAIVaultEnvelopeDTO,
    status_code=status.HTTP_200_OK,
)
async def export_ai_settings_vault(
    payload: ExportAIVaultRequestDTO,
    _current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN)),
    ],
) -> EncryptedAIVaultEnvelopeDTO:
    """Encrypt active/candidate AI settings & API keys into an AES-256-GCM vault (ADMIN only)."""
    llm_base_arg: str | None | object = (
        payload.llm_base_url if "llm_base_url" in payload.model_fields_set else _SENTINEL
    )
    emb_base_arg: str | None | object = (
        payload.embedding_base_url
        if "embedding_base_url" in payload.model_fields_set
        else _SENTINEL
    )

    vault_payload = RuntimeAISettingsManager.build_vault_export_payload(
        llm_provider=payload.llm_provider,
        llm_model_name=payload.llm_model_name,
        llm_base_url=llm_base_arg,
        llm_api_key=payload.llm_api_key,
        llm_temperature=payload.llm_temperature,
        embedding_provider=payload.embedding_provider,
        embedding_model_name=payload.embedding_model_name,
        embedding_base_url=emb_base_arg,
        embedding_api_key=payload.embedding_api_key,
    )

    if vault_payload["llm_provider"] != "deterministic" and not vault_payload["llm_model_name"]:
        raise DomainValidationError(
            f"Explicit LLM model name is required when exporting '{vault_payload['llm_provider']}'."
        )
    if (
        vault_payload["embedding_provider"] != "deterministic"
        and not vault_payload["embedding_model_name"]
    ):
        raise DomainValidationError(
            "Explicit Embedding model name is required when exporting "
            f"'{vault_payload['embedding_provider']}'."
        )

    envelope = encrypt_ai_settings_vault(vault_payload, payload.passphrase)
    return EncryptedAIVaultEnvelopeDTO(
        vault_version=1,
        kdf="PBKDF2-HMAC-SHA256",
        iterations=envelope.iterations,
        cipher="AES-256-GCM",
        salt_b64=envelope.salt_b64,
        nonce_b64=envelope.nonce_b64,
        ciphertext_b64=envelope.ciphertext_b64,
        exported_at=envelope.exported_at,
    )


@ai_settings_router.post(
    "/import-vault",
    response_model=AISettingsResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def import_ai_settings_vault(
    payload: ImportAIVaultRequestDTO,
    _current_user: Annotated[
        TokenPayloadDTO,
        Depends(require_roles(UserRole.ADMIN)),
    ],
) -> AISettingsResponseDTO:
    """Unlock, validate, and activate an AES-256-GCM AI configuration vault (ADMIN only)."""
    envelope = EncryptedAIVaultEnvelope(
        vault_version=payload.vault.vault_version,
        kdf=payload.vault.kdf,
        iterations=payload.vault.iterations,
        cipher=payload.vault.cipher,
        salt_b64=payload.vault.salt_b64,
        nonce_b64=payload.vault.nonce_b64,
        ciphertext_b64=payload.vault.ciphertext_b64,
        exported_at=payload.vault.exported_at,
    )
    decrypted_dict = decrypt_ai_settings_vault(envelope, payload.passphrase)

    try:
        validated = UpdateAISettingsRequestDTO.model_validate(decrypted_dict)
    except ValidationError as exc:
        raise DomainValidationError(
            "Decrypted AI configuration vault failed schema or SSRF security validation."
        ) from exc

    restored_llm_provider = (validated.llm_provider or "").strip().lower()
    restored_emb_provider = (validated.embedding_provider or "").strip().lower()
    if not restored_llm_provider or not restored_emb_provider:
        raise DomainValidationError(
            "Decrypted AI configuration vault is missing required provider identifiers."
        )
    if restored_llm_provider != "deterministic" and not (
        validated.llm_model_name and validated.llm_model_name.strip()
    ):
        raise DomainValidationError(
            f"Decrypted vault is missing LLM model ID for '{restored_llm_provider}'."
        )
    if restored_emb_provider != "deterministic" and not (
        validated.embedding_model_name and validated.embedding_model_name.strip()
    ):
        raise DomainValidationError(
            f"Decrypted vault is missing Embedding model ID for '{restored_emb_provider}'."
        )

    updated = RuntimeAISettingsManager.update_runtime_ai_settings(
        llm_provider=restored_llm_provider,
        llm_model_name=validated.llm_model_name,
        llm_base_url=validated.llm_base_url,
        llm_api_key=validated.llm_api_key,
        llm_temperature=validated.llm_temperature,
        embedding_provider=restored_emb_provider,
        embedding_model_name=validated.embedding_model_name,
        embedding_base_url=validated.embedding_base_url,
        embedding_api_key=validated.embedding_api_key,
    )
    return _build_settings_response(updated)


@ai_settings_router.get(
    "/telemetry",
    response_model=AITelemetrySummaryDTO,
    status_code=status.HTTP_200_OK,
)
async def get_ai_telemetry(
    current_user: Annotated[TokenPayloadDTO, Depends(get_current_user)],
) -> AITelemetrySummaryDTO:
    """Return live AI FinOps token telemetry and Semantic Clause Cache statistics."""
    effective = RuntimeAISettingsManager.get_effective_settings()
    snapshot = SemanticAuditCacheAndTelemetryManager.get_telemetry_snapshot(
        org_id=current_user.org_id,
        active_provider=effective.LLM_PROVIDER,
        active_model=effective.LLM_MODEL_NAME,
    )
    return AITelemetrySummaryDTO(
        active_provider=snapshot.active_provider,
        active_model=snapshot.active_model,
        semantic_cache_enabled=snapshot.semantic_cache_enabled,
        cached_entries_count=snapshot.cached_entries_count,
        total_requests=snapshot.total_requests,
        cache_hits=snapshot.cache_hits,
        cache_misses=snapshot.cache_misses,
        cache_hit_rate_pct=snapshot.cache_hit_rate_pct,
        prompt_tokens=snapshot.prompt_tokens,
        completion_tokens=snapshot.completion_tokens,
        total_tokens=snapshot.total_tokens,
        estimated_tokens_saved=snapshot.estimated_tokens_saved,
        estimated_cost_usd=snapshot.estimated_cost_usd,
        estimated_cost_saved_usd=snapshot.estimated_cost_saved_usd,
        avg_latency_ms=snapshot.avg_latency_ms,
        operation_metrics=[
            AIOperationMetricsDTO(
                operation=op.operation,
                total_calls=op.total_calls,
                cache_hits=op.cache_hits,
                total_tokens=op.total_tokens,
                avg_latency_ms=op.avg_latency_ms,
            )
            for op in snapshot.operation_metrics
        ],
        recent_events=[
            AITelemetryEventDTO(
                event_id=evt.event_id,
                timestamp=evt.timestamp,
                operation=evt.operation,
                provider=evt.provider,
                model=evt.model,
                cache_hit=evt.cache_hit,
                prompt_tokens=evt.prompt_tokens,
                completion_tokens=evt.completion_tokens,
                tokens_saved=evt.tokens_saved,
                latency_ms=evt.latency_ms,
            )
            for evt in snapshot.recent_events
        ],
    )


@ai_settings_router.post(
    "/telemetry/clear-cache",
    response_model=ClearAICacheResponseDTO,
    status_code=status.HTTP_200_OK,
)
async def clear_ai_semantic_cache(
    current_user: Annotated[
        TokenPayloadDTO,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.LEGAL_COUNSEL,
                UserRole.TECHNICAL_LEAD,
            )
        ),
    ],
) -> ClearAICacheResponseDTO:
    """Purge all cached Semantic Clause Audit entries for the actor's organization."""
    cleared = SemanticAuditCacheAndTelemetryManager.clear_cache(org_id=current_user.org_id)
    return ClearAICacheResponseDTO(
        cleared_entries=cleared,
        message=(
            f"Purged {cleared} cached clause audit "
            f"{'entry' if cleared == 1 else 'entries'} for your organization."
        ),
    )


__all__ = ["ai_settings_router"]
