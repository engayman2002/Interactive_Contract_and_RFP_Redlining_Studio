"""Extensible Multi-Provider & Local LLM Plugin Registry for Clause Auditing."""

import asyncio
import inspect
import threading
from collections.abc import Callable
from typing import Any, Final

import httpx
from langchain_core.runnables import Runnable, RunnableConfig, RunnableLambda

from src.domain.exceptions import ClauseAnalysisError
from src.infrastructure.ai.redline_chain import (
     SYSTEM_PROMPT,
    PolicyAwareDeterministicChatModel,
)
from src.infrastructure.config import Settings
from src.infrastructure.vector.provider_registry import UnsupportedAIProviderError

JSON_SCHEMA_INSTRUCTION: Final[str] = (
    "\n\nRespond ONLY with a valid JSON object matching this exact schema:\n"
    "{\n"
    '  "is_compliant": boolean,\n'
    '  "risk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",\n'
    '  "category": string,\n'
    '  "proposed_text": string,\n'
    '  "rationale": string,\n'
    '  "negotiation_talking_point": string\n'
    "}"
)


def extract_system_and_user_messages(prompt_input: Any) -> tuple[str, str]:
    """Extract `(system_prompt, user_prompt)` from a ChatPromptValue, message list, or dict."""
    system_parts: list[str] = []
    user_parts: list[str] = []

    messages: list[Any] | None = None
    if hasattr(prompt_input, "to_messages") and callable(prompt_input.to_messages):
        messages = list(prompt_input.to_messages())
    elif isinstance(prompt_input, list):
        messages = prompt_input

    if messages is not None:
        for msg in messages:
            if isinstance(msg, dict):
                role = str(msg.get("role", "user")).lower()
                content = str(msg.get("content", ""))
            else:
                role = str(getattr(msg, "type", "human")).lower()
                content = str(getattr(msg, "content", msg))

            if role == "system":
                system_parts.append(content)
            else:
                user_parts.append(content)
    elif isinstance(prompt_input, dict):
        playbook_ctx = str(prompt_input.get("playbook_context", ""))
        clause_text = str(prompt_input.get("clause_text", ""))
        system_parts.append(SYSTEM_PROMPT)
        user_parts.append(
            f"Company Playbook Rules:\n{playbook_ctx}\n\nContract Clause:\n{clause_text}"
        )
    else:
        system_parts.append(SYSTEM_PROMPT)
        user_parts.append(str(prompt_input))

    system_text = "\n\n".join(p for p in system_parts if p).strip() or SYSTEM_PROMPT
    lowered_system = system_text.lower()
    if (
        "is_compliant" not in system_text
        and "respond only with" not in lowered_system
        and "return valid json" not in lowered_system
        and "return a valid json" not in lowered_system
    ):
        system_text = f"{system_text}{JSON_SCHEMA_INSTRUCTION}"

    user_text = "\n\n".join(p for p in user_parts if p).strip()
    return system_text, user_text


def _build_chat_completions_url(base_url: str) -> str:
    cleaned = base_url.strip().rstrip("/")
    if cleaned.endswith("/chat/completions"):
        return cleaned
    if cleaned.endswith("/v1"):
        return f"{cleaned}/chat/completions"
    return f"{cleaned}/v1/chat/completions"


def _build_anthropic_messages_url(base_url: str) -> str:
    cleaned = base_url.strip().rstrip("/")
    if cleaned.endswith("/messages"):
        return cleaned
    if cleaned.endswith("/v1"):
        return f"{cleaned}/messages"
    return f"{cleaned}/v1/messages"


def _require_llm_model_name(provider_label: str, model_name: str) -> str:
    """Ensure an explicit non-empty LLM model identifier is configured."""
    cleaned = model_name.strip()
    if not cleaned:
        raise ClauseAnalysisError(
            f"Missing model name for '{provider_label}' LLM provider. "
            "Configure LLM_MODEL_NAME explicitly or select a live model via Fetch Live Models."
        )
    return cleaned


