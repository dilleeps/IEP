#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📍 Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Hardcoded to dev environment
ENVIRONMENT="dev"
echo -e "${GREEN}✓ Environment: ${ENVIRONMENT}${NC}"

# Determine branch_choice based on current branch
case $CURRENT_BRANCH in
    main)
        BRANCH_CHOICE="main"
        CUSTOM_REF=""
        ;;
    dev)
        BRANCH_CHOICE="dev"
        CUSTOM_REF=""
        ;;
    *)
        BRANCH_CHOICE="custom"
        CUSTOM_REF="$CURRENT_BRANCH"
        ;;
esac

echo -e "${BLUE}🚀 Triggering deployment...${NC}"
echo -e "   Branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo -e "   Environment: ${YELLOW}$ENVIRONMENT${NC}"

# Trigger the workflow
if [ "$BRANCH_CHOICE" = "custom" ]; then
    gh workflow run deploy-api.yml \
        --ref "$CURRENT_BRANCH" \
        -f environment="$ENVIRONMENT" \
        -f branch_choice="$BRANCH_CHOICE" \
        -f custom_ref="$CUSTOM_REF"
else
    gh workflow run deploy-api.yml \
        --ref "$CURRENT_BRANCH" \
        -f environment="$ENVIRONMENT" \
        -f branch_choice="$BRANCH_CHOICE"
fi

echo -e "${GREEN}✓ Workflow triggered successfully!${NC}"
echo -e "${BLUE}⏳ Waiting for workflow to start...${NC}"

# Wait a bit for the workflow to start
sleep 3

# Get the latest run
RUN_ID=$(gh run list --workflow=deploy-api.yml --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo -e "${RED}❌ Could not find workflow run${NC}"
    exit 1
fi

# Show workflow URL
REPO_URL=$(gh repo view --json url --jq '.url')
WORKFLOW_URL="${REPO_URL}/actions/runs/${RUN_ID}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Deployment Status${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Workflow URL:${NC}"
echo -e "   ${WORKFLOW_URL}"
echo -e "\n${BLUE}📝 View logs:${NC}"
echo -e "   ${YELLOW}gh run view ${RUN_ID} --log${NC}"
echo -e "\n${BLUE}👁️  Watch progress:${NC}"
echo -e "   ${YELLOW}gh run watch ${RUN_ID}${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Ask if user wants to watch
read -p "Watch deployment progress? (y/n): " WATCH_CHOICE

if [[ "$WATCH_CHOICE" =~ ^[Yy]$ ]]; then
    gh run watch "$RUN_ID"
else
    echo -e "${BLUE}✓ Deployment running in background${NC}"
    echo -e "Check status with: ${YELLOW}gh run view ${RUN_ID}${NC}"
fi
