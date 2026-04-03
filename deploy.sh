#!/bin/bash
# deploy.sh — Deploy AskIEP to Cloud Run
# Usage: ./deploy.sh [all|api|ui]
set -euo pipefail

COMPONENT="${1:-all}"
REGION="us-central1"
PROJECT="askiep-production"
REPO="iep-apps"
TAG="prod-$(date +%Y%m%d-%H%M%S)"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${GREEN}[*] $*${NC}"; }
fail() { echo -e "${RED}[x] $*${NC}"; exit 1; }

# ── Setup ─────────────────────────────────────────────────────────────
gcloud config set project "$PROJECT" --quiet
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null

gcloud artifacts repositories describe "$REPO" --location="$REGION" &>/dev/null || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --quiet

# ── Deploy API ────────────────────────────────────────────────────────
deploy_api() {
  local IMAGE="${REGISTRY}/api:${TAG}"
  info "Building API: ${IMAGE}"
  gcloud builds submit ./api --tag="$IMAGE" --quiet

  info "Deploying API to Cloud Run"
  gcloud run deploy iep-api-production \
    --image="$IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --service-account="iep-api-production-sa@${PROJECT}.iam.gserviceaccount.com" \
    --add-cloudsql-instances="askiep-production:us-central1:iepdatabaseprod" \
    --memory=1Gi --cpu=1 \
    --min-instances=0 --max-instances=2 \
    --timeout=900 \
    --quiet

  info "API: $(gcloud run services describe iep-api-production --region=$REGION --format='value(status.url)')"
}

# ── Deploy UI ─────────────────────────────────────────────────────────
deploy_ui() {
  local IMAGE="${REGISTRY}/web:${TAG}"
  info "Building UI: ${IMAGE}"

  # Use Cloud Build with cloudbuild.yaml for build args
  gcloud builds submit ./app \
    --config=./app/cloudbuild.yaml \
    --substitutions="\
_IMAGE_NAME=${IMAGE},\
_VITE_BASE_API_URL=https://api.askiep.com,\
_VITE_FIREBASE_API_KEY=AIzaSyDrQiBnhw_WKdXqLGe1XCgNF-eB421J5MM,\
_VITE_FIREBASE_AUTH_DOMAIN=askiep-prod.firebaseapp.com,\
_VITE_FIREBASE_PROJECT_ID=askiep-prod,\
_VITE_FIREBASE_STORAGE_BUCKET=askiep-prod.firebasestorage.app,\
_VITE_FIREBASE_MESSAGING_SENDER_ID=215807505456,\
_VITE_FIREBASE_APP_ID=1:215807505456:web:459b836b54aa9f396f29f5,\
_VITE_FIREBASE_MEASUREMENT_ID=G-9KQ0QPXYD4,\
_VITE_RECAPTCHA_SITE_KEY=,\
_VITE_STRIPE_PUBLISHABLE_KEY=" \
    --quiet

  info "Deploying UI to Cloud Run"
  gcloud run deploy iep-web-production \
    --image="$IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi --cpu=1 \
    --min-instances=0 --max-instances=3 \
    --timeout=60 \
    --quiet

  info "UI: $(gcloud run services describe iep-web-production --region=$REGION --format='value(status.url)')"
}

# ── Run ───────────────────────────────────────────────────────────────
info "AskIEP Deploy: ${COMPONENT} (tag: ${TAG})"
case "$COMPONENT" in
  api) deploy_api ;;
  ui)  deploy_ui ;;
  all) deploy_api; deploy_ui ;;
  *)   fail "Usage: $0 [all|api|ui]" ;;
esac
info "Done!"
