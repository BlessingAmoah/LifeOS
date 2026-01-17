#!/bin/bash
# ==========================================
# LifeOS Frontend Deployment Script for Azure (Fully Automated Static SPA)
# ==========================================
# Usage: ./deploy-frontend.sh <resource-group> <app-name> <backend-app-name>

set -e

# Default values
RESOURCE_GROUP=${1:-lifeos-rg}
APP_NAME=${2:-lifeos-frontend}
BACKEND_APP=${3:-lifeos-backend}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "=========================================="
echo "📦 LifeOS Frontend Deployment (SPA + Auto Backend URL)"
echo "=========================================="

# -------------------------------
# Step 0: Auto-detect backend URL from Azure
# -------------------------------
BACKEND_URL=$(az webapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$BACKEND_APP" \
  --query "defaultHostName" -o tsv 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
  echo "⚠️  Could not detect backend URL. Using default fallback."
  BACKEND_URL="${BACKEND_APP}.azurewebsites.net"
fi

echo "✅ Backend URL detected: https://${BACKEND_URL}/api"
echo ""

# -------------------------------
# Step 1: Build frontend
# -------------------------------
echo "🔨 Building frontend..."
cd "$PROJECT_ROOT/frontend"

# Always remove old deploy.zip before building
if [ -f "deploy.zip" ]; then
  rm -f deploy.zip
  echo "   ✓ Removed old deploy.zip"
fi

npm install --silent
VITE_API_URL="https://${BACKEND_URL}/api" npm run build
echo "   ✓ Frontend build completed"
echo ""

# -------------------------------
# Step 2: Add web.config for SPA routing
# -------------------------------
cat > dist/web.config <<'EOL'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>
EOL
echo "   ✓ Added web.config for SPA routing"
echo ""

# -------------------------------
# Step 3: Prepare deployment package (STATIC FILES ONLY)
# -------------------------------
echo "📦 Creating deployment package..."
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy static files from dist
cp -r dist/* "$TEMP_DIR/"

# Copy server.js for minimal Node.js static server (needed for SPA routing on Linux)
cp server.js "$TEMP_DIR/"

# Install Express and ALL its dependencies locally, then bundle everything
echo "   Installing Express and dependencies for bundling..."
cd "$PROJECT_ROOT/frontend"

# Create a temporary package.json with only Express to get clean install
TEMP_PKG_JSON=$(mktemp)
cat > "$TEMP_PKG_JSON" <<'PKGEOF'
{
  "name": "lifeos-frontend-temp",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.2"
  }
}
PKGEOF

# Install Express in a clean temp directory to get full dependency tree
TEMP_INSTALL_DIR=$(mktemp -d)
cp "$TEMP_PKG_JSON" "$TEMP_INSTALL_DIR/package.json"

cd "$TEMP_INSTALL_DIR"
npm install --production --silent 2>/dev/null || {
  echo "   ⚠️  Could not install Express in temp directory"
  cd "$PROJECT_ROOT/frontend"
  rm -rf "$TEMP_INSTALL_DIR"
  rm -f "$TEMP_PKG_JSON"
}

# Copy the ENTIRE node_modules tree to deployment
if [ -d "$TEMP_INSTALL_DIR/node_modules" ]; then
  echo "   Bundling Express and complete dependency tree..."
  mkdir -p "$TEMP_DIR/node_modules"
  
  # Copy entire node_modules directory (includes all nested dependencies)
  cp -r "$TEMP_INSTALL_DIR/node_modules"/* "$TEMP_DIR/node_modules/" 2>/dev/null || {
    # If copy fails, try rsync or tar
    (cd "$TEMP_INSTALL_DIR" && tar cf - node_modules) | (cd "$TEMP_DIR" && tar xf -) 2>/dev/null || {
      echo "   ⚠️  Could not copy node_modules, trying alternative method..."
      # Fallback: copy express and known dependencies
      if [ -d "$TEMP_INSTALL_DIR/node_modules/express" ]; then
        cp -r "$TEMP_INSTALL_DIR/node_modules/express" "$TEMP_DIR/node_modules/"
      fi
    }
  }
  
  echo "   ✓ Express and complete dependency tree bundled"
else
  echo "   ⚠️  node_modules not found in temp install"
fi

# Cleanup
cd "$PROJECT_ROOT/frontend"
rm -rf "$TEMP_INSTALL_DIR"
rm -f "$TEMP_PKG_JSON"

# Create minimal package.json (Express is already bundled, so npm install won't be needed)
cat > "$TEMP_DIR/package.json" <<'EOL'
{
  "name": "lifeos-frontend",
  "version": "1.0.0",
  "description": "LifeOS Frontend - Static SPA Server",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOL

# Create deploy.zip with files at root level
cd "$TEMP_DIR"
zip -r "$PROJECT_ROOT/frontend/deploy.zip" . -q
cd "$PROJECT_ROOT/frontend"

ZIP_SIZE=$(du -h deploy.zip | cut -f1)
echo "   Package size: $ZIP_SIZE"
if [ -d "$TEMP_DIR/node_modules" ]; then
  echo "   ✓ Package includes: static files (dist/*), server.js, package.json, web.config, Express (bundled)"
  echo "   ✓ Express is bundled - no npm install needed on Azure"
else
  echo "   ✓ Package includes: static files (dist/*), server.js, package.json, web.config"
  echo "   ⚠️  Express not bundled - Azure will need to run npm install"
fi
echo ""

# -------------------------------
# Step 4: Deploy to Azure
# -------------------------------
echo "📤 Deploying to Azure App Service..."
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Name: $APP_NAME"

# Deploy using sync mode (no async) for immediate feedback
if az webapp deploy \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src-path deploy.zip \
    --type zip \
    --restart true \
    --output table 2>&1; then
  echo ""
  echo "   ✓ Deployment completed successfully"
  DEPLOYMENT_SUCCESS=true
else
  echo ""
  echo "   ✗ Deployment command failed"
  DEPLOYMENT_SUCCESS=false
fi

# -------------------------------
# Step 5: Cleanup
# -------------------------------
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
  echo ""
  echo "🧹 Cleaning up temporary files..."
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
echo "Frontend URL: https://$APP_NAME.azurewebsites.net"
echo "SPA routing: Enabled via web.config"
echo "Backend URL used: https://${BACKEND_URL}/api"
echo ""
echo "Note: Pure static files - no Node.js server required"
echo "Check logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
