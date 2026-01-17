#!/bin/bash

# Verify all resources are in the same location

RESOURCE_GROUP=${1:-lifeos-rg}

echo "Checking resource locations in resource group: $RESOURCE_GROUP"
echo ""

# Get resource group location
RG_LOCATION=$(az group show --name $RESOURCE_GROUP --query location -o tsv)
echo "Resource Group Location: $RG_LOCATION"
echo ""

# Check PostgreSQL
echo "PostgreSQL Server:"
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name lifeos-db \
  --query "{Name:name, Location:location}" -o table 2>/dev/null || echo "  Not found"
echo ""

# Check Storage Account
echo "Storage Account:"
az storage account list \
  --resource-group $RESOURCE_GROUP \
  --query "[].{Name:name, Location:location}" -o table
echo ""

# Check App Service Plans
echo "App Service Plans:"
az appservice plan list \
  --resource-group $RESOURCE_GROUP \
  --query "[].{Name:name, Location:location}" -o table
echo ""

# Check App Services
echo "App Services:"
az webapp list \
  --resource-group $RESOURCE_GROUP \
  --query "[].{Name:name, Location:location}" -o table
echo ""

echo "All resources should be in the same location: $RG_LOCATION"
