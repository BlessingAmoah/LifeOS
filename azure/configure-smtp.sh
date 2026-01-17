#!/bin/bash
# ==========================================
# Configure SMTP Settings for LifeOS Backend
# ==========================================
# Usage: ./configure-smtp.sh <resource-group> <app-name> <smtp-host> <smtp-port> <smtp-user> <smtp-pass>

set -e

RESOURCE_GROUP=${1:-lifeos-rg}
APP_NAME=${2:-lifeos-backend}
SMTP_HOST=${3:-$SMTP_HOST}
SMTP_PORT=${4:-${SMTP_PORT:-587}}
SMTP_USER=${5:-$SMTP_USER}
SMTP_PASS=${6:-$SMTP_PASS}

if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
  echo "⚠️  SMTP configuration not provided"
  echo ""
  echo "Usage: ./configure-smtp.sh <resource-group> <app-name> <smtp-host> <smtp-port> <smtp-user> <smtp-pass>"
  echo ""
  echo "Or set environment variables:"
  echo "  export SMTP_HOST=smtp.gmail.com"
  echo "  export SMTP_PORT=587"
  echo "  export SMTP_USER=your-email@gmail.com"
  echo "  export SMTP_PASS=your-app-password"
  echo ""
  echo "Then run: ./configure-smtp.sh"
  exit 1
fi

echo "=========================================="
echo "Configuring SMTP for LifeOS Backend"
echo "=========================================="
echo "SMTP Host: $SMTP_HOST"
echo "SMTP Port: $SMTP_PORT"
echo "SMTP User: $SMTP_USER"
echo ""

if az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SMTP_HOST="$SMTP_HOST" \
    SMTP_PORT="$SMTP_PORT" \
    SMTP_USER="$SMTP_USER" \
    SMTP_PASS="$SMTP_PASS" \
  --output none 2>&1; then
  echo "✓ SMTP settings configured successfully"
  echo ""
  echo "Note: The backend will restart automatically"
  echo "Email verification will now work for user registration"
else
  echo "✗ Failed to configure SMTP settings"
  exit 1
fi
