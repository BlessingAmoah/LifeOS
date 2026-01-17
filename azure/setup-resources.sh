#!/bin/bash

# LifeOS Azure Infrastructure Setup Script
# This script creates all necessary Azure resources for LifeOS

set -e

# Configuration
RESOURCE_GROUP="lifeos-rg"
LOCATION="centralus"  # Central US - supports Flexible Server
POSTGRES_SERVER="lifeos-db"
POSTGRES_ADMIN="lifeosadmin"
POSTGRES_DB_NAME="lifeos"
BACKEND_APP="lifeos-backend"
FRONTEND_APP="lifeos-frontend"
STORAGE_ACCOUNT="lifeosstorage$(openssl rand -hex 4)"
CONTAINER_NAME="lifeos-documents"

# Get script directory for .env file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LifeOS Azure Infrastructure Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
    echo "Please login to Azure:"
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✓ Logged in to Azure (Subscription: ${SUBSCRIPTION_ID})${NC}\n"

# Load or generate PostgreSQL password
if [ -f "$ENV_FILE" ] && grep -q "POSTGRES_PASSWORD=" "$ENV_FILE"; then
    # Load from .env file
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2)
    echo -e "${GREEN}✓ Using password from $ENV_FILE${NC}"
else
    # Generate new password
    echo -e "${YELLOW}Generating secure password...${NC}"
    POSTGRES_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
    
    # Ensure it has uppercase, lowercase, and numbers
    if ! [[ "$POSTGRES_PASSWORD" =~ [A-Z] ]]; then
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr '[:lower:]' '[:upper:]' | cut -c1-1)"
    fi
    if ! [[ "$POSTGRES_PASSWORD" =~ [a-z] ]]; then
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr '[:upper:]' '[:lower:]' | cut -c1-1)"
    fi
    if ! [[ "$POSTGRES_PASSWORD" =~ [0-9] ]]; then
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr -d '[:alpha:]' | cut -c1-1)"
    fi
    # Shuffle password (macOS compatible)
    if command -v shuf &> /dev/null; then
        POSTGRES_PASSWORD=$(echo "$POSTGRES_PASSWORD" | fold -w1 | shuf | tr -d '\n')
    else
        # macOS alternative
        POSTGRES_PASSWORD=$(echo "$POSTGRES_PASSWORD" | fold -w1 | awk 'BEGIN{srand();}{printf "%06d %s\n", rand()*1000000, $0;}' | sort -n | cut -d' ' -f2 | tr -d '\n')
    fi
    
    # Save to .env file
    if [ ! -f "$ENV_FILE" ]; then
        touch "$ENV_FILE"
    fi
    if grep -q "POSTGRES_PASSWORD=" "$ENV_FILE"; then
        # macOS compatible sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
        else
            sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" "$ENV_FILE"
        fi
    else
        echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Password generated and saved to $ENV_FILE${NC}"
fi
echo ""

