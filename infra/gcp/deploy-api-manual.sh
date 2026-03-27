#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/../.."

# Load .env.dev
if [ ! -f ".env.dev" ]; then
    echo -e "${RED}❌ .env.dev file not found${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Loading environment variables from .env.dev...${NC}"
set -a
source .env.dev
set +a

# Check required variables
REQUIRED_VARS=(
    "GCP_PROJECT_ID"
    "GCP_REGION"
    "GCP_ARTIFACT_REPOSITORY"
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "CLOUDSQL_CONNECTION_NAME"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required variable $var is not set${NC}"
        exit 1
    fi
done

# Set variables
ENVIRONMENT="dev"
SERVICE_NAME="iep-api-${ENVIRONMENT}"
IMAGE_TAG=$(git rev-parse HEAD)
IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY}/api:${IMAGE_TAG}"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Manual API Deployment${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Project:${NC} ${GCP_PROJECT_ID}"
echo -e "${BLUE}Region:${NC} ${GCP_REGION}"
echo -e "${BLUE}Service:${NC} ${SERVICE_NAME}"
echo -e "${BLUE}Image:${NC} ${IMAGE_NAME}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 1: Configure Docker
echo -e "${BLUE}🔧 Configuring Docker for Artifact Registry...${NC}"
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev --quiet

# Step 2: Build Docker image
echo -e "\n${BLUE}🏗️  Building Docker image...${NC}"
docker build -t "${IMAGE_NAME}" apps/api

# Step 3: Push to Artifact Registry
echo -e "\n${BLUE}📤 Pushing image to Artifact Registry...${NC}"
docker push "${IMAGE_NAME}"

# Step 4: Create env vars file
echo -e "\n${BLUE}📝 Creating environment variables file...${NC}"
cat > /tmp/cloudrun-env-vars.yaml << EOF
SERVER_PORT: "3000"
JWT_EXPIRATION_TIME_IN_MINUTES: "${JWT_EXPIRATION_TIME_IN_MINUTES:-60}"
APP_ENVIRONMENT: "${APP_ENVIRONMENT:-dev}"
POSTGRES_DB: "${POSTGRES_DB}"
GEMINI_API_KEY: "${GEMINI_API_KEY}"
POSTGRES_USER: "${POSTGRES_USER}"
POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
CLOUDSQL_CONNECTION_NAME: "${CLOUDSQL_CONNECTION_NAME}"
DB_SOCKET_PATH: "/cloudsql/${CLOUDSQL_CONNECTION_NAME}"
RECAPTCHA_SECRET: "${RECAPTCHA_SECRET}"
RECAPTCHA_MIN_SCORE: "${RECAPTCHA_MIN_SCORE:-0.5}"
SES_IAM_USER: "${SES_IAM_USER:-}"
SES_SMTP_HOST: "${SES_SMTP_HOST:-}"
SES_SMTP_USER: "${SES_SMTP_USER:-}"
SES_SMTP_PASS: "${SES_SMTP_PASS:-}"
FROM_EMAIL_ADDRESS: "${FROM_EMAIL_ADDRESS:-}"
NOTIFY_EMAILS: "${NOTIFY_EMAILS:-}"
TELEGRAM_API_KEY: "${TELEGRAM_API_KEY:-}"
TELEGRAM_CHAT_ID: "${TELEGRAM_CHAT_ID:-}"
EOF

echo -e "${GREEN}✓ Environment variables file created at /tmp/cloudrun-env-vars.yaml${NC}"

# Step 5: Deploy to Cloud Run
echo -e "\n${BLUE}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_NAME}" \
    --region "${GCP_REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --add-cloudsql-instances "${CLOUDSQL_CONNECTION_NAME}" \
    --env-vars-file /tmp/cloudrun-env-vars.yaml \
    --project "${GCP_PROJECT_ID}"

# Get service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${GCP_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --format="value(status.url)")

# Cleanup
rm -f /tmp/cloudrun-env-vars.yaml

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Service URL:${NC}"
echo -e "   ${YELLOW}${SERVICE_URL}${NC}"
echo -e "${BLUE}📊 View logs:${NC}"
echo -e "   ${YELLOW}gcloud run logs read --service=${SERVICE_NAME} --region=${GCP_REGION}${NC}"
echo -e "${BLUE}🔍 Service details:${NC}"
echo -e "   ${YELLOW}gcloud run services describe ${SERVICE_NAME} --region=${GCP_REGION}${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test health endpoint
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
if curl -s -f "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed (this might be normal if /health endpoint doesn't exist)${NC}"
fi
