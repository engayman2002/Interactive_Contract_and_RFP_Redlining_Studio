"""SQLAlchemy 2.0 AsyncEngine and async_sessionmaker factory."""

import asyncio
import logging
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.infrastructure.config import get_settings
from src.infrastructure.db.base import Base

logger = logging.getLogger(__name__)


def build_async_engine(database_url: str | None = None) -> AsyncEngine:
    """Create a configured SQLAlchemy 2.0 AsyncEngine."""
    settings = get_settings()
    target_url = database_url or settings.DATABASE_URL
    if target_url.startswith("sqlite"):
        sqlite_engine = create_async_engine(
            target_url,
            connect_args={"check_same_thread": False},
            future=True,
        )

        @event.listens_for(sqlite_engine.sync_engine, "connect")
        def _set_sqlite_pragma(dbapi_connection: Any, _connection_record: Any) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        return sqlite_engine

    return create_async_engine(
        target_url,
        pool_pre_ping=True,
        future=True,
    )


engine: AsyncEngine = build_async_engine()

AsyncSessionFactory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def initialize_database_engine() -> str:
    """Ensure schema readiness on PostgreSQL, or fall back to local SQLite in dev mode."""
    global engine
    settings = get_settings()

    # Import ORM models so Base.metadata registers all tables prior to create_all
    import src.infrastructure.db.models  # noqa: F401

    async def _probe_and_init(target_engine: AsyncEngine) -> None:
        async with target_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            if target_engine.dialect.name == "postgresql":
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)

    try:
        await asyncio.wait_for(_probe_and_init(engine), timeout=3.0)
        return str(engine.dialect.name)
    except Exception as exc:
        if settings.APP_ENV == "production":
            raise
        logger.warning(
            "Primary database '%s' unreachable (%s). Falling back to zero-config local SQLite "
            "(sqlite+aiosqlite:///./local_workspace.db).",
            settings.DATABASE_URL,
            exc,
        )
        await engine.dispose()
        sqlite_engine = build_async_engine("sqlite+aiosqlite:///./local_workspace.db")
        async with sqlite_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        engine = sqlite_engine
        AsyncSessionFactory.configure(bind=sqlite_engine)
        return "sqlite"


async def dispose_database_engine() -> None:
    """Dispose active database connection pool cleanly on shutdown."""
    await engine.dispose()


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a transactional SQLAlchemy AsyncSession per request."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

