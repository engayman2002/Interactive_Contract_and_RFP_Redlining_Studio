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


def _resolve_optional_secret(env_var_name: str) -> str | None:
    """Resolve an optional secret from environment variable or `*_FILE` secret mount.

    Gracefully handles missing files, unreadable files (PermissionError/OSError),
    and placeholder values.
    """
    direct_value = os.getenv(env_var_name, "").strip()
    if direct_value and direct_value != "local-only-placeholder":
        return direct_value

    file_path_str = os.getenv(f"{env_var_name}_FILE", "").strip()
    if file_path_str:
        secret_path = Path(file_path_str)
        try:
            if secret_path.is_file():
                file_val = secret_path.read_text(encoding="utf-8").strip()
                if file_val and file_val != "local-only-placeholder":
                    return file_val
        except OSError as exc:
            logger.warning(
                "Unable to read optional secret file '%s' for %s (%s). Falling back to None.",
                file_path_str,
                env_var_name,
                exc,
            )
            return None
    return None


_ephemeral_jwt_secret: str | None = None


def _resolve_jwt_secret() -> str:
    """Resolve JWT secret safely without hardcoded literals.

    Resolution order:
    1. Environment variable `JWT_SECRET_KEY` (if non-empty and not placeholder)
    2. Mounted secret file `JWT_SECRET_KEY_FILE` (Docker Swarm / Kubernetes Secret volume)
    3. Local secret file `jwt_secret.txt` (non-production only)
    4. Ephemeral CSPRNG fallback for development/testing with warning
    """
    global _ephemeral_jwt_secret
    direct_value = os.getenv("JWT_SECRET_KEY", "").strip()
    if direct_value and direct_value != "local-only-placeholder":
        return direct_value

    file_path_str = os.getenv("JWT_SECRET_KEY_FILE", "").strip()
    if file_path_str:
        secret_path = Path(file_path_str)
        try:
            if secret_path.is_file():
                file_val = secret_path.read_text(encoding="utf-8").strip()
                if file_val and file_val != "local-only-placeholder":
                    return file_val
        except PermissionError as exc:
            app_env = os.getenv("APP_ENV", "development").strip().lower()
            if app_env == "production":
                raise RuntimeError(
                    f"Permission denied reading '{file_path_str}'. "
                    "The backend container runs as non-root UID 10001 (redline). "
                    "Run 'chmod 644 deploy/secrets/*.txt' or "
                    "'chown 10001:10001 deploy/secrets/*.txt' on the host."
                ) from exc
            logger.warning(
                "Permission denied reading secret file '%s' in %s mode. Falling back.",
                file_path_str,
                app_env,
            )
        except OSError as exc:
            logger.warning(
                "Unable to read secret file '%s' for JWT_SECRET_KEY (%s). Falling back.",
                file_path_str,
                exc,
            )

    app_env = os.getenv("APP_ENV", "development").strip().lower()
    if app_env == "production":
        raise RuntimeError(
            "CRITICAL: JWT_SECRET_KEY or JWT_SECRET_KEY_FILE must be configured in production."
        )

    secret_file = Path("jwt_secret.txt")
    try:
        if secret_file.exists():
            file_secret = secret_file.read_text(encoding="utf-8").strip()
            if file_secret and file_secret != "local-only-placeholder":  # noqa: S105
                return file_secret
    except OSError:
        pass

    if _ephemeral_jwt_secret is None:
        logger.warning(
            "Generating ephemeral JWT secret via CSPRNG. Instance-isolated; "
            "do not use across multiple replicas without configuring JWT_SECRET_KEY."
        )
        _ephemeral_jwt_secret = secrets.token_hex(32)
    return _ephemeral_jwt_secret


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

    # Phase 3: Company Playbook & Vector Knowledge Base Configuration
    EMBEDDING_PROVIDER: str = Field(default="deterministic")
    EMBEDDING_MODEL_NAME: str = Field(default="")
    EMBEDDING_BASE_URL: str | None = Field(default=None)
    EMBEDDING_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("EMBEDDING_API_KEY")
    )
    EMBEDDING_TIMEOUT_SECONDS: float = Field(default=30.0, ge=1.0, le=300.0)
    EMBEDDING_DIMENSION: int = Field(default=1536, ge=128, le=4096)
    PLAYBOOK_DEFAULT_TOP_K: int = Field(default=3, ge=1, le=50)
    HYBRID_VECTOR_WEIGHT: float = Field(default=0.7, ge=0.0, le=1.0)
    HYBRID_KEYWORD_WEIGHT: float = Field(default=0.3, ge=0.0, le=1.0)
    OPENAI_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("OPENAI_API_KEY")
    )

    # Phase 4: LangChain Redlining Engine & Async Worker Pipeline Configuration
    LLM_PROVIDER: str = Field(default="deterministic")
    LLM_MODEL_NAME: str = Field(default="")
    LLM_BASE_URL: str | None = Field(default=None)
    LLM_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("LLM_API_KEY")
    )
    GROQ_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("GROQ_API_KEY")
    )
    ANTHROPIC_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("ANTHROPIC_API_KEY")
    )
    GEMINI_API_KEY: str | None = Field(
        default_factory=lambda: _resolve_optional_secret("GEMINI_API_KEY")
    )
    LLM_TEMPERATURE: float = Field(default=0.0, ge=0.0, le=1.0)
    LLM_TIMEOUT_SECONDS: float = Field(default=60.0, ge=1.0, le=600.0)
    REDLINE_BATCH_CONCURRENCY: int = Field(default=20, ge=1, le=100)
    REDLINE_MAX_RETRIES: int = Field(default=2, ge=0, le=10)
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_TASK_ALWAYS_EAGER: bool = Field(default=True)

    # Phase 7: Production Hardening & Sliding-Window Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True)
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=240, ge=1, le=10000)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)

    def resolve_llm_api_key(self) -> str | None:
        """Resolve the effective LLM API key with provider-specific fallback."""
        if self.LLM_API_KEY:
            return self.LLM_API_KEY
        provider = self.LLM_PROVIDER.strip().lower()
        if provider == "groq":
            return self.GROQ_API_KEY
        if provider in ("openai", "openai_compatible"):
            return self.OPENAI_API_KEY or self.GROQ_API_KEY
        if provider == "anthropic":
            return self.ANTHROPIC_API_KEY
        if provider == "gemini":
            return self.GEMINI_API_KEY
        return (
            self.GROQ_API_KEY
            or self.OPENAI_API_KEY
            or self.ANTHROPIC_API_KEY
            or self.GEMINI_API_KEY
        )

    def resolve_embedding_api_key(self) -> str | None:
        """Resolve the effective Embedding API key with provider-specific fallback."""
        if self.EMBEDDING_API_KEY:
            return self.EMBEDDING_API_KEY
        provider = self.EMBEDDING_PROVIDER.strip().lower()
        if provider == "gemini":
            return self.GEMINI_API_KEY
        return self.OPENAI_API_KEY or self.GEMINI_API_KEY

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

