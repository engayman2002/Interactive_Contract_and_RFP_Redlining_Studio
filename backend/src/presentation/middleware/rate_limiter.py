"""Configurable sliding-window rate-limiting middleware for Phase 7 Production Hardening."""

import math
import time
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.infrastructure.config import get_settings

_REQUEST_WINDOWS: dict[str, deque[float]] = defaultdict(deque)


def reset_rate_limiter_state() -> None:
    """Clear all in-memory sliding-window counters (used in deterministic tests)."""
    _REQUEST_WINDOWS.clear()


def _resolve_client_key(request: Request) -> str:
    """Identify the caller bucket by explicit client header, auth token hash, or client IP."""
    explicit_client = request.headers.get("X-Client-ID", "").strip()
    if explicit_client:
        return f"client:{explicit_client[:64]}"
    auth_header = request.headers.get("Authorization", "").strip()
    if auth_header:
        return f"auth:{auth_header[-32:]}"
    client_host = request.client.host if request.client else "127.0.0.1"
    return f"ip:{client_host}"


class SlidingWindowRateLimitMiddleware(BaseHTTPMiddleware):
    """Enforce per-client sliding-window request rate limits with `429 Too Many Requests`."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        max_requests = settings.RATE_LIMIT_REQUESTS_PER_MINUTE
        window_seconds = float(settings.RATE_LIMIT_WINDOW_SECONDS)
        now = time.monotonic()
        cutoff = now - window_seconds

        client_key = _resolve_client_key(request)
        bucket = _REQUEST_WINDOWS[client_key]

        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= max_requests:
            oldest = bucket[0]
            retry_after = max(1, math.ceil((oldest + window_seconds) - now))
            corr_id = getattr(request.state, "correlation_id", "")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                },
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": (
                            f"Rate limit of {max_requests} requests per "
                            f"{int(window_seconds)}s exceeded. Please retry later."
                        ),
                        "correlation_id": corr_id,
                    }
                },
            )

        bucket.append(now)
        remaining = max(0, max_requests - len(bucket))
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


__all__ = [
    "SlidingWindowRateLimitMiddleware",
    "reset_rate_limiter_state",
]

