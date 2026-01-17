import pool from '../config/db';

/**
 * Cleanup job: Delete unverified users older than 5 minutes
 * This runs periodically to clean up users who registered but never verified their email
 */
export const cleanupUnverifiedUsers = async (): Promise<void> => {
  try {
    const result = await pool.query(
      `DELETE FROM users 
       WHERE is_verified = FALSE 
       AND verification_expires_at < NOW()
       RETURNING id, email`
    );

    if (result.rows.length > 0) {
      console.log(`✓ Cleaned up ${result.rows.length} unverified user(s):`, 
        result.rows.map((r: any) => r.email).join(', '));
      
      // Also delete associated profiles (cascade should handle this, but explicit is better)
      const userIds = result.rows.map((r: any) => r.id);
      await pool.query(
        `DELETE FROM profiles WHERE user_id = ANY($1::uuid[])`,
        [userIds]
      );
    }
  } catch (error: any) {
    console.error('✗ Error cleaning up unverified users:', error.message);
    // Don't throw - this is a background job, don't crash the server
  }
};

/**
 * Start the cleanup job - runs every 2 minutes
 */
export const startCleanupJob = (): void => {
  // Run immediately on startup
  cleanupUnverifiedUsers();

  // Then run every 2 minutes
  setInterval(() => {
    cleanupUnverifiedUsers();
  }, 2 * 60 * 1000); // 2 minutes in milliseconds

  console.log('✓ Cleanup job started - will delete unverified users after 5 minutes');
};
