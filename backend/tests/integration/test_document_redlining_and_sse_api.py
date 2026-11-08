"""Integration tests for Phase 4 Document AI Redlining, Workspace Hydration, and SSE Stream."""

import io
import json
from typing import Any

import docx
from httpx import AsyncClient
from src.domain.enums import UserRole


def _build_sample_contract_docx_bytes() -> bytes:
    """Create an in-memory DOCX contract with 3 risky clauses and 1 compliant clause."""
    doc = docx.Document()
    doc.add_heading("Master Cloud Services Agreement", level=1)

    doc.add_heading("1. Limitation of Liability", level=2)
    doc.add_paragraph(
        "1.1 In no event shall Vendor's aggregate liability exceed $500, and Customer "
        "shall have uncapped liability for all consequential and indirect damages."
    )

    doc.add_heading("2. Indemnification", level=2)
    doc.add_paragraph(
        "2.1 Customer shall defend, indemnify, and hold harmless Vendor against all claims "
        "including those arising from Vendor's own negligence without limit."
    )

    doc.add_heading("3. Service Level Agreement", level=2)
    doc.add_paragraph(
        "3.1 Vendor shall provide the cloud platform on a best-efforts basis with sole "
        "remedy waiver and no service credits for downtime."
    )

    doc.add_heading("4. Compliance with Laws", level=2)
    doc.add_paragraph(
        "4.1 Each party shall comply with all applicable federal, state, and local laws "
        "in the performance of its obligations under this Agreement."
    )

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _parse_sse_stream(raw_sse_text: str) -> list[tuple[str, dict[str, Any]]]:
    """Parse raw `text/event-stream` text into `(event_name, parsed_json_data)` tuples."""
    events: list[tuple[str, dict[str, Any]]] = []
    blocks = [b.strip() for b in raw_sse_text.strip().split("\n\n") if b.strip()]
    for block in blocks:
        event_name = "message"
        data_str = ""
        for line in block.splitlines():
            if line.startswith("event:"):
                event_name = line.removeprefix("event:").strip()
            elif line.startswith("data:"):
                data_str = line.removeprefix("data:").strip()
        if data_str:
            events.append((event_name, json.loads(data_str)))
    return events


