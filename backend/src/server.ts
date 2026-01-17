import app from './app';
import { config } from './config/env';
import { testConnection } from './config/db';
import { startCleanupJob } from './jobs/cleanupUnverifiedUsers';
import { startNotificationsJob } from './jobs/notificationsScheduler';

// Azure App Service uses process.env.PORT, fallback to config.port for local
const PORT = Number(process.env.PORT) || Number(config.port) || 8080;

// Keep process alive - handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err);
  // Don't exit - log and continue (Azure will restart if needed)
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Test PostgreSQL connection and start server
const startServer = async () => {
  try {
    // Always start the server first (don't wait for DB)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${config.nodeEnv || 'production'}`);
      console.log(`✓ Database URL: ${config.database.url ? 'configured' : 'NOT CONFIGURED'}`);
      console.log('✓ Server is ready to accept connections');
    });

    // Keep server alive - handle errors without crashing
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('✗ Server error:', err);
        // Don't exit - let Azure handle restart if needed
      }
    });
    
    // Test connection asynchronously (don't block startup)
    if (config.database.url) {
      testConnection().catch((error) => {
        console.error('⚠️  Database connection warning:', error.message);
        console.error('⚠️  The server is running but database operations may fail');
        // Don't exit - let the server start anyway
      });

      // Start cleanup job for unverified users (only if DB is configured)
      startCleanupJob();
      
      // Start notifications job for habit streaks, deadlines, etc.
      startNotificationsJob();
    } else {
      console.warn('⚠️  DATABASE_URL not configured - database operations will fail');
    }
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    // Only exit on critical startup errors
    process.exit(1);
  }
};

startServer();
