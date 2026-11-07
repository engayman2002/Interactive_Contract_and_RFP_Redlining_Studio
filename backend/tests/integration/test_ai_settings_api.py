"""Integration tests for In-App AI Provider Switcher, Key Masking, RBAC, and Live Testing."""

from httpx import AsyncClient
from src.domain.enums import UserRole


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

    provider_ids = {p["provider_id"] for p in body["available_providers"]}
    assert {
        "deterministic",
        "gemini",
        "groq",
        "openai",
        "anthropic",
        "ollama",
        "openai_compatible",
    }.issubset(provider_ids)


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
