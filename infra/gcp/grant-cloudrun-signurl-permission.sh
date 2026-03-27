#!/usr/bin/env bash
set -euo pipefail

# =========================
# Grant Cloud Run service account permission to create signed URLs
# =========================
# This is separate from the CI/CD deployer service account
# The Cloud Run app needs this to generate GCS signed URLs at runtime

# =========================
# Required environment variables
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${CLOUD_RUN_SERVICE_NAME:?Set CLOUD_RUN_SERVICE_NAME (e.g., iep-api-dev)}"

GCP_REGION="${GCP_REGION:-us-central1}"

echo "=============================================="
echo "Grant Cloud Run Signed URL Permission"
echo "  Project : ${GCP_PROJECT_ID}"
echo "  Service : ${CLOUD_RUN_SERVICE_NAME}"
echo "  Region  : ${GCP_REGION}"
echo "=============================================="
echo

# =========================
# Get the Cloud Run service account
# =========================
echo "[*] Fetching Cloud Run service account..."
SERVICE_ACCOUNT=$(gcloud run services describe "$CLOUD_RUN_SERVICE_NAME" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "⚠️  No custom service account found. Cloud Run is using default compute service account."
  SERVICE_ACCOUNT="${GCP_PROJECT_ID}@appspot.gserviceaccount.com"
  echo "    Using: $SERVICE_ACCOUNT"
else
  echo "✅ Found service account: $SERVICE_ACCOUNT"
fi

# =========================
# Grant self-signing permission for signed URLs
# =========================
echo
echo "[*] Granting iam.serviceAccountTokenCreator role (for signed URL generation)..."
gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="$GCP_PROJECT_ID" \
  --quiet

echo "✅ Permission granted!"

# =========================
# Verify permission
# =========================
echo
echo "[*] Verifying permission..."
gcloud iam service-accounts get-iam-policy "$SERVICE_ACCOUNT" \
  --project="$GCP_PROJECT_ID" \
  --format=json | grep -q "serviceAccountTokenCreator" && {
  echo "✅ Verification successful - serviceAccountTokenCreator role is active"
} || {
  echo "⚠️  Verification failed - role may take a few seconds to propagate"
}

echo
echo "=============================================="
echo "✅ Done!"
echo "=============================================="
echo "The Cloud Run service can now create signed URLs for GCS."
echo
echo "Service Account: $SERVICE_ACCOUNT"
echo "Permission: roles/iam.serviceAccountTokenCreator"
echo
echo "If you still get 'signBlob' errors, redeploy the service:"
echo "  gcloud run services update $CLOUD_RUN_SERVICE_NAME --region=$GCP_REGION"
echo
