#!/bin/bash
# deploy.sh — Deploy AskIEP API and/or UI to Google Cloud Run
#
# Usage:
#   ./deploy.sh all    # Deploy both API and UI
#   ./deploy.sh api    # Deploy API only
#   ./deploy.sh ui     # Deploy UI only
#
# For UI deployment, create a .env.deploy file in the repo root:
#   VITE_BASE_API_URL=https://api.askiep.com
#   VITE_FIREBASE_API_KEY=AIza...
#   VITE_FIREBASE_AUTH_DOMAIN=askiep-production.firebaseapp.com
#   VITE_FIREBASE_PROJECT_ID=askiep-production
#   VITE_FIREBASE_STORAGE_BUCKET=askiep-production.appspot.com
#   VITE_FIREBASE_MESSAGING_SENDER_ID=...
#   VITE_FIREBASE_APP_ID=...
#   VITE_FIREBASE_MEASUREMENT_ID=...
#   VITE_RECAPTCHA_SITE_KEY=...
#   VITE_STRIPE_PUBLISHABLE_KEY=...

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────
PROJECT_ID="askiep-production"
REGION="us-central1"
AR_REPO="iep-apps"

API_SERVICE="iep-api-production"
API_SA="iep-api-production-sa@${PROJECT_ID}.iam.gserviceaccount.com"
API_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api:latest"

UI_SERVICE="iep-web-production"
UI_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/web:latest"

CLOUDSQL="askiep-production:us-central1:iepdatabaseprod"

TARGET="${1:-all}"

if [[ "$TARGET" != "all" && "$TARGET" != "api" && "$TARGET" != "ui" ]]; then
  echo "Usage: ./deploy.sh [all|api|ui]"
  exit 1
fi

echo "=== AskIEP Deployment ($TARGET) ==="

# ── Setup ─────────────────────────────────────────────────────────────
gcloud config set project "$PROJECT_ID" --quiet
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null

# ── Deploy API ────────────────────────────────────────────────────────
deploy_api() {
  echo ""
  echo "--- [1/2] Building API image ---"
  gcloud builds submit ./api --tag="$API_IMAGE" --quiet

  echo "--- [2/2] Deploying API to Cloud Run ---"
  gcloud run deploy "$API_SERVICE" \
    --image="$API_IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --service-account="$API_SA" \
    --add-cloudsql-instances="$CLOUDSQL" \
    --memory=1Gi --cpu=1 \
    --min-instances=0 --max-instances=2 \
    --timeout=900 \
    --quiet

  echo "API: $(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)')"
}

# ── Deploy UI ─────────────────────────────────────────────────────────
deploy_ui() {
  # Load env vars from .env.deploy
  if [ -z "${VITE_FIREBASE_API_KEY:-}" ]; then
    if [ -f ".env.deploy" ]; then
      echo "Loading UI env vars from .env.deploy..."
      set -a; source .env.deploy; set +a
    else
      echo "ERROR: Firebase keys not set."
      echo "Create .env.deploy in repo root (see comments at top of this script)."
      exit 1
    fi
  fi

  echo ""
  echo "--- [1/2] Building UI image (Cloud Build) ---"
  gcloud builds submit ./app \
    --config=./app/cloudbuild.yaml \
    --substitutions="\
_IMAGE_NAME=${UI_IMAGE},\
_VITE_BASE_API_URL=${VITE_BASE_API_URL:-https://api.askiep.com},\
_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},\
_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},\
_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},\
_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET:-},\
_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID:-},\
_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID},\
_VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID:-},\
_VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY:-},\
_VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY:-}" \
    --quiet

  echo "--- [2/2] Deploying UI to Cloud Run ---"
  gcloud run deploy "$UI_SERVICE" \
    --image="$UI_IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=256Mi --cpu=1 \
    --min-instances=0 --max-instances=3 \
    --timeout=60 \
    --quiet

  echo "UI: $(gcloud run services describe $UI_SERVICE --region=$REGION --format='value(status.url)')"
}

# ── Run ───────────────────────────────────────────────────────────────
if [[ "$TARGET" == "all" || "$TARGET" == "api" ]]; then
  deploy_api
fi

if [[ "$TARGET" == "all" || "$TARGET" == "ui" ]]; then
  deploy_ui
fi

echo ""
echo "=== Deployment complete ==="
