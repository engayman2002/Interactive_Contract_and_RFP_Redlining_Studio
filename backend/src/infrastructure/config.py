"""Application and infrastructure settings managed via Pydantic Settings."""

import logging
import os
import secrets
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


def _resolve_jwt_secret() -> str:
    """Resolve JWT secret safely without hardcoded literals.

    Resolution order:
    1. Environment variable `JWT_SECRET_KEY`
    2. Local secret file `jwt_secret.txt` (non-production only)
    3. Ephemeral CSPRNG fallback for development/testing with warning
    """
    env_secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if env_secret:
        return env_secret

    app_env = os.getenv("APP_ENV", "development").strip().lower()
    if app_env == "production":
        raise RuntimeError(
            "CRITICAL: JWT_SECRET_KEY environment variable must be configured in production."
        )

    secret_file = Path("jwt_secret.txt")
    if secret_file.exists():
        file_secret = secret_file.read_text(encoding="utf-8").strip()
        if file_secret:
            return file_secret

    logger.warning(
        "Generating ephemeral JWT secret via CSPRNG. Instance-isolated; "
        "do not use across multiple replicas without configuring JWT_SECRET_KEY."
    )
    return secrets.token_hex(32)


class Settings(BaseSettings):
    """Strongly typed configuration settings for the Redlining Studio backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_ENV: Literal["development", "testing", "production"] = "development"
    APP_NAME: str = "Interactive Contract & RFP Redlining Studio"
    API_V1_PREFIX: str = "/api/v1"

    # Server must listen on 127.0.0.1 in development/testing per security policy
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Least-privilege database connection URL (mTLS / SSL configured in production)
    # TODO(security): Enforce ssl=verify-full (mTLS) on asyncpg connection in production deployment.
    DATABASE_URL: str = (
        "postgresql+asyncpg://redline_app:redline_dev_pass@127.0.0.1:5432/redlining_studio"
    )
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    JWT_SECRET_KEY: str = Field(default_factory=_resolve_jwt_secret)
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=5, le=1440)

    CORS_ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Phase 2: Document Ingestion & Upload Storage Configuration
    MAX_UPLOAD_SIZE_MB: int = Field(default=25, ge=1, le=100)
    ALLOWED_UPLOAD_EXTENSIONS: tuple[str, ...] = (".docx", ".pdf")
    ALLOWED_UPLOAD_MIME_TYPES: tuple[str, ...] = (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf",
        "application/octet-stream",
    )
    STORAGE_ROOT_PATH: Path = Field(
        default=Path("/tmp/redlining_studio_storage"),  # noqa: S108
        description="Local / S3-compatible object storage root outside the web root.",
    )

    @property
    def max_upload_size_bytes(self) -> int:
        """Return maximum allowed upload size in bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @field_validator("CORS_ALLOWED_ORIGINS")
    @classmethod
    def validate_no_wildcard_origins(cls, origins: list[str]) -> list[str]:
        """Reject wildcard CORS origins to enforce strict origin allow-listing."""
        for origin in origins:
            if origin.strip() == "*":
                raise ValueError("Wildcard '*' is strictly forbidden in CORS_ALLOWED_ORIGINS.")
        return origins


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached singleton application settings."""
    return Settings()

