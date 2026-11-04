"""SQLAlchemy 2.0 AsyncEngine and async_sessionmaker factory."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.infrastructure.config import get_settings


def build_async_engine(database_url: str | None = None) -> AsyncEngine:
    """Create a configured SQLAlchemy 2.0 AsyncEngine."""
    settings = get_settings()
    target_url = database_url or settings.DATABASE_URL
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


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a transactional SQLAlchemy AsyncSession per request."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

