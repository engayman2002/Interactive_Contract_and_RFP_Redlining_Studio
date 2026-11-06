"""Extensible Embedding Provider Plugin Registry and Automatic Vector Dimension Adapter."""

import inspect
import math
import threading
from collections.abc import Callable, Sequence
from typing import Any

import httpx

from src.domain.exceptions import DomainValidationError, EmbeddingGenerationError
from src.domain.ports.playbook_ports import EmbeddingGeneratorPort
from src.infrastructure.config import Settings
from src.infrastructure.vector.embedding_service import DeterministicHashEmbeddingAdapter


class UnsupportedAIProviderError(DomainValidationError, ValueError):
    """Raised when an unknown or unregistered LLM or Embedding provider is requested."""

    def __init__(
        self,
        provider_name: str,
        provider_kind: str,
        available_providers: Sequence[str],
    ) -> None:
        available_str = ", ".join(sorted(available_providers))
        message = (
            f"Unsupported {provider_kind} provider '{provider_name}'. "
            f"Registered {provider_kind} providers: [{available_str}]."
        )
        super().__init__(message=message)
        self.code = "UNSUPPORTED_AI_PROVIDER"
        self.provider_name = provider_name
        self.provider_kind = provider_kind
        self.available_providers = tuple(sorted(available_providers))


def adapt_and_normalize_vector(
    raw_vector: Sequence[float],
    target_dim: int = 1536,
) -> list[float]:
    """Adapt any non-empty embedding vector to `target_dim` and L2-normalize to unit length.

    - If `len(raw_vector) == target_dim`: copies values directly.
    - If `len(raw_vector) < target_dim` (e.g., 384-d MiniLM, 768-d nomic-embed-text,
      1024-d mxbai-embed-large / bge-large): embeds isometrically by zero-padding to `target_dim`,
      preserving 100% of pairwise cosine similarity.
    - If `len(raw_vector) > target_dim` (e.g., 3072-d text-embedding-3-large): folds values
      deterministically across `target_dim` buckets (`idx % target_dim`).
    - Finally L2-normalizes the resulting vector so `||v||_2 = 1.0`.
    """
    if target_dim <= 0:
        raise ValueError("target_dim must be a positive integer.")
    if not raw_vector:
        raise EmbeddingGenerationError("Provider returned an empty embedding vector.")

    source_dim = len(raw_vector)
    if source_dim == target_dim:
        adapted = [float(val) for val in raw_vector]
    elif source_dim < target_dim:
        adapted = [0.0] * target_dim
        for idx, val in enumerate(raw_vector):
            adapted[idx] = float(val)
    else:
        adapted = [0.0] * target_dim
        for idx, val in enumerate(raw_vector):
            adapted[idx % target_dim] += float(val)

    squared_norm = sum(val * val for val in adapted)
    norm = math.sqrt(squared_norm)
    if norm == 0.0 or not math.isfinite(norm):
        raise EmbeddingGenerationError(
            "Embedding vector has zero or non-finite magnitude after dimension adaptation."
        )

    return [val / norm for val in adapted]


def _build_openai_embeddings_url(base_url: str) -> str:
    cleaned = base_url.strip().rstrip("/")
    if cleaned.endswith("/embeddings"):
        return cleaned
    if cleaned.endswith("/v1"):
        return f"{cleaned}/embeddings"
    return f"{cleaned}/v1/embeddings"


