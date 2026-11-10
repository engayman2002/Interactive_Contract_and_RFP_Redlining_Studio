"""Integration tests for Phase 3 Playbook CRUD, RBAC, Multi-Tenancy, and Hybrid Search."""

import io

from docx import Document as CreateDocxDocument
from httpx import AsyncClient
from src.domain.enums import UserRole


async def test_playbook_crud_and_hybrid_search_e2e(client: AsyncClient) -> None:
    """Verify end-to-end Playbook CRUD, 1536-d embedding generation, and <150ms hybrid search."""
    # 1. Register Organization A (Admin user)
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Apex Legal Enterprises",
            "admin_email": "admin@apex-legal.io",
            "admin_password": "ApexLegalPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    token: str = reg_resp.json()["access_token"]
    org_id: str = reg_resp.json()["organization"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed 4 distinct Playbook Rules via POST /api/v1/playbooks/rules
    rules_to_seed = [
        {
            "category": "Limitation of Liability",
            "standard_position": (
                "Mutual aggregate liability cap at 12 months of fees paid or payable; "
                "mutual exclusion of consequential, indirect, special, and punitive damages."
            ),
            "fallback_position": (
                "Super-cap up to 24 months of fees for data protection or confidentiality breaches."
            ),
            "unacceptable_triggers": (
                "Uncapped liability for Customer or vendor liability cap below $10,000."
            ),
        },
        {
            "category": "Indemnification",
            "standard_position": (
                "Vendor shall defend, indemnify, and hold harmless Customer from "
                "third-party IP infringement claims."
            ),
            "fallback_position": (
                "Mutual indemnification for third-party bodily injury and tangible property damage."
            ),
            "unacceptable_triggers": (
                "Customer required to indemnify Vendor for Vendor's own gross negligence "
                "or willful misconduct."
            ),
        },
        {
            "category": "Intellectual Property",
            "standard_position": (
                "Customer retains all right, title, and interest in Customer Data and "
                "custom deliverables."
            ),
            "fallback_position": (
                "Vendor retains pre-existing background IP and grants Customer a perpetual "
                "royalty-free license."
            ),
            "unacceptable_triggers": (
                "Assignment of Customer pre-existing intellectual property or confidential "
                "data to Vendor."
            ),
        },
        {
            "category": "Service Level Agreement",
            "standard_position": (
                "99.95% monthly uptime commitment with 10% service credit per 0.1% downtime "
                "and termination right."
            ),
            "fallback_position": "99.9% monthly uptime commitment with service credits.",
            "unacceptable_triggers": (
                "No uptime commitment, best-efforts availability only, or sole remedy waiver."
            ),
        },
    ]

    created_rules: list[dict[str, object]] = []
    for payload in rules_to_seed:
        resp = await client.post("/api/v1/playbooks/rules", headers=headers, json=payload)
        assert resp.status_code == 201
        body = resp.json()
        assert body["org_id"] == org_id
        assert body["category"] == payload["category"]
        assert body["embedding_dim"] == 1536
        created_rules.append(body)

    lol_rule_id = str(created_rules[0]["id"])
    sla_rule_id = str(created_rules[3]["id"])

    # 3. List all rules and test optional ?category= filter
    list_all_resp = await client.get("/api/v1/playbooks/rules", headers=headers)
    assert list_all_resp.status_code == 200
    assert len(list_all_resp.json()) == 4

    list_cat_resp = await client.get(
        "/api/v1/playbooks/rules",
        headers=headers,
        params={"category": "Limitation of Liability"},
    )
    assert list_cat_resp.status_code == 200
    cat_items = list_cat_resp.json()
    assert len(cat_items) == 1
    assert cat_items[0]["id"] == lol_rule_id

    # 4. Get single rule by ID
    get_resp = await client.get(f"/api/v1/playbooks/rules/{lol_rule_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["category"] == "Limitation of Liability"

    # 5. Update rule via PUT /api/v1/playbooks/rules/{rule_id} and verify re-embedding
    updated_payload = {
        "category": "Limitation of Liability",
        "standard_position": (
            "Mutual aggregate liability cap capped at 12 months fees; no consequential "
            "or indirect damages."
        ),
        "fallback_position": (
            "Super-cap of 2x annual contract value for IP and confidentiality breaches."
        ),
        "unacceptable_triggers": "Uncapped liability or asymmetric $500 liability cap.",
    }
    put_resp = await client.put(
        f"/api/v1/playbooks/rules/{lol_rule_id}",
        headers=headers,
        json=updated_payload,
    )
    assert put_resp.status_code == 200
    put_body = put_resp.json()
    assert put_body["id"] == lol_rule_id
    assert put_body["fallback_position"] == updated_payload["fallback_position"]
    assert put_body["embedding_dim"] == 1536

    # 6. Execute Hybrid Search (POST /api/v1/playbooks/search) with a sample LoL clause
    search_resp = await client.post(
        "/api/v1/playbooks/search",
        headers=headers,
        json={
            "query_text": (
                "In no event shall Vendor's aggregate liability exceed $500, and Customer "
                "shall have uncapped liability for consequential and indirect damages."
            ),
            "top_k": 3,
        },
    )
    assert search_resp.status_code == 200
    search_body = search_resp.json()
    assert len(search_body["results"]) == 3
    assert search_body["results"][0]["rule"]["id"] == lol_rule_id
    assert search_body["results"][0]["rule"]["category"] == "Limitation of Liability"
    assert (
        search_body["results"][0]["combined_score"]
        > search_body["results"][1]["combined_score"]
    )
    assert search_body["execution_time_ms"] < 150.0

    # 7. Delete a rule via DELETE /api/v1/playbooks/rules/{rule_id} and verify 404 on subsequent GET
    del_resp = await client.delete(f"/api/v1/playbooks/rules/{sla_rule_id}", headers=headers)
    assert del_resp.status_code == 204

    get_deleted_resp = await client.get(
        f"/api/v1/playbooks/rules/{sla_rule_id}",
        headers=headers,
    )
    assert get_deleted_resp.status_code == 404


async def test_playbook_rbac_enforcement(client: AsyncClient) -> None:
    """Verify ADMIN & LEGAL_COUNSEL can mutate Playbooks; TECHNICAL_LEAD & VIEWER are read-only."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "RBAC Playbook Org",
            "admin_email": "admin@rbac-playbook.io",
            "admin_password": "AdminPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    admin_token: str = reg_resp.json()["access_token"]

    role_tokens: dict[UserRole, str] = {UserRole.ADMIN: admin_token}
    for role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        email = f"{role.value.lower()}@rbac-playbook.io"
        password = f"Pass_{role.value}!2026"
        create_user_resp = await client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"email": email, "password": password, "role": role.value},
        )
        assert create_user_resp.status_code == 201

        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_resp.status_code == 200
        role_tokens[role] = login_resp.json()["access_token"]

    rule_payload = {
        "category": "Data Privacy & GDPR",
        "standard_position": (
            "Customer personal data must remain in EU data centers with AES-256 encryption."
        ),
        "fallback_position": "Standard Contractual Clauses with 48-hour breach notice.",
        "unacceptable_triggers": (
            "Training third-party foundation models on Customer personal data."
        ),
    }

    # 1. ADMIN and LEGAL_COUNSEL can create and update rules
    created_ids: list[str] = []
    for allowed_role in (UserRole.ADMIN, UserRole.LEGAL_COUNSEL):
        post_resp = await client.post(
            "/api/v1/playbooks/rules",
            headers={"Authorization": f"Bearer {role_tokens[allowed_role]}"},
            json=rule_payload,
        )
        assert post_resp.status_code == 201
        rule_id = post_resp.json()["id"]
        created_ids.append(rule_id)

        put_resp = await client.put(
            f"/api/v1/playbooks/rules/{rule_id}",
            headers={"Authorization": f"Bearer {role_tokens[allowed_role]}"},
            json={**rule_payload, "fallback_position": f"Updated by {allowed_role.value}"},
        )
        assert put_resp.status_code == 200

    target_rule_id = created_ids[0]

    # 2. TECHNICAL_LEAD and VIEWER receive 403 Forbidden on POST, PUT, and DELETE
    for read_only_playbook_role in (UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        role_header = {"Authorization": f"Bearer {role_tokens[read_only_playbook_role]}"}

        forbidden_post = await client.post(
            "/api/v1/playbooks/rules",
            headers=role_header,
            json=rule_payload,
        )
        assert forbidden_post.status_code == 403
        assert forbidden_post.json()["error"]["code"] == "FORBIDDEN_ROLE"

        forbidden_put = await client.put(
            f"/api/v1/playbooks/rules/{target_rule_id}",
            headers=role_header,
            json=rule_payload,
        )
        assert forbidden_put.status_code == 403

        forbidden_delete = await client.delete(
            f"/api/v1/playbooks/rules/{target_rule_id}",
            headers=role_header,
        )
        assert forbidden_delete.status_code == 403

        # However, TECHNICAL_LEAD and VIEWER ARE permitted (200 OK) to list, get, and search rules
        allowed_list = await client.get("/api/v1/playbooks/rules", headers=role_header)
        assert allowed_list.status_code == 200
        assert len(allowed_list.json()) == 2

        allowed_get = await client.get(
            f"/api/v1/playbooks/rules/{target_rule_id}",
            headers=role_header,
        )
        assert allowed_get.status_code == 200

        allowed_search = await client.post(
            "/api/v1/playbooks/search",
            headers=role_header,
            json={"query_text": "EU data residency and GDPR breach notice", "top_k": 2},
        )
        assert allowed_search.status_code == 200
        assert len(allowed_search.json()["results"]) == 2

    # 3. LEGAL_COUNSEL can delete a rule (204 No Content)
    lc_del = await client.delete(
        f"/api/v1/playbooks/rules/{created_ids[1]}",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.LEGAL_COUNSEL]}"},
    )
    assert lc_del.status_code == 204


async def test_playbook_multi_tenant_isolation(client: AsyncClient) -> None:
    """Prove Org B cannot read, update, delete, or search Org A's Playbook Rules."""
    org_a_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Alpha Law",
            "admin_email": "admin@alpha-law.io",
            "admin_password": "AlphaLawPassword!2026",
        },
    )
    assert org_a_resp.status_code == 201
    headers_a = {"Authorization": f"Bearer {org_a_resp.json()['access_token']}"}

    org_b_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Beta Corp",
            "admin_email": "admin@beta-corp.io",
            "admin_password": "BetaCorpPassword!2026",
        },
    )
    assert org_b_resp.status_code == 201
    headers_b = {"Authorization": f"Bearer {org_b_resp.json()['access_token']}"}

    # Org A creates a confidential Playbook rule
    rule_a_payload = {
        "category": "Limitation of Liability",
        "standard_position": "Alpha Law confidential cap at 12 months fees.",
        "fallback_position": "Alpha Law super-cap at 24 months fees.",
        "unacceptable_triggers": "Uncapped liability.",
    }
    create_a_resp = await client.post(
        "/api/v1/playbooks/rules",
        headers=headers_a,
        json=rule_a_payload,
    )
    assert create_a_resp.status_code == 201
    rule_a_id: str = create_a_resp.json()["id"]

    # Org B receives 404 Not Found when trying to GET, PUT, or DELETE Org A's rule
    b_get = await client.get(f"/api/v1/playbooks/rules/{rule_a_id}", headers=headers_b)
    assert b_get.status_code == 404

    b_put = await client.put(
        f"/api/v1/playbooks/rules/{rule_a_id}",
        headers=headers_b,
        json={**rule_a_payload, "standard_position": "Tampered by Org B"},
    )
    assert b_put.status_code == 404

    b_delete = await client.delete(f"/api/v1/playbooks/rules/{rule_a_id}", headers=headers_b)
    assert b_delete.status_code == 404

    # Org B receives 0 rules when listing or searching its Playbook knowledge base
    b_list = await client.get("/api/v1/playbooks/rules", headers=headers_b)
    assert b_list.status_code == 200
    assert b_list.json() == []

    b_search = await client.post(
        "/api/v1/playbooks/search",
        headers=headers_b,
        json={"query_text": "Alpha Law confidential cap at 12 months fees", "top_k": 3},
    )
    assert b_search.status_code == 200
    assert b_search.json()["results"] == []

    # Verify Org A's rule remains intact and searchable by Org A
    a_search = await client.post(
        "/api/v1/playbooks/search",
        headers=headers_a,
        json={"query_text": "Alpha Law confidential cap at 12 months fees", "top_k": 3},
    )
    assert a_search.status_code == 200
    assert len(a_search.json()["results"]) == 1
    assert a_search.json()["results"][0]["rule"]["id"] == rule_a_id


