"""Integration tests for Phase 6 Collaboration, Threaded Comments, and One-Click Resolution."""

import io
from typing import Any

import docx
from httpx import AsyncClient
from src.domain.enums import UserRole


def _build_contract_docx_bytes() -> bytes:
    """Create a 3-clause DOCX contract with risky provisions for redline resolution testing."""
    doc = docx.Document()
    doc.add_heading("Enterprise SaaS Master Agreement", level=1)

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

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


async def _setup_org_and_analyzed_document(
    client: AsyncClient,
    org_name: str,
    admin_email: str,
) -> tuple[str, str, str, list[dict[str, Any]], list[dict[str, Any]]]:
    """Onboard an org, upload a 3-clause contract, run analysis, and return workspace data."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": org_name,
            "admin_email": admin_email,
            "admin_password": "StrongAdminPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    token: str = reg_data["access_token"]
    admin_user_id: str = reg_data["admin_user"]["id"]

    upload_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "enterprise_agreement.docx",
                _build_contract_docx_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Enterprise SaaS Agreement"},
    )
    assert upload_resp.status_code == 201
    doc_id: str = upload_resp.json()["document_id"]

    analyze_resp = await client.post(
        f"/api/v1/documents/{doc_id}/analyze",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert analyze_resp.status_code == 200
    assert analyze_resp.json()["suggestions_created"] == 3

    ws_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ws_resp.status_code == 200
    ws_data = ws_resp.json()
    clauses: list[dict[str, Any]] = ws_data["clauses"]
    redlines: list[dict[str, Any]] = ws_data["redlines"]
    return token, admin_user_id, doc_id, clauses, redlines


async def test_accept_modify_and_reject_redline_suggestions(
    client: AsyncClient,
) -> None:
    """Verify ACCEPT, MODIFY, and REJECT resolutions update DB and increment clause versions."""
    token, admin_user_id, doc_id, clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Phase 6 Resolution Corp",
            admin_email="admin@phase6-resolution.io",
        )
    )
    assert len(clauses) == 3
    assert len(redlines) == 3

    # 1. ACCEPT first suggestion (Clause #1)
    first_suggestion = redlines[0]
    first_clause = next(c for c in clauses if c["id"] == first_suggestion["clause_id"])
    assert first_clause["version"] == 1
    assert first_suggestion["status"] == "PENDING"

    accept_resp = await client.post(
        f"/api/v1/suggestions/{first_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "action": "ACCEPT",
            "expected_clause_version": 1,
        },
    )
    assert accept_resp.status_code == 200
    accept_data = accept_resp.json()
    assert accept_data["suggestion"]["status"] == "ACCEPTED"
    assert accept_data["suggestion"]["resolved_by"] == admin_user_id
    assert accept_data["suggestion"]["resolved_at"] is not None
    assert accept_data["clause"]["id"] == first_clause["id"]
    assert accept_data["clause"]["current_text"] == first_suggestion["proposed_text"]
    assert accept_data["clause"]["version"] == 2
    assert accept_data["document_version"] == 3

    # 2. MODIFY second suggestion (Clause #2) with custom legal text
    second_suggestion = redlines[1]
    custom_modified_text = (
        "2.1 Mutual fault-based indemnification capped at 2x annual subscription fees."
    )

    # Verify empty modified_text on MODIFY is rejected with 422
    invalid_modify_resp = await client.post(
        f"/api/v1/suggestions/{second_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "action": "MODIFY",
            "expected_clause_version": 1,
            "modified_text": "   ",
        },
    )
    assert invalid_modify_resp.status_code == 422
    assert invalid_modify_resp.json()["error"]["code"] == "INVALID_RESOLUTION"

    modify_resp = await client.post(
        f"/api/v1/suggestions/{second_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "action": "MODIFY",
            "expected_clause_version": 1,
            "modified_text": custom_modified_text,
        },
    )
    assert modify_resp.status_code == 200
    modify_data = modify_resp.json()
    assert modify_data["suggestion"]["status"] == "MODIFIED"
    assert modify_data["suggestion"]["proposed_text"] == custom_modified_text
    assert modify_data["suggestion"]["resolved_by"] == admin_user_id
    assert modify_data["clause"]["current_text"] == custom_modified_text
    assert modify_data["clause"]["version"] == 2
    assert modify_data["document_version"] == 4

    # 3. REJECT third suggestion (Clause #3) -> keeps original clause text, increments version
    third_suggestion = redlines[2]
    third_clause = next(c for c in clauses if c["id"] == third_suggestion["clause_id"])

    reject_resp = await client.post(
        f"/api/v1/suggestions/{third_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "action": "REJECT",
            "expected_clause_version": 1,
        },
    )
    assert reject_resp.status_code == 200
    reject_data = reject_resp.json()
    assert reject_data["suggestion"]["status"] == "REJECTED"
    assert reject_data["suggestion"]["resolved_by"] == admin_user_id
    assert reject_data["clause"]["current_text"] == third_clause["original_text"]
    assert reject_data["clause"]["version"] == 2
    assert reject_data["document_version"] == 5

    # 4. Verify workspace persistence in PostgreSQL
    ws_after_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ws_after_resp.status_code == 200
    ws_after = ws_after_resp.json()
    assert ws_after["version"] == 5
    persisted_clauses = {c["id"]: c for c in ws_after["clauses"]}
    assert (
        persisted_clauses[first_clause["id"]]["current_text"]
        == first_suggestion["proposed_text"]
    )
    assert persisted_clauses[first_clause["id"]]["version"] == 2
    assert (
        persisted_clauses[second_suggestion["clause_id"]]["current_text"]
        == custom_modified_text
    )
    assert (
        persisted_clauses[third_clause["id"]]["current_text"]
        == third_clause["original_text"]
    )


async def test_optimistic_concurrency_prevents_stale_overwrites_409_conflict(
    client: AsyncClient,
) -> None:
    """Verify Phase 6 Acceptance Criteria: stale concurrent edits fail with 409 Conflict."""
    admin_token, _, doc_id, _clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Concurrency Guard Legal LLP",
            admin_email="admin@concurrency-guard.io",
        )
    )

    # Provision a second user (LEGAL_COUNSEL) in the same organization
    counsel_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "counsel@concurrency-guard.io",
            "password": "CounselStrongPassword!2026",
            "role": UserRole.LEGAL_COUNSEL.value,
        },
    )
    assert counsel_create.status_code == 201

    counsel_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "counsel@concurrency-guard.io",
            "password": "CounselStrongPassword!2026",
        },
    )
    assert counsel_login.status_code == 200
    counsel_token: str = counsel_login.json()["access_token"]

    target_suggestion = redlines[0]
    target_clause_id: str = target_suggestion["clause_id"]

    # Both users loaded the clause at version = 1.
    # User 1 (Legal Counsel) accepts the suggestion with expected_clause_version = 1 -> 200 OK
    first_resolve = await client.post(
        f"/api/v1/suggestions/{target_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {counsel_token}"},
        json={
            "action": "ACCEPT",
            "expected_clause_version": 1,
        },
    )
    assert first_resolve.status_code == 200
    assert first_resolve.json()["clause"]["version"] == 2

    # User 2 (Admin) tries to MODIFY the same clause with stale expected_clause_version = 1
    stale_resolve = await client.post(
        f"/api/v1/suggestions/{target_suggestion['id']}/resolve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "action": "MODIFY",
            "expected_clause_version": 1,
            "modified_text": "Stale overwrite attempt that must be blocked!",
        },
    )
    assert stale_resolve.status_code == 409
    assert stale_resolve.json()["error"]["code"] == "CONCURRENCY_CONFLICT"

    # Verify in PostgreSQL that User 1's accepted text was NOT overwritten by User 2's stale write
    ws_check = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ws_check.status_code == 200
    persisted_clause = next(
        c for c in ws_check.json()["clauses"] if c["id"] == target_clause_id
    )
    assert persisted_clause["version"] == 2
    assert persisted_clause["current_text"] == target_suggestion["proposed_text"]


async def test_threaded_clause_comments_and_rbac_enforcement(
    client: AsyncClient,
) -> None:
    """Verify all roles (including VIEWER) can comment, while VIEWER gets 403 on resolve."""
    admin_token, admin_id, doc_id, clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Collaborative Review Partners",
            admin_email="admin@collab-review.io",
        )
    )

    # Create VIEWER user in the same organization
    viewer_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "viewer@collab-review.io",
            "password": "ViewerStrongPassword!2026",
            "role": UserRole.VIEWER.value,
        },
    )
    assert viewer_create.status_code == 201
    viewer_id: str = viewer_create.json()["id"]

    viewer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer@collab-review.io",
            "password": "ViewerStrongPassword!2026",
        },
    )
    assert viewer_login.status_code == 200
    viewer_token: str = viewer_login.json()["access_token"]

    clause_id: str = clauses[0]["id"]

    # 1. ADMIN posts first comment on Clause #1
    comment_1_resp = await client.post(
        f"/api/v1/clauses/{clause_id}/comments",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"body": "We must insist on the 12-month mutual fee cap here."},
    )
    assert comment_1_resp.status_code == 201
    c1_data = comment_1_resp.json()
    assert c1_data["clause_id"] == clause_id
    assert c1_data["author_id"] == admin_id
    assert c1_data["body"] == "We must insist on the 12-month mutual fee cap here."

    # 2. VIEWER posts a threaded reply on Clause #1 (All Roles permitted per Section 7 of DOCS.md)
    comment_2_resp = await client.post(
        f"/api/v1/clauses/{clause_id}/comments",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"body": "Confirmed with Finance: 12-month cap is approved."},
    )
    assert comment_2_resp.status_code == 201
    c2_data = comment_2_resp.json()
    assert c2_data["clause_id"] == clause_id
    assert c2_data["author_id"] == viewer_id
    assert c2_data["body"] == "Confirmed with Finance: 12-month cap is approved."

    # 3. Listing clause comments returns chronological thread
    list_resp = await client.get(
        f"/api/v1/clauses/{clause_id}/comments",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert list_resp.status_code == 200
    thread = list_resp.json()
    assert len(thread) == 2
    assert [c["body"] for c in thread] == [
        "We must insist on the 12-month mutual fee cap here.",
        "Confirmed with Finance: 12-month cap is approved.",
    ]

    # 4. Workspace endpoint hydrates all document comments
    ws_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert ws_resp.status_code == 200
    assert len(ws_resp.json()["comments"]) == 2

    # 5. VIEWER is strictly blocked from resolving suggestions (403 Forbidden)
    viewer_resolve = await client.post(
        f"/api/v1/suggestions/{redlines[0]['id']}/resolve",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"action": "ACCEPT", "expected_clause_version": 1},
    )
    assert viewer_resolve.status_code == 403
    assert viewer_resolve.json()["error"]["code"] == "FORBIDDEN_ROLE"


async def test_collaboration_multi_tenant_isolation_between_orgs(
    client: AsyncClient,
) -> None:
    """Verify Org B cannot resolve suggestions or read/post comments on Org A's clauses (404)."""
    _token_a, _admin_a, _doc_a, clauses_a, redlines_a = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Tenant Isolation Org Alpha",
            admin_email="admin@iso-alpha.io",
        )
    )

    org_b_reg = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Isolation Org Beta",
            "admin_email": "admin@iso-beta.io",
            "admin_password": "BetaStrongPassword!2026",
        },
    )
    assert org_b_reg.status_code == 201
    token_b: str = org_b_reg.json()["access_token"]

    org_a_suggestion_id: str = redlines_a[0]["id"]
    org_a_clause_id: str = clauses_a[0]["id"]

    # Org B attempting to resolve Org A's suggestion gets 404 Not Found
    cross_resolve = await client.post(
        f"/api/v1/suggestions/{org_a_suggestion_id}/resolve",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"action": "ACCEPT", "expected_clause_version": 1},
    )
    assert cross_resolve.status_code == 404
    assert cross_resolve.json()["error"]["code"] == "SUGGESTION_NOT_FOUND"

    # Org B attempting to post a comment on Org A's clause gets 404 Not Found
    cross_comment_post = await client.post(
        f"/api/v1/clauses/{org_a_clause_id}/comments",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"body": "Cross-tenant comment injection attempt"},
    )
    assert cross_comment_post.status_code == 404
    assert cross_comment_post.json()["error"]["code"] == "CLAUSE_NOT_FOUND"

    # Org B attempting to list comments on Org A's clause gets 404 Not Found
    cross_comment_get = await client.get(
        f"/api/v1/clauses/{org_a_clause_id}/comments",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert cross_comment_get.status_code == 404
    assert cross_comment_get.json()["error"]["code"] == "CLAUSE_NOT_FOUND"


async def test_refine_redline_suggestion_copilot_and_audit_trail(
    client: AsyncClient,
) -> None:
    """Verify Inline AI Copilot refines suggestion, logs audit event, and enforces RBAC."""
    token, admin_user_id, doc_id, clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Copilot Refine Corp",
            admin_email="admin@copilot-refine.io",
        )
    )

    suggestion_id = redlines[0]["id"]
    instruction = "Cap aggregate liability at $100,000 and add a 30-day cure period"

    # 1. Admin refines the redline suggestion via AI Copilot
    refine_resp = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/refine",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "instruction": instruction,
            "stance": "balanced",
        },
    )
    assert refine_resp.status_code == 200
    refine_data = refine_resp.json()
    assert refine_data["suggestion"]["id"] == suggestion_id
    assert "$100,000" in refine_data["suggestion"]["proposed_text"]
    assert "30-day" in refine_data["suggestion"]["proposed_text"]
    assert "[AI Copilot Refined:" in refine_data["suggestion"]["rationale"]
    assert len(refine_data["negotiation_talking_point"]) > 0
    assert refine_data["latency_ms"] >= 0

    # 2. Verify workspace reflects updated suggestion proposed text
    ws_resp = await client.get(
        f"/api/v1/documents/{doc_id}/workspace",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ws_resp.status_code == 200
    updated_redlines = ws_resp.json()["redlines"]
    target_rl = next(r for r in updated_redlines if r["id"] == suggestion_id)
    assert "$100,000" in target_rl["proposed_text"]
    assert "[AI Copilot Refined:" in target_rl["rationale"]

    # 3. Verify audit log captures SUGGESTION_REFINED
    audit_resp = await client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    refined_entries = [log for log in audit_logs if log["action"] == "SUGGESTION_REFINED"]
    assert len(refined_entries) >= 1
    latest_entry = refined_entries[-1]
    assert latest_entry["actor_user_id"] == admin_user_id
    assert latest_entry["details"]["suggestion_id"] == suggestion_id
    assert latest_entry["details"]["instruction"] == instruction

    # 4. RBAC: VIEWER cannot refine suggestions (403 Forbidden)
    viewer_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "viewer-copilot@copilot-refine.io",
            "password": "ViewerSecurePass!2026",
            "role": UserRole.VIEWER.value,
        },
    )
    assert viewer_create.status_code == 201

    viewer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer-copilot@copilot-refine.io",
            "password": "ViewerSecurePass!2026",
        },
    )
    assert viewer_login.status_code == 200
    viewer_token: str = viewer_login.json()["access_token"]

    viewer_refine = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/refine",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"instruction": "Make this mutual"},
    )
    assert viewer_refine.status_code == 403
    assert viewer_refine.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # 5. Multi-Tenant Isolation: Tenant Beta cannot refine Tenant Alpha's suggestion (404)
    beta_reg = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Beta Copilot",
            "admin_email": "admin@beta-copilot.io",
            "admin_password": "BetaCopilotPass!2026",
        },
    )
    assert beta_reg.status_code == 201
    token_beta: str = beta_reg.json()["access_token"]

    cross_refine = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/refine",
        headers={"Authorization": f"Bearer {token_beta}"},
        json={"instruction": "Cross tenant tamper attempt"},
    )
    assert cross_refine.status_code == 404
    assert cross_refine.json()["error"]["code"] == "SUGGESTION_NOT_FOUND"


