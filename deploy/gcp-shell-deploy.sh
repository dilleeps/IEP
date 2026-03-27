#!/usr/bin/env bash
set -euo pipefail

# =============================================================
# AskIEP Production Deployment — GCP Cloud Shell
# =============================================================
# One-command deploy: clones repo, builds, pushes, and deploys
# to GCP Cloud Run with all required environment variables.
#
# Usage (from GCP Cloud Shell):
#   1. Open https://shell.cloud.google.com
#   2. Export your GitHub PAT:
#        export GITHUB_PAT="ghp_xxxx"
#   3. Clone & deploy (use x-access-token format so git reads the PAT from the URL):
#        git -c credential.helper= clone https://x-access-token:${GITHUB_PAT}@github.com/ASKIEP/iepapp.git && cd iepapp
#        bash deploy/gcp-shell-deploy.sh [api|ui|all]
#
# The script reads secrets from .env.production at the repo root.
# All VITE_* vars are passed as Docker build args to the UI.
# All API env vars are passed to Cloud Run via --set-env-vars.
# =============================================================

COMPONENT="${1:-all}"
REGION="us-central1"
PROJECT="askiep-production"
REPO="iep-apps"
TAG="prod-$(date +%Y%m%d-%H%M%S)"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"
ENV_FILE=".env.production"

# ---- Colors ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()  { echo -e "${GREEN}[*] $*${NC}"; }
warn()  { echo -e "${YELLOW}[!] $*${NC}"; }
fail()  { echo -e "${RED}[x] $*${NC}"; exit 1; }

# ---- Helper: read a value from .env.production ----
env_val() {
  local key="$1"
  local val
  val=$(grep -E "^${key}=" "${ENV_FILE}" | head -1 | cut -d'=' -f2-)
  echo "${val}"
}

# ---- Pre-checks ----
command -v gcloud >/dev/null || fail "gcloud not found"
command -v docker >/dev/null || fail "docker not found"
[[ -f apps/api/Dockerfile ]] || fail "Run this from the repo root (iepapp/)"
[[ -f "${ENV_FILE}" ]] || fail "${ENV_FILE} not found — secrets are required for deployment"

# ---- Load env values ----
info "Loading secrets from ${ENV_FILE}"

# --- UI build args (VITE_*) ---
VITE_BASE_API_URL="$(env_val VITE_BASE_API_URL)"
VITE_FIREBASE_API_KEY="$(env_val VITE_FIREBASE_API_KEY)"
VITE_FIREBASE_AUTH_DOMAIN="$(env_val VITE_FIREBASE_AUTH_DOMAIN)"
VITE_FIREBASE_PROJECT_ID="$(env_val VITE_FIREBASE_PROJECT_ID)"
VITE_FIREBASE_STORAGE_BUCKET="$(env_val VITE_FIREBASE_STORAGE_BUCKET)"
VITE_FIREBASE_MESSAGING_SENDER_ID="$(env_val VITE_FIREBASE_MESSAGING_SENDER_ID)"
VITE_FIREBASE_APP_ID="$(env_val VITE_FIREBASE_APP_ID)"
VITE_FIREBASE_MEASUREMENT_ID="$(env_val VITE_FIREBASE_MEASUREMENT_ID)"
VITE_RECAPTCHA_SITE_KEY="$(env_val VITE_RECAPTCHA_SITE_KEY)"
VITE_STRIPE_PUBLISHABLE_KEY="$(env_val VITE_STRIPE_PUBLISHABLE_KEY)"

# --- API env vars ---
JWT_SECRET="$(env_val JWT_SECRET)"
JWT_EXPIRATION_TIME_IN_MINUTES="$(env_val JWT_EXPIRATION_TIME_IN_MINUTES)"
APP_ENVIRONMENT="$(env_val APP_ENVIRONMENT)"
API_SERVER_PORT="$(env_val API_SERVER_PORT)"

# Database
POSTGRES_HOST="$(env_val POSTGRES_HOST)"
POSTGRES_PORT="$(env_val POSTGRES_PORT)"
POSTGRES_DB="$(env_val POSTGRES_DB)"
POSTGRES_USER="$(env_val POSTGRES_USER)"
POSTGRES_PASSWORD="$(env_val POSTGRES_PASSWORD)"
POSTGRES_SSL_MODE="$(env_val POSTGRES_SSL_MODE)"
CLOUDSQL_CONNECTION_NAME="$(env_val CLOUDSQL_CONNECTION_NAME)"

