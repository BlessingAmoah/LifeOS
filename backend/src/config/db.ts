import { Pool } from 'pg';
import { config } from './env';

// Validate connection string before creating pool
if (!config.database.url || config.database.url.trim() === '') {
  console.error('⚠️  WARNING: DATABASE_URL is not configured');
  console.error('⚠️  Database operations will fail until DATABASE_URL is set');
}

// Create pool with error handling
// Always create the pool, even if connection string is invalid
// This allows the app to start and fail gracefully on first query
const pool = new Pool({
  connectionString: config.database.url || 'postgresql://localhost:5432/invalid',
  ssl: config.database.url ? {
    rejectUnauthorized: false, // Required for Azure PostgreSQL
  } : undefined,
  // Connection pool settings for Azure
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
});

// Connection event handlers
pool.on('connect', () => {
  // Only log in development to reduce noise in production
  if (config.nodeEnv === 'development') {
    console.log('✓ New PostgreSQL client connected');
  }
});

pool.on('error', (err: Error) => {
  console.error('✗ PostgreSQL pool error:', err.message);
  // Don't throw - let individual queries handle errors
  // This prevents the app from crashing on connection errors
});

if (config.database.url) {
  console.log('✓ PostgreSQL pool initialized with connection string');
} else {
  console.warn('⚠️  PostgreSQL pool initialized without valid connection string');
  console.warn('⚠️  Database operations will fail until DATABASE_URL is configured');
}

// Test connection on startup (non-blocking)
export const testConnection = async (): Promise<void> => {
  if (!config.database.url || config.database.url.trim() === '') {
    console.warn('⚠️  DATABASE_URL not configured - skipping connection test');
    return;
  }
  
  try {
    await pool.query('SELECT 1');
    console.log('✓ Connected to Azure PostgreSQL');
  } catch (error: any) {
    console.error('✗ PostgreSQL connection test failed:', error.message);
    console.error('⚠️  The server will start, but database operations may fail');
    // Don't throw - let the server start anyway
    // The error is already logged, individual queries will handle it
  }
};

export default pool;
