"""Infrastructure AI adapters: LangChain LCEL Redlining Chain, Batch Worker, and Celery Task."""

from src.infrastructure.ai.batch_worker import BatchDocumentAuditWorker
from src.infrastructure.ai.celery_app import (
    audit_document_celery_task,
    celery_app,
    create_celery_app,
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
    SYSTEM_PROMPT,
    LangChainClauseAuditor,
    PolicyAwareDeterministicChatModel,
    RedlineOutput,
    build_redline_chain,
    format_playbook_rules_context,
    parse_and_validate_redline_output,
)
from src.infrastructure.ai.runtime_settings import (
    RuntimeAISettingsManager,
    mask_api_key,
    sanitize_secret_from_text,
)

__all__ = [
    "AnthropicMessagesChatRunnable",
    "BatchDocumentAuditWorker",
    "GeminiGenerateContentChatRunnable",
    "LLMProviderRegistry",
    "LangChainClauseAuditor",
    "OllamaChatRunnable",
    "OpenAICompatibleChatRunnable",
    "PolicyAwareDeterministicChatModel",
    "RedlineOutput",
    "RuntimeAISettingsManager",
    "SYSTEM_PROMPT",
    "UnsupportedAIProviderError",
    "audit_document_celery_task",
    "build_redline_chain",
    "celery_app",
    "create_celery_app",
    "create_llm_runnable",
    "format_playbook_rules_context",
    "mask_api_key",
    "parse_and_validate_redline_output",
    "register_llm_provider",
    "sanitize_secret_from_text",
]
