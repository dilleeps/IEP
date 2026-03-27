#!/usr/bin/env bash
set -euo pipefail

# =========================
# Deploy Web App to GCP Cloud Run
# =========================
# Reads configuration from config/web.properties

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROPERTIES_FILE="${SCRIPT_DIR}/config/web.properties"

# =========================
# Required Environment Variables
# =========================
: "${GCP_SA_KEY_FILE_PATH:?Set GCP_SA_KEY_FILE_PATH (path to service account JSON key)}"
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION (e.g., us-central1)}"

# =========================
# Optional with defaults
# =========================
GCP_ARTIFACT_REPOSITORY="${GCP_ARTIFACT_REPOSITORY:-iep-apps}"

# =========================
# Validation
# =========================
if [[ ! -f "$PROPERTIES_FILE" ]]; then
  echo "❌ Properties file not found: $PROPERTIES_FILE" >&2
  exit 1
fi

# =========================
# Helpers
# =========================
need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing command: $1" >&2; exit 1; }
}

load_and_expand_properties() {
  local props_file="$1"
  echo "[*] Loading properties from: $props_file"
  
  # Source the properties file to expand variables
  set -a  # automatically export all variables
  source "$props_file"
  set +a
  
  echo "✅ Properties loaded"
}

build_env_vars_string() {
  local props_file="$1"
  local env_vars=""
  
  # Read each line from properties file
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Trim whitespace
    key="$(echo "$key" | xargs)"
    value="$(echo "$value" | xargs)"
    
    # Expand the value (evaluate $VAR references)
    expanded_value="$(eval echo "$value")"
    
    if [[ -n "$env_vars" ]]; then
      env_vars="${env_vars},${key}=${expanded_value}"
    else
      env_vars="${key}=${expanded_value}"
    fi
  done < "$props_file"
  
  echo "$env_vars"
}

build_docker_build_args() {
  local props_file="$1"
  local build_args=""
  
  # Read each line from properties file
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Trim whitespace
    key="$(echo "$key" | xargs)"
    value="$(echo "$value" | xargs)"
    
    # Expand the value (evaluate $VAR references)
    expanded_value="$(eval echo "$value")"
    
    # Only add build args for VITE_ prefixed variables
    if [[ "$key" =~ ^VITE_ ]]; then
      build_args="${build_args} --build-arg ${key}=${expanded_value}"
    fi
  done < "$props_file"
  
  echo "$build_args"
}

# =========================
# Load properties
# =========================
load_and_expand_properties "$PROPERTIES_FILE"

# =========================
# Derived variables
# =========================
APP_DIR="apps/ui"
ENVIRONMENT="${APP_ENVIRONMENT:-dev}"
SERVICE_NAME="iep-web-${ENVIRONMENT}"

GIT_SHA="${GIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo "local")}"
IMAGE_TAG="${IMAGE_TAG:-${GIT_SHA}}"
IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY}/web:${IMAGE_TAG}"

# =========================
# Main
# =========================
echo "=============================================="
echo "Deploy Web App to GCP Cloud Run"
echo "  Properties     : ${PROPERTIES_FILE}"
echo "  Service Name   : ${SERVICE_NAME}"
echo "  App Dir        : ${APP_DIR}"
echo "  Image          : ${IMAGE_NAME}"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Region         : ${GCP_REGION}"
echo "=============================================="
echo

need_cmd gcloud
need_cmd docker

# Authenticate with GCP using service account
echo "[*] Authenticating with GCP..."
gcloud auth activate-service-account --key-file="${GCP_SA_KEY_FILE_PATH}"
gcloud config set project "${GCP_PROJECT_ID}"
echo "✅ Authenticated"
echo

# Configure Docker for Artifact Registry
echo "[*] Configuring Docker for Artifact Registry..."
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
echo "✅ Docker configured"
echo

# Ensure Artifact Registry repository exists
echo "[*] Ensuring Artifact Registry repository exists..."
if gcloud artifacts repositories describe "${GCP_ARTIFACT_REPOSITORY}" \
  --location="${GCP_REGION}" >/dev/null 2>&1; then
  echo "✅ Repository exists: ${GCP_ARTIFACT_REPOSITORY}"
else
  echo "[*] Creating repository: ${GCP_ARTIFACT_REPOSITORY}"
  gcloud artifacts repositories create "${GCP_ARTIFACT_REPOSITORY}" \
    --repository-format=docker \
    --location="${GCP_REGION}" \
    --quiet
  echo "✅ Repository created"
fi
echo

# Build container image
echo "[*] Building container image..."

# Build Docker build args from properties (for VITE_ variables)
BUILD_ARGS="$(build_docker_build_args "$PROPERTIES_FILE")"

if [[ -n "$BUILD_ARGS" ]]; then
  echo "[*] Using build args: $BUILD_ARGS"
  docker build $BUILD_ARGS -t "${IMAGE_NAME}" "${APP_DIR}"
else
  docker build -t "${IMAGE_NAME}" "${APP_DIR}"
fi

echo "✅ Image built: ${IMAGE_NAME}"
echo

# Push container image
echo "[*] Pushing container image..."
docker push "${IMAGE_NAME}"
echo "✅ Image pushed"
echo

# Verify image exists in registry before deploying
echo "[*] Verifying image in Artifact Registry..."
if ! gcloud artifacts docker images describe "${IMAGE_NAME}" --quiet >/dev/null 2>&1; then
  echo "❌ Image verification failed: ${IMAGE_NAME} not found in Artifact Registry" >&2
  exit 1
fi
echo "✅ Image verified in registry"
echo

# Deploy to Cloud Run
echo "[*] Deploying to Cloud Run..."

# Build env vars string from properties file
ENV_VARS="$(build_env_vars_string "$PROPERTIES_FILE")"

echo "[*] Environment variables: ${ENV_VARS}"

gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_NAME}" \
  --region="${GCP_REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="${ENV_VARS}" \
  --quiet

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${GCP_REGION}" \
  --format='value(status.url)')"

echo
echo "=============================================="
echo "✅ Deployment successful!"
echo "🔗 Service URL: ${SERVICE_URL}"
echo "=============================================="