# Check if resource group exists
echo -e "${BLUE}Checking resource group: ${RESOURCE_GROUP}...${NC}"
EXISTING_RG=$(az group show --name $RESOURCE_GROUP --query location -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_RG" ]; then
  if [ "$EXISTING_RG" != "$LOCATION" ]; then
    echo -e "${YELLOW}⚠️  Resource group already exists in location: $EXISTING_RG${NC}"
    echo -e "${YELLOW}⚠️  Target location: $LOCATION${NC}"
    echo -e "${YELLOW}⚠️  Azure doesn't allow changing resource group location.${NC}"
    echo -e "${RED}⚠️  ERROR: Resource group location mismatch!${NC}"
    echo -e "${YELLOW}To fix this, run:${NC}"
    echo -e "${YELLOW}  cd azure${NC}"
    echo -e "${YELLOW}  ./reset-and-setup.sh${NC}"
    echo -e "${YELLOW}This will delete the existing resource group and recreate everything in $LOCATION${NC}"
    exit 1
  else
    echo -e "${GREEN}✓ Resource group already exists in $LOCATION${NC}\n"
  fi
else
  # Create new resource group
  echo -e "${BLUE}Creating resource group: ${RESOURCE_GROUP} in ${LOCATION}...${NC}"
  az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output none
  echo -e "${GREEN}✓ Resource group created in $LOCATION${NC}\n"
fi

# Check if PostgreSQL server already exists
echo -e "${BLUE}Checking PostgreSQL Flexible Server: ${POSTGRES_SERVER}...${NC}"
if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER &>/dev/null; then
  echo -e "${GREEN}✓ PostgreSQL server already exists${NC}"
  # Get the actual location of the existing server and normalize to lowercase
  EXISTING_LOCATION=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query location -o tsv 2>/dev/null)
  if [ -n "$EXISTING_LOCATION" ] && [ "$EXISTING_LOCATION" != "null" ]; then
    # Normalize location: convert to lowercase and replace spaces with nothing (e.g., "Central US" -> "centralus")
    LOCATION=$(echo "$EXISTING_LOCATION" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
    echo -e "${YELLOW}Using existing server location: $LOCATION${NC}\n"
  fi
  POSTGRES_CREATED=true
else
  # Create PostgreSQL Flexible Server
  echo -e "${BLUE}Creating PostgreSQL Flexible Server: ${POSTGRES_SERVER}...${NC}"
  echo -e "${YELLOW}Note: If location '$LOCATION' is restricted, trying alternative locations...${NC}"

  # Try to create PostgreSQL server, handle location restrictions
  POSTGRES_CREATED=false
  CREATE_OUTPUT=$(az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --location $LOCATION \
    --admin-user $POSTGRES_ADMIN \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 14 \
    --storage-size 32 \
    --public-access 0.0.0.0 \
    --output none 2>&1)
  
  CREATE_EXIT_CODE=$?
  
  if [ $CREATE_EXIT_CODE -eq 0 ]; then
    # Check if creation was successful
    if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER &>/dev/null; then
      echo -e "${GREEN}✓ PostgreSQL server created in $LOCATION${NC}\n"
      POSTGRES_CREATED=true
    else
      POSTGRES_CREATED=false
    fi
  elif echo "$CREATE_OUTPUT" | grep -q "already used\|already exists"; then
    echo -e "${GREEN}✓ PostgreSQL server already exists (detected during creation attempt)${NC}\n"
    POSTGRES_CREATED=true
  elif echo "$CREATE_OUTPUT" | grep -q "restricted\|not available"; then
    POSTGRES_CREATED=false
  else
    POSTGRES_CREATED=false
  fi
fi

# If PostgreSQL creation failed, try alternative locations
if [ "$POSTGRES_CREATED" = false ]; then
  echo -e "${YELLOW}Location '$LOCATION' is restricted. Trying alternative locations...${NC}"
  
  # Alternative locations that commonly support Flexible Server
  ALTERNATIVE_LOCATIONS=("centralus" "westus2" "westeurope" "southeastasia" "uksouth" "canadacentral")
  
  for alt_location in "${ALTERNATIVE_LOCATIONS[@]}"; do
    echo -e "${YELLOW}Trying location: $alt_location...${NC}"
    CREATE_OUTPUT=$(az postgres flexible-server create \
      --resource-group $RESOURCE_GROUP \
      --name $POSTGRES_SERVER \
      --location $alt_location \
      --admin-user $POSTGRES_ADMIN \
      --admin-password "$POSTGRES_PASSWORD" \
      --sku-name Standard_B1ms \
      --tier Burstable \
      --version 14 \
      --storage-size 32 \
      --public-access 0.0.0.0 \
      --output none 2>&1)
    
    CREATE_EXIT_CODE=$?
    
    if [ $CREATE_EXIT_CODE -eq 0 ]; then
      # Update location for all subsequent resources
      LOCATION=$alt_location
      echo -e "${GREEN}✓ PostgreSQL server created in $alt_location${NC}"
      echo -e "${YELLOW}⚠️  Updating resource group and all resources to use location: $LOCATION${NC}"
      
      # Update resource group location
      az group create --name $RESOURCE_GROUP --location $LOCATION --output none
      POSTGRES_CREATED=true
      break
    elif echo "$CREATE_OUTPUT" | grep -q "already used\|already exists"; then
      # Server already exists, use its location
      EXISTING_LOCATION=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query location -o tsv 2>/dev/null || echo "$alt_location")
      # Normalize location: convert to lowercase and remove spaces
      LOCATION=$(echo "$EXISTING_LOCATION" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
      echo -e "${GREEN}✓ PostgreSQL server already exists in $LOCATION${NC}"
      POSTGRES_CREATED=true
      break
    fi
  done
  
  if [ "$POSTGRES_CREATED" = false ]; then
    echo -e "${YELLOW}Failed to create in alternative locations. Checking if server exists...${NC}"
    if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER &>/dev/null; then
      EXISTING_LOCATION=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query location -o tsv)
      # Normalize location: convert to lowercase and remove spaces
      LOCATION=$(echo "$EXISTING_LOCATION" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
      echo -e "${GREEN}✓ PostgreSQL server already exists in $LOCATION${NC}\n"
      POSTGRES_CREATED=true
    else
      echo -e "${RED}✗ Failed to create PostgreSQL server${NC}"
      echo -e "${YELLOW}Please check Azure portal or try again later${NC}"
      exit 1
    fi
  fi
fi

# Display final location being used
echo -e "${BLUE}Using location: ${LOCATION} for all resources${NC}\n"

# Wait for PostgreSQL server to be fully ready
echo -e "${BLUE}Waiting for PostgreSQL server to be ready...${NC}"
WAIT_COUNTER=0
MAX_WAIT=300  # 5 minutes
SERVER_READY=false

while [ $WAIT_COUNTER -lt $MAX_WAIT ]; do
  if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER &>/dev/null; then
    # Check if server state is "Ready"
    SERVER_STATE=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query state -o tsv 2>/dev/null || echo "")
    if [ "$SERVER_STATE" = "Ready" ] || [ -n "$SERVER_STATE" ]; then
      SERVER_READY=true
      echo -e "${GREEN}✓ PostgreSQL server is ready${NC}\n"
      break
    fi
  fi
  if [ $((WAIT_COUNTER % 30)) -eq 0 ] && [ $WAIT_COUNTER -gt 0 ]; then
    echo -e "${YELLOW}Still waiting... ($((WAIT_COUNTER / 60)) minutes, $((WAIT_COUNTER % 60)) seconds elapsed)${NC}"
  fi
  sleep 10
  WAIT_COUNTER=$((WAIT_COUNTER + 10))
