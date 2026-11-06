"""Vector knowledge base adapter package exports."""

from src.infrastructure.vector.embedding_service import (
    DeterministicHashEmbeddingAdapter,
    format_playbook_rule_for_embedding,
    stem_legal_token,
    tokenize_legal_text,
)
from src.infrastructure.vector.hybrid_retriever import (
    HybridPlaybookRetriever,
    compute_cosine_similarity,
)
from src.infrastructure.vector.provider_registry import (
    EmbeddingProviderRegistry,
    GeminiEmbeddingAdapter,
    OllamaEmbeddingAdapter,
    OpenAICompatibleEmbeddingAdapter,
    UnsupportedAIProviderError,
    adapt_and_normalize_vector,
    create_embedding_generator,
    register_embedding_provider,
)

__all__ = [
    "DeterministicHashEmbeddingAdapter",
    "EmbeddingProviderRegistry",
    "GeminiEmbeddingAdapter",
    "HybridPlaybookRetriever",
    "OllamaEmbeddingAdapter",
    "OpenAICompatibleEmbeddingAdapter",
    "UnsupportedAIProviderError",
    "adapt_and_normalize_vector",
    "compute_cosine_similarity",
    "create_embedding_generator",
    "format_playbook_rule_for_embedding",
    "register_embedding_provider",
    "stem_legal_token",
    "tokenize_legal_text",
]