class OpenAICompatibleChatRunnable(Runnable[Any, str]):
    """Runnable adapter for Groq, OpenAI, and OpenAI-compatible servers (vLLM, LM Studio)."""

    def __init__(
        self,
        provider_label: str,
        model_name: str,
        base_url: str,
        api_key: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: float = 60.0,
        require_api_key: bool = True,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__()
        self._provider_label = provider_label
        self._model_name = _require_llm_model_name(provider_label, model_name)
        self._endpoint_url = _build_chat_completions_url(base_url)
        self._api_key = api_key
        self._temperature = temperature
        self._timeout_seconds = timeout_seconds
        self._require_api_key = require_api_key
        self._http_client = http_client

    async def ainvoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronously invoke the chat completions endpoint and return the assistant string."""
        _ = config, kwargs
        if self._require_api_key and not self._api_key:
            raise ClauseAnalysisError(
                f"Missing API key for '{self._provider_label}' LLM provider. "
                "Configure LLM_API_KEY (or provider-specific GROQ_API_KEY / OPENAI_API_KEY)."
            )

        system_prompt, user_prompt = extract_system_and_user_messages(input)
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        payload: dict[str, Any] = {
            "model": self._model_name,
            "temperature": self._temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
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
            data = response.json()
        except httpx.HTTPError as exc:
            raise ClauseAnalysisError(
                f"LLM HTTP request to '{self._endpoint_url}' ({self._provider_label}) failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise ClauseAnalysisError(
                f"LLM endpoint '{self._endpoint_url}' returned invalid JSON: {exc}"
            ) from exc

        choices = data.get("choices") if isinstance(data, dict) else None
        if not isinstance(choices, list) or not choices:
            raise ClauseAnalysisError(
                f"LLM response from '{self._endpoint_url}' missing 'choices' array."
            )
        first_choice = choices[0]
        message = first_choice.get("message") if isinstance(first_choice, dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str) or not content.strip():
            raise ClauseAnalysisError(
                f"LLM response from '{self._endpoint_url}' contained empty message content."
            )
        return content

    def invoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Synchronously invoke the chat completions endpoint."""
        return asyncio.run(self.ainvoke(input, config=config, **kwargs))


class AnthropicMessagesChatRunnable(Runnable[Any, str]):
    """LangChain Runnable adapter for Anthropic Claude Messages API (`/v1/messages`)."""

    def __init__(
        self,
        model_name: str,
        base_url: str = "https://api.anthropic.com",
        api_key: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: float = 60.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__()
        self._model_name = _require_llm_model_name("anthropic", model_name)
        self._endpoint_url = _build_anthropic_messages_url(base_url)
        self._api_key = api_key
        self._temperature = temperature
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def ainvoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronously invoke the Anthropic `/v1/messages` API and return JSON content."""
        _ = config, kwargs
        if not self._api_key:
            raise ClauseAnalysisError(
                "Missing API key for 'anthropic' LLM provider. "
                "Configure LLM_API_KEY or ANTHROPIC_API_KEY."
            )

        system_prompt, user_prompt = extract_system_and_user_messages(input)
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "x-api-key": self._api_key,
            "anthropic-version": "2023-06-01",
        }
        payload: dict[str, Any] = {
            "model": self._model_name,
            "max_tokens": 2048,
            "temperature": self._temperature,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_prompt},
            ],
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
            data = response.json()
        except httpx.HTTPError as exc:
            raise ClauseAnalysisError(
                f"Anthropic LLM request to '{self._endpoint_url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise ClauseAnalysisError(
                f"Anthropic LLM endpoint '{self._endpoint_url}' returned invalid JSON: {exc}"
            ) from exc

        content_blocks = data.get("content") if isinstance(data, dict) else None
        if not isinstance(content_blocks, list) or not content_blocks:
            raise ClauseAnalysisError("Anthropic response missing 'content' blocks.")
        first_block = content_blocks[0]
        text = first_block.get("text") if isinstance(first_block, dict) else None
        if not isinstance(text, str) or not text.strip():
            raise ClauseAnalysisError("Anthropic response contained empty text content.")
        return text

    def invoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Synchronously invoke the Anthropic `/v1/messages` API."""
        return asyncio.run(self.ainvoke(input, config=config, **kwargs))


class OllamaChatRunnable(Runnable[Any, str]):
    """Runnable adapter for 100% local Ollama inference (`/api/chat` with `format='json'`)."""

    def __init__(
        self,
        model_name: str,
        base_url: str = "http://localhost:11434",
        temperature: float = 0.0,
        timeout_seconds: float = 60.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__()
        self._model_name = _require_llm_model_name("ollama", model_name)
        self._endpoint_url = f"{base_url.strip().rstrip('/')}/api/chat"
        self._temperature = temperature
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def ainvoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronously invoke local Ollama `/api/chat` (`format='json'`, `stream=False`)."""
        _ = config, kwargs
        system_prompt, user_prompt = extract_system_and_user_messages(input)

        payload: dict[str, Any] = {
            "model": self._model_name,
            "format": "json",
            "stream": False,
            "options": {"temperature": self._temperature},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        try:
            if self._http_client is not None:
                response = await self._http_client.post(
                    self._endpoint_url,
                    json=payload,
                    timeout=self._timeout_seconds,
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                    response = await client.post(
                        self._endpoint_url,
                        json=payload,
                    )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as exc:
            raise ClauseAnalysisError(
                f"Ollama chat request to '{self._endpoint_url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise ClauseAnalysisError(
                f"Ollama chat endpoint '{self._endpoint_url}' returned invalid JSON: {exc}"
            ) from exc

        if not isinstance(data, dict):
            raise ClauseAnalysisError("Ollama /api/chat returned non-object JSON payload.")

        message = data.get("message")
        content = message.get("content") if isinstance(message, dict) else data.get("response")
        if not isinstance(content, str) or not content.strip():
            raise ClauseAnalysisError("Ollama /api/chat response contained empty content.")
        return content

    def invoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Synchronously invoke local Ollama `/api/chat`."""
        return asyncio.run(self.ainvoke(input, config=config, **kwargs))


class GeminiGenerateContentChatRunnable(Runnable[Any, str]):
    """LangChain Runnable adapter for Google Gemini generateContent API with JSON mode."""

    def __init__(
        self,
        model_name: str,
        base_url: str = "https://generativelanguage.googleapis.com/v1beta",
        api_key: str | None = None,
        temperature: float = 0.0,
        timeout_seconds: float = 60.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__()
        clean_model = _require_llm_model_name("gemini", model_name).removeprefix("models/")
        if not clean_model:
            raise ClauseAnalysisError("Missing model name for 'gemini' LLM provider.")
        self._model_id = clean_model
        clean_base = base_url.strip().rstrip("/")
        self._endpoint_url = f"{clean_base}/models/{self._model_id}:generateContent"
        self._api_key = api_key
        self._temperature = temperature
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    async def ainvoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronously invoke Gemini generateContent with application/json output."""
        _ = config, kwargs
        if not self._api_key:
            raise ClauseAnalysisError(
                "Missing API key for 'gemini' LLM provider. "
                "Configure LLM_API_KEY or GEMINI_API_KEY."
            )

        system_prompt, user_prompt = extract_system_and_user_messages(input)
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "x-goog-api-key": self._api_key,
        }
        payload: dict[str, Any] = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": self._temperature,
                "responseMimeType": "application/json",
            },
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
            data = response.json()
        except httpx.HTTPError as exc:
            raise ClauseAnalysisError(
                f"Gemini LLM request to '{self._endpoint_url}' failed: {exc}"
            ) from exc
        except ValueError as exc:
            raise ClauseAnalysisError(
                f"Gemini LLM endpoint '{self._endpoint_url}' returned invalid JSON: {exc}"
            ) from exc

        candidates = data.get("candidates") if isinstance(data, dict) else None
        if not isinstance(candidates, list) or not candidates:
            raise ClauseAnalysisError(
                f"Gemini response from '{self._endpoint_url}' missing 'candidates' array."
            )
        first_candidate = candidates[0]
        content_obj = (
            first_candidate.get("content") if isinstance(first_candidate, dict) else None
        )
        parts = content_obj.get("parts") if isinstance(content_obj, dict) else None
        if not isinstance(parts, list) or not parts:
            raise ClauseAnalysisError(
                f"Gemini response from '{self._endpoint_url}' missing 'parts' in candidate."
            )
        first_part = parts[0]
        text = first_part.get("text") if isinstance(first_part, dict) else None
        if not isinstance(text, str) or not text.strip():
            raise ClauseAnalysisError(
                f"Gemini response from '{self._endpoint_url}' contained empty text content."
            )
        return text

    def invoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Synchronously invoke Google Gemini generateContent."""
        return asyncio.run(self.ainvoke(input, config=config, **kwargs))


LLMFactoryCallable = Callable[..., Runnable[Any, Any]]


class LLMProviderRegistry:
    """Thread-safe plugin registry for LangChain LLM chat runnables."""

    _lock = threading.RLock()
    _factories: dict[str, LLMFactoryCallable] = {}

    @classmethod
    def register(
        cls,
        provider_name: str,
        factory: LLMFactoryCallable,
    ) -> None:
        """Register an LLM runnable factory under `provider_name`."""
        normalized = provider_name.strip().lower()
        if not normalized:
            raise ValueError("LLM provider name cannot be empty.")
        with cls._lock:
            cls._factories[normalized] = factory

    @classmethod
    def unregister(cls, provider_name: str) -> None:
        """Remove a registered LLM provider (useful for isolated unit test cleanup)."""
        normalized = provider_name.strip().lower()
        with cls._lock:
            cls._factories.pop(normalized, None)

    @classmethod
    def available_providers(cls) -> tuple[str, ...]:
        """Return sorted tuple of all registered LLM provider names."""
        with cls._lock:
            return tuple(sorted(cls._factories.keys()))

    @classmethod
    def create(
        cls,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> Runnable[Any, Any]:
        """Instantiate the configured LangChain `Runnable` for `settings.LLM_PROVIDER`."""
        normalized = settings.LLM_PROVIDER.strip().lower()
        with cls._lock:
            factory = cls._factories.get(normalized)
            available = tuple(cls._factories.keys())

        if factory is None:
            raise UnsupportedAIProviderError(
                provider_name=settings.LLM_PROVIDER,
                provider_kind="llm",
                available_providers=available,
            )

        sig = inspect.signature(factory)
        if "http_client" in sig.parameters or any(
            p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()
        ):
            created = factory(settings, http_client=http_client)
        else:
            created = factory(settings)

        if isinstance(created, Runnable):
            return created
        if callable(created):
            return RunnableLambda(created)
        raise TypeError(
            f"LLM provider '{normalized}' factory must return a LangChain Runnable or Callable."
        )


def register_llm_provider(
    provider_name: str,
) -> Callable[[LLMFactoryCallable], LLMFactoryCallable]:
    """Decorator to register a custom LLM runnable factory in `LLMProviderRegistry`."""

    def _decorator(factory: LLMFactoryCallable) -> LLMFactoryCallable:
        LLMProviderRegistry.register(provider_name, factory)
        return factory

    return _decorator


@register_llm_provider("deterministic")
def _build_deterministic_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    _ = http_client
    return PolicyAwareDeterministicChatModel(temperature=settings.LLM_TEMPERATURE)


@register_llm_provider("groq")
def _build_groq_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return OpenAICompatibleChatRunnable(
        provider_label="groq",
        model_name=_require_llm_model_name("groq", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL or "https://api.groq.com/openai/v1",
        api_key=settings.resolve_llm_api_key(),
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        require_api_key=True,
        http_client=http_client,
    )


@register_llm_provider("openai")
def _build_openai_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return OpenAICompatibleChatRunnable(
        provider_label="openai",
        model_name=_require_llm_model_name("openai", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL or "https://api.openai.com/v1",
        api_key=settings.resolve_llm_api_key(),
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        require_api_key=True,
        http_client=http_client,
    )


@register_llm_provider("anthropic")
def _build_anthropic_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return AnthropicMessagesChatRunnable(
        model_name=_require_llm_model_name("anthropic", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL or "https://api.anthropic.com",
        api_key=settings.resolve_llm_api_key(),
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        http_client=http_client,
    )


@register_llm_provider("ollama")
def _build_ollama_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return OllamaChatRunnable(
        model_name=_require_llm_model_name("ollama", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL or "http://localhost:11434",
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        http_client=http_client,
    )


@register_llm_provider("openai_compatible")
def _build_openai_compatible_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return OpenAICompatibleChatRunnable(
        provider_label="openai_compatible",
        model_name=_require_llm_model_name("openai_compatible", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL or "http://localhost:8000/v1",
        api_key=settings.resolve_llm_api_key(),
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        require_api_key=False,
        http_client=http_client,
    )


@register_llm_provider("gemini")
def _build_gemini_llm(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, str]:
    return GeminiGenerateContentChatRunnable(
        model_name=_require_llm_model_name("gemini", settings.LLM_MODEL_NAME),
        base_url=settings.LLM_BASE_URL
        or "https://generativelanguage.googleapis.com/v1beta",
        api_key=settings.resolve_llm_api_key(),
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        http_client=http_client,
    )


def create_llm_runnable(
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> Runnable[Any, Any]:
    """Create the active LangChain LLM `Runnable` from `LLMProviderRegistry`."""
    return LLMProviderRegistry.create(settings=settings, http_client=http_client)


__all__ = [
    "AnthropicMessagesChatRunnable",
    "GeminiGenerateContentChatRunnable",
    "JSON_SCHEMA_INSTRUCTION",
    "LLMFactoryCallable",
    "LLMProviderRegistry",
    "OllamaChatRunnable",
    "OpenAICompatibleChatRunnable",
    "UnsupportedAIProviderError",
    "create_llm_runnable",
    "extract_system_and_user_messages",
    "register_llm_provider",
]
