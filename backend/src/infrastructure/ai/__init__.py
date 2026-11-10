"""Infrastructure AI adapters: LangChain LCEL Redlining Chain, Batch Worker, and Celery Task."""

from src.infrastructure.ai.batch_worker import BatchDocumentAuditWorker
from src.infrastructure.ai.celery_app import (
    audit_document_celery_task,
    celery_app,
    create_celery_app,
)
from src.infrastructure.ai.config_vault import (
    EncryptedAIVaultEnvelope,
    decrypt_ai_settings_vault,
    encrypt_ai_settings_vault,
)
from src.infrastructure.ai.cross_clause_analyzer import LangChainCrossClauseAnalyzer
from src.infrastructure.ai.model_discovery import (
    DiscoveredModelsResult,
    DiscoverySource,
    discover_provider_models,
)
from src.infrastructure.ai.playbook_extractor import (
    PLAYBOOK_EXTRACTION_SYSTEM_PROMPT,
    LangChainPlaybookExtractor,
    segment_reference_text,
)
from src.infrastructure.ai.provider_registry import (
    AnthropicMessagesChatRunnable,
    GeminiGenerateContentChatRunnable,
    LLMProviderRegistry,
    OllamaChatRunnable,
    OpenAICompatibleChatRunnable,
    UnsupportedAIProviderError,
    create_llm_runnable,
    register_llm_provider,
)
from src.infrastructure.ai.redline_chain import (
    PUSHBACK_SIMULATION_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    CriticVerificationAgent,
    LangChainClauseAuditor,
    PolicyAwareDeterministicChatModel,
    PushbackSimulationOutput,
    RedlineOutput,
    build_pushback_simulation_chain,
    build_redline_chain,
    format_playbook_rules_context,
    parse_and_validate_pushback_output,
    parse_and_validate_redline_output,
)
from src.infrastructure.ai.runtime_settings import (
    CURATED_PROVIDER_PRESET_MAP,
    CURATED_PROVIDER_PRESETS,
    CuratedProviderPreset,
    RuntimeAISettingsManager,
    mask_api_key,
    sanitize_secret_from_text,
)

__all__ = [
    "AnthropicMessagesChatRunnable",
    "BatchDocumentAuditWorker",
    "CURATED_PROVIDER_PRESETS",
    "CURATED_PROVIDER_PRESET_MAP",
    "CriticVerificationAgent",
    "CuratedProviderPreset",
    "DiscoveredModelsResult",
    "DiscoverySource",
    "EncryptedAIVaultEnvelope",
    "GeminiGenerateContentChatRunnable",
    "LLMProviderRegistry",
    "LangChainClauseAuditor",
    "LangChainCrossClauseAnalyzer",
    "LangChainPlaybookExtractor",
    "OllamaChatRunnable",
    "OpenAICompatibleChatRunnable",
    "PLAYBOOK_EXTRACTION_SYSTEM_PROMPT",
    "PUSHBACK_SIMULATION_SYSTEM_PROMPT",
    "PolicyAwareDeterministicChatModel",
    "PushbackSimulationOutput",
    "RedlineOutput",
    "RuntimeAISettingsManager",
    "SYSTEM_PROMPT",
    "UnsupportedAIProviderError",
    "audit_document_celery_task",
    "build_pushback_simulation_chain",
    "build_redline_chain",
    "celery_app",
    "create_celery_app",
    "create_llm_runnable",
    "decrypt_ai_settings_vault",
    "discover_provider_models",
    "encrypt_ai_settings_vault",
    "format_playbook_rules_context",
    "mask_api_key",
    "parse_and_validate_pushback_output",
    "parse_and_validate_redline_output",
    "register_llm_provider",
    "sanitize_secret_from_text",
    "segment_reference_text",
]
