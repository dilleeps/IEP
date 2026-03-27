#!/usr/bin/env bash
set -euo pipefail

# =========================
# Cloud SQL Auth Proxy Runner
# =========================
# Starts Cloud SQL Auth Proxy for secure local database access

# =========================
# Required environment variables
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
: "${INSTANCEID:?Set INSTANCEID (Cloud SQL instance name)}"

# =========================
# Optional settings
# =========================
PROXY_PORT="${PROXY_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-iep_database}"
POSTGRES_USER="${POSTGRES_USER:-iep_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

# Build connection name
CONNECTION_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${INSTANCEID}"

# =========================
# Check if cloud-sql-proxy is installed
# =========================
if ! command -v cloud-sql-proxy &> /dev/null; then
    echo "❌ cloud-sql-proxy not found"
    echo ""
    echo "Install it with:"
    echo "  brew install cloud-sql-proxy"
    echo ""
    echo "Or download from:"
    echo "  https://cloud.google.com/sql/docs/mysql/sql-proxy#install"
    exit 1
fi

echo "=============================================="
echo "Cloud SQL Auth Proxy"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Region         : ${GCP_REGION}"
echo "  Instance       : ${INSTANCEID}"
echo "  Connection     : ${CONNECTION_NAME}"
echo "  Local Port     : ${PROXY_PORT}"
echo "=============================================="
echo ""
echo "🔌 Starting proxy..."
echo ""

# Start the proxy
echo "Running: cloud-sql-proxy \"${CONNECTION_NAME}\" --port ${PROXY_PORT}"
echo ""
echo "📝 To connect, use:"
echo "  psql \"host=127.0.0.1 port=${PROXY_PORT} dbname=${POSTGRES_DB} user=${POSTGRES_USER}\""
echo ""
if [[ -n "$POSTGRES_PASSWORD" ]]; then
    echo "  Or with password:"
    echo "  PGPASSWORD='${POSTGRES_PASSWORD}' psql \"host=127.0.0.1 port=${PROXY_PORT} dbname=${POSTGRES_DB} user=${POSTGRES_USER}\""
    echo ""
fi
echo "Press Ctrl+C to stop the proxy"
echo "=============================================="
echo ""

# Run proxy (this blocks until Ctrl+C)
cloud-sql-proxy "${CONNECTION_NAME}" --port "${PROXY_PORT}"