async def test_document_analyze_workspace_redline_hydration_and_sse_stream(
    client: AsyncClient,
) -> None:
    """Verify `/analyze`, workspace `redlines` hydration, idempotency, and `/stream` SSE events."""
    # 1. Register Organization A
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Vanguard Legal AI",
            "admin_email": "admin@vanguard-ai.io",
            "admin_password": "VanguardPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    token: str = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed Playbook Rules
    playbook_rules = [
        {
            "category": "Limitation of Liability",
            "standard_position": (
                "Each party's aggregate cumulative liability shall not exceed twelve (12) months "
                "of fees paid or payable; mutual waiver of consequential and indirect damages."
            ),
            "fallback_position": "Super-cap of 24 months of fees for confidentiality breaches.",
            "unacceptable_triggers": (
                "Uncapped liability for Customer or vendor liability cap below $10,000."
            ),
        },
        {
            "category": "Indemnification",
            "standard_position": (
                "Vendor shall defend, indemnify, and hold harmless Customer from third-party "
                "intellectual property infringement claims."
            ),
            "fallback_position": "Mutual indemnification for bodily injury and property damage.",
            "unacceptable_triggers": (
                "Customer required to indemnify Vendor for Vendor's own negligence."
            ),
        },
        {
            "category": "Service Level Agreement",
            "standard_position": (
                "99.95% monthly uptime commitment with 10% service credit per 0.1% downtime."
            ),
            "fallback_position": "99.9% monthly uptime commitment with service credits.",
            "unacceptable_triggers": "Best-efforts availability only or sole remedy waiver.",
        },
    ]

    rule_ids_by_cat: dict[str, str] = {}
    for rule_payload in playbook_rules:
        r_resp = await client.post(
            "/api/v1/playbooks/rules",
            headers=headers,
            json=rule_payload,
        )
        assert r_resp.status_code == 201
        rule_ids_by_cat[rule_payload["category"]] = r_resp.json()["id"]

    # 3. Upload a 4-clause DOCX contract
    docx_bytes = _build_sample_contract_docx_bytes()
    upload_resp = await client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={
            "file": (
                "vendor_msa.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Vendor Cloud MSA"},
    )
    assert upload_resp.status_code == 201
    doc_id: str = upload_resp.json()["document_id"]
    assert upload_resp.json()["clause_count"] == 4

    # 4. Trigger batch AI redline analysis (`POST /api/v1/documents/{doc_id}/analyze`)
    analyze_resp = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers=headers,
    )
    assert analyze_resp.status_code == 200
    summary = analyze_resp.json()
    assert summary["document_id"] == doc_id
    assert summary["status"] == "ANALYZED"
    assert summary["total_clauses"] == 4
    assert summary["suggestions_created"] == 3
    assert summary["compliant_count"] == 1
    assert summary["critical_count"] >= 2
    assert summary["execution_time_ms"] < 25000.0

    # 5. Fetch workspace (`GET /api/v1/documents/{doc_id}/workspace`) and verify hydrated redlines
    ws_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers=headers,
    )
    assert ws_resp.status_code == 200
    ws_body = ws_resp.json()
    assert ws_body["status"] == "ANALYZED"
    assert len(ws_body["clauses"]) == 4
    assert len(ws_body["redlines"]) == 3

    clause_ids = {c["id"] for c in ws_body["clauses"]}
    for redline in ws_body["redlines"]:
        assert redline["clause_id"] in clause_ids
        assert redline["matched_rule_id"] in set(rule_ids_by_cat.values())
        assert redline["status"] == "PENDING"
        assert redline["risk"] in ("CRITICAL", "HIGH", "MEDIUM")
        assert len(redline["proposed_text"]) > 10
        assert "Talking Point:" in redline["rationale"]

    # 6. Re-run `/analyze` to verify idempotency (old PENDING suggestions replaced cleanly)
    reanalyze_resp = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers=headers,
    )
    assert reanalyze_resp.status_code == 200
    ws_after = await client.get(f"/api/v1/documents/{doc_id}/workspace", headers=headers)
    assert len(ws_after.json()["redlines"]) == 3

    # 7. Stream real-time SSE audit progress (`GET /api/v1/documents/{doc_id}/stream`)
    stream_resp = await client.get(
        f"/api/v1/documents/{doc_id}/stream",
        headers=headers,
    )
    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers["content-type"]

    sse_events = _parse_sse_stream(stream_resp.text)
    assert len(sse_events) == 5  # 4 `clause_audited` events + 1 `completed` event

    clause_events = sse_events[:4]
    for idx, (event_name, event_data) in enumerate(clause_events):
        assert event_name == "clause_audited"
        assert event_data["event_type"] == "clause_audited"
        assert event_data["document_id"] == doc_id
        assert event_data["clause_index"] == idx
        assert event_data["completed_count"] == idx + 1
        assert event_data["total_count"] == 4

    final_event_name, final_event_data = sse_events[-1]
    assert final_event_name == "completed"
    assert final_event_data["event_type"] == "completed"
    assert final_event_data["document_id"] == doc_id
    assert final_event_data["completed_count"] == 4
    assert final_event_data["total_count"] == 4
    assert final_event_data["status"] == "ANALYZED"


