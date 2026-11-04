"""SQLAlchemy 2.0 ORM models matching Section 3 (Database & Vector Schema Design) of DOCS.md."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.domain.enums import DocumentStatus, RiskLevel, SuggestionStatus, UserRole
from src.infrastructure.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(UTC)


# Vector(1536) on PostgreSQL with JSON fallback variant for SQLite unit/integration tests
EMBEDDING_VECTOR_TYPE: Any = Vector(1536).with_variant(JSON(), "sqlite")


class OrganizationModel(Base):
    """ORM model for the `organizations` table."""

    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        server_default=func.now(),
    )

    users: Mapped[list["UserModel"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    playbook_rules: Mapped[list["PlaybookRuleModel"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    documents: Mapped[list["DocumentModel"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )


class UserModel(Base):
    """ORM model for the `users` table."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=True),
        nullable=False,
        default=UserRole.VIEWER,
        server_default=UserRole.VIEWER.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        server_default=func.now(),
    )

    organization: Mapped["OrganizationModel"] = relationship(back_populates="users")


class PlaybookRuleModel(Base):
    """ORM model for the `playbook_rules` table with pgvector `vector(1536)` column."""

    __tablename__ = "playbook_rules"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    standard_position: Mapped[str] = mapped_column(Text, nullable=False)
    fallback_position: Mapped[str] = mapped_column(Text, nullable=False)
    unacceptable_triggers: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(EMBEDDING_VECTOR_TYPE, nullable=False)

    organization: Mapped["OrganizationModel"] = relationship(back_populates="playbook_rules")


class DocumentModel(Base):
    """ORM model for the `documents` table with optimistic concurrency `version` column."""

    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=DocumentStatus.PROCESSING.value,
        server_default=DocumentStatus.PROCESSING.value,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    created_by: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        server_default=func.now(),
    )

    organization: Mapped["OrganizationModel"] = relationship(back_populates="documents")
    clauses: Mapped[list["DocumentClauseModel"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )


class DocumentClauseModel(Base):
    """ORM model for the `document_clauses` table with optimistic concurrency `version` column."""

    __tablename__ = "document_clauses"
    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "clause_index",
            name="uq_document_clauses_document_id_clause_index",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    document_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    clause_index: Mapped[int] = mapped_column(Integer, nullable=False)
    heading: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    current_text: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    document: Mapped["DocumentModel"] = relationship(back_populates="clauses")
    suggestions: Mapped[list["RedlineSuggestionModel"]] = relationship(
        back_populates="clause",
        cascade="all, delete-orphan",
    )
    comments: Mapped[list["ClauseCommentModel"]] = relationship(
        back_populates="clause",
        cascade="all, delete-orphan",
    )


class RedlineSuggestionModel(Base):
    """ORM model for the `redline_suggestions` table."""

    __tablename__ = "redline_suggestions"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    clause_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_clauses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    matched_rule_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("playbook_rules.id"),
        nullable=True,
    )
    risk: Mapped[RiskLevel] = mapped_column(
        SAEnum(RiskLevel, name="risk_level", native_enum=True),
        nullable=False,
    )
    proposed_text: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SuggestionStatus] = mapped_column(
        SAEnum(SuggestionStatus, name="suggestion_status", native_enum=True),
        nullable=False,
        default=SuggestionStatus.PENDING,
        server_default=SuggestionStatus.PENDING.value,
    )
    resolved_by: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        server_default=func.now(),
    )

    clause: Mapped["DocumentClauseModel"] = relationship(back_populates="suggestions")


class ClauseCommentModel(Base):
    """ORM model for the `clause_comments` table."""

    __tablename__ = "clause_comments"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    clause_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document_clauses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        server_default=func.now(),
    )

    clause: Mapped["DocumentClauseModel"] = relationship(back_populates="comments")


__all__ = [
    "ClauseCommentModel",
    "DocumentClauseModel",
    "DocumentModel",
    "OrganizationModel",
    "PlaybookRuleModel",
    "RedlineSuggestionModel",
    "UserModel",
]
