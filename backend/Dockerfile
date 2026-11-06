# syntax=docker/dockerfile:1.7
# =============================================================================
# Stage 1: Builder — Install Python 3.12 dependencies into an isolated venv
# =============================================================================
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
COPY src ./src
RUN pip install --upgrade pip && pip install .

# =============================================================================
# Stage 2: Production Runtime — Minimal non-root image
# =============================================================================
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    APP_ENV="production" \
    HOST="0.0.0.0" \
    PORT="8000"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 redline \
    && useradd --uid 10001 --gid redline --shell /bin/false --create-home redline \
    && mkdir -p /var/lib/redlining_studio/storage \
    && chown -R redline:redline /app /var/lib/redlining_studio

COPY --from=builder /opt/venv /opt/venv
COPY --chown=redline:redline alembic.ini ./alembic.ini
COPY --chown=redline:redline src ./src

USER redline

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v1/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]