def _build_golden_contract_docx_bytes() -> bytes:
    """Create a valid in-memory `.docx` golden contract containing corporate policy clauses."""
    doc = CreateDocxDocument()
    doc.add_heading("ENTERPRISE GOLDEN MASTER SERVICES AGREEMENT", level=1)
    doc.add_paragraph(
        "1. Limitation of Liability. Neither party's aggregate cumulative liability shall exceed "
        "fees paid in the preceding 12 months, and indirect or consequential damages are excluded."
    )
    doc.add_paragraph(
        "2. Data Privacy & AI Safeguards. Vendor shall adhere to GDPR/CCPA safeguards, never train "
        "public foundation models on Customer Data, and provide 24-hour confirmed breach notice."
    )
    doc.add_paragraph(
        "3. Service Level Agreement. Vendor guarantees 99.95% monthly production uptime "
        "availability backed by tiered monthly service credits."
    )
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


async def test_ai_playbook_auto_extractor_text_and_file_e2e(client: AsyncClient) -> None:
    """Verify text & DOCX auto-extraction with auto_save=True, 1536-d indexing, and search."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Golden Standards Legal",
            "admin_email": "admin@golden-legal.io",
            "admin_password": "GoldenLegalPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    admin_headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

    golden_text = (
        "1. Limitation of Liability. Aggregate liability shall not exceed twelve (12) months "
        "of fees paid, with mutual exclusion of consequential damages.\n\n"
        "2. Data Privacy & AI Governance. Vendor shall never use Customer Data to train public "
        "AI foundation models and shall notify Customer within 24 hours of a security breach.\n\n"
        "3. Payment Terms. Customer shall pay undisputed invoices Net 45 from receipt and may "
        "withhold good-faith disputed amounts.\n\n"
        "4. Termination Notice. Termination for cause requires 30 days written notice and cure."
    )

    text_resp = await client.post(
        "/api/v1/playbooks/extract-from-text",
        headers=admin_headers,
        json={
            "reference_text": golden_text,
            "max_rules": 6,
            "auto_save": True,
        },
    )
    assert text_resp.status_code == 200
    text_body = text_resp.json()
    assert text_body["extracted_count"] == 4
    assert text_body["auto_saved"] is True
    assert text_body["audit_action"] == "PLAYBOOK_AUTO_EXTRACTED"
    assert len(text_body["candidates"]) == 4
    assert len(text_body["saved_rules"]) == 4

    extracted_categories = {c["category"] for c in text_body["candidates"]}
    assert "Liability" in extracted_categories
    assert "Data Privacy & AI" in extracted_categories
    assert "Payment Terms" in extracted_categories
    assert "Termination" in extracted_categories

    for cand in text_body["candidates"]:
        assert 50 <= cand["confidence_score"] <= 100
        assert len(cand["unacceptable_triggers"]) >= 1
        assert len(cand["source_clause_excerpt"]) >= 10

    for saved in text_body["saved_rules"]:
        assert saved["embedding_dim"] == 1536

    # Confirm persisted rules appear in GET /rules and are searchable via hybrid search
    list_resp = await client.get("/api/v1/playbooks/rules", headers=admin_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 4

    search_resp = await client.post(
        "/api/v1/playbooks/search",
        headers=admin_headers,
        json={"query_text": "train public foundation models on customer data", "top_k": 2},
    )
    assert search_resp.status_code == 200
    assert len(search_resp.json()["results"]) >= 1
    assert search_resp.json()["results"][0]["rule"]["category"] == "Data Privacy & AI"

    # Upload golden DOCX in preview mode vs auto_save=True
    docx_bytes = _build_golden_contract_docx_bytes()
    file_resp = await client.post(
        "/api/v1/playbooks/extract-from-file",
        headers=admin_headers,
        files={
            "file": (
                "golden_msa.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"auto_save": "true", "max_rules": "4"},
    )
    assert file_resp.status_code == 200
    file_body = file_resp.json()
    assert file_body["extracted_count"] == 3
    assert file_body["auto_saved"] is True
    assert {c["category"] for c in file_body["candidates"]} >= {
        "Liability",
        "Data Privacy & AI",
        "SLA & Uptime",
    }
    assert len(file_body["saved_rules"]) == 3


async def test_ai_playbook_extractor_rbac_preview_vs_autosave(client: AsyncClient) -> None:
    """Verify LEGAL_COUNSEL/TECH_LEAD can preview (auto_save=False) while VIEWER is 403."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "RBAC Extractor Org",
            "admin_email": "admin@rbac-extract.io",
            "admin_password": "RbacExtractPassword!2026",
        },
    )
    assert reg_resp.status_code == 201
    admin_headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

    role_headers: dict[UserRole, dict[str, str]] = {}
    for role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        email = f"{role.value.lower()}@rbac-extract.io"
        create_user = await client.post(
            "/api/v1/users",
            headers=admin_headers,
            json={
                "email": email,
                "password": "RolePassword!2026",
                "role": role.value,
            },
        )
        assert create_user.status_code == 201
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "RolePassword!2026"},
        )
        assert login.status_code == 200
        role_headers[role] = {"Authorization": f"Bearer {login.json()['access_token']}"}

    sample_text = (
        "1. SLA & Uptime. Vendor commits to 99.9% monthly production uptime availability "
        "with tiered monthly service credits."
    )

    # LEGAL_COUNSEL and TECHNICAL_LEAD can extract in preview mode (auto_save=False)
    for role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD):
        preview_resp = await client.post(
            "/api/v1/playbooks/extract-from-text",
            headers=role_headers[role],
            json={"reference_text": sample_text, "max_rules": 4, "auto_save": False},
        )
        assert preview_resp.status_code == 200
        preview_body = preview_resp.json()
        assert preview_body["auto_saved"] is False
        assert preview_body["saved_rules"] == []
        assert preview_body["extracted_count"] == 1

        # auto_save=True is strictly gated to ADMIN
        forbidden_save = await client.post(
            "/api/v1/playbooks/extract-from-text",
            headers=role_headers[role],
            json={"reference_text": sample_text, "max_rules": 4, "auto_save": True},
        )
        assert forbidden_save.status_code == 403

    # VIEWER is 403 Forbidden for both preview text extraction and file extraction
    viewer_text = await client.post(
        "/api/v1/playbooks/extract-from-text",
        headers=role_headers[UserRole.VIEWER],
        json={"reference_text": sample_text, "max_rules": 4, "auto_save": False},
    )
    assert viewer_text.status_code == 403

    docx_bytes = _build_golden_contract_docx_bytes()
    viewer_file = await client.post(
        "/api/v1/playbooks/extract-from-file",
        headers=role_headers[UserRole.VIEWER],
        files={"file": ("golden.docx", docx_bytes, "application/octet-stream")},
        data={"auto_save": "false"},
    )
    assert viewer_file.status_code == 403

    # Confirm preview calls did not persist any rules in organization knowledge base
    list_after = await client.get("/api/v1/playbooks/rules", headers=admin_headers)
    assert list_after.status_code == 200
    assert list_after.json() == []
