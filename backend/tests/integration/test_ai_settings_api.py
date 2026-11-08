"""Integration tests for In-App AI Provider Switcher, Live Model Discovery, RBAC, and Custom IDs."""

import httpx
import pytest
from httpx import AsyncClient
from src.domain.enums import UserRole
from src.infrastructure.ai.config_vault import encrypt_ai_settings_vault


async def _register_org_and_admin(client: AsyncClient, slug: str) -> dict[str, str]:
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": f"AI Switcher Org {slug}",
            "admin_email": f"admin-{slug}@aiswitcher.io",
            "admin_password": "AdminSecurePassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    token = str(reg_resp.json()["access_token"])
    return {"Authorization": f"Bearer {token}"}


async def _create_and_login_role_user(
    client: AsyncClient,
    admin_headers: dict[str, str],
    email: str,
    role: UserRole,
) -> dict[str, str]:
    password = "RoleUserPassword!2026"
    create_resp = await client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={
            "email": email,
            "password": password,
            "role": role.value,
        },
    )
    assert create_resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    token = str(login_resp.json()["access_token"])
    return {"Authorization": f"Bearer {token}"}


async def test_get_ai_settings_returns_catalog_and_requires_auth(
    client: AsyncClient,
) -> None:
    """Verify GET /api/v1/ai-settings requires JWT auth and returns full provider catalog."""
    unauth_resp = await client.get("/api/v1/ai-settings")
    assert unauth_resp.status_code == 401

    admin_headers = await _register_org_and_admin(client, "catalog")
    get_resp = await client.get("/api/v1/ai-settings", headers=admin_headers)
    assert get_resp.status_code == 200

    body = get_resp.json()
    assert body["llm_provider"] == "deterministic"
    assert body["embedding_provider"] == "deterministic"
    assert body["llm_has_api_key"] is False
    assert body["llm_api_key_masked"] is None

    provider_map = {p["provider_id"]: p for p in body["available_providers"]}
    assert {
        "deterministic",
        "gemini",
        "groq",
        "openai",
        "anthropic",
        "ollama",
        "openai_compatible",
    }.issubset(set(provider_map.keys()))

    # Built-in offline deterministic engine retains its internal code identifiers
    det_entry = provider_map["deterministic"]
    assert det_entry["default_llm_model"] == "policy-deterministic-v1"
    assert det_entry["recommended_llm_models"] == ["policy-deterministic-v1"]
    assert det_entry["default_embedding_model"] == "deterministic-hash-1536"
    assert det_entry["recommended_embedding_models"] == ["deterministic-hash-1536"]

    # External & local providers expose zero hardcoded/static model lists
    for ext_provider in (
        "gemini",
        "groq",
        "openai",
        "anthropic",
        "ollama",
        "openai_compatible",
    ):
        ext_entry = provider_map[ext_provider]
        assert ext_entry["default_llm_model"] is None
        assert ext_entry["recommended_llm_models"] == []
        assert ext_entry["default_embedding_model"] is None
        assert ext_entry["recommended_embedding_models"] == []


