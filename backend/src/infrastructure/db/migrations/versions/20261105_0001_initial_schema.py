"""Initial database schema for Phase 1 Foundation, Multi-Tenancy & RBAC Core.

Revision ID: 20261105_0001
Revises: None
Create Date: 2026-11-05 01:35:00+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20261105_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create PostgreSQL extensions, enum types, and core multi-tenant tables."""
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')

    user_role_enum = postgresql.ENUM(
        "ADMIN",
        "LEGAL_COUNSEL",
        "TECHNICAL_LEAD",
        "VIEWER",
        name="user_role",
        create_type=False,
    )
    risk_level_enum = postgresql.ENUM(
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
        name="risk_level",
        create_type=False,
    )
    suggestion_status_enum = postgresql.ENUM(
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "MODIFIED",
        name="suggestion_status",
        create_type=False,
    )

    user_role_enum.create(op.get_bind(), checkfirst=True)
    risk_level_enum.create(op.get_bind(), checkfirst=True)
    suggestion_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "organizations",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_organizations"),
    )

    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("org_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            user_role_enum,
            server_default="VIEWER",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["org_id"],
            ["organizations.id"],
            name="fk_users_org_id_organizations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_org_id", "users", ["org_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "playbook_rules",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("org_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("standard_position", sa.Text(), nullable=False),
        sa.Column("fallback_position", sa.Text(), nullable=False),
        sa.Column("unacceptable_triggers", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(1536), nullable=False),
        sa.ForeignKeyConstraint(
            ["org_id"],
            ["organizations.id"],
            name="fk_playbook_rules_org_id_organizations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_playbook_rules"),
    )
    op.create_index("ix_playbook_rules_org_id", "playbook_rules", ["org_id"], unique=False)

    op.create_table(
        "documents",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("org_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.String(length=50),
            server_default="PROCESSING",
            nullable=False,
        ),
        sa.Column(
            "version",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
        sa.Column("created_by", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="fk_documents_created_by_users",
        ),
        sa.ForeignKeyConstraint(
            ["org_id"],
            ["organizations.id"],
            name="fk_documents_org_id_organizations",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_documents"),
    )
    op.create_index("ix_documents_org_id", "documents", ["org_id"], unique=False)

    op.create_table(
        "document_clauses",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("document_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("clause_index", sa.Integer(), nullable=False),
        sa.Column("heading", sa.String(length=255), nullable=True),
        sa.Column("original_text", sa.Text(), nullable=False),
        sa.Column("current_text", sa.Text(), nullable=False),
        sa.Column(
            "version",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name="fk_document_clauses_document_id_documents",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_document_clauses"),
        sa.UniqueConstraint(
            "document_id",
            "clause_index",
            name="uq_document_clauses_document_id_clause_index",
        ),
    )
    op.create_index(
        "ix_document_clauses_document_id",
        "document_clauses",
        ["document_id"],
        unique=False,
    )

    op.create_table(
        "redline_suggestions",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("clause_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("matched_rule_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("risk", risk_level_enum, nullable=False),
        sa.Column("proposed_text", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column(
            "status",
            suggestion_status_enum,
            server_default="PENDING",
            nullable=False,
        ),
        sa.Column("resolved_by", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["clause_id"],
            ["document_clauses.id"],
            name="fk_redline_suggestions_clause_id_document_clauses",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["matched_rule_id"],
            ["playbook_rules.id"],
            name="fk_redline_suggestions_matched_rule_id_playbook_rules",
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by"],
            ["users.id"],
            name="fk_redline_suggestions_resolved_by_users",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_redline_suggestions"),
    )
    op.create_index(
        "ix_redline_suggestions_clause_id",
        "redline_suggestions",
        ["clause_id"],
        unique=False,
    )

    op.create_table(
        "clause_comments",
        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            server_default=sa.text("uuid_generate_v4()"),
            nullable=False,
        ),
        sa.Column("clause_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("author_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            name="fk_clause_comments_author_id_users",
        ),
        sa.ForeignKeyConstraint(
            ["clause_id"],
            ["document_clauses.id"],
            name="fk_clause_comments_clause_id_document_clauses",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_clause_comments"),
    )
    op.create_index("ix_clause_comments_clause_id", "clause_comments", ["clause_id"], unique=False)


def downgrade() -> None:
    """Drop all tables and PostgreSQL custom enum types."""
    op.drop_index("ix_clause_comments_clause_id", table_name="clause_comments")
    op.drop_table("clause_comments")

    op.drop_index("ix_redline_suggestions_clause_id", table_name="redline_suggestions")
    op.drop_table("redline_suggestions")

    op.drop_index("ix_document_clauses_document_id", table_name="document_clauses")
    op.drop_table("document_clauses")

    op.drop_index("ix_documents_org_id", table_name="documents")
    op.drop_table("documents")

    op.drop_index("ix_playbook_rules_org_id", table_name="playbook_rules")
    op.drop_table("playbook_rules")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_org_id", table_name="users")
    op.drop_table("users")

    op.drop_table("organizations")

    op.execute("DROP TYPE IF EXISTS suggestion_status")
    op.execute("DROP TYPE IF EXISTS risk_level")
    op.execute("DROP TYPE IF EXISTS user_role")
