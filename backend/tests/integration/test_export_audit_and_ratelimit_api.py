"""Integration tests for Phase 7 DOCX Export, Immutable Audit Trail, and Rate Limiting."""

import io
import zipfile
from typing import Any

import pytest
from docx import Document as CreateDocxDocument
from docx import Document as LoadDocxDocument
from httpx import AsyncClient
from src.infrastructure.config import get_settings
from src.presentation.middleware import reset_rate_limiter_state


def _build_contract_docx_bytes() -> bytes:
    """Create an in-memory `.docx` contract with non-compliant liability language."""
    doc = CreateDocxDocument()
    doc.add_heading("Enterprise Master Services Agreement", level=1)
    doc.add_heading("Section 1. Limitation of Liability", level=2)
    doc.add_paragraph(
        "Vendor liability shall be unlimited and include all indirect consequential damages."
    )
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


async def _onboard_tenant(
    client: AsyncClient,
    org_name: str,
    admin_email: str,
) -> dict[str, Any]:
    resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": org_name,
            "admin_email": admin_email,
            "admin_password": "StrongAdminPassword!2026",
        },
    )
    assert resp.status_code == 201
    data: dict[str, Any] = resp.json()
    return data


async def _create_and_login_role(
    client: AsyncClient,
    admin_token: str,
    email: str,
    role: str,
) -> str:
    password = "RoleUserPassword!2026"  # noqa: S105
    create_resp = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": email, "password": password, "role": role},
    )
    assert create_resp.status_code == 201
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    token: str = login_resp.json()["access_token"]
    return token


