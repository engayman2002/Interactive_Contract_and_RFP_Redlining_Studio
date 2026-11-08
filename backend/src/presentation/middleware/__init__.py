"""Global exception handlers, request correlation ID middleware, and security headers."""

import logging
from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from typing import Final
from uuid import uuid4

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.domain.exceptions import (
    ConcurrencyConflictError,
    DomainError,
    DomainValidationError,
    DuplicateEntityError,
    EntityNotFoundError,
    ForbiddenRoleError,
    InvalidAIVaultError,
    TenantIsolationError,
    UnauthorizedError,
)

logger = logging.getLogger(__name__)

correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")

ALLOWED_HTTP_METHODS: Final[frozenset[str]] = frozenset(
    {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}
)

DOMAIN_ERROR_STATUS_MAP: Final[dict[type[DomainError], int]] = {
    InvalidAIVaultError: status.HTTP_400_BAD_REQUEST,
    UnauthorizedError: status.HTTP_401_UNAUTHORIZED,
    ForbiddenRoleError: status.HTTP_403_FORBIDDEN,
    TenantIsolationError: status.HTTP_403_FORBIDDEN,
    EntityNotFoundError: status.HTTP_404_NOT_FOUND,
    ConcurrencyConflictError: status.HTTP_409_CONFLICT,
    DuplicateEntityError: status.HTTP_409_CONFLICT,
    DomainValidationError: status.HTTP_422_UNPROCESSABLE_CONTENT,
}


class CorrelationAndSecurityMiddleware(BaseHTTPMiddleware):
    """Attach correlation IDs, enforce HTTP method allow-list, and apply security headers.

    TODO(security): Add distributed Redis sliding-window rate limiter per IP and tenant org_id.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        raw_corr_id = request.headers.get("X-Correlation-ID", "").strip()
        # Sanitize correlation ID to alphanumeric + hyphens only to prevent header injection
        is_valid_corr = (
            bool(raw_corr_id)
            and all(c.isalnum() or c == "-" for c in raw_corr_id)
            and len(raw_corr_id) <= 64
        )
        corr_id = raw_corr_id if is_valid_corr else str(uuid4())

        token = correlation_id_ctx.set(corr_id)
        request.state.correlation_id = corr_id

        try:
            if request.method.upper() not in ALLOWED_HTTP_METHODS:
                response: Response = JSONResponse(
                    status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                    content={
                        "error": {
                            "code": "METHOD_NOT_ALLOWED",
                            "message": f"HTTP method '{request.method}' is not permitted.",
                            "correlation_id": corr_id,
                        }
                    },
                )
            else:
                response = await call_next(request)
        finally:
            correlation_id_ctx.reset(token)

        response.headers["X-Correlation-ID"] = corr_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
        )
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = "no-store"
        return response


def _resolve_status_code(exc: DomainError) -> int:
    for error_cls, http_status in DOMAIN_ERROR_STATUS_MAP.items():
        if isinstance(exc, error_cls):
            return http_status
    return status.HTTP_422_UNPROCESSABLE_CONTENT


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers mapping DomainError and database errors safely."""

    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        corr_id = getattr(request.state, "correlation_id", "") or correlation_id_ctx.get()
        status_code = _resolve_status_code(exc)
        headers: dict[str, str] = {"X-Correlation-ID": corr_id} if corr_id else {}
        if status_code == status.HTTP_401_UNAUTHORIZED:
            headers["WWW-Authenticate"] = "Bearer"

        return JSONResponse(
            status_code=status_code,
            headers=headers,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "correlation_id": corr_id,
                }
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def handle_database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        corr_id = getattr(request.state, "correlation_id", "") or correlation_id_ctx.get()
        logger.error("Database error occurred [correlation_id=%s]: %s", corr_id, type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers={"X-Correlation-ID": corr_id} if corr_id else {},
            content={
                "error": {
                    "code": "INTERNAL_DATABASE_ERROR",
                    "message": "An unexpected database error occurred.",
                    "correlation_id": corr_id,
                }
            },
        )


from src.presentation.middleware.rate_limiter import (  # noqa: E402
    SlidingWindowRateLimitMiddleware,
    reset_rate_limiter_state,
)

__all__ = [
    "ALLOWED_HTTP_METHODS",
    "CorrelationAndSecurityMiddleware",
    "DOMAIN_ERROR_STATUS_MAP",
    "SlidingWindowRateLimitMiddleware",
    "correlation_id_ctx",
    "register_exception_handlers",
    "reset_rate_limiter_state",
]
