"""Integration tests for Phase 2 Document Upload, Ingestion, RBAC, and Workspace API."""

from httpx import AsyncClient
from src.domain.enums import UserRole

from tests.unit.test_parsers_and_segmenter import (
    build_30_page_contract_docx_bytes,
    build_multi_page_contract_pdf_bytes,
)


async def _register_org_and_get_token(
    client: AsyncClient,
    org_name: str,
    admin_email: str,
) -> tuple[str, str]:
    resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": org_name,
            "admin_email": admin_email,
            "admin_password": "StrongAdminPassword!2026",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    return data["organization"]["id"], data["access_token"]


async def test_upload_docx_and_pdf_and_retrieve_ordered_workspace(
    client: AsyncClient,
) -> None:
    """Test uploading a 120-clause DOCX and multi-page PDF and retrieving ordered clauses."""
    org_id, admin_token = await _register_org_and_get_token(
        client,
        org_name="Apex Legal Partners",
        admin_email="admin@apexlegal.io",
    )

    # 1. Upload 30-page equivalent DOCX (120 clauses across 15 sections)
    docx_bytes = build_30_page_contract_docx_bytes(num_sections=15, clauses_per_section=8)
    upload_docx_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={
            "file": (
                "Global_MSA_2026.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"title": "Global Enterprise MSA 2026"},
    )
    assert upload_docx_resp.status_code == 201
    docx_meta = upload_docx_resp.json()
    assert docx_meta["org_id"] == org_id
    assert docx_meta["title"] == "Global Enterprise MSA 2026"
    assert docx_meta["status"] == "READY"
    assert docx_meta["version"] == 1
    assert docx_meta["clause_count"] == 120
    docx_doc_id: str = docx_meta["document_id"]

    # 2. Fetch workspace and verify all 120 clauses are returned in exact sequential order 0..119
    workspace_resp = await client.get(
        f"/api/v1/documents/{docx_doc_id}/workspace",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert workspace_resp.status_code == 200
    workspace = workspace_resp.json()
    assert workspace["document_id"] == docx_doc_id
    assert workspace["status"] == "READY"
    assert len(workspace["clauses"]) == 120
    assert [c["clause_index"] for c in workspace["clauses"]] == list(range(120))
    assert workspace["clauses"][0]["heading"] == "ARTICLE 1 - DEFINITIONS AND INTERPRETATION"
    assert workspace["clauses"][0]["original_text"].startswith("1.1 ")
    assert workspace["clauses"][0]["current_text"] == workspace["clauses"][0]["original_text"]
    assert (
        workspace["clauses"][119]["heading"]
        == "ARTICLE 15 - GOVERNING LAW AND DISPUTE RESOLUTION"
    )
    assert workspace["clauses"][119]["original_text"].startswith("15.8 ")

    # 3. Upload multi-page PDF contract without explicit title (defaults to clean filename)
    pdf_bytes = build_multi_page_contract_pdf_bytes(
        [
            [
                "ARTICLE 1 - SLA COMMITMENTS",
                "1.1 Uptime Guarantee. Provider guarantees 99.95% monthly availability.",
                "Page 1 of 2",
            ],
            [
                "ARTICLE 2 - SECURITY CONTROLS",
                "2.1 Penetration Testing. Provider shall conduct annual third-party pen tests.",
                "Page 2 of 2",
            ],
        ]
    )
    upload_pdf_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("Technical_RFP_Schedule.pdf", pdf_bytes, "application/pdf")},
    )
    assert upload_pdf_resp.status_code == 201
    pdf_meta = upload_pdf_resp.json()
    assert pdf_meta["title"] == "Technical_RFP_Schedule"
    assert pdf_meta["clause_count"] == 2

    # 4. Verify GET /api/v1/documents lists both uploaded documents for the tenant
    list_resp = await client.get(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert len(docs) == 2


async def test_document_upload_rbac_and_multi_tenant_workspace_isolation(
    client: AsyncClient,
) -> None:
    """Verify VIEWER cannot upload (403) but can view workspace (200), and Org B gets 404."""
    _org_a_id, admin_a_token = await _register_org_and_get_token(
        client,
        org_name="Tenant Alpha Legal",
        admin_email="admin@alpha-legal.io",
    )
    _org_b_id, admin_b_token = await _register_org_and_get_token(
        client,
        org_name="Tenant Beta Legal",
        admin_email="admin@beta-legal.io",
    )

    # Create LEGAL_COUNSEL, TECHNICAL_LEAD, and VIEWER users in Org A
    role_tokens: dict[UserRole, str] = {UserRole.ADMIN: admin_a_token}
    for role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        email = f"{role.value.lower()}@alpha-legal.io"
        password = f"RolePass!{role.value}2026"
        c_resp = await client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_a_token}"},
            json={"email": email, "password": password, "role": role.value},
        )
        assert c_resp.status_code == 201
        l_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert l_resp.status_code == 200
        role_tokens[role] = l_resp.json()["access_token"]

    sample_docx = build_30_page_contract_docx_bytes(num_sections=2, clauses_per_section=3)

    # LEGAL_COUNSEL and TECHNICAL_LEAD can upload contracts
    uploaded_doc_id: str = ""
    for allowed_role in (UserRole.LEGAL_COUNSEL, UserRole.TECHNICAL_LEAD):
        ok_resp = await client.post(
            "/api/v1/documents/upload",
            headers={"Authorization": f"Bearer {role_tokens[allowed_role]}"},
            files={
                "file": (
                    f"{allowed_role.value.lower()}_contract.docx",
                    sample_docx,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )
        assert ok_resp.status_code == 201
        uploaded_doc_id = ok_resp.json()["document_id"]

    # VIEWER is strictly blocked from uploading documents (403 Forbidden)
    viewer_upload_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
        files={
            "file": (
                "viewer_attempt.docx",
                sample_docx,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert viewer_upload_resp.status_code == 403
    assert viewer_upload_resp.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # VIEWER in Org A CAN read the workspace of Org A's uploaded document (200 OK)
    viewer_ws_resp = await client.get(
        f"/api/v1/documents/{uploaded_doc_id}/workspace",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
    )
    assert viewer_ws_resp.status_code == 200
    assert len(viewer_ws_resp.json()["clauses"]) == 6

    # Org B ADMIN attempting to access Org A's workspace receives 404 Not Found
    cross_tenant_ws = await client.get(
        f"/api/v1/documents/{uploaded_doc_id}/workspace",
        headers={"Authorization": f"Bearer {admin_b_token}"},
    )
    assert cross_tenant_ws.status_code == 404
    assert cross_tenant_ws.json()["error"]["code"] == "ENTITY_NOT_FOUND"

    # Org B document listing is empty
    org_b_list = await client.get(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {admin_b_token}"},
    )
    assert org_b_list.status_code == 200
    assert org_b_list.json() == []

    # Invalid file format (.exe) returns 422 INVALID_DOCUMENT_FORMAT
    bad_ext_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_a_token}"},
        files={"file": ("exploit.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert bad_ext_resp.status_code == 422
    assert bad_ext_resp.json()["error"]["code"] == "INVALID_DOCUMENT_FORMAT"

    # Empty 0-byte file returns 422 EMPTY_DOCUMENT
    empty_resp = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_a_token}"},
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert empty_resp.status_code == 422
    assert empty_resp.json()["error"]["code"] == "EMPTY_DOCUMENT"