# reCAPTCHA
RECAPTCHA_SECRET="$(env_val RECAPTCHA_SECRET)"
RECAPTCHA_MIN_SCORE="$(env_val RECAPTCHA_MIN_SCORE)"

# Email (Azure/Microsoft Graph)
AZURE_TENANT_ID="$(env_val AZURE_TENANT_ID)"
AZURE_CLIENT_ID="$(env_val AZURE_CLIENT_ID)"
AZURE_CLIENT_SECRET="$(env_val AZURE_CLIENT_SECRET)"
FROM_EMAIL_ADDRESS="$(env_val FROM_EMAIL_ADDRESS)"
NOTIFY_EMAILS="$(env_val NOTIFY_EMAILS)"

# Legacy SES (optional)
SES_IAM_USER="$(env_val SES_IAM_USER)"
SES_SMTP_HOST="$(env_val SES_SMTP_HOST)"
SES_SMTP_USER="$(env_val SES_SMTP_USER)"
SES_SMTP_PASS="$(env_val SES_SMTP_PASS)"

# Telegram
TELEGRAM_API_KEY="$(env_val TELEGRAM_API_KEY)"
TELEGRAM_CHAT_ID="$(env_val TELEGRAM_CHAT_ID)"

# Cloud Storage
GCS_BUCKET="$(env_val GCS_BUCKET)"
GCS_CONFIG_BUCKET="$(env_val GCS_CONFIG_BUCKET)"
APPFILE_GCP_SERVICE_ACCOUNT_FILE="$(env_val APPFILE_GCP_SERVICE_ACCOUNT_FILE)"
APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE="$(env_val APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE)"
ENABLE_S3="$(env_val ENABLE_S3)"
LOCAL_BASE_FOLDER="$(env_val LOCAL_BASE_FOLDER)"
CONFIG_SOURCE_FOLDER="$(env_val CONFIG_SOURCE_FOLDER)"

# AI / Gemini
GEMINI_API_KEY="$(env_val GEMINI_API_KEY)"
GEMINI_MODEL="$(env_val GEMINI_MODEL)"
AI_MODEL="$(env_val AI_MODEL)"
AI_TEMPERATURE="$(env_val AI_TEMPERATURE)"

# Encryption
CONFIG_ENCRYPTION_KEY="$(env_val CONFIG_ENCRYPTION_KEY)"

info "Secrets loaded"

# ---- GCP Auth ----
info "Setting project to ${PROJECT}"
gcloud config set project "${PROJECT}" --quiet

info "Configuring Docker for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ---- Ensure Artifact Registry repo exists ----
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" &>/dev/null; then
  info "Creating Artifact Registry repository: ${REPO}"
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker --location="${REGION}" --quiet
fi

# =============================================================
# Verify image helper
# =============================================================
verify_image() {
  local image="$1"
  info "Verifying image exists in Artifact Registry"
  if ! gcloud artifacts docker images describe "${image}" --quiet &>/dev/null; then
    fail "Image push verification failed: ${image} not found in Artifact Registry"
  fi
  info "Image verified in registry"
}