async def test_document_redlining_rbac_and_multi_tenant_isolation(
    client: AsyncClient,
) -> None:
    """Verify RBAC on `/analyze` & `/stream` and strict isolation between Org A and Org B."""
    # Register Org A
    org_a_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Org Alpha Redline",
            "admin_email": "admin@alpha-redline.io",
            "admin_password": "AlphaPassword!2026",
        },
    )
    assert org_a_resp.status_code == 201
    admin_a_token: str = org_a_resp.json()["access_token"]
    headers_admin_a = {"Authorization": f"Bearer {admin_a_token}"}

    # Provision LEGAL_COUNSEL, TECHNICAL_LEAD, and VIEWER in Org A
    role_tokens: dict[UserRole, str] = {UserRole.ADMIN: admin_a_token}
    for role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        email = f"{role.value.lower()}@alpha-redline.io"
        password = f"RolePass_{role.value}!2026"
        c_resp = await client.post(
            "/api/v1/users",
            headers=headers_admin_a,
            json={"email": email, "password": password, "role": role.value},
        )
        assert c_resp.status_code == 201
        l_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert l_resp.status_code == 200
        role_tokens[role] = l_resp.json()["access_token"]

    # Register Org B
    org_b_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Org Beta Competitor",
            "admin_email": "admin@beta-competitor.io",
            "admin_password": "BetaPassword!2026",
        },
    )
    assert org_b_resp.status_code == 201
    headers_admin_b = {"Authorization": f"Bearer {org_b_resp.json()['access_token']}"}

    # Org A uploads a contract
    docx_bytes = _build_sample_contract_docx_bytes()
    upload_resp = await client.post(
        "/api/v1/documents/upload",
        headers=headers_admin_a,
        files={
            "file": (
                "confidential_rfp.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert upload_resp.status_code == 201
    doc_a_id: str = upload_resp.json()["document_id"]

    # 1. VIEWER in Org A is blocked (403 Forbidden) from triggering POST /analyze
    viewer_headers = {"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"}
    viewer_analyze = await client.post(
        f"/api/v1/documents/{doc_a_id}/analyze",
        headers=viewer_headers,
    )
    assert viewer_analyze.status_code == 403
    assert viewer_analyze.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # 2. LEGAL_COUNSEL and TECHNICAL_LEAD in Org A are permitted (200 OK) to trigger POST /analyze
    for allowed_role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD):
        ok_resp = await client.post(
            f"/api/v1/documents/{doc_a_id}/analyze",
            headers={"Authorization": f"Bearer {role_tokens[allowed_role]}"},
        )
        assert ok_resp.status_code == 200

    # 3. VIEWER in Org A CAN read GET /stream and GET /workspace (200 OK)
    viewer_stream = await client.get(
        f"/api/v1/documents/{doc_a_id}/stream",
        headers=viewer_headers,
    )
    assert viewer_stream.status_code == 200
    assert len(_parse_sse_stream(viewer_stream.text)) == 5

    viewer_ws = await client.get(
        f"/api/v1/documents/{doc_a_id}/workspace",
        headers=viewer_headers,
    )
    assert viewer_ws.status_code == 200
    assert len(viewer_ws.json()["redlines"]) == 3

    # 4. Org B Admin receives 404 Not Found on Org A's /analyze, /stream, and /workspace
    b_analyze = await client.post(
        f"/api/v1/documents/{doc_a_id}/analyze",
        headers=headers_admin_b,
    )
    assert b_analyze.status_code == 404

    b_stream = await client.get(
        f"/api/v1/documents/{doc_a_id}/stream",
        headers=headers_admin_b,
    )
    assert b_stream.status_code == 404

    b_ws = await client.get(
        f"/api/v1/documents/{doc_a_id}/workspace",
        headers=headers_admin_b,
    )
    assert b_ws.status_code == 404


async def test_document_analyze_with_negotiation_stances(
    client: AsyncClient,
) -> None:
    """Verify that /analyze and /stream respect NegotiationStance payload and query parameters."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Stance Tech Legal",
            "admin_email": "admin@stancetech.io",
            "admin_password": "StancePassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    token: str = reg_resp.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token}"}

    # 1. Ingest sample agreement
    upload_resp = await client.post(
        "/api/v1/documents/upload",
        files={
            "file": (
                "msa_stance.docx",
                _build_sample_contract_docx_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "MSA Negotiation Stance Test"},
        headers=headers_admin,
    )
    assert upload_resp.status_code == 201
    doc_id = upload_resp.json()["document_id"]

    # 2. Analyze without request body -> defaults to balanced
    resp_default = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers=headers_admin,
    )
    assert resp_default.status_code == 200
    summary_default = resp_default.json()
    assert summary_default["stance"] == "balanced"

    # 3. Analyze with commercial stance payload
    resp_comm = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        json={"stance": "commercial"},
        headers=headers_admin,
    )
    assert resp_comm.status_code == 200
    summary_comm = resp_comm.json()
    assert summary_comm["stance"] == "commercial"

    # 4. Analyze with strict stance payload
    resp_strict = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        json={"stance": "strict"},
        headers=headers_admin,
    )
    assert resp_strict.status_code == 200
    summary_strict = resp_strict.json()
    assert summary_strict["stance"] == "strict"

    # 5. Stream with commercial stance query parameter
    stream_resp = await client.get(
        f"/api/v1/documents/{doc_id}/stream?stance=commercial",
        headers=headers_admin,
    )
    assert stream_resp.status_code == 200
    events = _parse_sse_stream(stream_resp.text)
    assert len(events) >= 1
    # Verify completed event contains stance == commercial
    completed_events = [data for name, data in events if name == "completed"]
    assert len(completed_events) == 1
    assert completed_events[0].get("stance") == "commercial"


def _build_contradictory_contract_docx_bytes() -> bytes:
    """Create an in-memory DOCX with contradictions, broken references, and undefined terms."""
    doc = docx.Document()
    doc.add_heading("Master Cloud Services Agreement", level=1)

    doc.add_heading("1. Limitation of Liability", level=2)
    doc.add_paragraph(
        "1.1 Vendor aggregate liability under this Agreement shall not exceed $500, "
        "and Customer shall have uncapped liability."
    )

    doc.add_heading("2. Indemnification", level=2)
    doc.add_paragraph(
        "2.1 Vendor shall defend, indemnify, and hold harmless Customer without limitation "
        "or aggregate monetary cap for all third-party intellectual property claims."
    )

    doc.add_heading("3. Termination & Reference", level=2)
    doc.add_paragraph(
        "3.1 Either party may terminate this Agreement immediately pursuant to Section 99.4, "
        "provided Customer Confidential Data is deleted within 10 days."
    )

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


async def test_cross_clause_contradiction_and_broken_reference_radar(
    client: AsyncClient,
) -> None:
    """Verify cross-clause integrity check, RBAC, tenant isolation, and audit trail logging."""
    # 1. Register Organization A
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Radar Legal Corp",
            "admin_email": "admin@radar-legal.io",
            "admin_password": "RadarPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    token_admin: str = reg_resp.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # 2. Provision a VIEWER user in Organization A
    viewer_resp = await client.post(
        "/api/v1/users",
        json={
            "email": "viewer@radar-legal.io",
            "password": "ViewerPassword!2026",
            "role": UserRole.VIEWER.value,
        },
        headers=headers_admin,
    )
    assert viewer_resp.status_code == 201

    viewer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer@radar-legal.io",
            "password": "ViewerPassword!2026",
        },
    )
    assert viewer_login.status_code == 200
    token_viewer: str = viewer_login.json()["access_token"]
    headers_viewer = {"Authorization": f"Bearer {token_viewer}"}

    # 3. Register Organization B (for multi-tenant isolation testing)
    reg_b_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Competitor Org B",
            "admin_email": "admin@competitor-b.io",
            "admin_password": "CompetitorPassword!2026",
        },
    )
    assert reg_b_resp.status_code == 201
    token_b: str = reg_b_resp.json()["access_token"]
    headers_org_b = {"Authorization": f"Bearer {token_b}"}

    # 4. Upload document with contradictions and broken references in Org A
    upload_resp = await client.post(
        "/api/v1/documents/upload",
        files={
            "file": (
                "contradictory_msa.docx",
                _build_contradictory_contract_docx_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Contradictory Cloud Agreement"},
        headers=headers_admin,
    )
    assert upload_resp.status_code == 201
    doc_id = upload_resp.json()["document_id"]

    # 5. RBAC check: VIEWER role cannot trigger cross-clause check (requires MUTATE_DOCUMENT)
    viewer_check_resp = await client.post(
        f"/api/v1/documents/{doc_id}/cross-clause-check",
        headers=headers_viewer,
    )
    assert viewer_check_resp.status_code == 403

    # 6. Multi-tenant isolation: Org B admin cannot access Org A's document
    org_b_check_resp = await client.post(
        f"/api/v1/documents/{doc_id}/cross-clause-check",
        headers=headers_org_b,
    )
    assert org_b_check_resp.status_code == 404

    # 7. Authorized ADMIN execution: Run Cross-Clause Radar
    check_resp = await client.post(
        f"/api/v1/documents/{doc_id}/cross-clause-check",
        headers=headers_admin,
    )
    assert check_resp.status_code == 200
    report = check_resp.json()

    assert report["document_id"] == doc_id
    assert report["total_findings"] >= 2
    assert report["contradiction_count"] >= 1
    assert report["broken_reference_count"] >= 1
    assert report["undefined_term_count"] >= 1
    assert 0 <= report["integrity_score"] < 100
    assert len(report["findings"]) == report["total_findings"]

    first_finding = report["findings"][0]
    assert "id" in first_finding
    assert "issue_type" in first_finding
    assert "severity" in first_finding
    assert "source_clause_id" in first_finding
    assert "source_clause_index" in first_finding
    assert "title" in first_finding
    assert "description" in first_finding
    assert "recommended_fix" in first_finding

    # 8. Verify immutable audit trail records CROSS_CLAUSE_CHECKED
    audit_resp = await client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers=headers_admin,
    )
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    assert any(log["action"] == "CROSS_CLAUSE_CHECKED" for log in audit_logs)