@pytest.mark.asyncio
async def test_end_to_end_export_track_changes_and_clean_docx_plus_immutable_audit_trail(
    client: AsyncClient,
) -> None:
    """Verify track_changes and clean `.docx` export, immutable audit trail, and isolation."""
    async_client = client
    reset_rate_limiter_state()
    org_a = await _onboard_tenant(async_client, "Org A Export Studio", "admin@orga-export.io")
    org_b = await _onboard_tenant(async_client, "Org B Competitor", "admin@orgb-export.io")

    admin_a_token: str = org_a["access_token"]
    admin_b_token: str = org_b["access_token"]

    counsel_a_token = await _create_and_login_role(
        async_client, admin_a_token, "counsel@orga-export.io", "LEGAL_COUNSEL"
    )
    viewer_a_token = await _create_and_login_role(
        async_client, admin_a_token, "viewer@orga-export.io", "VIEWER"
    )

    # 1. Seed a playbook rule in Org A
    rule_resp = await async_client.post(
        "/api/v1/playbooks/rules",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
        json={
            "category": "Limitation of Liability",
            "standard_position": (
                "Total aggregate liability of either party shall be capped at "
                "twelve (12) months of fees paid, excluding indirect or consequential damages."
            ),
            "fallback_position": "Mutual super-cap at 2x annual contract value.",
            "unacceptable_triggers": "unlimited, indirect, consequential damages",
        },
    )
    assert rule_resp.status_code == 201

    # 2. Upload contract in Org A (records DOCUMENT_INGESTED)
    upload_resp = await async_client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
        files={
            "file": (
                "enterprise_msa.docx",
                _build_contract_docx_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Enterprise Master Services Agreement"},
    )
    assert upload_resp.status_code == 201
    doc_id: str = upload_resp.json()["document_id"]

    # 3. Analyze clauses (records DOCUMENT_ANALYZED)
    analyze_resp = await async_client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
    )
    assert analyze_resp.status_code == 200

    workspace_resp = await async_client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
    )
    assert workspace_resp.status_code == 200
    ws_data = workspace_resp.json()
    suggestion = ws_data["redlines"][0]
    clause_id: str = suggestion["clause_id"]

    # 4. Accept suggestion (records SUGGESTION_ACCEPTED)
    resolve_resp = await async_client.post(
        f"/api/v1/suggestions/{suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
        json={
            "action": "ACCEPT",
            "expected_clause_version": 1,
        },
    )
    assert resolve_resp.status_code == 200

    # 5. Post a threaded comment as VIEWER (records COMMENT_CREATED)
    comment_resp = await async_client.post(
        f"/api/v1/clauses/{clause_id}/comments",
        headers={"Authorization": f"Bearer {viewer_a_token}"},
        json={"body": "Confirmed liability cap aligns with Q4 risk committee guidelines."},
    )
    assert comment_resp.status_code == 201

    # 6. Export in track_changes mode (records DOCUMENT_EXPORTED)
    export_tc_resp = await async_client.get(
        f"/api/v1/documents/{doc_id}/export?mode=track_changes",
        headers={"Authorization": f"Bearer {counsel_a_token}"},
    )
    assert export_tc_resp.status_code == 200
    assert (
        export_tc_resp.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert "track_changes.docx" in export_tc_resp.headers["content-disposition"]

    tc_bytes = export_tc_resp.content
    assert tc_bytes.startswith(b"PK\x03\x04")
    LoadDocxDocument(io.BytesIO(tc_bytes))
    with zipfile.ZipFile(io.BytesIO(tc_bytes), mode="r") as archive:
        tc_xml = archive.read("word/document.xml").decode("utf-8")
    assert "<w:del " in tc_xml
    assert "<w:ins " in tc_xml
    assert "Confirmed liability cap aligns with Q4 risk committee guidelines." in tc_xml

    # 7. Export in clean mode as VIEWER (records second DOCUMENT_EXPORTED)
    export_clean_resp = await async_client.get(
        f"/api/v1/documents/{doc_id}/export?mode=clean",
        headers={"Authorization": f"Bearer {viewer_a_token}"},
    )
    assert export_clean_resp.status_code == 200
    assert "clean.docx" in export_clean_resp.headers["content-disposition"]

    clean_bytes = export_clean_resp.content
    with zipfile.ZipFile(io.BytesIO(clean_bytes), mode="r") as archive:
        clean_xml = archive.read("word/document.xml").decode("utf-8")
    assert "<w:del " not in clean_xml
    assert "<w:ins " not in clean_xml
    assert "twelve (12) months of fees paid" in clean_xml

    # 8. Verify immutable compliance audit trail
    audit_resp = await async_client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers={"Authorization": f"Bearer {viewer_a_token}"},
    )
    assert audit_resp.status_code == 200
    audit_entries = audit_resp.json()
    recorded_actions = [entry["action"] for entry in audit_entries]
    assert recorded_actions == [
        "DOCUMENT_INGESTED",
        "DOCUMENT_ANALYZED",
        "SUGGESTION_ACCEPTED",
        "COMMENT_CREATED",
        "DOCUMENT_EXPORTED",
        "DOCUMENT_EXPORTED",
    ]
    assert audit_entries[-2]["details"]["mode"] == "track_changes"
    assert audit_entries[-1]["details"]["mode"] == "clean"
    assert audit_entries[-1]["actor_role"] == "VIEWER"

    # 9. Verify workspace endpoint also embeds audit_logs
    ws_final = await async_client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {viewer_a_token}"},
    )
    assert ws_final.status_code == 200
    assert len(ws_final.json()["audit_logs"]) == 6

    # 10. Multi-tenant isolation: Org B cannot export or read Org A's audit trail
    cross_export = await async_client.get(
        f"/api/v1/documents/{doc_id}/export?mode=track_changes",
        headers={"Authorization": f"Bearer {admin_b_token}"},
    )
    assert cross_export.status_code == 404

    cross_audit = await async_client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers={"Authorization": f"Bearer {admin_b_token}"},
    )
    assert cross_audit.status_code == 404


