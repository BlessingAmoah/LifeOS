import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  azure: {
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    storageContainer: process.env.AZURE_STORAGE_CONTAINER || 'lifeos-documents',
  },
};

// Validate required environment variables (only in production, and log instead of throw for graceful degradation)
if (config.nodeEnv === 'production') {
  if (!config.database.url) {
    console.error('ERROR: DATABASE_URL is required in production');
    // Don't throw - let the app start and fail gracefully on first DB connection
  }
  
  if (!config.jwt.secret) {
    console.error('ERROR: JWT_SECRET is required in production');
    // Don't throw - let the app start, but auth will fail
  }
}