class OpenAICompatibleEmbeddingAdapter(EmbeddingGeneratorPort):
    """Async HTTP adapter for OpenAI and OpenAI-compatible embedding endpoints (`/v1/embeddings`).

    Supports:
    - OpenAI Cloud (`https://api.openai.com/v1`)
    - Local vLLM (`http://localhost:8000/v1`)
    - Local LM Studio (`http://localhost:1234/v1`)
    - HuggingFace Text Embeddings Inference (TEI) / LocalAI (`http://localhost:8080/v1`)
    """

    def __init__(
        self,
        model_name: str = "text-embedding-3-small",
        base_url: str = "https://api.openai.com/v1",
        api_key: str | None = None,
        dimension: int = 1536,
        timeout_seconds: float = 30.0,
        require_api_key: bool = False,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        if dimension <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self._model_name = model_name
        self._endpoint_url = _build_openai_embeddings_url(base_url)
        self._api_key = api_key
        self._dimension = dimension
        self._timeout_seconds = timeout_seconds
        self._require_api_key = require_api_key
        self._http_client = http_client

    @property
    def dimension(self) -> int:
        return self._dimension

    async def _post_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        for text in texts:
            if not text or not text.strip():
                raise EmbeddingGenerationError(
                    "Cannot generate embedding for empty or blank text."
                )

        if self._require_api_key and not self._api_key:
            raise EmbeddingGenerationError(
                "Missing API key for OpenAI embedding provider. "
                "Configure EMBEDDING_API_KEY or OPENAI_API_KEY."
            )

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        payload: dict[str, Any] = {
            "model": self._model_name,
            "input": texts,
        }

        try:
            if self._http_client is not None:
                response = await self._http_client.post(
                    self._endpoint_url,
                     headers=headers,
                    json=payload,
                    timeout=self._timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.post(
                        self._endpoint_url,
                        headers=headers,
                        json=payload,
                    )
            response.raise_for_status()
            body = response.json()
        except httpx.HTTPError as exc:
            raise EmbeddingGenerationError(
                f"Embedding HTTP request to '{self._endpoint_url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise EmbeddingGenerationError(
                f"Embedding endpoint '{self._endpoint_url}' returned invalid JSON: {exc}"
            ) from exc

        data_items = body.get("data") if isinstance(body, dict) else None
        if not isinstance(data_items, list) or len(data_items) != len(texts):
            raise EmbeddingGenerationError(
                f"Unexpected embedding response structure from '{self._endpoint_url}'."
            )

        sorted_items = sorted(
            data_items,
            key=lambda item: int(item.get("index", 0)) if isinstance(item, dict) else 0,
        )
        results: list[list[float]] = []
        for item in sorted_items:
            raw_vec = item.get("embedding") if isinstance(item, dict) else None
            if not isinstance(raw_vec, list):
                raise EmbeddingGenerationError(
                    "Embedding item missing 'embedding' float list in provider response."
                )
            results.append(adapt_and_normalize_vector(raw_vec, target_dim=self._dimension))

        return results

    async def embed_text(self, text: str) -> list[float]:
        """Generate an adapted and L2-normalized embedding vector for a single text."""
        vectors = await self._post_embeddings([text])
        return vectors[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate adapted and L2-normalized embedding vectors for a batch of texts."""
        return await self._post_embeddings(texts)


class OllamaEmbeddingAdapter(EmbeddingGeneratorPort):
    """Async HTTP adapter for local Ollama embedding models (`/api/embed` & `/api/embeddings`).

    Automatically adapts local model dimensions (e.g. 768-d `nomic-embed-text`,
    1024-d `mxbai-embed-large`, 1024-d `bge-m3`, 384-d `all-minilm`) into L2-normalized
    `target_dim` (1536-d) vectors compatible with PostgreSQL `vector(1536)`.
    """

    def __init__(
        self,
        model_name: str = "nomic-embed-text",
        base_url: str = "http://localhost:11434",
        dimension: int = 1536,
        timeout_seconds: float = 30.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        if dimension <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self._model_name = model_name
        self._base_url = base_url.strip().rstrip("/")
        self._dimension = dimension
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    @property
    def dimension(self) -> int:
        return self._dimension

    async def _request_ollama_batch(
        self,
        client: httpx.AsyncClient,
        texts: list[str],
    ) -> list[list[float]]:
        embed_url = f"{self._base_url}/api/embed"
        response = await client.post(
            embed_url,
            json={"model": self._model_name, "input": texts},
            timeout=self._timeout_seconds,
        )
        if response.status_code == 404:
            # Fallback to legacy Ollama `/api/embeddings` per-text endpoint
            legacy_url = f"{self._base_url}/api/embeddings"
            vectors: list[list[float]] = []
            for text in texts:
                leg_resp = await client.post(
                    legacy_url,
                    json={"model": self._model_name, "prompt": text},
                    timeout=self._timeout_seconds,
                )
                leg_resp.raise_for_status()
                leg_data = leg_resp.json()
                raw_vec = leg_data.get("embedding") if isinstance(leg_data, dict) else None
                if not isinstance(raw_vec, list):
                    raise EmbeddingGenerationError(
                        "Ollama /api/embeddings response missing 'embedding' list."
                    )
                vectors.append(adapt_and_normalize_vector(raw_vec, target_dim=self._dimension))
            return vectors

        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            raise EmbeddingGenerationError("Ollama /api/embed returned non-JSON-object payload.")

        if isinstance(data.get("embeddings"), list):
            raw_list = data["embeddings"]
            if len(raw_list) != len(texts):
                raise EmbeddingGenerationError(
                    f"Ollama returned {len(raw_list)} embeddings for {len(texts)} input texts."
                )
            return [
                adapt_and_normalize_vector(vec, target_dim=self._dimension) for vec in raw_list
            ]

        if isinstance(data.get("embedding"), list) and len(texts) == 1:
            return [adapt_and_normalize_vector(data["embedding"], target_dim=self._dimension)]

        raise EmbeddingGenerationError(
            "Ollama /api/embed response missing 'embeddings' array."
        )

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate adapted 1536-d L2-normalized embeddings from local Ollama."""
        if not texts:
            return []
        for text in texts:
            if not text or not text.strip():
                raise EmbeddingGenerationError(
                    "Cannot generate embedding for empty or blank text."
                )

        try:
            if self._http_client is not None:
                return await self._request_ollama_batch(self._http_client, texts)
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                return await self._request_ollama_batch(client, texts)
        except httpx.HTTPError as exc:
            raise EmbeddingGenerationError(
                f"Ollama embedding request to '{self._base_url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise EmbeddingGenerationError(
                f"Ollama embedding endpoint returned invalid JSON: {exc}"
            ) from exc

    async def embed_text(self, text: str) -> list[float]:
        """Generate an adapted 1536-d L2-normalized embedding for a single text via Ollama."""
        vectors = await self.embed_batch([text])
        return vectors[0]


class GeminiEmbeddingAdapter(EmbeddingGeneratorPort):
    """Async HTTP adapter for Google Gemini embedding models via Generative Language API."""

    def __init__(
        self,
        model_name: str = "text-embedding-004",
        base_url: str = "https://generativelanguage.googleapis.com/v1beta",
        api_key: str | None = None,
        dimension: int = 1536,
        timeout_seconds: float = 30.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        if dimension <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self._model_id = model_name.strip().removeprefix("models/")
        self._base_url = base_url.strip().rstrip("/")
        self._api_key = api_key
        self._dimension = dimension
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    @property
    def dimension(self) -> int:
        return self._dimension

    def _get_headers(self) -> dict[str, str]:
        if not self._api_key:
            raise EmbeddingGenerationError(
                "Missing API key for 'gemini' embedding provider. "
                "Configure EMBEDDING_API_KEY or GEMINI_API_KEY."
            )
        return {
            "Content-Type": "application/json",
            "x-goog-api-key": self._api_key,
        }

    async def embed_text(self, text: str) -> list[float]:
        """Generate an adapted 1536-d L2-normalized embedding for a single text."""
        cleaned = text.strip()
        if not cleaned:
            raise EmbeddingGenerationError("Cannot generate embedding for empty or blank text.")

        headers = self._get_headers()
        url = f"{self._base_url}/models/{self._model_id}:embedContent"
        payload: dict[str, Any] = {
            "model": f"models/{self._model_id}",
            "content": {"parts": [{"text": cleaned}]},
        }

        try:
            if self._http_client is not None:
                response = await self._http_client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self._timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload,
                    )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            raise EmbeddingGenerationError(
                f"Gemini embedding HTTP request to '{url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise EmbeddingGenerationError(
                f"Gemini embedding endpoint '{url}' returned invalid JSON: {exc}"
            ) from exc

        raw_vec = data.get("embedding", {}).get("values") if isinstance(data, dict) else None
        if not isinstance(raw_vec, list) or not raw_vec:
            raise EmbeddingGenerationError(
                f"Gemini response from '{url}' missing 'embedding.values' list."
            )
        return adapt_and_normalize_vector(raw_vec, target_dim=self._dimension)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate adapted 1536-d L2-normalized embeddings for a batch of texts."""
        if not texts:
            return []
        for text in texts:
            if not text or not text.strip():
                raise EmbeddingGenerationError(
                    "Cannot generate embedding for empty or blank text."
                )

        headers = self._get_headers()
        url = f"{self._base_url}/models/{self._model_id}:batchEmbedContents"
        payload: dict[str, Any] = {
            "requests": [
                {
                    "model": f"models/{self._model_id}",
                    "content": {"parts": [{"text": t.strip()}]},
                }
                for t in texts
            ]
        }

        try:
            if self._http_client is not None:
                response = await self._http_client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self._timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload,
                    )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            raise EmbeddingGenerationError(
                f"Gemini batch embedding HTTP request to '{url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise EmbeddingGenerationError(
                f"Gemini batch embedding endpoint '{url}' returned invalid JSON: {exc}"
            ) from exc

        embeddings_list = data.get("embeddings") if isinstance(data, dict) else None
        if not isinstance(embeddings_list, list) or len(embeddings_list) != len(texts):
            raise EmbeddingGenerationError(
                f"Gemini response from '{url}' missing or mismatched 'embeddings' list."
            )

        results: list[list[float]] = []
        for item in embeddings_list:
            raw_vec = item.get("values") if isinstance(item, dict) else None
            if not isinstance(raw_vec, list) or not raw_vec:
                raise EmbeddingGenerationError(
                    "Gemini batch item missing 'values' list in response."
                )
            results.append(adapt_and_normalize_vector(raw_vec, target_dim=self._dimension))
        return results


EmbeddingFactoryCallable = Callable[..., EmbeddingGeneratorPort]


class EmbeddingProviderRegistry:
    """Thread-safe plugin registry for `EmbeddingGeneratorPort` implementations."""

    _lock = threading.RLock()
    _factories: dict[str, EmbeddingFactoryCallable] = {}

    @classmethod
    def register(
        cls,
        provider_name: str,
        factory: EmbeddingFactoryCallable,
    ) -> None:
        """Register an embedding provider factory under `provider_name`."""
        normalized = provider_name.strip().lower()
        if not normalized:
            raise ValueError("Embedding provider name cannot be empty.")
        with cls._lock:
            cls._factories[normalized] = factory

    @classmethod
    def unregister(cls, provider_name: str) -> None:
        """Remove a registered embedding provider (useful for isolated unit test cleanup)."""
        normalized = provider_name.strip().lower()
        with cls._lock:
            cls._factories.pop(normalized, None)

    @classmethod
    def available_providers(cls) -> tuple[str, ...]:
        """Return sorted tuple of all registered embedding provider names."""
        with cls._lock:
            return tuple(sorted(cls._factories.keys()))

    @classmethod
    def create(
        cls,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> EmbeddingGeneratorPort:
        """Instantiate the configured `EmbeddingGeneratorPort` for `settings.EMBEDDING_PROVIDER`."""
        normalized = settings.EMBEDDING_PROVIDER.strip().lower()
        with cls._lock:
            factory = cls._factories.get(normalized)
            available = tuple(cls._factories.keys())

        if factory is None:
            raise UnsupportedAIProviderError(
                provider_name=settings.EMBEDDING_PROVIDER,
                provider_kind="embedding",
                available_providers=available,
            )

        sig = inspect.signature(factory)
        if "http_client" in sig.parameters or any(
            p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()
        ):
            return factory(settings, http_client=http_client)
        return factory(settings)


def register_embedding_provider(
    provider_name: str,
) -> Callable[[EmbeddingFactoryCallable], EmbeddingFactoryCallable]:
    """Decorator to register an `EmbeddingGeneratorPort` factory in `EmbeddingProviderRegistry`."""

    def _decorator(factory: EmbeddingFactoryCallable) -> EmbeddingFactoryCallable:
        EmbeddingProviderRegistry.register(provider_name, factory)
        return factory

    return _decorator


@register_embedding_provider("deterministic")
def _build_deterministic_embedding_provider(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    _ = http_client
    return DeterministicHashEmbeddingAdapter(dimension=settings.EMBEDDING_DIMENSION)


@register_embedding_provider("openai")
def _build_openai_embedding_provider(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    return OpenAICompatibleEmbeddingAdapter(
        model_name=settings.EMBEDDING_MODEL_NAME,
        base_url=settings.EMBEDDING_BASE_URL or "https://api.openai.com/v1",
        api_key=settings.resolve_embedding_api_key(),
        dimension=settings.EMBEDDING_DIMENSION,
        timeout_seconds=settings.EMBEDDING_TIMEOUT_SECONDS,
        require_api_key=True,
        http_client=http_client,
    )


@register_embedding_provider("openai_compatible")
def _build_openai_compatible_embedding_provider(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    return OpenAICompatibleEmbeddingAdapter(
        model_name=settings.EMBEDDING_MODEL_NAME,
        base_url=settings.EMBEDDING_BASE_URL or "http://localhost:8080/v1",
        api_key=settings.resolve_embedding_api_key(),
        dimension=settings.EMBEDDING_DIMENSION,
        timeout_seconds=settings.EMBEDDING_TIMEOUT_SECONDS,
        require_api_key=False,
        http_client=http_client,
    )


@register_embedding_provider("ollama")
def _build_ollama_embedding_provider(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    model_name = (
        "nomic-embed-text"
        if settings.EMBEDDING_MODEL_NAME == "text-embedding-3-small"
        else settings.EMBEDDING_MODEL_NAME
    )
    return OllamaEmbeddingAdapter(
        model_name=model_name,
        base_url=settings.EMBEDDING_BASE_URL or "http://localhost:11434",
        dimension=settings.EMBEDDING_DIMENSION,
        timeout_seconds=settings.EMBEDDING_TIMEOUT_SECONDS,
        http_client=http_client,
    )


@register_embedding_provider("gemini")
def _build_gemini_embedding_provider(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    model_name = (
        "text-embedding-004"
        if settings.EMBEDDING_MODEL_NAME == "text-embedding-3-small"
        else settings.EMBEDDING_MODEL_NAME
    )
    return GeminiEmbeddingAdapter(
        model_name=model_name,
        base_url=settings.EMBEDDING_BASE_URL
        or "https://generativelanguage.googleapis.com/v1beta",
        api_key=settings.resolve_embedding_api_key(),
        dimension=settings.EMBEDDING_DIMENSION,
        timeout_seconds=settings.EMBEDDING_TIMEOUT_SECONDS,
        http_client=http_client,
    )


def create_embedding_generator(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> EmbeddingGeneratorPort:
    """Create the active `EmbeddingGeneratorPort` from `EmbeddingProviderRegistry`."""
    return EmbeddingProviderRegistry.create(settings=settings, http_client=http_client)


__all__ = [
    "EmbeddingFactoryCallable",
    "EmbeddingProviderRegistry",
    "GeminiEmbeddingAdapter",
    "OllamaEmbeddingAdapter",
    "OpenAICompatibleEmbeddingAdapter",
    "UnsupportedAIProviderError",
    "adapt_and_normalize_vector",
    "create_embedding_generator",
    "register_embedding_provider",
]