# =============================================================
# Deploy API
# =============================================================
deploy_api() {
  local IMAGE="${REGISTRY}/api:${TAG}"
  info "Building API image: ${IMAGE}"
  docker build -t "${IMAGE}" apps/api

  info "Pushing API image"
  docker push "${IMAGE}"

  verify_image "${IMAGE}"

  info "Deploying API to Cloud Run"
  gcloud run deploy iep-api-production \
    --image="${IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --service-account="iep-api-production-sa@${PROJECT}.iam.gserviceaccount.com" \
    --add-cloudsql-instances="${CLOUDSQL_CONNECTION_NAME}" \
    --memory=1Gi --cpu=1 \
    --min-instances=0 --max-instances=2 \
    --timeout=900 \
    --set-env-vars="NODE_ENV=production,\
SERVER_PORT=3000,\
API_SERVER_PORT=${API_SERVER_PORT:-8080},\
GCP_PROJECT_ID=${PROJECT},\
APP_ENVIRONMENT=${APP_ENVIRONMENT:-production},\
JWT_SECRET=${JWT_SECRET},\
JWT_EXPIRATION_TIME_IN_MINUTES=${JWT_EXPIRATION_TIME_IN_MINUTES:-60},\
POSTGRES_HOST=${POSTGRES_HOST:-127.0.0.1},\
POSTGRES_PORT=${POSTGRES_PORT:-5432},\
POSTGRES_DB=${POSTGRES_DB},\
POSTGRES_USER=${POSTGRES_USER},\
POSTGRES_PASSWORD=${POSTGRES_PASSWORD},\
POSTGRES_SSL_MODE=${POSTGRES_SSL_MODE:-verify-ca},\
CLOUDSQL_CONNECTION_NAME=${CLOUDSQL_CONNECTION_NAME},\
DB_SOCKET_PATH=/cloudsql/${CLOUDSQL_CONNECTION_NAME},\
RECAPTCHA_SECRET=${RECAPTCHA_SECRET},\
RECAPTCHA_MIN_SCORE=${RECAPTCHA_MIN_SCORE:-0.5},\
GEMINI_API_KEY=${GEMINI_API_KEY},\
GEMINI_MODEL=${GEMINI_MODEL:-gemini-flash-latest},\
AI_MODEL=${AI_MODEL:-gemini-flash-latest},\
AI_TEMPERATURE=${AI_TEMPERATURE:-0.3},\
AZURE_TENANT_ID=${AZURE_TENANT_ID},\
AZURE_CLIENT_ID=${AZURE_CLIENT_ID},\
AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET},\
FROM_EMAIL_ADDRESS=${FROM_EMAIL_ADDRESS},\
NOTIFY_EMAILS=${NOTIFY_EMAILS},\
TELEGRAM_API_KEY=${TELEGRAM_API_KEY},\
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID},\
GCS_BUCKET=${GCS_BUCKET},\
GCS_CONFIG_BUCKET=${GCS_CONFIG_BUCKET},\
CONFIG_ENCRYPTION_KEY=${CONFIG_ENCRYPTION_KEY},\
LOCAL_BASE_FOLDER=${LOCAL_BASE_FOLDER:-/tmp/iep-uploads},\
CONFIG_SOURCE_FOLDER=${CONFIG_SOURCE_FOLDER:-/tmp/iep-config},\
ENABLE_S3=${ENABLE_S3:-true},\
APPFILE_GCP_SERVICE_ACCOUNT_FILE=${APPFILE_GCP_SERVICE_ACCOUNT_FILE:-/etc/secrets/gcp/service-account.json},\
APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE=${APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE:-/etc/secrets/firebase/service-account.json}" \
    --quiet

  local URL
  URL=$(gcloud run services describe iep-api-production \
    --region="${REGION}" --format='value(status.url)')
  info "API deployed: ${URL}"
}

# =============================================================
# Deploy UI
# =============================================================
deploy_ui() {
  local IMAGE="${REGISTRY}/web:${TAG}"
  info "Building UI image: ${IMAGE}"
  docker build \
    --build-arg VITE_BASE_API_URL="${VITE_BASE_API_URL}" \
    --build-arg VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY}" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN}" \
    --build-arg VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID}" \
    --build-arg VITE_FIREBASE_STORAGE_BUCKET="${VITE_FIREBASE_STORAGE_BUCKET}" \
    --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
    --build-arg VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID}" \
    --build-arg VITE_FIREBASE_MEASUREMENT_ID="${VITE_FIREBASE_MEASUREMENT_ID}" \
    --build-arg VITE_RECAPTCHA_SITE_KEY="${VITE_RECAPTCHA_SITE_KEY}" \
    --build-arg VITE_STRIPE_PUBLISHABLE_KEY="${VITE_STRIPE_PUBLISHABLE_KEY}" \
    -t "${IMAGE}" apps/ui

  info "Pushing UI image"
  docker push "${IMAGE}"

  verify_image "${IMAGE}"

  info "Deploying UI to Cloud Run"
  gcloud run deploy iep-web-production \
    --image="${IMAGE}" \
    --region="${REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --quiet

  local URL
  URL=$(gcloud run services describe iep-web-production \
    --region="${REGION}" --format='value(status.url)')
  info "UI deployed: ${URL}"
}

# =============================================================
# Main
# =============================================================
echo ""
info "================================================"
info "  AskIEP Production Deploy"
info "  Component : ${COMPONENT}"
info "  Tag       : ${TAG}"
info "  Project   : ${PROJECT}"
info "  Region    : ${REGION}"
info "  Registry  : ${REGISTRY}"
info "================================================"
echo ""

case "${COMPONENT}" in
  api)  deploy_api ;;
  ui)   deploy_ui ;;
  all)  deploy_api; deploy_ui ;;
  *)    fail "Usage: $0 [api|ui|all]" ;;
esac

echo ""
info "Done!"
