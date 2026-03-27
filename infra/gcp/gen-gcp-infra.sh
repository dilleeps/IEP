#!/usr/bin/env bash
set -euo pipefail

# =========================
# GCP Infrastructure Setup
# =========================
# Sets up Artifact Registry for Docker images

# =========================
# Required inputs (env-based)
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID (e.g., export GCP_PROJECT_ID=xxx)}"
: "${GCP_REGION:?Set GCP_REGION (e.g., export GCP_REGION=us-central1)}"

# =========================
# Artifact Registry settings
# =========================
AR_REPO="${GCP_ARTIFACT_REPOSITORY:-iep-apps}"
AR_FORMAT="${AR_FORMAT:-docker}"

# =========================
# Helpers
# =========================
need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing command: $1" >&2; exit 1; }
}

ensure_api() {
  local api="$1"
  echo "[*] Enabling API: $api"
  gcloud services enable "$api" --project="$GCP_PROJECT_ID" --quiet
}

repo_exists() {
  gcloud artifacts repositories describe "$AR_REPO" \
    --location="$GCP_REGION" \
    --project="$GCP_PROJECT_ID" >/dev/null 2>&1
}

# =========================
# Main
# =========================
need_cmd gcloud

echo "=============================================="
echo "GCP Infrastructure Setup"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Region         : ${GCP_REGION}"
echo "  Artifact Repo  : ${AR_REPO} (${AR_FORMAT})"
echo "=============================================="
echo

# Enable required APIs
echo "==> Enabling GCP APIs"
ensure_api "artifactregistry.googleapis.com"
ensure_api "run.googleapis.com"
ensure_api "firebase.googleapis.com"
ensure_api "identitytoolkit.googleapis.com"
ensure_api "sqladmin.googleapis.com"
ensure_api "sql-component.googleapis.com"
ensure_api "storage.googleapis.com"
ensure_api "secretmanager.googleapis.com"
echo

# Artifact Registry
echo "==> Artifact Registry"
if repo_exists; then
  echo "✅ Repo exists: ${AR_REPO} (${GCP_REGION})"
else
  echo "[*] Creating Artifact Registry repo: ${AR_REPO}"
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format="$AR_FORMAT" \
    --location="$GCP_REGION" \
    --project="$GCP_PROJECT_ID" \
    --quiet
  echo "✅ Repo created: ${AR_REPO}"
fi
echo

# Output
echo "=============================================="
echo "✅ Infrastructure Setup Complete"
echo "=============================================="
echo
echo "Artifact Registry Docker Registry:"
echo "  ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
echo
echo "Next Steps:"
echo "  1. Manually create CloudSQL instance in GCP Console"
echo "  2. Run: task dev:db-connection (or prod:db-connection)"
echo "  3. Run: task deploy:secrets:api-dev (or prod)"
echo "  4. Deploy Cloud Run service"
echo "  5. After cloudrun deployed. Update domain mappings on https://console.cloud.google.com/run/domains?referrer=search&project=${GCP_PROJECT_ID}"
echo
echo "=============================================="
