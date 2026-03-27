#!/bin/bash
# deploy-cloud-run.sh
# Deploy IEP API to Google Cloud Run with proper IAM permissions

set -e  # Exit on error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-iep-api}"
SERVICE_ACCOUNT_NAME="${GCP_SA_NAME:-iep-api}"
GCS_BUCKET="${GCS_BUCKET:-}"
SA_KEY_FILE="${GCP_SA_KEY_FILE_PATH:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 IEP API Cloud Run Deployment"
echo "================================"

# Validate required variables
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: GCP_PROJECT_ID is required${NC}"
  echo "Usage: GCP_PROJECT_ID=your-project-id ./deploy-cloud-run.sh"
  exit 1
fi

if [ -z "$GCS_BUCKET" ]; then
  echo -e "${RED}❌ Error: GCS_BUCKET is required${NC}"
  echo "Usage: GCS_BUCKET=your-bucket ./deploy-cloud-run.sh"
  exit 1
fi

# Authenticate with service account if key file is provided
if [ -n "$SA_KEY_FILE" ]; then
  # Expand tilde to home directory
  EXPANDED_SA_KEY_FILE="${SA_KEY_FILE/#\~/$HOME}"
  if [ -f "$EXPANDED_SA_KEY_FILE" ]; then
    echo -e "${YELLOW}🔐 Authenticating with service account...${NC}"
    gcloud auth activate-service-account --key-file="$EXPANDED_SA_KEY_FILE"
    echo -e "${GREEN}✅ Service account authentication successful${NC}"
  else
    echo -e "${YELLOW}⚠️  Service account key file not found: $EXPANDED_SA_KEY_FILE${NC}"
    echo "   Proceeding with current gcloud authentication"
  fi
fi

echo -e "${GREEN}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo "  Service Account: $SERVICE_ACCOUNT_NAME"
echo "  GCS Bucket: $GCS_BUCKET"
echo "  SA Key File: ${SA_KEY_FILE:-'Not specified (using current gcloud auth)'}"
echo ""

# Set active project
echo -e "${YELLOW}📋 Setting active project...${NC}"
gcloud config set project $PROJECT_ID

# Check if service account exists
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo -e "${YELLOW}🔍 Checking service account...${NC}"

if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
  echo -e "${GREEN}✅ Service account exists: $SERVICE_ACCOUNT_EMAIL${NC}"
else
  echo -e "${RED}❌ Error: Service account does not exist: $SERVICE_ACCOUNT_EMAIL${NC}"
  echo "   Please create the service account first or check your GCP_SA_NAME environment variable"
  exit 1
fi

# Grant Storage Object Viewer role
echo -e "${YELLOW}🔒 Granting Storage Object Viewer permissions...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectViewer" \
  --condition=None \
  > /dev/null
echo -e "${GREEN}✅ Storage permissions granted${NC}"

# Grant Service Account Token Creator (self-impersonation for signed URLs)
echo -e "${YELLOW}🔒 Granting Service Account Token Creator permissions (for signed URLs)...${NC}"
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  > /dev/null
echo -e "${GREEN}✅ Token creator permissions granted (enables signed URLs)${NC}"

# Verify permissions
echo -e "${YELLOW}🔍 Verifying permissions...${NC}"
POLICY=$(gcloud iam service-accounts get-iam-policy $SERVICE_ACCOUNT_EMAIL --format=json)
if echo "$POLICY" | grep -q "roles/iam.serviceAccountTokenCreator"; then
  echo -e "${GREEN}✅ Service account has signing permissions${NC}"
else
  echo -e "${RED}❌ Warning: Token creator permission not found${NC}"
  exit 1
fi

# Build and deploy Cloud Run
echo -e "${YELLOW}🏗️  Building and deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --source=. \
  --platform=managed \
  --region=$REGION \
  --service-account=$SERVICE_ACCOUNT_EMAIL \
  --allow-unauthenticated=false \
  --set-env-vars="GCS_BUCKET=$GCS_BUCKET,GCP_PROJECT_ID=$PROJECT_ID,NODE_ENV=production" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --port=3000

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo -e "${GREEN}🎉 Success!${NC}"
echo "================================"
echo "Service URL: $SERVICE_URL"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo -e "${YELLOW}Permissions granted:${NC}"
echo "  ✅ roles/storage.objectViewer (read GCS objects)"
echo "  ✅ roles/iam.serviceAccountTokenCreator (generate signed URLs)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the API: curl $SERVICE_URL/health"
echo "  2. Get auth token: gcloud auth print-identity-token"
echo "  3. Test document upload/download with signed URLs"
echo ""
echo -e "${YELLOW}Monitor logs:${NC}"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "  If signed URLs fail, check logs for 'signBlob' errors:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION | grep -i signblob"
