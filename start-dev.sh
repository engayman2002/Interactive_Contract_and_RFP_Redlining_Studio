#!/usr/bin/env bash
# Unified Development Launcher for Interactive Contract & RFP Redlining Studio
# Starts FastAPI Backend (http://127.0.0.1:8000) and Next.js Frontend (http://127.0.0.1:3000)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

UVICORN_BIN="${BACKEND_DIR}/.venv/bin/uvicorn"
if [[ ! -x "${UVICORN_BIN}" ]]; then
  if command -v uvicorn >/dev/null 2>&1; then
    UVICORN_BIN="$(command -v uvicorn)"
  else
    echo "[start-dev] ERROR: uvicorn not found in ${BACKEND_DIR}/.venv/bin or PATH."
    exit 1
  fi
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "[start-dev] Shutting down studio services..."
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo "[start-dev] Shutdown complete."
}

trap cleanup EXIT INT TERM

echo "[start-dev] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
(
  cd "${BACKEND_DIR}"
  exec "${UVICORN_BIN}" src.main:app --host 127.0.0.1 --port 8000 --reload
) &
BACKEND_PID=$!

# Wait briefly for backend health readiness before booting Next.js UI
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:8000/api/v1/health" >/dev/null 2>&1; then
    echo "[start-dev] FastAPI Backend ready (http://127.0.0.1:8000/api/v1/health)."
    break
  fi
  sleep 0.5
done

echo "[start-dev] Starting Next.js Frontend Studio on http://localhost:3000 ..."
(
  cd "${FRONTEND_DIR}"
  export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8000/api/v1}"
  export NEXT_PUBLIC_DEFAULT_DEMO_MODE="${NEXT_PUBLIC_DEFAULT_DEMO_MODE:-false}"
  exec node ./node_modules/.bin/next dev -p 3000
) &
FRONTEND_PID=$!

wait

