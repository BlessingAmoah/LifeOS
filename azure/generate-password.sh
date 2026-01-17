#!/bin/bash

# Generate secure random password for PostgreSQL
# Requirements: min 8 chars, uppercase, lowercase, numbers

generate_password() {
    # Generate password with required characters
    # Length: 16 characters
    # Contains: uppercase, lowercase, numbers
    
    # Generate random password
    PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-12)
    
    # Ensure it has uppercase, lowercase, and numbers
    # Add required characters if missing
    if ! [[ "$PASSWORD" =~ [A-Z] ]]; then
        PASSWORD="${PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr '[:lower:]' '[:upper:]' | cut -c1-1)"
    fi
    if ! [[ "$PASSWORD" =~ [a-z] ]]; then
        PASSWORD="${PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr '[:upper:]' '[:lower:]' | cut -c1-1)"
    fi
    if ! [[ "$PASSWORD" =~ [0-9] ]]; then
        PASSWORD="${PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | tr -d '[:alpha:]' | cut -c1-1)"
    fi
    
    # Ensure minimum length of 16
    while [ ${#PASSWORD} -lt 16 ]; do
        PASSWORD="${PASSWORD}$(openssl rand -base64 1 | tr -d "=+/" | cut -c1-1)"
    done
    
    # Shuffle the password (macOS compatible)
    if command -v shuf &> /dev/null; then
        PASSWORD=$(echo "$PASSWORD" | fold -w1 | shuf | tr -d '\n')
    else
        # macOS alternative: use awk to shuffle
        PASSWORD=$(echo "$PASSWORD" | fold -w1 | awk 'BEGIN{srand();}{printf "%06d %s\n", rand()*1000000, $0;}' | sort -n | cut -d' ' -f2 | tr -d '\n')
    fi
    
    echo "$PASSWORD"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

PASSWORD=$(generate_password)

echo "Generated PostgreSQL password: $PASSWORD"
echo ""
echo "Saving to .env file..."

# Create .env file in azure directory if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# Update or add POSTGRES_PASSWORD
if grep -q "POSTGRES_PASSWORD=" "$ENV_FILE"; then
    # Update existing password (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PASSWORD|" "$ENV_FILE"
    else
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PASSWORD|" "$ENV_FILE"
    fi
else
    # Add new password
    echo "POSTGRES_PASSWORD=$PASSWORD" >> "$ENV_FILE"
fi

echo "✓ Password saved to $ENV_FILE"
echo ""
echo "⚠️  IMPORTANT: Keep this password secure!"
echo "⚠️  The .env file is in .gitignore and should not be committed."
echo ""
echo "To use this password in setup script, run:"
echo "  cd azure"
echo "  ./setup-resources.sh"
