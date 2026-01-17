# LifeOS Azure Infrastructure Setup Script (PowerShell)
# This script creates all necessary Azure resources for LifeOS

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "lifeos-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "centralus",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresServer = "lifeos-db",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresAdmin = "lifeosadmin",
    
    [Parameter(Mandatory=$true)]
    [SecureString]$PostgresPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$BackendApp = "lifeos-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendApp = "lifeos-frontend"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "LifeOS Azure Infrastructure Setup" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check if logged in to Azure
Write-Host "Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Please login to Azure:"
    az login
}

$subscriptionId = az account show --query id -o tsv
Write-Host "✓ Logged in to Azure (Subscription: $subscriptionId)" -ForegroundColor Green
Write-Host ""

# Convert SecureString to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PostgresPassword)
$PostgresPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$PostgresDbName = "lifeos"
$StorageAccount = "lifeosstorage$((Get-Random -Maximum 9999).ToString('0000'))"
$ContainerName = "lifeos-documents"

# Create Resource Group
Write-Host "Creating resource group: $ResourceGroup..." -ForegroundColor Blue
az group create --name $ResourceGroup --location $Location | Out-Null
Write-Host "✓ Resource group created" -ForegroundColor Green
Write-Host ""

# Create PostgreSQL Flexible Server
Write-Host "Creating PostgreSQL Flexible Server: $PostgresServer..." -ForegroundColor Blue
az postgres flexible-server create `
  --resource-group $ResourceGroup `
  --name $PostgresServer `
  --location $Location `
  --admin-user $PostgresAdmin `
  --admin-password $PostgresPasswordPlain `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 14 `
  --storage-size 32 `
  --public-access 0.0.0.0 | Out-Null
Write-Host "✓ PostgreSQL server created" -ForegroundColor Green
Write-Host ""

# Configure PostgreSQL Firewall
Write-Host "Configuring PostgreSQL firewall rules..." -ForegroundColor Blue

# Allow Azure services
az postgres flexible-server firewall-rule create `
  --resource-group $ResourceGroup `
  --name $PostgresServer `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0 | Out-Null

# Get current IP
$MyIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
az postgres flexible-server firewall-rule create `
  --resource-group $ResourceGroup `
  --name $PostgresServer `
  --rule-name AllowMyIP `
  --start-ip-address $MyIP `
  --end-ip-address $MyIP | Out-Null
Write-Host "✓ Firewall rules configured" -ForegroundColor Green
Write-Host ""

# Create database
Write-Host "Creating database: $PostgresDbName..." -ForegroundColor Blue
az postgres flexible-server db create `
  --resource-group $ResourceGroup `
  --server-name $PostgresServer `
  --database-name $PostgresDbName | Out-Null
Write-Host "✓ Database created" -ForegroundColor Green
Write-Host ""

# Create Storage Account
Write-Host "Creating Storage Account: $StorageAccount..." -ForegroundColor Blue
az storage account create `
  --name $StorageAccount `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Standard_LRS `
  --kind StorageV2 | Out-Null
Write-Host "✓ Storage account created" -ForegroundColor Green
Write-Host ""

# Create Blob Container
Write-Host "Creating blob container: $ContainerName..." -ForegroundColor Blue
az storage container create `
  --name $ContainerName `
  --account-name $StorageAccount `
  --auth-mode login `
  --public-access blob | Out-Null
Write-Host "✓ Blob container created" -ForegroundColor Green
Write-Host ""

# Create App Service Plans
Write-Host "Creating App Service Plans..." -ForegroundColor Blue

# Backend Plan
az appservice plan create `
  --name "$BackendApp-plan" `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku B1 `
  --is-linux | Out-Null
Write-Host "✓ Backend App Service Plan created" -ForegroundColor Green

# Frontend Plan
az appservice plan create `
  --name "$FrontendApp-plan" `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku FREE `
  --is-linux | Out-Null
Write-Host "✓ Frontend App Service Plan created" -ForegroundColor Green
Write-Host ""

# Create Backend App Service
Write-Host "Creating Backend App Service: $BackendApp..." -ForegroundColor Blue
az webapp create `
  --name $BackendApp `
  --resource-group $ResourceGroup `
  --plan "$BackendApp-plan" `
  --runtime "NODE:18-lts" | Out-Null
Write-Host "✓ Backend App Service created" -ForegroundColor Green
Write-Host ""

# Create Frontend App Service
Write-Host "Creating Frontend App Service: $FrontendApp..." -ForegroundColor Blue
az webapp create `
  --name $FrontendApp `
  --resource-group $ResourceGroup `
  --plan "$FrontendApp-plan" `
  --runtime "NODE:18-lts" | Out-Null
Write-Host "✓ Frontend App Service created" -ForegroundColor Green
Write-Host ""

# Get connection strings
Write-Host "Retrieving connection strings..." -ForegroundColor Blue

$PostgresConnectionString = "postgresql://${PostgresAdmin}:${PostgresPasswordPlain}@${PostgresServer}.postgres.database.azure.com:5432/${PostgresDbName}?sslmode=require"
$StorageConnectionString = az storage account show-connection-string `
  --name $StorageAccount `
  --resource-group $ResourceGroup `
  --query connectionString -o tsv

# Generate JWT secret
$JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Configure Backend App Settings
Write-Host "Configuring Backend App Settings..." -ForegroundColor Blue
az webapp config appsettings set `
  --name $BackendApp `
  --resource-group $ResourceGroup `
  --settings `
    DATABASE_URL="$PostgresConnectionString" `
    AZURE_STORAGE_CONNECTION_STRING="$StorageConnectionString" `
    AZURE_STORAGE_CONTAINER="$ContainerName" `
    JWT_SECRET="$JwtSecret" `
    NODE_ENV="production" `
    PORT="8080" | Out-Null
Write-Host "✓ Backend app settings configured" -ForegroundColor Green
Write-Host ""

# Configure Frontend App Settings
Write-Host "Configuring Frontend App Settings..." -ForegroundColor Blue
$BackendUrl = "https://${BackendApp}.azurewebsites.net"

az webapp config appsettings set `
  --name $FrontendApp `
  --resource-group $ResourceGroup `
  --settings `
    VITE_API_URL="${BackendUrl}/api" | Out-Null
Write-Host "✓ Frontend app settings configured" -ForegroundColor Green
Write-Host ""

# Enable HTTPS only
Write-Host "Enabling HTTPS only..." -ForegroundColor Blue
az webapp update --name $BackendApp --resource-group $ResourceGroup --https-only true | Out-Null
az webapp update --name $FrontendApp --resource-group $ResourceGroup --https-only true | Out-Null
Write-Host "✓ HTTPS enabled" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Blue
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

Write-Host "Resource Details:" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location: $Location"
Write-Host ""
Write-Host "PostgreSQL Server: $PostgresServer.postgres.database.azure.com"
Write-Host "Database: $PostgresDbName"
Write-Host "Admin User: $PostgresAdmin"
Write-Host ""
Write-Host "Backend App: https://$BackendApp.azurewebsites.net"
Write-Host "Frontend App: https://$FrontendApp.azurewebsites.net"
Write-Host ""
Write-Host "Storage Account: $StorageAccount"
Write-Host "Container: $ContainerName"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run database migrations:"
Write-Host "   cd database"
Write-Host "   `$env:DATABASE_URL=`"$PostgresConnectionString`""
Write-Host "   npm run migrate"
Write-Host ""
Write-Host "2. Deploy backend and frontend"
Write-Host ""
