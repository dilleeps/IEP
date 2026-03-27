#!/usr/bin/env bash
set -euo pipefail

# =========================
# Upload Files to GCP Storage Bucket
# =========================
# Uploads files or directories to a GCP bucket with optional configurations

# =========================
# Required environment variables
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_BUCKET_NAME:?Set GCP_BUCKET_NAME (e.g., askiepconfig)}"

# =========================
# Optional (with defaults)
# =========================
GCP_REGION="${GCP_REGION:-us-central1}"
SOURCE_PATH="${SOURCE_PATH:-.}"
DESTINATION_PATH="${DESTINATION_PATH:-}"
MAKE_PUBLIC="${MAKE_PUBLIC:-false}"
CONTENT_TYPE="${CONTENT_TYPE:-}"
CACHE_CONTROL="${CACHE_CONTROL:-}"
RECURSIVE="${RECURSIVE:-false}"
OVERWRITE="${OVERWRITE:-true}"

# Expand tilde in paths
SOURCE_PATH="${SOURCE_PATH/#\~/$HOME}"

echo "=============================================="
echo "Upload Files to GCP Storage Bucket"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Region         : ${GCP_REGION}"
echo "  Bucket         : ${GCP_BUCKET_NAME}"
echo "  Source         : ${SOURCE_PATH}"
echo "  Destination    : ${DESTINATION_PATH:-/}"
echo "  Make Public    : ${MAKE_PUBLIC}"
echo "  Recursive      : ${RECURSIVE}"
echo "=============================================="
echo

# =========================
# Helper functions
# =========================
bucket_exists() {
  gsutil ls -p "$GCP_PROJECT_ID" "gs://${GCP_BUCKET_NAME}" >/dev/null 2>&1
}

create_bucket() {
  echo "[*] Creating bucket: gs://${GCP_BUCKET_NAME}"
  gcloud storage buckets create "gs://${GCP_BUCKET_NAME}" \
    --project="$GCP_PROJECT_ID" \
    --location="$GCP_REGION" \
    --uniform-bucket-level-access
  echo "✅ Bucket created"
}

upload_file() {
  local source="$1"
  local destination="$2"
  local upload_cmd="gsutil"
  
  # Build upload command
  if [[ "$RECURSIVE" == "true" ]]; then
    upload_cmd="$upload_cmd -m cp -r"
  else
    upload_cmd="$upload_cmd cp"
  fi
  
  # Add content type if specified
  if [[ -n "$CONTENT_TYPE" ]]; then
    upload_cmd="$upload_cmd -h \"Content-Type:${CONTENT_TYPE}\""
  fi
  
  # Add cache control if specified
  if [[ -n "$CACHE_CONTROL" ]]; then
    upload_cmd="$upload_cmd -h \"Cache-Control:${CACHE_CONTROL}\""
  fi
  
  # Add overwrite flag
  if [[ "$OVERWRITE" == "false" ]]; then
    upload_cmd="$upload_cmd -n"
  fi
  
  upload_cmd="$upload_cmd \"$source\" \"$destination\""
  
  echo "[*] Uploading: $source -> $destination"
  eval "$upload_cmd"
  echo "✅ Upload complete"
}

make_public() {
  local destination="$1"
  echo "[*] Making public: $destination"
  gsutil iam ch allUsers:objectViewer "$destination"
  echo "✅ Public access granted"
}

# =========================
# Main
# =========================

# Check if source exists
if [[ ! -e "$SOURCE_PATH" ]]; then
  echo "❌ Source path not found: $SOURCE_PATH" >&2
  exit 1
fi

# Enable required APIs
echo "[*] Ensuring Storage API is enabled"
gcloud services enable storage.googleapis.com \
  --project="$GCP_PROJECT_ID" \
  --quiet
echo

# Create bucket if it doesn't exist
if bucket_exists; then
  echo "✅ Bucket already exists: gs://${GCP_BUCKET_NAME}"
else
  create_bucket
fi
echo

# Determine destination
if [[ -z "$DESTINATION_PATH" ]]; then
  if [[ -d "$SOURCE_PATH" ]]; then
    DEST="gs://${GCP_BUCKET_NAME}/"
  else
    FILENAME=$(basename "$SOURCE_PATH")
    DEST="gs://${GCP_BUCKET_NAME}/${FILENAME}"
  fi
else
  # Remove leading slash if present
  DESTINATION_PATH="${DESTINATION_PATH#/}"
  DEST="gs://${GCP_BUCKET_NAME}/${DESTINATION_PATH}"
fi

# Upload files
upload_file "$SOURCE_PATH" "$DEST"
echo

# Make public if requested
if [[ "$MAKE_PUBLIC" == "true" ]]; then
  if [[ -d "$SOURCE_PATH" && "$RECURSIVE" == "true" ]]; then
    echo "[*] Making bucket public"
    gsutil iam ch allUsers:objectViewer "gs://${GCP_BUCKET_NAME}"
    echo "✅ Bucket is now publicly accessible"
  else
    make_public "$DEST"
  fi
  echo
fi

echo "✅ Upload complete!"
echo
echo "📋 Uploaded to: $DEST"
if [[ "$MAKE_PUBLIC" == "true" ]]; then
  if [[ -d "$SOURCE_PATH" ]]; then
    echo "🌐 Public URL: https://storage.googleapis.com/${GCP_BUCKET_NAME}/"
  else
    FILENAME=$(basename "$DEST")
    DEST_PATH="${DEST#gs://${GCP_BUCKET_NAME}/}"
    echo "🌐 Public URL: https://storage.googleapis.com/${GCP_BUCKET_NAME}/${DEST_PATH}"
  fi
fi
echo

# =========================
# Usage Examples
# =========================
: <<'USAGE_EXAMPLES'

# Upload a single file
export GCP_PROJECT_ID="your-project-id"
export GCP_BUCKET_NAME="askiepconfig"
export SOURCE_PATH="./config.json"
./upload-to-bucket.sh

# Upload with custom destination
export DESTINATION_PATH="configs/prod/config.json"
./upload-to-bucket.sh

# Upload directory recursively
export SOURCE_PATH="./dist"
export RECURSIVE=true
./upload-to-bucket.sh

# Upload and make public
export SOURCE_PATH="./public/index.html"
export MAKE_PUBLIC=true
./upload-to-bucket.sh

# Upload with custom content type and cache control
export SOURCE_PATH="./style.css"
export CONTENT_TYPE="text/css"
export CACHE_CONTROL="public, max-age=3600"
./upload-to-bucket.sh

# Upload without overwriting existing files
export OVERWRITE=false
export SOURCE_PATH="./backup.sql"
./upload-to-bucket.sh

USAGE_EXAMPLES
