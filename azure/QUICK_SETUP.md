# Quick Azure Setup Guide

## One-Command Setup

### Fresh Setup (Recommended)

If you don't have an existing resource group, or want to start fresh:

```bash
cd azure
./setup-resources.sh
```

### Reset Existing Resources

If you have an existing resource group in a different location and want to recreate everything in Central US:

```bash
cd azure
./reset-and-setup.sh
```

**⚠️ WARNING**: This will delete ALL existing resources including:
- PostgreSQL Database (all data will be lost!)
- Storage Account
- App Services
- Everything in the resource group

## What Gets Created

✅ Resource Group: `lifeos-rg` (in Central US)  
✅ PostgreSQL Database: `lifeos-db`  
✅ Storage Account: `lifeosstorage[random]`  
✅ Backend App Service: `lifeos-backend`  
✅ Frontend App Service: `lifeos-frontend`  

## After Setup

### 1. Run Migrations

```bash
cd database
# Load DATABASE_URL from azure/.env
source ../azure/.env  # Linux/macOS
# Or set manually:
export DATABASE_URL="postgresql://lifeosadmin:YOUR_PASSWORD@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require"
npm install
npm run migrate
```

### 2. Deploy Applications

```bash
# Deploy backend
cd azure
./deploy-backend.sh

# Deploy frontend  
./deploy-frontend.sh
```

### 3. Access Your App

- Frontend: https://lifeos-frontend.azurewebsites.net
- Backend API: https://lifeos-backend.azurewebsites.net

## Connection Strings

All connection strings are automatically saved to `azure/.env` file after setup.

## Troubleshooting

**Resource group location mismatch?**
- Run `./reset-and-setup.sh` to delete and recreate in Central US

**Can't connect to database?**
- Check firewall rules in Azure Portal
- Ensure your IP is allowed

**App not starting?**
- Check logs: `az webapp log tail --name lifeos-backend --resource-group lifeos-rg`
- Verify environment variables are set correctly

**Need help?**
- See [azure/README.md](README.md) for detailed documentation
