"""Architectural boundary and pure domain layer unit tests."""

import ast
import inspect
from pathlib import Path
from uuid import uuid4

import pytest
from src.domain.entities import (
    ClauseComment,
    Document,
    DocumentClause,
    Organization,
    PlaybookRule,
    RedlineSuggestion,
    User,
)
from src.domain.enums import DocumentStatus, RiskLevel, SuggestionStatus, UserRole
from src.domain.exceptions import ConcurrencyConflictError, DomainValidationError
from src.domain.ports import (
    AuditLogRepositoryPort,
    CommentRepositoryPort,
    DocumentRepositoryPort,
    RedlineRepositoryPort,
    UserRepositoryPort,
)

FORBIDDEN_DOMAIN_IMPORT_PREFIXES: tuple[str, ...] = (
    "src.infrastructure",
    "src.presentation",
    "src.application",
    "infrastructure",
    "presentation",
    "application",
    "sqlalchemy",
    "fastapi",
    "pydantic",
    "starlette",
    "jwt",
    "bcrypt",
    "passlib",
    "pgvector",
    "alembic",
    "langchain",
    "langchain_core",
    "celery",
    "redis",
)


def test_domain_layer_has_zero_external_or_outer_layer_imports() -> None:
    """Verify `src/domain/` has zero imports from outer layers or external frameworks."""
    domain_dir = Path(__file__).resolve().parents[2] / "src" / "domain"
    python_files = list(domain_dir.rglob("*.py"))
    assert len(python_files) >= 5

    violations: list[str] = []
    for file_path in python_files:
        tree = ast.parse(file_path.read_text(encoding="utf-8"), filename=str(file_path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.startswith(FORBIDDEN_DOMAIN_IMPORT_PREFIXES):
                        violations.append(f"{file_path.name}: import {alias.name}")
            elif (
                isinstance(node, ast.ImportFrom)
                and node.module
                and node.module.startswith(FORBIDDEN_DOMAIN_IMPORT_PREFIXES)
            ):
                violations.append(f"{file_path.name}: from {node.module} import ...")

    assert violations == [], f"Forbidden imports detected in domain layer: {violations}"


def test_repository_ports_require_org_id_parameter() -> None:
    """Verify that tenant repository port methods require `org_id` for multi-tenancy."""
    tenant_user_methods = ("create", "get_by_id", "get_by_email", "list_by_org")
    for method_name in tenant_user_methods:
        method = getattr(UserRepositoryPort, method_name)
        sig = inspect.signature(method)
        assert "org_id" in sig.parameters, (
            f"UserRepositoryPort.{method_name} must require 'org_id'"
        )

    tenant_doc_methods = (
        "create",
        "get_by_id",
        "list_by_org",
        "update",
        "delete",
        "get_clause_by_id",
        "update_clause_with_optimistic_lock",
    )
    for method_name in tenant_doc_methods:
        method = getattr(DocumentRepositoryPort, method_name)
        sig = inspect.signature(method)
        assert "org_id" in sig.parameters, (
            f"DocumentRepositoryPort.{method_name} must require 'org_id'"
        )

    tenant_redline_methods = (
        "create_many",
        "list_by_document",
        "delete_pending_by_document",
        "get_by_id",
        "update_resolution",
    )
    for method_name in tenant_redline_methods:
        method = getattr(RedlineRepositoryPort, method_name)
        sig = inspect.signature(method)
        assert "org_id" in sig.parameters, (
            f"RedlineRepositoryPort.{method_name} must require 'org_id'"
        )

    tenant_comment_methods = ("create", "list_by_clause", "list_by_document")
    for method_name in tenant_comment_methods:
        method = getattr(CommentRepositoryPort, method_name)
        sig = inspect.signature(method)
        assert "org_id" in sig.parameters, (
            f"CommentRepositoryPort.{method_name} must require 'org_id'"
        )

    tenant_audit_methods = ("append", "list_by_document")
    for method_name in tenant_audit_methods:
        method = getattr(AuditLogRepositoryPort, method_name)
        sig = inspect.signature(method)
        assert "org_id" in sig.parameters, (
            f"AuditLogRepositoryPort.{method_name} must require 'org_id'"
        )


def test_domain_entities_and_optimistic_concurrency() -> None:
    """Verify domain entity invariants and optimistic concurrency transitions."""
    org = Organization(name="  Acme Legal Corp  ")
    assert org.name == "Acme Legal Corp"

    with pytest.raises(DomainValidationError):
        Organization(name="   ")

    user = User(org_id=org.id, email="  COUNSEL@Acme.com ", role=UserRole.LEGAL_COUNSEL)
    assert user.email == "counsel@acme.com"
    assert user.role == UserRole.LEGAL_COUNSEL

    with pytest.raises(DomainValidationError):
        User(org_id=org.id, email="invalid-email")

    doc = Document(org_id=org.id, title="Master Services Agreement", created_by=user.id)
    assert doc.status == DocumentStatus.PROCESSING.value
    assert doc.version == 1

    doc.increment_version(expected_version=1)
    assert doc.version == 2

    with pytest.raises(ConcurrencyConflictError):
        doc.increment_version(expected_version=1)

    clause = DocumentClause(
        document_id=doc.id,
        clause_index=0,
        heading="1. Indemnification",
        original_text="Supplier shall indemnify Customer without limit.",
        current_text="Supplier shall indemnify Customer without limit.",
    )
    clause.apply_text_revision(
        new_text="Supplier shall indemnify Customer up to 2x fees paid.",
        expected_version=1,
    )
    assert clause.version == 2
    assert "2x fees paid" in clause.current_text

    with pytest.raises(ConcurrencyConflictError):
        clause.apply_text_revision(new_text="Stale overwrite", expected_version=1)

    rule = PlaybookRule(
        org_id=org.id,
        category="Indemnification",
        standard_position="Mutual indemnification capped at 2x contract value.",
        fallback_position="Uncapped only for third-party IP infringement.",
        unacceptable_triggers="Unlimited consequential indemnity.",
        embedding=[0.01] * 1536,
    )
    assert len(rule.embedding) == 1536

    with pytest.raises(DomainValidationError):
        PlaybookRule(
            org_id=org.id,
            category="Invalid",
            standard_position="A",
            fallback_position="B",
            unacceptable_triggers="C",
            embedding=[0.1, 0.2],
        )

    suggestion = RedlineSuggestion(
        clause_id=clause.id,
        matched_rule_id=rule.id,
        risk=RiskLevel.CRITICAL,
        proposed_text="Supplier liability is capped at 2x fees.",
        rationale="Playbook prohibits unlimited indemnity.",
    )
    initial_status: SuggestionStatus = suggestion.status
    assert initial_status == SuggestionStatus.PENDING
    suggestion.resolve(
        new_status=SuggestionStatus.ACCEPTED,
        resolved_by=user.id,
    )
    resolved_status: SuggestionStatus = suggestion.status
    assert resolved_status == SuggestionStatus.ACCEPTED
    assert suggestion.resolved_by == user.id
    assert suggestion.resolved_at is not None

    comment = ClauseComment(
        clause_id=clause.id,
        author_id=user.id,
        body="  Reviewed with counterparty counsel.  ",
    )
    assert comment.body == "Reviewed with counterparty counsel."
    assert uuid4() != comment.id
