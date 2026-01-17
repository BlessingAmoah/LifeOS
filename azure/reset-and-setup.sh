#!/bin/bash

# Reset LifeOS Azure Infrastructure - Delete and recreate everything in Central US

set -e

RESOURCE_GROUP="lifeos-rg"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}Reset LifeOS Azure Infrastructure${NC}"
echo -e "${RED}========================================${NC}\n"

echo -e "${YELLOW}⚠️  WARNING: This will DELETE the resource group '$RESOURCE_GROUP'${NC}"
echo -e "${YELLOW}⚠️  This will DELETE ALL resources including:${NC}"
echo -e "${YELLOW}   - PostgreSQL Database${NC}"
echo -e "${YELLOW}   - Storage Account${NC}"
echo -e "${YELLOW}   - App Services${NC}"
echo -e "${YELLOW}   - All data will be lost!${NC}\n"

read -p "Type 'DELETE' to confirm: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "${RED}Cancelled. No changes made.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Checking if resource group exists...${NC}"
if az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo -e "${YELLOW}Resource group found. Deleting...${NC}"
    az group delete --name $RESOURCE_GROUP --yes --no-wait
    echo -e "${YELLOW}Waiting for deletion to complete (this may take several minutes)...${NC}"
    
    # Wait for deletion (check every 10 seconds, up to 15 minutes)
    COUNTER=0
    MAX_WAIT=900  # 15 minutes in seconds
    DELETED=false
    
    while [ $COUNTER -lt $MAX_WAIT ]; do
        # Check if resource group exists (both show and list methods)
        if ! az group show --name $RESOURCE_GROUP &>/dev/null 2>&1; then
            # Double-check with list to ensure it's really gone
            if ! az group list --query "[?name=='$RESOURCE_GROUP']" -o tsv | grep -q "$RESOURCE_GROUP"; then
                DELETED=true
                echo -e "${GREEN}✓ Resource group deleted successfully${NC}\n"
                break
            fi
        fi
        if [ $((COUNTER % 30)) -eq 0 ] && [ $COUNTER -gt 0 ]; then
            echo -e "${YELLOW}Still deleting... ($((COUNTER / 60)) minutes, $((COUNTER % 60)) seconds elapsed)${NC}"
        fi
        sleep 10
        COUNTER=$((COUNTER + 10))
    done
    
    # Final check - don't proceed if resource group still exists
    if [ "$DELETED" != "true" ]; then
        if az group show --name $RESOURCE_GROUP &>/dev/null 2>&1; then
            echo -e "${RED}✗ ERROR: Resource group still exists after $((MAX_WAIT / 60)) minutes${NC}"
            echo -e "${RED}Please wait a few more minutes and try again, or delete manually:${NC}"
            echo -e "${YELLOW}  az group delete --name $RESOURCE_GROUP --yes${NC}"
            exit 1
        fi
    fi
    
    # Small delay to ensure Azure has fully processed the deletion
    echo -e "${BLUE}Waiting a few seconds for Azure to finalize deletion...${NC}"
    sleep 5
else
    echo -e "${GREEN}Resource group doesn't exist. Nothing to delete.${NC}\n"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Starting fresh setup in Central US...${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Run the setup script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$SCRIPT_DIR/setup-resources.sh"
