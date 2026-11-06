#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Interactive Contract & RFP Redlining Studio — Production Bootstrap Script
# Sets up directories, secrets (with 0644 permissions for UID 10001), and TLS certs.
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SECRETS_DIR="${PROJECT_ROOT}/deploy/secrets"
CERTS_DIR="${PROJECT_ROOT}/deploy/nginx/certs"

echo "=== Initializing Production Environment at: ${PROJECT_ROOT} ==="

mkdir -p "${SECRETS_DIR}" "${CERTS_DIR}"

# 1. Idempotently generate secrets only if they do not exist
if [ ! -f "${SECRETS_DIR}/jwt_secret_key.txt" ]; then
    openssl rand -hex 32 > "${SECRETS_DIR}/jwt_secret_key.txt"
    echo "  [+] Generated deploy/secrets/jwt_secret_key.txt"
else
    echo "  [=] Preserved existing deploy/secrets/jwt_secret_key.txt"
fi

if [ ! -f "${SECRETS_DIR}/postgres_password.txt" ]; then
    openssl rand -hex 24 > "${SECRETS_DIR}/postgres_password.txt"
    echo "  [+] Generated deploy/secrets/postgres_password.txt"
else
    echo "  [=] Preserved existing deploy/secrets/postgres_password.txt"
fi

for key_name in groq_api_key openai_api_key anthropic_api_key gemini_api_key; do
    file_path="${SECRETS_DIR}/${key_name}.txt"
    if [ ! -f "${file_path}" ]; then
        echo "local-only-placeholder" > "${file_path}"
        echo "  [+] Initialized deploy/secrets/${key_name}.txt (placeholder)"
    else
        echo "  [=] Preserved existing deploy/secrets/${key_name}.txt"
    fi
done

# 2. Set 0644 permissions so non-root container UID 10001 (redline) can read them
chmod 644 "${SECRETS_DIR}"/*.txt
echo "  [✓] Applied chmod 644 on deploy/secrets/*.txt (non-root UID 10001 readable)"

# 3. Idempotently generate self-signed TLS certificates for Nginx if absent
if [ ! -f "${CERTS_DIR}/privkey.pem" ] || [ ! -f "${CERTS_DIR}/fullchain.pem" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${CERTS_DIR}/privkey.pem" \
        -out "${CERTS_DIR}/fullchain.pem" \
        -subj "/CN=localhost" 2>/dev/null
    chmod 644 "${CERTS_DIR}/privkey.pem" "${CERTS_DIR}/fullchain.pem"
    echo "  [+] Generated self-signed TLS certificates in deploy/nginx/certs/"
else
    echo "  [=] Preserved existing TLS certificates in deploy/nginx/certs/"
fi

# 4. Initialize .env.production if not already present
if [ ! -f "${PROJECT_ROOT}/.env.production" ]; then
    cp "${PROJECT_ROOT}/.env.production.example" "${PROJECT_ROOT}/.env.production"
    echo "  [+] Created .env.production from .env.production.example"
else
    echo "  [=] Preserved existing .env.production"
fi

echo ""
echo "=== Bootstrap Complete! Next Steps to Run Single-Node Production Stack ==="
echo ""
echo "1. Build and start the production stack:"
echo "   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build"
echo ""
echo "2. Apply database migrations inside the backend container:"
echo "   docker compose --env-file .env.production -f docker-compose.prod.yml exec backend alembic upgrade head"
echo ""
echo "3. Verify API and Nginx readiness:"
echo "   curl -k -fsS https://127.0.0.1/api/v1/health"
echo ""