@pytest.mark.asyncio
async def test_sliding_window_rate_limiting_middleware_enforces_429_and_retry_after(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify sliding-window rate limiter returns 429 Too Many Requests with Retry-After header."""
    async_client = client
    settings = get_settings()
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(settings, "RATE_LIMIT_REQUESTS_PER_MINUTE", 3)
    reset_rate_limiter_state()

    headers = {"X-Client-ID": "phase7-ratelimit-test-client"}
    try:
        for expected_remaining in (2, 1, 0):
            resp = await async_client.get("/api/v1/documents", headers=headers)
            # Unauthenticated returns 401 from endpoint dependency, but passes through middleware
            assert resp.status_code == 401
            assert resp.headers["x-ratelimit-limit"] == "3"
            assert resp.headers["x-ratelimit-remaining"] == str(expected_remaining)

        throttled_resp = await async_client.get("/api/v1/documents", headers=headers)
        assert throttled_resp.status_code == 429
        assert "retry-after" in throttled_resp.headers
        assert int(throttled_resp.headers["retry-after"]) >= 1
        assert throttled_resp.headers["x-ratelimit-remaining"] == "0"
        assert throttled_resp.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    finally:
        reset_rate_limiter_state()


@pytest.mark.asyncio
async def test_workspace_session_bootstrap_and_export_download_endpoint(
    client: AsyncClient,
) -> None:
    """Verify idempotent `/auth/workspace-session` and `/export/download` binary export."""
    reset_rate_limiter_state()

    # 1. First workspace-session call provisions org + ADMIN user and issues signed JWT
    boot1 = await client.post("/api/v1/auth/workspace-session")
    assert boot1.status_code == 200
    data1 = boot1.json()
    assert data1["token_type"] == "bearer"
    assert data1["access_token"]
    assert data1["user"]["email"] == "counsel@redlinestudio.local"
    assert data1["user"]["role"] == "ADMIN"

    # 2. Second concurrent/repeat call is idempotent and returns a valid JWT for the same user
    boot2 = await client.post("/api/v1/auth/workspace-session")
    assert boot2.status_code == 200
    data2 = boot2.json()
    assert data2["user"]["id"] == data1["user"]["id"]
    token: str = data2["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Bootstrapped JWT authenticates cleanly against documents and playbooks routes
    docs_resp = await client.get("/api/v1/documents", headers=headers)
    assert docs_resp.status_code == 200
    rules_resp = await client.get("/api/v1/playbooks/rules", headers=headers)
    assert rules_resp.status_code == 200

    # 4. Upload, analyze, resolve, and download via `/export/download?export_type=...`
    upload_resp = await client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={
            "file": (
                "live_bootstrap_msa.docx",
                _build_contract_docx_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Live Bootstrap MSA"},
    )
    assert upload_resp.status_code == 201
    doc_id: str = upload_resp.json()["document_id"]

    analyze_resp = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers=headers,
    )
    assert analyze_resp.status_code == 200

    ws_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers=headers,
    )
    assert ws_resp.status_code == 200
    suggestions = ws_resp.json()["redlines"]
    if suggestions:
        resolve_resp = await client.post(
            f"/api/v1/suggestions/{suggestions[0]['id']}/resolve",
            headers=headers,
            json={"action": "ACCEPT", "expected_clause_version": 1},
        )
        assert resolve_resp.status_code == 200

    dl_tc = await client.get(
        f"/api/v1/documents/{doc_id}/export/download?export_type=TRACK_CHANGES",
        headers=headers,
    )
    assert dl_tc.status_code == 200
    assert (
        dl_tc.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert dl_tc.content.startswith(b"PK\x03\x04")

    dl_clean = await client.get(
        f"/api/v1/documents/{doc_id}/export/download?export_type=CLEAN",
        headers=headers,
    )
    assert dl_clean.status_code == 200
    assert dl_clean.content.startswith(b"PK\x03\x04")
    with zipfile.ZipFile(io.BytesIO(dl_clean.content), mode="r") as archive:
        clean_xml = archive.read("word/document.xml").decode("utf-8")
    assert "<w:del " not in clean_xml
    assert "<w:ins " not in clean_xml