async def test_verify_redline_suggestion_critic_rbac_and_audit_trail(
    client: AsyncClient,
) -> None:
    """Verify POST /suggestions/{id}/verify Critic Guard, RBAC, tenant isolation, & audit log."""
    token, admin_user_id, doc_id, _clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Critic Guard Legal LLP",
            admin_email="admin@critic-guard.io",
        )
    )
    suggestion_id = redlines[0]["id"]
    assert redlines[0]["confidence_score"] >= 70
    assert redlines[0]["verification_status"] in ("VERIFIED", "AUTO_REFINED", "NEEDS_HUMAN_REVIEW")

    # 1. Admin runs on-demand Critic Verification Guard
    verify_resp = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["suggestion"]["id"] == suggestion_id
    assert verify_data["confidence_score"] >= 70
    assert verify_data["verification_status"] in ("VERIFIED", "AUTO_REFINED")
    assert verify_data["policy_alignment_passed"] is True
    assert verify_data["hallucination_free_passed"] is True
    assert verify_data["obligation_preservation_passed"] is True
    assert "Critic" in verify_data["critic_notes"]
    assert verify_data["latency_ms"] >= 0

    # 2. Verify audit log records SUGGESTION_VERIFIED
    audit_resp = await client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert audit_resp.status_code == 200
    verified_entries = [
        log for log in audit_resp.json() if log["action"] == "SUGGESTION_VERIFIED"
    ]
    assert len(verified_entries) >= 1
    assert verified_entries[-1]["actor_user_id"] == admin_user_id
    assert verified_entries[-1]["details"]["suggestion_id"] == suggestion_id

    # 3. RBAC: VIEWER cannot invoke Critic verify (403 Forbidden)
    viewer_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "viewer@critic-guard.io",
            "password": "ViewerCriticPass!2026",
            "role": UserRole.VIEWER.value,
        },
    )
    assert viewer_create.status_code == 201
    viewer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer@critic-guard.io",
            "password": "ViewerCriticPass!2026",
        },
    )
    assert viewer_login.status_code == 200
    viewer_token: str = viewer_login.json()["access_token"]

    viewer_verify = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/verify",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert viewer_verify.status_code == 403
    assert viewer_verify.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # 4. Multi-Tenant Isolation: Tenant Beta receives 404 Not Found
    beta_reg = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Beta Critic",
            "admin_email": "admin@beta-critic.io",
            "admin_password": "BetaCriticPass!2026",
        },
    )
    assert beta_reg.status_code == 201
    token_beta: str = beta_reg.json()["access_token"]

    cross_verify = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/verify",
        headers={"Authorization": f"Bearer {token_beta}"},
    )
    assert cross_verify.status_code == 404
    assert cross_verify.json()["error"]["code"] == "SUGGESTION_NOT_FOUND"


