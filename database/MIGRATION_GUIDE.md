# Database Migration Guide

## Azure Connection String

Your Azure PostgreSQL connection string is stored in `azure/.env`:

```
DATABASE_URL=postgresql://lifeosadmin:r3nhgUEcceEwq5vF@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require
```

## Running Migrations

### Option 1: Using Environment Variable (Recommended)

```bash
cd database

# Load the connection string from azure/.env
export DATABASE_URL='postgresql://lifeosadmin:r3nhgUEcceEwq5vF@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require'

# Run migrations
npm run migrate
```

### Option 2: Create .env file in database directory

```bash
cd database

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://lifeosadmin:r3nhgUEcceEwq5vF@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require
EOF

# Run migrations
npm run migrate
```

### Option 3: Direct Connection String

```bash
cd database
DATABASE_URL='postgresql://lifeosadmin:r3nhgUEcceEwq5vF@lifeos-db.postgres.database.azure.com:5432/lifeos?sslmode=require' npm run migrate
```

## Available Migrations

1. **001_initial_schema.sql** - Creates all base tables (users, profiles, journals, habits, tasks, reviews, health_logs, documents)
2. **002_update_profiles_schema.sql** - Adds new profile fields (location, timezone, phone_numbers, core_values, profile_image_url) and password reset/email change fields

## Migration Status

Migrations are tracked in the `schema_migrations` table. Each migration is only applied once.

## Troubleshooting

### Connection Refused Error
If you see `ECONNREFUSED`, it means:
- You're trying to connect to `localhost:5432` (local database)
- You need to use the Azure connection string instead

**Solution**: Make sure `DATABASE_URL` environment variable is set to the Azure connection string before running migrations.

### SSL Required
Azure PostgreSQL requires SSL. The connection string includes `sslmode=require` which is necessary.

### Firewall Rules
If connection fails, check that your IP address is allowed in Azure PostgreSQL firewall rules:
```bash
az postgres flexible-server firewall-rule list \
  --name lifeos-db \
  --resource-group lifeos-rg
```
