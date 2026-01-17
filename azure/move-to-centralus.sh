#!/bin/bash

# Script to move resources to Central US
# WARNING: This will delete the existing resource group and recreate it in centralus

set -e

RESOURCE_GROUP="lifeos-rg"
NEW_LOCATION="centralus"

echo "========================================"
echo "Move LifeOS Resources to Central US"
echo "========================================"
echo ""
echo "⚠️  WARNING: This will DELETE the existing resource group!"
echo "⚠️  All resources in $RESOURCE_GROUP will be deleted!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Deleting resource group: $RESOURCE_GROUP..."
az group delete --name $RESOURCE_GROUP --yes --no-wait

echo "Waiting for deletion to complete (this may take a few minutes)..."
# Wait for deletion
while az group show --name $RESOURCE_GROUP &>/dev/null; do
    echo "Still deleting... (waiting 10 seconds)"
    sleep 10
done

echo "✓ Resource group deleted"
echo ""
echo "Now run the setup script to recreate everything in centralus:"
echo "  cd azure"
echo "  ./setup-resources.sh"
