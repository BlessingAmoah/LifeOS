# LifeOS Quick Start Guide

## Local Development Setup (5 minutes)

### 1. Prerequisites Check
```bash
node --version  # Should be 18+
npm --version
psql --version  # PostgreSQL client
```

### 2. Database Setup
```bash
# Create database
createdb lifeos

# Or using PostgreSQL directly:
psql -U postgres -c "CREATE DATABASE lifeos;"

# Run migrations
cd database
npm install
export DATABASE_URL="postgresql://postgres:password@localhost:5432/lifeos"
npm run migrate
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://lifeosadmin:password@lifeos-db.postgres.database.azure.com:5432/postgres?sslmode=require
JWT_SECRET=your-secret-key-change-in-production
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=lifeos-documents
PORT=3001
NODE_ENV=development
EOF

# Start backend (runs on http://localhost:3001)
npm run dev
```

### 4. Frontend Setup (New Terminal)
```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start frontend (runs on http://localhost:3000)
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## First Steps

1. **Register**: Create an account at http://localhost:3000/register
2. **Login**: Sign in with your credentials
3. **Set Profile**: Go to Profile page and add your identity statement and vision
4. **Create Habits**: Add habits you want to track
5. **Add Tasks**: Create tasks for your sprint
6. **Journal**: Start journaling your thoughts and reflections

## Common Issues

### Database Connection Error
- Verify Azure PostgreSQL server is running in Azure Portal
- Check DATABASE_URL format: `postgresql://user:pass@server.postgres.database.azure.com:5432/db?sslmode=require`
- Ensure firewall rules allow your IP address
- Verify SSL mode is set to `require` in connection string
- Check Azure Portal → Networking for firewall configuration

### Port Already in Use
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/vite.config.ts

### CORS Errors
- Ensure backend is running before frontend
- Check VITE_API_URL matches backend URL
- Verify backend CORS configuration allows frontend origin

### Azure Storage (Local Dev)
- For local development, you can use Azure Storage Emulator (Azurite)
- Or use a test storage account connection string
- File uploads will work but files won't persist locally without Azure Storage

## Next Steps

- Review `azure/README.md` for Azure deployment
- Check `README.md` for full documentation
- Explore API endpoints using the backend health check