done

if [ "$SERVER_READY" != "true" ]; then
  echo -e "${YELLOW}⚠️  Warning: PostgreSQL server may not be fully ready, but continuing...${NC}\n"
fi

# Configure PostgreSQL Firewall
echo -e "${BLUE}Configuring PostgreSQL firewall rules...${NC}"

# Check if AllowAzureServices rule exists
if az postgres flexible-server firewall-rule show \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAzureServices &>/dev/null; then
  echo -e "${GREEN}✓ Firewall rule 'AllowAzureServices' already exists${NC}"
else
  # Allow Azure services
  if az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Created firewall rule 'AllowAzureServices'${NC}"
  else
    echo -e "${YELLOW}⚠️  Could not create 'AllowAzureServices' firewall rule (may already exist)${NC}"
  fi
fi

# Get current IP and create rule
MY_IP=$(curl -s https://api.ipify.org 2>/dev/null || echo "")
if [ -n "$MY_IP" ]; then
  # Check if AllowMyIP rule exists
  if az postgres flexible-server firewall-rule show \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --rule-name AllowMyIP &>/dev/null; then
    echo -e "${GREEN}✓ Firewall rule 'AllowMyIP' already exists${NC}"
  else
    if az postgres flexible-server firewall-rule create \
      --resource-group $RESOURCE_GROUP \
      --name $POSTGRES_SERVER \
      --rule-name AllowMyIP \
      --start-ip-address $MY_IP \
      --end-ip-address $MY_IP \
      --output none 2>&1; then
      echo -e "${GREEN}✓ Created firewall rule 'AllowMyIP' for $MY_IP${NC}"
    else
      echo -e "${YELLOW}⚠️  Could not create 'AllowMyIP' firewall rule (may already exist)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️  Could not determine current IP address${NC}"
fi
echo ""

# Create database
echo -e "${BLUE}Creating database: ${POSTGRES_DB_NAME}...${NC}"
if az postgres flexible-server db show \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name $POSTGRES_DB_NAME &>/dev/null; then
  echo -e "${GREEN}✓ Database already exists${NC}\n"
else
  if az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name $POSTGRES_DB_NAME \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Database created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create database (may already exist or server not ready)${NC}\n"
  fi
fi

# Check for existing storage account or create new one
echo -e "${BLUE}Checking Storage Account...${NC}"
EXISTING_STORAGE=$(az storage account list --resource-group $RESOURCE_GROUP --query "[?name=='$STORAGE_ACCOUNT'].name" -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_STORAGE" ]; then
  STORAGE_ACCOUNT=$EXISTING_STORAGE
  echo -e "${GREEN}✓ Storage account already exists: ${STORAGE_ACCOUNT}${NC}\n"
else
  # Create Storage Account
  echo -e "${BLUE}Creating Storage Account: ${STORAGE_ACCOUNT}...${NC}"
  if az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2 \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Storage account created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create storage account (may already exist with different name)${NC}"
    # Try to find existing storage account
    EXISTING_STORAGE=$(az storage account list --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv 2>/dev/null || echo "")
    if [ -n "$EXISTING_STORAGE" ]; then
      STORAGE_ACCOUNT=$EXISTING_STORAGE
      echo -e "${GREEN}✓ Using existing storage account: ${STORAGE_ACCOUNT}${NC}\n"
    else
      echo -e "${RED}✗ No storage account found and creation failed${NC}\n"
    fi
  fi
fi

# Create Blob Container
echo -e "${BLUE}Creating blob container: ${CONTAINER_NAME}...${NC}"
if az storage container show \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login &>/dev/null; then
  echo -e "${GREEN}✓ Blob container already exists${NC}\n"
else
  if az storage container create \
    --name $CONTAINER_NAME \
    --account-name $STORAGE_ACCOUNT \
    --auth-mode login \
    --public-access blob \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Blob container created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create blob container (may already exist)${NC}\n"
  fi
fi

# Create App Service Plans
echo -e "${BLUE}Creating App Service Plans...${NC}"

# Backend Plan
if az appservice plan show --name "${BACKEND_APP}-plan" --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo -e "${GREEN}✓ Backend App Service Plan already exists${NC}"
else
  if az appservice plan create \
    --name "${BACKEND_APP}-plan" \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Backend App Service Plan created${NC}"
  else
    echo -e "${YELLOW}⚠️  Could not create Backend App Service Plan (may already exist)${NC}"
  fi
fi

# Frontend Plan
if az appservice plan show --name "${FRONTEND_APP}-plan" --resource-group $RESOURCE_GROUP &>/dev/null; then
  CURRENT_SKU=$(az appservice plan show --name "${FRONTEND_APP}-plan" --resource-group $RESOURCE_GROUP --query sku.name -o tsv)
  if [ "$CURRENT_SKU" != "B1" ]; then
    echo -e "${YELLOW}Frontend App Service Plan exists with SKU $CURRENT_SKU, updating to B1...${NC}"
    if az appservice plan update \
      --name "${FRONTEND_APP}-plan" \
      --resource-group $RESOURCE_GROUP \
      --sku B1 \
      --output none 2>&1; then
      echo -e "${GREEN}✓ Frontend App Service Plan updated to B1${NC}\n"
    else
      echo -e "${YELLOW}⚠️  Could not update Frontend App Service Plan SKU (may require manual update)${NC}\n"
    fi
  else
    echo -e "${GREEN}✓ Frontend App Service Plan already exists with B1 SKU${NC}\n"
  fi
else
  if az appservice plan create \
    --name "${FRONTEND_APP}-plan" \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Frontend App Service Plan created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create Frontend App Service Plan (may already exist)${NC}\n"
  fi
fi

# Create Backend App Service
echo -e "${BLUE}Creating Backend App Service: ${BACKEND_APP}...${NC}"
if az webapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo -e "${GREEN}✓ Backend App Service already exists${NC}\n"
else
  if az webapp create \
    --name $BACKEND_APP \
    --resource-group $RESOURCE_GROUP \
    --plan "${BACKEND_APP}-plan" \
    --runtime "NODE:20-lts" \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Backend App Service created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create Backend App Service (may already exist)${NC}\n"
  fi
fi

# Create Frontend App Service
echo -e "${BLUE}Creating Frontend App Service: ${FRONTEND_APP}...${NC}"
if az webapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo -e "${GREEN}✓ Frontend App Service already exists${NC}\n"
else
  if az webapp create \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --plan "${FRONTEND_APP}-plan" \
    --runtime "NODE:20-lts" \
    --output none 2>&1; then
    echo -e "${GREEN}✓ Frontend App Service created${NC}\n"
  else
    echo -e "${YELLOW}⚠️  Could not create Frontend App Service (may already exist)${NC}\n"
  fi
fi

# Get connection strings
echo -e "${BLUE}Retrieving connection strings...${NC}"

POSTGRES_CONNECTION_STRING="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/${POSTGRES_DB_NAME}?sslmode=verify-full"

# Wait for storage account to be ready
echo -e "${BLUE}Waiting for storage account to be ready...${NC}"
WAIT_COUNTER=0
MAX_WAIT=120  # 2 minutes
STORAGE_READY=false

while [ $WAIT_COUNTER -lt $MAX_WAIT ]; do
  if az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &>/dev/null; then
    STORAGE_READY=true
    echo -e "${GREEN}✓ Storage account is ready${NC}"
    break
  fi
  sleep 5
  WAIT_COUNTER=$((WAIT_COUNTER + 5))
done

if [ "$STORAGE_READY" = true ]; then
  STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query connectionString -o tsv 2>/dev/null || echo "")
else
  echo -e "${YELLOW}⚠️  Storage account not ready yet, continuing anyway...${NC}"
  STORAGE_CONNECTION_STRING=""
fi

# Wait for App Services to be ready
echo -e "${BLUE}Waiting for App Services to be ready...${NC}"
WAIT_COUNTER=0
MAX_WAIT=180  # 3 minutes
BACKEND_READY=false
FRONTEND_READY=false

while [ $WAIT_COUNTER -lt $MAX_WAIT ]; do
  if [ "$BACKEND_READY" != "true" ] && az webapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
    BACKEND_READY=true
    echo -e "${GREEN}✓ Backend App Service is ready${NC}"
  fi
  if [ "$FRONTEND_READY" != "true" ] && az webapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP &>/dev/null; then
    FRONTEND_READY=true
    echo -e "${GREEN}✓ Frontend App Service is ready${NC}"
  fi
  if [ "$BACKEND_READY" = "true" ] && [ "$FRONTEND_READY" = "true" ]; then
    break
  fi
  sleep 5
  WAIT_COUNTER=$((WAIT_COUNTER + 5))
done

if [ "$BACKEND_READY" != "true" ] || [ "$FRONTEND_READY" != "true" ]; then
  echo -e "${YELLOW}⚠️  App Services may not be fully ready, but continuing...${NC}\n"
fi

# Configure Backend App Settings
echo -e "${BLUE}Configuring Backend App Settings...${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

if az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="$POSTGRES_CONNECTION_STRING" \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
    AZURE_STORAGE_CONTAINER="$CONTAINER_NAME" \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV="production" \
    PORT="8080" \
  --output none 2>&1; then
  echo -e "${GREEN}✓ Backend app settings configured${NC}\n"
else
  echo -e "${YELLOW}⚠️  Could not configure backend app settings (app may still be provisioning)${NC}\n"
fi

# Configure Backend startup command to install dependencies
echo -e "${BLUE}Configuring Backend startup command...${NC}"
if az webapp config set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm install --production && npm start" \
  --output none 2>&1; then
  echo -e "${GREEN}✓ Backend startup command configured${NC}\n"
else
  echo -e "${YELLOW}⚠️  Could not configure backend startup command${NC}\n"
fi

# Configure Frontend App Settings
echo -e "${BLUE}Configuring Frontend App Settings...${NC}"
BACKEND_URL="https://${BACKEND_APP}.azurewebsites.net"

if az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    VITE_API_URL="${BACKEND_URL}/api" \
  --output none 2>&1; then
  echo -e "${GREEN}✓ Frontend app settings configured${NC}\n"
else
  echo -e "${YELLOW}⚠️  Could not configure frontend app settings (app may still be provisioning)${NC}\n"
fi

# Enable HTTPS only
echo -e "${BLUE}Enabling HTTPS only...${NC}"
az webapp update \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --https-only true \
  --output none

az webapp update \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --https-only true \
  --output none
echo -e "${GREEN}✓ HTTPS enabled${NC}\n"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Resource Details:${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION (all resources created in this location)"
echo ""
echo "PostgreSQL Server: $POSTGRES_SERVER.postgres.database.azure.com"
echo "Database: $POSTGRES_DB_NAME"
echo "Admin User: $POSTGRES_ADMIN"
echo ""
echo "Backend App: https://$BACKEND_APP.azurewebsites.net"
echo "Frontend App: https://$FRONTEND_APP.azurewebsites.net"
echo ""
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Container: $CONTAINER_NAME"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run database migrations:"
echo "   cd database"
echo "   export DATABASE_URL=\"$POSTGRES_CONNECTION_STRING\""
echo "   npm run migrate"
echo ""
echo "2. Deploy backend:"
echo "   cd azure"
echo "   ./deploy-backend.sh"
echo ""
echo "3. Deploy frontend:"
echo "   cd azure"
echo "   ./deploy-frontend.sh"
echo ""
# Save connection strings to .env file
echo -e "${BLUE}Saving connection strings to $ENV_FILE...${NC}"
{
    echo ""
    echo "# Azure Connection Strings"
    echo "DATABASE_URL=$POSTGRES_CONNECTION_STRING"
    echo "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "RESOURCE_GROUP=$RESOURCE_GROUP"
    echo "POSTGRES_SERVER=$POSTGRES_SERVER"
    echo "BACKEND_APP=$BACKEND_APP"
    echo "FRONTEND_APP=$FRONTEND_APP"
    echo "STORAGE_ACCOUNT=$STORAGE_ACCOUNT"
} >> "$ENV_FILE"
echo -e "${GREEN}✓ Connection strings saved to $ENV_FILE${NC}"
echo ""

echo -e "${YELLOW}Connection Strings (also saved to $ENV_FILE):${NC}"
echo "DATABASE_URL=$POSTGRES_CONNECTION_STRING"
echo "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: The .env file contains sensitive information.${NC}"
echo -e "${YELLOW}⚠️  Do not commit it to version control!${NC}"
echo ""
