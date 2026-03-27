#!/usr/bin/env bash
set -euo pipefail

# =========================
# Deploy Postgres SSL Certificates to GCP Secret Manager
# =========================
# Creates/updates secrets and grants Cloud Run service account access

# =========================
# Required environment variables
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
: "${CLOUD_RUN_SERVICE_NAME:?Set CLOUD_RUN_SERVICE_NAME (e.g., iep-api-dev)}"

# =========================
# Optional (with defaults)
# =========================
PG_CA_CERT_PATH="${PG_CA_CERT_PATH:-~/.iepconfig/certs/gcp/postgres/ca.crt}"
PG_CLIENT_CERT_PATH="${PG_CLIENT_CERT_PATH:-~/.iepconfig/certs/gcp/postgres/client.crt}"
PG_KEY_CERT_PATH="${PG_KEY_CERT_PATH:-~/.iepconfig/certs/gcp/postgres/client.key}"
SECRET_CA_NAME="${SECRET_CA_NAME:-postgres-ca-cert}"
SECRET_CLIENT_CERT_NAME="${SECRET_CLIENT_CERT_NAME:-postgres-client-cert}"
SECRET_CLIENT_KEY_NAME="${SECRET_CLIENT_KEY_NAME:-postgres-client-key}"

# Expand tilde in paths
PG_CA_CERT_PATH="${PG_CA_CERT_PATH/#\~/$HOME}"
PG_CLIENT_CERT_PATH="${PG_CLIENT_CERT_PATH/#\~/$HOME}"
PG_KEY_CERT_PATH="${PG_KEY_CERT_PATH/#\~/$HOME}"

echo "=============================================="
echo "Deploy Postgres SSL Certificates to Secrets"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Region         : ${GCP_REGION}"
echo "  Service        : ${CLOUD_RUN_SERVICE_NAME}"
echo "=============================================="
echo

# =========================
# Helper functions
# =========================
secret_exists() {
  gcloud secrets describe "$1" --project="$GCP_PROJECT_ID" >/dev/null 2>&1
}

create_or_update_secret() {
  local secret_name="$1"
  local file_path="$2"
  
  if [[ ! -f "$file_path" ]]; then
    echo "❌ File not found: $file_path" >&2
    return 1
  fi
  
  if secret_exists "$secret_name"; then
    echo "[*] Updating secret: $secret_name"
    gcloud secrets versions add "$secret_name" \
      --data-file="$file_path" \
      --project="$GCP_PROJECT_ID"
    echo "✅ Updated: $secret_name"
  else
    echo "[*] Creating secret: $secret_name"
    gcloud secrets create "$secret_name" \
      --data-file="$file_path" \
      --project="$GCP_PROJECT_ID"
    echo "✅ Created: $secret_name"
  fi
}

# =========================
# Create/Update Secrets
# =========================
echo "==> Creating/Updating Secrets"
create_or_update_secret "$SECRET_CA_NAME" "$PG_CA_CERT_PATH"
create_or_update_secret "$SECRET_CLIENT_CERT_NAME" "$PG_CLIENT_CERT_PATH"
create_or_update_secret "$SECRET_CLIENT_KEY_NAME" "$PG_KEY_CERT_PATH"
echo

# =========================
# Grant Cloud Run Service Account Access
# =========================
echo "==> Granting Service Account Access"
echo "[*] Getting service account for: $CLOUD_RUN_SERVICE_NAME"
SERVICE_ACCOUNT=$(gcloud run services describe "$CLOUD_RUN_SERVICE_NAME" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")

if [[ -z "$SERVICE_ACCOUNT" ]]; then
  echo "⚠️  Service not found or no service account configured"
  echo "    You'll need to grant access manually or after service is deployed"
  echo "    Run this script again after deploying the service"
else
  echo "    Service Account: $SERVICE_ACCOUNT"
  echo
  
  for SECRET in "$SECRET_CA_NAME" "$SECRET_CLIENT_CERT_NAME" "$SECRET_CLIENT_KEY_NAME"; do
    echo "[*] Granting access to: $SECRET"
    gcloud secrets add-iam-policy-binding "$SECRET" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="roles/secretmanager.secretAccessor" \
      --project="$GCP_PROJECT_ID" \
      --quiet
    echo "✅ Access granted"
  done
fi
echo

echo "✅ Secret deployment complete!"
echo
echo "📋 Secret paths in Cloud Run:"
echo "  POSTGRES_SSL_CA=/etc/secrets/postgres/ca.crt"
echo "  POSTGRES_SSL_CERT=/etc/secrets/postgres/client.crt"
echo "  POSTGRES_SSL_KEY=/etc/secrets/postgres/client.key"