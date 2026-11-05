"""FastAPI application entrypoint wiring middleware, exception handlers, and v1 routers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.config import get_settings
from src.presentation.api.v1 import api_v1_router
from src.presentation.middleware import (
    CorrelationAndSecurityMiddleware,
    register_exception_handlers,
)


def create_app() -> FastAPI:
    """Construct and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    )

    # Strict CORS configuration (no wildcard origins allowed)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Correlation-ID"],
        expose_headers=["X-Correlation-ID"],
    )

    app.add_middleware(CorrelationAndSecurityMiddleware)
    register_exception_handlers(app)

    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()