async def test_put_ai_settings_switches_providers_masks_api_key_and_enforces_rbac(
    client: AsyncClient,
) -> None:
    """Verify PUT dynamically switches Gemini/Ollama, masks secrets, and enforces ADMIN RBAC."""
    admin_headers = await _register_org_and_admin(client, "rbac")
    viewer_headers = await _create_and_login_role_user(
        client,
        admin_headers,
        email="viewer@aiswitcher.io",
        role=UserRole.VIEWER,
    )
    counsel_headers = await _create_and_login_role_user(
        client,
        admin_headers,
        email="counsel@aiswitcher.io",
        role=UserRole.LEGAL_COUNSEL,
    )

    raw_gemini_secret = "AIzaSyTopSecretPlaintextKey7b1c"  # noqa: S105

    # 1. ADMIN dynamically switches to Google Gemini with API key
    put_gemini = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "gemini",
            "llm_model_name": "gemini-2.5-flash",
            "llm_api_key": raw_gemini_secret,
            "llm_temperature": 0.1,
            "embedding_provider": "gemini",
            "embedding_model_name": "text-embedding-004",
            "embedding_api_key": raw_gemini_secret,
        },
    )
    assert put_gemini.status_code == 200
    assert raw_gemini_secret not in put_gemini.text

    gemini_body = put_gemini.json()
    assert gemini_body["llm_provider"] == "gemini"
    assert gemini_body["llm_model_name"] == "gemini-2.5-flash"
    assert gemini_body["llm_has_api_key"] is True
    assert gemini_body["llm_api_key_masked"] == "AIza...7b1c"
    assert gemini_body["llm_temperature"] == 0.1
    assert gemini_body["embedding_provider"] == "gemini"
    assert gemini_body["embedding_model_name"] == "text-embedding-004"
    assert gemini_body["embedding_has_api_key"] is True
    assert gemini_body["embedding_api_key_masked"] == "AIza...7b1c"

    # 2. VIEWER can read masked GET settings, but is blocked from PUT and test-connection (403)
    viewer_get = await client.get("/api/v1/ai-settings", headers=viewer_headers)
    assert viewer_get.status_code == 200
    assert raw_gemini_secret not in viewer_get.text
    assert viewer_get.json()["llm_api_key_masked"] == "AIza...7b1c"

    viewer_put = await client.put(
        "/api/v1/ai-settings",
        headers=viewer_headers,
        json={"llm_provider": "deterministic"},
    )
    assert viewer_put.status_code == 403

    viewer_test = await client.post(
        "/api/v1/ai-settings/test-connection",
        headers=viewer_headers,
        json={
            "target": "both",
            "llm_provider": "deterministic",
            "embedding_provider": "deterministic",
        },
    )
    assert viewer_test.status_code == 403

    # 3. LEGAL_COUNSEL is blocked from mutating PUT (403), but allowed to test-connection (200)
    counsel_put = await client.put(
        "/api/v1/ai-settings",
        headers=counsel_headers,
        json={"llm_provider": "deterministic"},
    )
    assert counsel_put.status_code == 403

    counsel_test = await client.post(
        "/api/v1/ai-settings/test-connection",
        headers=counsel_headers,
        json={
            "target": "both",
            "llm_provider": "deterministic",
            "llm_model_name": "policy-deterministic-v1",
            "embedding_provider": "deterministic",
            "embedding_model_name": "deterministic-hash-1536",
        },
    )
    assert counsel_test.status_code == 200
    assert counsel_test.json()["success"] is True

    # 4. ADMIN switches to Local Ollama with Base URL
    put_ollama = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "ollama",
            "llm_model_name": "llama3.1:8b",
            "llm_base_url": "http://localhost:11434",
            "embedding_provider": "ollama",
            "embedding_model_name": "nomic-embed-text",
            "embedding_base_url": "http://localhost:11434",
        },
    )
    assert put_ollama.status_code == 200
    ollama_body = put_ollama.json()
    assert ollama_body["llm_provider"] == "ollama"
    assert ollama_body["llm_model_name"] == "llama3.1:8b"
    assert ollama_body["llm_base_url"] == "http://localhost:11434"
    assert ollama_body["llm_has_api_key"] is False
    assert ollama_body["embedding_provider"] == "ollama"
    assert ollama_body["embedding_model_name"] == "nomic-embed-text"

    # 5. Rejects unregistered provider (422) and SSRF metadata Base URL (422)
    bad_provider = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={"llm_provider": "unregistered_vendor_xyz"},
    )
    assert bad_provider.status_code == 422

    ssrf_url = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "openai_compatible",
            "llm_base_url": "http://169.254.169.254/latest/meta-data/",
        },
    )
    assert ssrf_url.status_code == 422


async def test_post_test_ai_connection_reports_latency_and_failure_diagnostics(
    client: AsyncClient,
) -> None:
    """Verify POST /api/v1/ai-settings/test-connection validates 1536-d vectors and LLM probes."""
    admin_headers = await _register_org_and_admin(client, "probe")

    # 1. Deterministic engine succeeds with 1536-d vector check, structured preview, and latency
    ok_resp = await client.post(
        "/api/v1/ai-settings/test-connection",
        headers=admin_headers,
        json={
            "target": "both",
            "llm_provider": "deterministic",
            "llm_model_name": "policy-deterministic-v1",
            "embedding_provider": "deterministic",
            "embedding_model_name": "deterministic-hash-1536",
        },
    )
    assert ok_resp.status_code == 200
    ok_body = ok_resp.json()
    assert ok_body["success"] is True
    assert ok_body["llm_ok"] is True
    assert ok_body["embedding_ok"] is True
    assert ok_body["latency_ms"] >= 0.0
    assert "1536-d unit vector verified" in ok_body["message"]
    assert ok_body["sample_output_preview"] is not None
    assert "[CRITICAL]" in ok_body["sample_output_preview"]

    # 2. Candidate Gemini test without an API key fails cleanly (200 OK with success=False)
    fail_resp = await client.post(
        "/api/v1/ai-settings/test-connection",
        headers=admin_headers,
        json={
            "target": "both",
            "llm_provider": "gemini",
            "llm_model_name": "gemini-2.5-flash",
            "embedding_provider": "gemini",
            "embedding_model_name": "text-embedding-004",
        },
    )
    assert fail_resp.status_code == 200
    fail_body = fail_resp.json()
    assert fail_body["success"] is False
    assert fail_body["llm_ok"] is False
    assert fail_body["embedding_ok"] is False
    assert "API key" in fail_body["message"] or "GEMINI_API_KEY" in fail_body["message"]


