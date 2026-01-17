#!/bin/bash

# ===================================================
# LifeOS Backend Deployment Script for Azure App Service
# Usage: ./deploy-backend.sh <resource-group> <app-name>
# ===================================================

set -e

RESOURCE_GROUP=${1:-lifeos-rg}
APP_NAME=${2:-lifeos-backend}

# Get script directory and navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "=========================================="
echo "LifeOS Backend Deployment"
echo "=========================================="
echo ""

# -------------------------------
# Step 1/4: Install dependencies & build
# -------------------------------
echo "📦 Step 1/4: Installing dependencies and building backend..."
cd "$PROJECT_ROOT/backend"

# Clean old build
rm -rf dist
npm install --silent
npm run build
echo "   ✓ Build completed"
echo ""

# -------------------------------
# Step 2/4: Create deployment package
# -------------------------------
echo "📦 Step 2/4: Creating deployment package..."
rm -f deploy.zip
echo "   ✓ Old deploy.zip removed (if existed)"

# Create temp directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy compiled files and package.json to temp folder
cp -r dist/* "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || true

# Zip files at root level (Azure requires files at root)
cd "$TEMP_DIR"
zip -r "$PROJECT_ROOT/backend/deploy.zip" . -q
cd "$PROJECT_ROOT/backend"

ZIP_SIZE=$(du -h deploy.zip | cut -f1)
echo "   Package size: $ZIP_SIZE"
echo "   ✓ Package includes: dist files (root), package.json, package-lock.json"
echo ""

# -------------------------------
# Step 3/4: Deploy to Azure
# -------------------------------
echo "📤 Step 3/4: Deploying to Azure App Service..."
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Name: $APP_NAME"

# Deploy using async mode with restart (Azure CLI handles the polling and shows status)
echo "   Deploying (this typically takes 1-3 minutes)..."
if az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src-path "$PROJECT_ROOT/backend/deploy.zip" \
  --type zip \
  --restart true \
  --async true \
  --output none 2>&1; then
  echo "   ✓ Deployment initiated successfully"
  DEPLOYMENT_SUCCESS=true
  
  # Wait a moment for Azure to process
  sleep 5
  
  # Check final deployment status
  FINAL_STATUS=$(az webapp deployment list \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query "[0].status" -o tsv 2>/dev/null || echo "unknown")
  
  if [ "$FINAL_STATUS" = "4" ] || [ "$FINAL_STATUS" = "Succeeded" ]; then
    echo "   ✓ Deployment status: Succeeded"
  else
    echo "   ⚠️  Deployment status: $FINAL_STATUS (check Azure portal for details)"
  fi
else
  echo "   ✗ Deployment command failed"
  DEPLOYMENT_SUCCESS=false
fi

# -------------------------------
# Step 4/4: Clean up
# -------------------------------
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
  echo ""
  echo "Cleaning up temporary files..."
  rm -f deploy.zip
  echo "   ✓ Removed deploy.zip after successful deployment"
else
  echo ""
  echo "⚠️  Deployment may have failed - keeping deploy.zip for debugging"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Backend URL: https://$APP_NAME.azurewebsites.net"
echo "Note: It may take 1-2 minutes for the app to fully restart"
echo "Check logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""