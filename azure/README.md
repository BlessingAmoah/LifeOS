# Azure Infrastructure Setup

This directory contains scripts and documentation for setting up LifeOS on Azure.

## Quick Start

### Prerequisites

- Azure CLI installed ([Install Guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Azure account with active subscription
- Node.js 18+ installed locally (for running migrations)

### Option 1: Automated Setup (Recommended)

#### Step 1: Generate Password (Optional)

Generate a secure password and save it to `.env` file:

```bash
cd azure
./generate-password.sh
```

This will create `azure/.env` with a secure PostgreSQL password.

#### Step 2: Run Setup Script

**Fresh Setup (No existing resources):**
```bash
cd azure
./setup-resources.sh
```

**Reset Existing Resources (Delete and recreate in Central US):**
```bash
cd azure
./reset-and-setup.sh
```

⚠️ **Warning**: `reset-and-setup.sh` will delete ALL existing resources!

**Windows PowerShell:**
```powershell
cd azure
$password = Read-Host "Enter PostgreSQL password" -AsSecureString
.\setup-resources.ps1 -PostgresPassword $password
```

The setup script will:
- Use password from `.env` file if it exists, otherwise generate a new one
- Create resource group
- Create PostgreSQL Flexible Server (handles location restrictions automatically)
- Create Storage Account and Blob Container
- Create App Service Plans
- Create Backend and Frontend App Services
- Configure all connection strings and environment variables
- Save all connection strings to `azure/.env` file
- Display summary with next steps

### Option 2: Manual Setup

See [AZURE_POSTGRESQL_SETUP.md](../AZURE_POSTGRESQL_SETUP.md) for step-by-step manual setup instructions.

## Password Management

### Generate Password

```bash
cd azure
./generate-password.sh
```

This creates/updates `azure/.env` with:
```
POSTGRES_PASSWORD=your-generated-password
```

### Using Existing Password

If `azure/.env` exists with `POSTGRES_PASSWORD`, the setup script will automatically use it.

## Resources Created

The setup script creates the following Azure resources:

### Core Infrastructure
- **Resource Group**: `lifeos-rg` (or custom name)
- **Location**: `centralus` (Central US - all resources created here)

### Database
- **PostgreSQL Flexible Server**: `lifeos-db`
  - Tier: Burstable (B1ms)
  - Version: PostgreSQL 14
  - Storage: 32 GB
  - Public access enabled with firewall rules
  - **Note**: Script automatically tries alternative locations if primary location is restricted

### Storage
- **Storage Account**: `lifeosstorage[random]`
  - SKU: Standard LRS
  - **Blob Container**: `lifeos-documents`
  - Public blob access enabled

### Application Services
- **Backend App Service Plan**: `lifeos-backend-plan`
  - SKU: B1 (Basic)
  - Linux runtime
  
- **Backend App Service**: `lifeos-backend`
  - Runtime: Node.js 18 LTS
  - Environment variables configured
  
- **Frontend App Service Plan**: `lifeos-frontend-plan`
  - SKU: FREE
  - Linux runtime
  
- **Frontend App Service**: `lifeos-frontend`
  - Runtime: Node.js 18 LTS
  - Environment variables configured

## Configuration Files

### azure/.env

The setup script creates/updates `azure/.env` with:

```env
POSTGRES_PASSWORD=your-password
DATABASE_URL=postgresql://...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...
JWT_SECRET=auto-generated-secret
RESOURCE_GROUP=lifeos-rg
POSTGRES_SERVER=lifeos-db
BACKEND_APP=lifeos-backend
FRONTEND_APP=lifeos-frontend
STORAGE_ACCOUNT=lifeosstorage...
LOCATION=centralus
```

**⚠️ Important**: This file contains sensitive information and is in `.gitignore`. Do not commit it!

## Post-Setup Steps

### 1. Run Database Migrations

```bash
cd database
npm install

# Load DATABASE_URL from azure/.env
source ../azure/.env  # Linux/macOS
# or
Get-Content ../azure/.env | ForEach-Object { if ($_ -match '^(.+?)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }  # PowerShell

# Or set manually
export DATABASE_URL="postgresql://lifeosadmin:password@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require"

# Run migrations
npm run migrate
```

### 2. Deploy Backend

```bash
cd azure
./deploy-backend.sh
```

### 3. Deploy Frontend

```bash
cd azure
./deploy-frontend.sh
```

## Location Restrictions

If you encounter "location is restricted" errors:

1. The script uses `centralus` as the default location. If restricted, it automatically tries alternative locations:
   - centralus (default)
   - westus2
   - westeurope
   - southeastasia
   - uksouth
   - canadacentral

2. To manually specify a location, edit `setup-resources.sh`:
   ```bash
   LOCATION="centralus"  # Default is centralus, change if needed
   ```

3. Or check available locations:
   ```bash
   az account list-locations --query "[?contains(name, 'us')].{Name:name, DisplayName:displayName}" -o table
   ```

## Verification

### Check Backend Health

```bash
curl https://lifeos-backend.azurewebsites.net/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Check Frontend

Open in browser:
```
https://lifeos-frontend.azurewebsites.net
```

## Troubleshooting

### PostgreSQL Connection Issues

1. **Check firewall rules**:
   ```bash
   az postgres flexible-server firewall-rule list \
     --resource-group lifeos-rg \
     --name lifeos-db
   ```

2. **Add your IP**:
   ```bash
   MY_IP=$(curl -s https://api.ipify.org)
   az postgres flexible-server firewall-rule create \
     --resource-group lifeos-rg \
     --name lifeos-db \
     --rule-name AllowMyIP \
     --start-ip-address $MY_IP \
     --end-ip-address $MY_IP
   ```

### App Service Issues

1. **Check logs**:
   ```bash
   az webapp log tail --name lifeos-backend --resource-group lifeos-rg
   ```

2. **Check app settings**:
   ```bash
   az webapp config appsettings list \
     --name lifeos-backend \
     --resource-group lifeos-rg
   ```

3. **Restart app**:
   ```bash
   az webapp restart --name lifeos-backend --resource-group lifeos-rg
   ```

### Password Issues

If you need to regenerate the password:

```bash
cd azure
./generate-password.sh
```

Then update the PostgreSQL server password:

```bash
az postgres flexible-server update \
  --resource-group lifeos-rg \
  --name lifeos-db \
  --admin-password $(grep POSTGRES_PASSWORD azure/.env | cut -d'=' -f2)
```

## Cost Estimation

### Development/Testing (Monthly)
- PostgreSQL B1ms: ~$12/month
- App Service B1: ~$13/month
- App Service FREE: $0
- Storage Account: ~$0.02/GB
- **Total**: ~$25/month

### Production (Monthly)
- PostgreSQL (scaled): $50-200/month
- App Service (scaled): $50-200/month
- Storage: $0.02/GB
- **Total**: $100-400/month (depending on scale)

## Cleanup

To delete all resources:

```bash
az group delete --name lifeos-rg --yes --no-wait
```

## Additional Resources

- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Storage Documentation](https://docs.microsoft.com/azure/storage/)