async def test_discover_models_live_api_parsing_fallback_and_secret_scrubbing(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify live model discovery for Gemini, OpenAI, Groq, and Ollama plus catalog fallback."""
    admin_headers = await _register_org_and_admin(client, "discover")
    viewer_headers = await _create_and_login_role_user(
        client,
        admin_headers,
        email="viewer-discover@aiswitcher.io",
        role=UserRole.VIEWER,
    )

    # 1. RBAC & SSRF guards on /discover-models
    viewer_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=viewer_headers,
        json={"provider_id": "ollama"},
    )
    assert viewer_resp.status_code == 403

    ssrf_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={
            "provider_id": "ollama",
            "base_url": "http://169.254.169.254/latest/meta-data/",
        },
    )
    assert ssrf_resp.status_code == 422

    # 2. Unconfigured status with zero static models when cloud provider has no API key
    no_key_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "gemini"},
    )
    assert no_key_resp.status_code == 200
    no_key_body = no_key_resp.json()
    assert no_key_body["source"] == "unconfigured"
    assert no_key_body["llm_models"] == []
    assert no_key_body["embedding_models"] == []
    assert "Fetch Live Models" in no_key_body["message"]

    # 3. Mock upstream HTTP responses for Gemini, OpenAI, Groq, and Ollama
    secret_test_key = "sk-live-super-secret-discovery-9911"  # noqa: S105

    def _mock_handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        if "generativelanguage.googleapis.com" in url_str:
            assert request.headers.get("x-goog-api-key") == secret_test_key
            assert secret_test_key not in url_str
            return httpx.Response(
                200,
                json={
                    "models": [
                        {
                            "name": "models/gemini-2.5-pro-preview-06-05",
                            "supportedGenerationMethods": ["generateContent"],
                        },
                        {
                            "name": "models/gemini-2.5-flash",
                            "supportedGenerationMethods": ["generateContent"],
                        },
                        {
                            "name": "models/text-embedding-004",
                            "supportedGenerationMethods": ["embedContent"],
                        },
                        {
                            "name": "models/imagen-3.0-generate-002",
                            "supportedGenerationMethods": ["generateContent"],
                        },
                    ]
                },
            )
        if "api.openai.com" in url_str:
            if request.headers.get("authorization") == f"Bearer {secret_test_key}":
                return httpx.Response(
                    200,
                    json={
                        "data": [
                            {"id": "gpt-4.1"},
                            {"id": "o4-mini"},
                            {"id": "text-embedding-3-large"},
                            {"id": "whisper-1"},
                            {"id": "dall-e-3"},
                        ]
                    },
                )
            return httpx.Response(
                401,
                text=f"Invalid key provided: {request.headers.get('authorization')}",
            )
        if "api.groq.com" in url_str:
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"id": "llama-3.3-70b-versatile"},
                        {"id": "meta-llama/llama-4-scout-17b-16e-instruct"},
                        {"id": "whisper-large-v3-turbo"},
                    ]
                },
            )
        if "11434/api/tags" in url_str:
            return httpx.Response(
                200,
                json={
                    "models": [
                        {"name": "llama3.3:latest"},
                        {"name": "qwen2.5:14b"},
                        {"name": "nomic-embed-text:latest"},
                        {"name": "bge-m3:latest"},
                    ]
                },
            )
        return httpx.Response(404, text="Not Found")

    mock_transport = httpx.MockTransport(_mock_handler)
    real_async_client = httpx.AsyncClient

    def _patched_async_client(*args: object, **kwargs: object) -> httpx.AsyncClient:
        _ = args, kwargs
        return real_async_client(transport=mock_transport)

    monkeypatch.setattr(httpx, "AsyncClient", _patched_async_client)

    # Gemini live discovery
    gem_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "gemini", "api_key": secret_test_key},
    )
    assert gem_resp.status_code == 200
    assert secret_test_key not in gem_resp.text
    gem_body = gem_resp.json()
    assert gem_body["source"] == "live_api"
    assert gem_body["llm_models"] == ["gemini-2.5-pro-preview-06-05", "gemini-2.5-flash"]
    assert gem_body["embedding_models"] == ["text-embedding-004"]

    # OpenAI live discovery
    oai_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "openai", "api_key": secret_test_key},
    )
    assert oai_resp.status_code == 200
    oai_body = oai_resp.json()
    assert oai_body["source"] == "live_api"
    assert oai_body["llm_models"] == ["gpt-4.1", "o4-mini"]
    assert oai_body["embedding_models"] == ["text-embedding-3-large"]

    # Groq live discovery (excludes whisper audio models)
    groq_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "groq", "api_key": secret_test_key},
    )
    assert groq_resp.status_code == 200
    groq_body = groq_resp.json()
    assert groq_body["source"] == "live_api"
    assert "llama-3.3-70b-versatile" in groq_body["llm_models"]
    assert "whisper-large-v3-turbo" not in groq_body["llm_models"]

    # Ollama live discovery via /api/tags
    ollama_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "ollama", "base_url": "http://localhost:11434"},
    )
    assert ollama_resp.status_code == 200
    ollama_body = ollama_resp.json()
    assert ollama_body["source"] == "live_api"
    assert ollama_body["llm_models"] == ["llama3.3:latest", "qwen2.5:14b"]
    assert ollama_body["embedding_models"] == ["nomic-embed-text:latest", "bge-m3:latest"]

    # Upstream 401 error scrubs candidate secret and returns empty lists with source="unreachable"
    bad_key = "sk-bad-secret-value-1234"
    err_resp = await client.post(
        "/api/v1/ai-settings/discover-models",
        headers=admin_headers,
        json={"provider_id": "openai", "api_key": bad_key},
    )
    assert err_resp.status_code == 200
    assert bad_key not in err_resp.text
    err_body = err_resp.json()
    assert err_body["source"] == "unreachable"
    assert err_body["llm_models"] == []
    assert err_body["embedding_models"] == []


async def test_put_ai_settings_persists_arbitrary_custom_model_ids(
    client: AsyncClient,
) -> None:
    """Verify ADMIN can save any arbitrary custom fine-tuned or local model ID."""
    admin_headers = await _register_org_and_admin(client, "custom-model")

    put_resp = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "openai_compatible",
            "llm_model_name": "custom-org-legal-llm-v3",
            "llm_base_url": "http://localhost:8000/v1",
            "embedding_provider": "openai_compatible",
            "embedding_model_name": "org-internal/legal-bge-large-ft",
            "embedding_base_url": "http://localhost:8080/v1",
        },
    )
    assert put_resp.status_code == 200
    put_body = put_resp.json()
    assert put_body["llm_model_name"] == "custom-org-legal-llm-v3"
    assert put_body["embedding_model_name"] == "org-internal/legal-bge-large-ft"

    get_resp = await client.get("/api/v1/ai-settings", headers=admin_headers)
    assert get_resp.status_code == 200
    get_body = get_resp.json()
    assert get_body["llm_provider"] == "openai_compatible"
    assert get_body["llm_model_name"] == "custom-org-legal-llm-v3"
    assert get_body["embedding_provider"] == "openai_compatible"
    assert get_body["embedding_model_name"] == "org-internal/legal-bge-large-ft"


async def test_ai_settings_encrypted_vault_export_import_roundtrip_and_rbac(
    client: AsyncClient,
) -> None:
    """Verify AES-256-GCM vault export/import, wrong-passphrase guard, SSRF check, and RBAC."""
    admin_headers = await _register_org_and_admin(client, "vault")
    viewer_headers = await _create_and_login_role_user(
        client,
        admin_headers,
        email="viewer-vault@aiswitcher.io",
        role=UserRole.VIEWER,
    )
    counsel_headers = await _create_and_login_role_user(
        client,
        admin_headers,
        email="counsel-vault@aiswitcher.io",
        role=UserRole.LEGAL_COUNSEL,
    )

    vault_secret_key = "AIzaSyVaultSecretKey998877"
    vault_passphrase = "MyStrongVaultPassphrase!2026"

    # 1. Configure Gemini in runtime settings first
    put_gemini = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "gemini",
            "llm_model_name": "gemini-2.5-pro",
            "llm_api_key": vault_secret_key,
            "llm_temperature": 0.15,
            "embedding_provider": "gemini",
            "embedding_model_name": "text-embedding-004",
            "embedding_api_key": vault_secret_key,
        },
    )
    assert put_gemini.status_code == 200

    # 2. Export encrypted vault (.rsvault.json envelope)
    export_resp = await client.post(
        "/api/v1/ai-settings/export-vault",
        headers=admin_headers,
        json={"passphrase": vault_passphrase},
    )
    assert export_resp.status_code == 200
    assert vault_secret_key not in export_resp.text
    assert "gemini-2.5-pro" not in export_resp.text

    envelope = export_resp.json()
    assert envelope["vault_version"] == 1
    assert envelope["cipher"] == "AES-256-GCM"
    assert envelope["kdf"] == "PBKDF2-HMAC-SHA256"
    assert envelope["iterations"] == 600_000

    # 3. RBAC: VIEWER and LEGAL_COUNSEL receive 403 Forbidden on both vault endpoints
    for non_admin_headers in (viewer_headers, counsel_headers):
        forbidden_export = await client.post(
            "/api/v1/ai-settings/export-vault",
            headers=non_admin_headers,
            json={"passphrase": vault_passphrase},
        )
        assert forbidden_export.status_code == 403

        forbidden_import = await client.post(
            "/api/v1/ai-settings/import-vault",
            headers=non_admin_headers,
            json={"passphrase": vault_passphrase, "vault": envelope},
        )
        assert forbidden_import.status_code == 403

    # 4. Reset active runtime settings back to offline deterministic engine
    reset_resp = await client.put(
        "/api/v1/ai-settings",
        headers=admin_headers,
        json={
            "llm_provider": "deterministic",
            "llm_model_name": "policy-deterministic-v1",
            "embedding_provider": "deterministic",
            "embedding_model_name": "deterministic-hash-1536",
        },
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["llm_provider"] == "deterministic"

    # 5. Wrong passphrase returns 400 Bad Request and does NOT mutate active settings
    wrong_pass_resp = await client.post(
        "/api/v1/ai-settings/import-vault",
        headers=admin_headers,
        json={"passphrase": "WrongVaultPassphrase!9999", "vault": envelope},
    )
    assert wrong_pass_resp.status_code == 400
    assert wrong_pass_resp.json()["error"]["code"] == "INVALID_AI_VAULT"

    after_wrong_get = await client.get("/api/v1/ai-settings", headers=admin_headers)
    assert after_wrong_get.status_code == 200
    assert after_wrong_get.json()["llm_provider"] == "deterministic"

    # 6. SSRF check inside decrypted vault payload returns 422 and leaves settings untouched
    ssrf_envelope = encrypt_ai_settings_vault(
        {
            "llm_provider": "openai_compatible",
            "llm_model_name": "local-vllm-model",
            "llm_base_url": "http://169.254.169.254/latest/meta-data/",
            "embedding_provider": "deterministic",
            "embedding_model_name": "deterministic-hash-1536",
        },
        vault_passphrase,
    )
    ssrf_import = await client.post(
        "/api/v1/ai-settings/import-vault",
        headers=admin_headers,
        json={
            "passphrase": vault_passphrase,
            "vault": {
                "vault_version": ssrf_envelope.vault_version,
                "cipher": ssrf_envelope.cipher,
                "kdf": ssrf_envelope.kdf,
                "iterations": ssrf_envelope.iterations,
                "salt_b64": ssrf_envelope.salt_b64,
                "nonce_b64": ssrf_envelope.nonce_b64,
                "ciphertext_b64": ssrf_envelope.ciphertext_b64,
                "exported_at": ssrf_envelope.exported_at,
            },
        },
    )
    assert ssrf_import.status_code == 422

    # 7. Correct passphrase unlocks vault, restores Gemini + keys, and returns masked preview
    unlock_resp = await client.post(
        "/api/v1/ai-settings/import-vault",
        headers=admin_headers,
        json={"passphrase": vault_passphrase, "vault": envelope},
    )
    assert unlock_resp.status_code == 200
    assert vault_secret_key not in unlock_resp.text

    unlocked_body = unlock_resp.json()
    assert unlocked_body["llm_provider"] == "gemini"
    assert unlocked_body["llm_model_name"] == "gemini-2.5-pro"
    assert unlocked_body["llm_temperature"] == 0.15
    assert unlocked_body["llm_has_api_key"] is True
    assert unlocked_body["llm_api_key_masked"] == "AIza...8877"
    assert unlocked_body["embedding_provider"] == "gemini"
    assert unlocked_body["embedding_model_name"] == "text-embedding-004"
    assert unlocked_body["embedding_has_api_key"] is True
    assert unlocked_body["embedding_api_key_masked"] == "AIza...8877"