async def test_simulate_counterparty_pushback_rbac_tenant_and_audit_trail(
    client: AsyncClient,
) -> None:
    """Verify POST /suggestions/{id}/simulate-pushback, RBAC, isolation & audit logging."""
    token, admin_user_id, doc_id, _clauses, redlines = (
        await _setup_org_and_analyzed_document(
            client=client,
            org_name="Adversarial Prep Legal LLP",
            admin_email="admin@adversarial-prep.io",
        )
    )
    suggestion_id = redlines[0]["id"]

    # 1. Admin runs Counterparty Pushback Simulation with STRICT stance
    sim_resp = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/simulate-pushback",
        headers={"Authorization": f"Bearer {token}"},
        json={"stance": "strict"},
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["suggestion_id"] == suggestion_id
    assert sim_data["clause_id"] == redlines[0]["clause_id"]
    assert 0 <= sim_data["acceptance_probability"] <= 100
    assert sim_data["pushback_severity"] in ("LOW", "MODERATE", "HIGH", "DEALBREAKER")
    assert len(sim_data["counterparty_persona"]) > 3
    assert len(sim_data["expected_objection"]) > 10
    assert len(sim_data["rebuttal_talking_point"]) > 10
    assert len(sim_data["fallback_compromise_text"]) > 10
    assert sim_data["latency_ms"] >= 0

    # Also test optional empty body invocation defaults cleanly
    sim_default_resp = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/simulate-pushback",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert sim_default_resp.status_code == 200

    # 2. Verify audit trail records PUSHBACK_SIMULATED
    audit_resp = await client.get(
        f"/api/v1/documents/{doc_id}/audit-trail",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert audit_resp.status_code == 200
    pushback_entries = [
        log for log in audit_resp.json() if log["action"] == "PUSHBACK_SIMULATED"
    ]
    assert len(pushback_entries) >= 2
    assert pushback_entries[-1]["actor_user_id"] == admin_user_id
    assert pushback_entries[-1]["details"]["suggestion_id"] == suggestion_id

    # 3. RBAC: VIEWER receives 403 Forbidden
    viewer_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "viewer@adversarial-prep.io",
            "password": "ViewerPushbackPass!2026",
            "role": UserRole.VIEWER.value,
        },
    )
    assert viewer_create.status_code == 201
    viewer_login = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer@adversarial-prep.io",
            "password": "ViewerPushbackPass!2026",
        },
    )
    assert viewer_login.status_code == 200
    viewer_token: str = viewer_login.json()["access_token"]

    viewer_sim = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/simulate-pushback",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"stance": "balanced"},
    )
    assert viewer_sim.status_code == 403
    assert viewer_sim.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # 4. Multi-Tenant Isolation: Tenant Beta receives 404 Not Found
    beta_reg = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Beta Pushback",
            "admin_email": "admin@beta-pushback.io",
            "admin_password": "BetaPushbackPass!2026",
        },
    )
    assert beta_reg.status_code == 201
    token_beta: str = beta_reg.json()["access_token"]

    cross_sim = await client.post(
        f"/api/v1/suggestions/{suggestion_id}/simulate-pushback",
        headers={"Authorization": f"Bearer {token_beta}"},
        json={"stance": "balanced"},
    )
    assert cross_sim.status_code == 404
    assert cross_sim.json()["error"]["code"] == "SUGGESTION_NOT_FOUND"


