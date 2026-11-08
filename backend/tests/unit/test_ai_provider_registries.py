"""Unit tests for the Multi-Provider & Local AI Plugin System (LLM & Embedding Registries)."""

import json
import math
from typing import Any
from uuid import UUID, uuid4

import httpx
import pytest
from langchain_core.runnables import Runnable, RunnableLambda
from src.domain.entities import (
    ClauseAuditInput,
    PlaybookRule,
    PlaybookSearchQuery,
)
from src.domain.enums import RiskLevel
from src.domain.exceptions import ClauseAnalysisError, EmbeddingGenerationError
from src.domain.ports.playbook_ports import (
    EmbeddingGeneratorPort,
    PlaybookRepositoryPort,
)
from src.infrastructure.ai import (
    LangChainClauseAuditor,
    LLMProviderRegistry,
    UnsupportedAIProviderError,
    create_llm_runnable,
    register_llm_provider,
)
from src.infrastructure.config import Settings
from src.infrastructure.vector import (
    EmbeddingProviderRegistry,
    HybridPlaybookRetriever,
    adapt_and_normalize_vector,
    compute_cosine_similarity,
    create_embedding_generator,
    register_embedding_provider,
)


class _InMemoryPlaybookRepo(PlaybookRepositoryPort):
    """Minimal in-memory PlaybookRepositoryPort for unit testing hybrid retrieval."""

    def __init__(self, rules: list[PlaybookRule]) -> None:
        self._rules = list(rules)

    async def create(
        self,
        rule: PlaybookRule,
        org_id: UUID | None = None,
    ) -> PlaybookRule:
        _ = org_id
        self._rules.append(rule)
        return rule

    async def get_by_id(self, org_id: UUID, rule_id: UUID) -> PlaybookRule | None:
        for rule in self._rules:
            if rule.org_id == org_id and rule.id == rule_id:
                return rule
        return None

    async def list_by_org(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        return [
            r
            for r in self._rules
            if r.org_id == org_id and (category is None or r.category == category)
        ]

    async def update(self, org_id: UUID, rule: PlaybookRule) -> PlaybookRule:
        _ = org_id
        return rule

    async def delete(self, org_id: UUID, rule_id: UUID) -> bool:
        _ = org_id, rule_id
        return True

    async def list_candidates_for_retrieval(
        self,
        org_id: UUID,
        category: str | None = None,
    ) -> list[PlaybookRule]:
        return await self.list_by_org(org_id=org_id, category=category)


def test_builtin_providers_are_registered() -> None:
    """Verify all built-in LLM and Embedding providers are registered out of the box."""
    llm_providers = LLMProviderRegistry.available_providers()
    for expected_llm in (
        "deterministic",
        "groq",
        "openai",
        "anthropic",
        "gemini",
        "ollama",
        "openai_compatible",
    ):
        assert expected_llm in llm_providers

    embed_providers = EmbeddingProviderRegistry.available_providers()
    for expected_embed in (
        "deterministic",
        "openai",
        "gemini",
        "ollama",
        "openai_compatible",
    ):
        assert expected_embed in embed_providers


def test_unsupported_provider_raises_helpful_error() -> None:
    """Verify requesting an unregistered LLM or Embedding provider lists registered options."""
    bad_llm_settings = Settings(LLM_PROVIDER="unknown_vendor_xyz")
    with pytest.raises(UnsupportedAIProviderError) as llm_exc:
        create_llm_runnable(bad_llm_settings)
    assert "unknown_vendor_xyz" in str(llm_exc.value)
    assert "ollama" in llm_exc.value.available_providers
    assert "groq" in llm_exc.value.available_providers

    bad_embed_settings = Settings(EMBEDDING_PROVIDER="unknown_embedder_xyz")
    with pytest.raises(UnsupportedAIProviderError) as embed_exc:
        create_embedding_generator(bad_embed_settings)
    assert "unknown_embedder_xyz" in str(embed_exc.value)
    assert "ollama" in embed_exc.value.available_providers
    assert "openai_compatible" in embed_exc.value.available_providers


def test_vector_dimension_adaptation_and_l2_normalization() -> None:
    """Verify 384-d, 768-d, 1024-d, and 3072-d vectors adapt to 1536-d with ||v||_2 == 1.0."""
    for source_dim in (384, 768, 1024, 1536, 3072):
        raw_a = [math.sin(i + 1.0) for i in range(source_dim)]
        raw_b = [math.cos(i + 1.0) for i in range(source_dim)]

        adapted_a = adapt_and_normalize_vector(raw_a, target_dim=1536)
        adapted_b = adapt_and_normalize_vector(raw_b, target_dim=1536)

        assert len(adapted_a) == 1536
        assert len(adapted_b) == 1536

        norm_a = math.sqrt(sum(x * x for x in adapted_a))
        norm_b = math.sqrt(sum(x * x for x in adapted_b))
        assert math.isclose(norm_a, 1.0, rel_tol=1e-6)
        assert math.isclose(norm_b, 1.0, rel_tol=1e-6)

        if source_dim <= 1536:
            # Isometric zero-padding preserves exact cosine similarity
            norm_raw_a = math.sqrt(sum(x * x for x in raw_a))
            norm_raw_b = math.sqrt(sum(x * x for x in raw_b))
            unit_raw_a = [x / norm_raw_a for x in raw_a]
            unit_raw_b = [x / norm_raw_b for x in raw_b]
            expected_cos = compute_cosine_similarity(unit_raw_a, unit_raw_b)
            actual_cos = compute_cosine_similarity(adapted_a, adapted_b)
            assert math.isclose(expected_cos, actual_cos, rel_tol=1e-5)


@pytest.mark.asyncio
async def test_local_ollama_llm_and_768d_embeddings_end_to_end() -> None:
    """Verify local Ollama /api/chat and 768-d /api/embed work end-to-end with domain ports."""
    captured_requests: list[tuple[str, dict[str, Any]]] = []

    def mock_ollama_handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode("utf-8"))
        captured_requests.append((str(request.url), body))

        if request.url.path == "/api/embed":
            inputs = body["input"]
            # Simulate 768-d nomic-embed-text embeddings
            embeddings = [
                [0.25 if idx % 2 == 0 else 0.15 for idx in range(768)]
                for _ in inputs
            ]
            return httpx.Response(200, json={"model": body["model"], "embeddings": embeddings})

        if request.url.path == "/api/chat":
            assert body["format"] == "json"
            assert body["stream"] is False
            redline_payload = {
                "is_compliant": False,
                "risk": "CRITICAL",
                "category": "Limitation of Liability",
                "proposed_text": (
                    "4.1 Each party's aggregate liability shall not exceed twelve (12) months "
                    "of fees paid."
                ),
                "rationale": "Local Ollama llama3.1:8b detected uncapped liability trigger.",
                "negotiation_talking_point": "Standard mutual 12-month fee cap required.",
            }
            return httpx.Response(
                200,
                json={"message": {"role": "assistant", "content": json.dumps(redline_payload)}},
            )

        return httpx.Response(404, json={"error": "not found"})

    transport = httpx.MockTransport(mock_ollama_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        settings = Settings(
            LLM_PROVIDER="ollama",
            LLM_MODEL_NAME="llama3.1:8b",
            LLM_BASE_URL="http://localhost:11434",
            EMBEDDING_PROVIDER="ollama",
            EMBEDDING_MODEL_NAME="nomic-embed-text",
            EMBEDDING_BASE_URL="http://localhost:11434",
            EMBEDDING_DIMENSION=1536,
        )

        embedder = create_embedding_generator(settings, http_client=mock_client)
        rule_embedding = await embedder.embed_text(
            "Limitation of Liability: Mutual 12-month fee cap; no uncapped liability."
        )
        assert len(rule_embedding) == 1536
        assert math.isclose(math.sqrt(sum(v * v for v in rule_embedding)), 1.0, rel_tol=1e-6)

        org_id = uuid4()
        rule = PlaybookRule(
            org_id=org_id,
            category="Limitation of Liability",
            standard_position="Mutual 12-month fee cap.",
            fallback_position="2x annual contract value super-cap.",
            unacceptable_triggers="uncapped, unlimited liability",
            embedding=rule_embedding,
        )
        retriever = HybridPlaybookRetriever(
            repository=_InMemoryPlaybookRepo([rule]),
            embedding_generator=embedder,
        )
        matched_rules = await retriever.retrieve_top_rules(
            PlaybookSearchQuery(
                org_id=org_id,
                query_text="4.1 Customer shall have uncapped liability under this Agreement.",
                top_k=3,
            )
        )
        assert len(matched_rules) == 1
        assert matched_rules[0].rule.id == rule.id

        llm_runnable = create_llm_runnable(settings, http_client=mock_client)
        auditor = LangChainClauseAuditor(
            llm_runnable=llm_runnable,
            max_retries=1,
            temperature=0.0,
            enable_deterministic_fallback=False,
        )
        audit_result = await auditor.audit_clause(
            audit_input=ClauseAuditInput(
                org_id=org_id,
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=0,
                heading="4. Limitation of Liability",
                clause_text="4.1 Customer shall have uncapped liability under this Agreement.",
            ),
            matched_rules=matched_rules,
        )

        assert audit_result.is_compliant is False
        assert audit_result.risk == RiskLevel.CRITICAL
        assert audit_result.matched_rule_id == rule.id
        assert "twelve (12) months" in audit_result.proposed_text
        assert any(url.endswith("/api/embed") for url, _ in captured_requests)
        assert any(url.endswith("/api/chat") for url, _ in captured_requests)


@pytest.mark.asyncio
async def test_cloud_and_openai_compatible_providers_via_mock_transport() -> None:
    """Verify Groq, OpenAI, Anthropic, and local vLLM/LM Studio (openai_compatible) adapters."""

    def mock_cloud_handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode("utf-8"))
        path = request.url.path

        if path.endswith("/embeddings"):
            inputs = body["input"]
            data = [
                {
                    "index": idx,
                    "embedding": [0.1 * ((i % 7) + 1) for i in range(1024)],
                }
                for idx in range(len(inputs))
            ]
            return httpx.Response(200, json={"data": data})

        if path.endswith("/chat/completions"):
            assert body["response_format"] == {"type": "json_object"}
            payload = {
                "is_compliant": False,
                "risk": "HIGH",
                "category": "Service Level Agreement",
                "proposed_text": (
                    "Vendor guarantees 99.95% monthly uptime with 10% service credits."
                ),
                "rationale": f"Evaluated by model {body['model']}",
                "negotiation_talking_point": "Binding SLA commitment required.",
            }
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": json.dumps(payload)}}]},
            )

        if path.endswith("/v1/messages"):
            assert request.headers.get("x-api-key") == "sk-ant-test-key"
            payload = {
                "is_compliant": True,
                "risk": "LOW",
                "category": "Governing Law",
                "proposed_text": "Delaware law governs this Agreement.",
                "rationale": "Evaluated by Anthropic Claude.",
                "negotiation_talking_point": "Acceptable as drafted.",
            }
            return httpx.Response(
                200,
                json={"content": [{"type": "text", "text": json.dumps(payload)}]},
            )

        return httpx.Response(404)

    transport = httpx.MockTransport(mock_cloud_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        # 1. Test OpenAI-Compatible (e.g. local vLLM / LM Studio without API key required)
        vllm_settings = Settings(
            LLM_PROVIDER="openai_compatible",
            LLM_MODEL_NAME="Qwen/Qwen2.5-14B-Instruct",
            LLM_BASE_URL="http://localhost:8000/v1",
            EMBEDDING_PROVIDER="openai_compatible",
            EMBEDDING_MODEL_NAME="BAAI/bge-large-en-v1.5",
            EMBEDDING_BASE_URL="http://localhost:8080/v1",
        )
        vllm_embedder = create_embedding_generator(vllm_settings, http_client=mock_client)
        vec = await vllm_embedder.embed_text("99.95% monthly uptime SLA")
        assert len(vec) == 1536

        vllm_llm = create_llm_runnable(vllm_settings, http_client=mock_client)
        vllm_auditor = LangChainClauseAuditor(
            llm_runnable=vllm_llm,
            max_retries=0,
            enable_deterministic_fallback=False,
        )
        res = await vllm_auditor.audit_clause(
            ClauseAuditInput(
                org_id=uuid4(),
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=1,
                heading="SLA",
                clause_text="Vendor provides best-efforts availability.",
            ),
            matched_rules=[],
        )
        assert res.risk == RiskLevel.HIGH
        assert "Qwen/Qwen2.5-14B-Instruct" in res.rationale

        # 2. Test Anthropic Claude adapter
        anthropic_settings = Settings(
            LLM_PROVIDER="anthropic",
            LLM_MODEL_NAME="claude-3-5-sonnet-latest",
            ANTHROPIC_API_KEY="sk-ant-test-key",
        )
        claude_llm = create_llm_runnable(anthropic_settings, http_client=mock_client)
        claude_auditor = LangChainClauseAuditor(
            llm_runnable=claude_llm,
            max_retries=0,
            enable_deterministic_fallback=False,
        )
        claude_res = await claude_auditor.audit_clause(
            ClauseAuditInput(
                org_id=uuid4(),
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=2,
                heading="Governing Law",
                clause_text="Delaware law governs this Agreement.",
            ),
            matched_rules=[],
        )
        assert claude_res.is_compliant is True
        assert claude_res.risk == RiskLevel.LOW


@pytest.mark.asyncio
async def test_google_gemini_llm_and_embeddings_mock_transport() -> None:
    """Verify native Google Gemini LLM and 768-d embedding adapter via mock transport."""
    captured_requests: list[tuple[str, dict[str, Any], dict[str, str]]] = []

    def mock_gemini_handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode("utf-8"))
        headers = dict(request.headers)
        captured_requests.append((str(request.url), body, headers))

        assert headers.get("x-goog-api-key") == "test-gemini-key"

        if request.url.path.endswith(":embedContent"):
            assert body["model"] == "models/text-embedding-004"
            assert "parts" in body["content"]
            raw_768 = [0.05 * ((i % 5) + 1) for i in range(768)]
            return httpx.Response(200, json={"embedding": {"values": raw_768}})

        if request.url.path.endswith(":batchEmbedContents"):
            assert len(body["requests"]) == 2
            for req_item in body["requests"]:
                assert req_item["model"] == "models/text-embedding-004"
                assert "parts" in req_item["content"]
            raw_batch = [
                {"values": [0.05 * ((i % 5) + 1) for i in range(768)]},
                {"values": [0.02 * ((i % 7) + 1) for i in range(768)]},
            ]
            return httpx.Response(200, json={"embeddings": raw_batch})

        if request.url.path.endswith(":generateContent"):
            assert "gemini-2.5-flash:generateContent" in request.url.path
            assert body["generationConfig"]["temperature"] == 0.0
            assert body["generationConfig"]["responseMimeType"] == "application/json"
            assert "system_instruction" in body
            assert "contents" in body

            redline_data = {
                "is_compliant": False,
                "risk": "CRITICAL",
                "category": "Limitation of Liability",
                "proposed_text": (
                    "Each party aggregate liability shall not exceed 12 months fees paid."
                ),
                "rationale": "Gemini 2.5 Flash identified unacceptable uncapped liability.",
                "negotiation_talking_point": "Standard mutual cap required.",
            }
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {"text": json.dumps(redline_data)}
                                ]
                            }
                        }
                    ]
                },
            )

        return httpx.Response(404, json={"error": "endpoint not found"})

    transport = httpx.MockTransport(mock_gemini_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        gemini_settings = Settings(
            LLM_PROVIDER="gemini",
            LLM_MODEL_NAME="gemini-2.5-flash",
            GEMINI_API_KEY="test-gemini-key",
            EMBEDDING_PROVIDER="gemini",
            EMBEDDING_MODEL_NAME="text-embedding-004",
            EMBEDDING_DIMENSION=1536,
        )

        embedder = create_embedding_generator(gemini_settings, http_client=mock_client)
        single_vec = await embedder.embed_text("12 months fees limitation of liability")
        assert len(single_vec) == 1536
        assert math.isclose(math.sqrt(sum(v * v for v in single_vec)), 1.0, rel_tol=1e-6)

        batch_vecs = await embedder.embed_batch(["Clause text A", "Clause text B"])
        assert len(batch_vecs) == 2
        assert len(batch_vecs[0]) == 1536
        assert len(batch_vecs[1]) == 1536
        assert math.isclose(math.sqrt(sum(v * v for v in batch_vecs[0])), 1.0, rel_tol=1e-6)
        assert math.isclose(math.sqrt(sum(v * v for v in batch_vecs[1])), 1.0, rel_tol=1e-6)

        gemini_llm = create_llm_runnable(gemini_settings, http_client=mock_client)
        auditor = LangChainClauseAuditor(
            llm_runnable=gemini_llm,
            max_retries=0,
            enable_deterministic_fallback=False,
        )
        audit_result = await auditor.audit_clause(
            ClauseAuditInput(
                org_id=uuid4(),
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=0,
                heading="Limitation of Liability",
                clause_text="Customer shall have uncapped liability.",
            ),
            matched_rules=[],
        )
        assert audit_result.is_compliant is False
        assert audit_result.risk == RiskLevel.CRITICAL
        assert "12 months fees paid" in audit_result.proposed_text
        assert "Gemini 2.5 Flash" in audit_result.rationale


@pytest.mark.asyncio
async def test_gemini_missing_model_api_key_and_empty_text_errors() -> None:
    """Verify non-deterministic providers reject empty model IDs, missing keys, and blank text."""
    # 1. Missing model IDs must raise domain exceptions with zero hardcoded fallback
    missing_model_settings = Settings(
        LLM_PROVIDER="gemini",
        LLM_MODEL_NAME="",
        EMBEDDING_PROVIDER="gemini",
        EMBEDDING_MODEL_NAME="",
        GEMINI_API_KEY="valid-key",
    )
    with pytest.raises(EmbeddingGenerationError) as missing_emb_model_exc:
        create_embedding_generator(missing_model_settings)
    assert "Model name" in str(missing_emb_model_exc.value) or "model" in str(
        missing_emb_model_exc.value
    ).lower()

    with pytest.raises(ClauseAnalysisError) as missing_llm_model_exc:
        create_llm_runnable(missing_model_settings)
    assert "Model name" in str(missing_llm_model_exc.value) or "model" in str(
        missing_llm_model_exc.value
    ).lower()

    # 2. Explicit model IDs + missing API key raises missing API key errors
    no_key_settings = Settings(
        LLM_PROVIDER="gemini",
        LLM_MODEL_NAME="gemini-live-test-model",
        EMBEDDING_PROVIDER="gemini",
        EMBEDDING_MODEL_NAME="gemini-live-embed-model",
        GEMINI_API_KEY=None,
        LLM_API_KEY=None,
        EMBEDDING_API_KEY=None,
    )

    embedder = create_embedding_generator(no_key_settings)
    with pytest.raises(EmbeddingGenerationError) as embed_exc:
        await embedder.embed_text("Sample text")
    assert "Missing API key for 'gemini' embedding provider" in str(embed_exc.value)

    with_key_settings = Settings(
        LLM_PROVIDER="gemini",
        LLM_MODEL_NAME="gemini-live-test-model",
        EMBEDDING_PROVIDER="gemini",
        EMBEDDING_MODEL_NAME="gemini-live-embed-model",
        GEMINI_API_KEY="valid-key",
    )
    valid_embedder = create_embedding_generator(with_key_settings)
    with pytest.raises(EmbeddingGenerationError) as blank_exc:
        await valid_embedder.embed_text("   ")
    assert "empty or blank text" in str(blank_exc.value)

    llm = create_llm_runnable(no_key_settings)
    with pytest.raises(ClauseAnalysisError) as llm_exc:
        await llm.ainvoke({"clause_text": "Sample clause", "playbook_context": ""})
    assert "Missing API key for 'gemini' LLM provider" in str(llm_exc.value)


@pytest.mark.asyncio
async def test_custom_plugin_provider_registration() -> None:
    """Verify dynamic registration of custom LLM and Embedding providers via decorators."""

    class CustomEnterpriseEmbeddingAdapter(EmbeddingGeneratorPort):
        def __init__(self, target_dim: int = 1536) -> None:
            self._target_dim = target_dim

        async def embed_text(self, text: str) -> list[float]:
            raw = [float((ord(ch) % 13) + 1) for ch in text[:256]]
            return adapt_and_normalize_vector(raw, target_dim=self._target_dim)

        async def embed_batch(self, texts: list[str]) -> list[list[float]]:
            return [await self.embed_text(t) for t in texts]

    @register_embedding_provider("custom_corp_embed")
    def _build_custom_embed(settings: Settings) -> EmbeddingGeneratorPort:
        return CustomEnterpriseEmbeddingAdapter(target_dim=settings.EMBEDDING_DIMENSION)

    @register_llm_provider("custom_corp_llm")
    def _build_custom_llm(settings: Settings) -> Runnable[Any, str]:
        _ = settings

        def _invoke_custom(_prompt_input: Any) -> str:
            return json.dumps(
                {
                    "is_compliant": False,
                    "risk": "MEDIUM",
                    "category": "Payment Terms",
                    "proposed_text": "Invoices are payable Net 45 days from receipt.",
                    "rationale": "Generated by Custom Enterprise Gateway Plugin.",
                    "negotiation_talking_point": "Standard Net 45 corporate treasury policy.",
                }
            )

        return RunnableLambda(_invoke_custom)

    try:
        custom_settings = Settings(
            LLM_PROVIDER="custom_corp_llm",
            EMBEDDING_PROVIDER="custom_corp_embed",
        )
        embedder = create_embedding_generator(custom_settings)
        vec = await embedder.embed_text("Payment Terms Net 45")
        assert len(vec) == 1536

        llm = create_llm_runnable(custom_settings)
        auditor = LangChainClauseAuditor(
            llm_runnable=llm,
            max_retries=0,
            enable_deterministic_fallback=False,
        )
        result = await auditor.audit_clause(
            ClauseAuditInput(
                org_id=uuid4(),
                document_id=uuid4(),
                clause_id=uuid4(),
                clause_index=0,
                heading="Payment Terms",
                clause_text="Invoices are payable Net 15 days.",
            ),
            matched_rules=[],
        )
        assert result.risk == RiskLevel.MEDIUM
        assert result.rationale == "Generated by Custom Enterprise Gateway Plugin."
    finally:
        EmbeddingProviderRegistry.unregister("custom_corp_embed")
        LLMProviderRegistry.unregister("custom_corp_llm")
