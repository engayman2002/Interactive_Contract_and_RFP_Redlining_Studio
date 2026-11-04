"""Integration tests for Multi-Tenant Isolation and RBAC at Repository and API layers."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.domain.entities import Document, Organization, User
from src.domain.enums import UserRole
from src.domain.exceptions import (
    ConcurrencyConflictError,
    EntityNotFoundError,
    TenantIsolationError,
)
from src.infrastructure.db.repositories import (
    SqlAlchemyDocumentRepository,
    SqlAlchemyOrganizationRepository,
    SqlAlchemyUserRepository,
)


async def test_repository_level_multi_tenant_isolation_and_concurrency(
    db_session: AsyncSession,
) -> None:
    """Prove Org A cannot read, list, update, or delete Org B resources at the Repository level."""
    org_repo = SqlAlchemyOrganizationRepository(db_session)
    user_repo = SqlAlchemyUserRepository(db_session)
    doc_repo = SqlAlchemyDocumentRepository(db_session)

    org_a = await org_repo.create(Organization(name="Organization Alpha"))
    org_b = await org_repo.create(Organization(name="Organization Beta"))

    user_a = await user_repo.create(
        org_id=org_a.id,
        user=User(
            org_id=org_a.id,
            email="admin@org-a.com",
            role=UserRole.ADMIN,
            password_hash="hashed_a",
        ),
    )
    user_b = await user_repo.create(
        org_id=org_b.id,
        user=User(
            org_id=org_b.id,
            email="admin@org-b.com",
            role=UserRole.ADMIN,
            password_hash="hashed_b",
        ),
    )

    # Attempting to create a user under Org A with Org B's org_id raises TenantIsolationError
    with pytest.raises(TenantIsolationError):
        await user_repo.create(
            org_id=org_a.id,
            user=User(
                org_id=org_b.id,
                email="intruder@org-b.com",
                role=UserRole.VIEWER,
                password_hash="hash",
            ),
        )

    # Org A cannot fetch Org B's user by ID or email
    assert await user_repo.get_by_id(org_id=org_a.id, user_id=user_b.id) is None
    assert await user_repo.get_by_email(org_id=org_a.id, email="admin@org-b.com") is None

    # Org A user listing never includes Org B users
    org_a_users = await user_repo.list_by_org(org_id=org_a.id)
    assert [u.id for u in org_a_users] == [user_a.id]

    # Create a document in Org B
    doc_b = await doc_repo.create(
        org_id=org_b.id,
        document=Document(
            org_id=org_b.id,
            title="Confidential Org B Acquisition RFP",
            created_by=user_b.id,
        ),
    )
    await db_session.commit()

    # Org A cannot read, list, update, or delete Org B's document
    assert await doc_repo.get_by_id(org_id=org_a.id, document_id=doc_b.id) is None
    assert await doc_repo.list_by_org(org_id=org_a.id) == []
    assert await doc_repo.delete(org_id=org_a.id, document_id=doc_b.id) is False

    with pytest.raises(TenantIsolationError):
        await doc_repo.update(
            org_id=org_a.id,
            document=doc_b,
            expected_version=1,
        )

    with pytest.raises(EntityNotFoundError):
        spoofed_doc = Document(
            id=doc_b.id,
            org_id=org_a.id,
            title="Spoofed Title",
            created_by=user_a.id,
        )
        await doc_repo.update(
            org_id=org_a.id,
            document=spoofed_doc,
            expected_version=1,
        )

    # Verify Org B can update its own document and optimistic concurrency is enforced
    updated_doc_b = await doc_repo.update(
        org_id=org_b.id,
        document=Document(
            id=doc_b.id,
            org_id=org_b.id,
            title="Updated Confidential RFP v2",
            created_by=user_b.id,
        ),
        expected_version=1,
    )
    assert updated_doc_b.version == 2

    with pytest.raises(ConcurrencyConflictError):
        await doc_repo.update(
            org_id=org_b.id,
            document=updated_doc_b,
            expected_version=1,
        )


async def test_api_rbac_roles_and_viewer_mutation_blocking(client: AsyncClient) -> None:
    """Prove VIEWER gets 403 on mutations while ADMIN, LEGAL_COUNSEL, and TECHNICAL_LEAD succeed."""
    # 1. Health check & security headers
    health_resp = await client.get(
        "/api/v1/health",
        headers={"X-Correlation-ID": "phase1-test-corr-id-001"},
    )
    assert health_resp.status_code == 200
    assert health_resp.headers["X-Correlation-ID"] == "phase1-test-corr-id-001"
    assert health_resp.headers["X-Content-Type-Options"] == "nosniff"
    assert health_resp.headers["X-Frame-Options"] == "DENY"

    # 2. Onboard Organization A with initial ADMIN
    onboard_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "LexCorp Enterprise",
            "admin_email": "admin@lexcorp.io",
            "admin_password": "AdminStrongPassword!2026",
        },
    )
    assert onboard_resp.status_code == 201
    onboard_data = onboard_resp.json()
    admin_token: str = onboard_data["access_token"]
    org_id: str = onboard_data["organization"]["id"]

    # 3. ADMIN provisions LEGAL_COUNSEL, TECHNICAL_LEAD, and VIEWER users
    role_tokens: dict[UserRole, str] = {UserRole.ADMIN: admin_token}
    for role in (
        UserRole.LEGAL_COUNSEL,
        UserRole.TECHNICAL_LEAD,
        UserRole.VIEWER,
    ):
        email = f"{role.value.lower()}@lexcorp.io"
        password = f"StrongPass!{role.value}2026"
        create_resp = await client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": email,
                "password": password,
                "role": role.value,
            },
        )
        assert create_resp.status_code == 201
        assert create_resp.json()["org_id"] == org_id

        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_resp.status_code == 200
        role_tokens[role] = login_resp.json()["access_token"]

    # 4. Non-ADMIN roles cannot create users (403 Forbidden)
    for non_admin_role in (
        UserRole.LEGAL_COUNSEL,
        UserRole.TECHNICAL_LEAD,
        UserRole.VIEWER,
    ):
        forbidden_user_resp = await client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {role_tokens[non_admin_role]}"},
            json={
                "email": f"unauthorized-{non_admin_role.value.lower()}@lexcorp.io",
                "password": "StrongPassword!1234",
                "role": "VIEWER",
            },
        )
        assert forbidden_user_resp.status_code == 403
        assert forbidden_user_resp.json()["error"]["code"] == "FORBIDDEN_ROLE"

    # 5. Playbook Rule creation: ADMIN and LEGAL_COUNSEL succeed (201), others get 403
    playbook_payload = {
        "category": "Limitation of Liability",
        "standard_position": "Mutual cap at 12 months fees.",
        "fallback_position": "24 months fees for data breach.",
        "unacceptable_triggers": "Uncapped liability.",
    }
    for allowed_role in (UserRole.ADMIN, UserRole.LEGAL_COUNSEL):
        pb_ok = await client.post(
            "/api/v1/playbooks/rules",
            headers={"Authorization": f"Bearer {role_tokens[allowed_role]}"},
            json=playbook_payload,
        )
        assert pb_ok.status_code == 201

    for blocked_role in (UserRole.TECHNICAL_LEAD, UserRole.VIEWER):
        pb_forbidden = await client.post(
            "/api/v1/playbooks/rules",
            headers={"Authorization": f"Bearer {role_tokens[blocked_role]}"},
            json=playbook_payload,
        )
        assert pb_forbidden.status_code == 403

    # 6. Document creation, mutation, and redline resolution:
    # ADMIN, LEGAL_COUNSEL, and TECHNICAL_LEAD succeed; VIEWER receives 403 Forbidden
    created_doc_id: str = ""
    for mutating_role in (
        UserRole.ADMIN,
        UserRole.LEGAL_COUNSEL,
        UserRole.TECHNICAL_LEAD,
    ):
        doc_resp = await client.post(
            "/api/v1/documents",
            headers={"Authorization": f"Bearer {role_tokens[mutating_role]}"},
            json={"title": f"MSA Created by {mutating_role.value}"},
        )
        assert doc_resp.status_code == 201
        created_doc_id = doc_resp.json()["id"]

        resolve_resp = await client.post(
            f"/api/v1/suggestions/{uuid4()}/resolve",
            headers={"Authorization": f"Bearer {role_tokens[mutating_role]}"},
            json={"action": "ACCEPT"},
        )
        assert resolve_resp.status_code == 200

    # VIEWER is allowed to read the document (200 OK)
    viewer_get_resp = await client.get(
        f"/api/v1/documents/{created_doc_id}",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
    )
    assert viewer_get_resp.status_code == 200

    # VIEWER is strictly blocked from creating/updating documents or resolving suggestions (403)
    viewer_create_doc = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
        json={"title": "Viewer Unauthorized Document"},
    )
    assert viewer_create_doc.status_code == 403

    viewer_patch_doc = await client.patch(
        f"/api/v1/documents/{created_doc_id}",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
        json={"title": "Viewer Unauthorized Edit", "expected_version": 1},
    )
    assert viewer_patch_doc.status_code == 403

    viewer_resolve = await client.post(
        f"/api/v1/suggestions/{uuid4()}/resolve",
        headers={"Authorization": f"Bearer {role_tokens[UserRole.VIEWER]}"},
        json={"action": "ACCEPT"},
    )
    assert viewer_resolve.status_code == 403


async def test_api_multi_tenant_isolation_between_org_a_and_org_b(
    client: AsyncClient,
) -> None:
    """Create Org A and Org B and prove Org A users cannot read or modify Org B resources."""
    org_a_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Org A",
            "admin_email": "admin@tenant-a.com",
            "admin_password": "TenantAPassword!2026",
        },
    )
    assert org_a_resp.status_code == 201
    org_a_data = org_a_resp.json()
    token_a: str = org_a_data["access_token"]
    org_a_id: str = org_a_data["organization"]["id"]

    org_b_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Tenant Org B",
            "admin_email": "admin@tenant-b.com",
            "admin_password": "TenantBPassword!2026",
        },
    )
    assert org_b_resp.status_code == 201
    org_b_data = org_b_resp.json()
    token_b: str = org_b_data["access_token"]
    org_b_id: str = org_b_data["organization"]["id"]
    org_b_admin_id: str = org_b_data["admin_user"]["id"]

    assert org_a_id != org_b_id

    # Org B creates a confidential document
    doc_b_resp = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"title": "Org B Secret Sovereign RFP"},
    )
    assert doc_b_resp.status_code == 201
    doc_b_id: str = doc_b_resp.json()["id"]

    # 1. Org A cannot read Org B's admin user profile
    cross_user_get = await client.get(
        f"/api/v1/users/{org_b_admin_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert cross_user_get.status_code == 404

    # 2. Org A's user list only contains Org A users
    list_a_resp = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert list_a_resp.status_code == 200
    assert all(u["org_id"] == org_a_id for u in list_a_resp.json())

    # 3. Org A Admin cannot create a user injected into Org B (`org_id=org_b_id`)
    cross_user_create = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "email": "injected@tenant-b.com",
            "password": "InjectedPassword!2026",
            "role": "ADMIN",
            "org_id": org_b_id,
        },
    )
    assert cross_user_create.status_code == 403
    assert cross_user_create.json()["error"]["code"] == "TENANT_ISOLATION_VIOLATION"

    # 4. Org A cannot read or mutate Org B's document
    cross_doc_get = await client.get(
        f"/api/v1/documents/{doc_b_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert cross_doc_get.status_code == 404

    cross_doc_patch = await client.patch(
        f"/api/v1/documents/{doc_b_id}",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"title": "Tampered by Org A", "expected_version": 1},
    )
    assert cross_doc_patch.status_code == 404

    # 5. Verify Org B's document remains completely intact
    verify_b_doc = await client.get(
        f"/api/v1/documents/{doc_b_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert verify_b_doc.status_code == 200
    assert verify_b_doc.json()["title"] == "Org B Secret Sovereign RFP"
    assert verify_b_doc.json()["version"] == 1


async def test_api_optimistic_concurrency_and_session_logout(
    client: AsyncClient,
) -> None:
    """Verify 409 on stale update, 405 on disallowed method, and 401 after logout."""
    reg_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Concurrency Test Org",
            "admin_email": "admin@concurrency-org.io",
            "admin_password": "StrongConcurrencyPass!99",
        },
    )
    assert reg_resp.status_code == 201
    token: str = reg_resp.json()["access_token"]

    # Duplicate email registration returns 409 Conflict
    dup_resp = await client.post(
        "/api/v1/auth/register-org",
        json={
            "organization_name": "Duplicate Email Org",
            "admin_email": "admin@concurrency-org.io",
            "admin_password": "StrongConcurrencyPass!99",
        },
    )
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"]["code"] == "DUPLICATE_ENTITY"

    # Create and update document once (version 1 -> 2)
    doc_resp = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Initial Contract v1"},
    )
    assert doc_resp.status_code == 201
    doc_id: str = doc_resp.json()["id"]

    patch_ok = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Updated Contract v2", "expected_version": 1},
    )
    assert patch_ok.status_code == 200
    assert patch_ok.json()["version"] == 2

    # Stale update with expected_version=1 returns 409 Conflict
    patch_conflict = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Stale Overwrite Attempt", "expected_version": 1},
    )
    assert patch_conflict.status_code == 409
    assert patch_conflict.json()["error"]["code"] == "CONCURRENCY_CONFLICT"

    # Disallowed HTTP method (DELETE) is rejected with 405 Method Not Allowed
    delete_resp = await client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_resp.status_code == 405

    # Logout invalidates the current token JTI
    logout_resp = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_resp.status_code == 200

    post_logout_resp = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert post_logout_resp.status_code == 401

