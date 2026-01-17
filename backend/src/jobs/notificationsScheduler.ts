import { generateNotifications } from './generateNotifications';

/**
 * Start the notifications job - runs every hour
 * Generates notifications for:
 * - Upcoming deadlines
 * - Habit streaks (milestones)
 * - Career tasks/interviews
 */
export const startNotificationsJob = (): void => {
  // Run immediately on startup
  generateNotifications().catch((error) => {
    console.error('✗ Error generating notifications on startup:', error.message);
  });

  // Then run every hour
  setInterval(() => {
    generateNotifications().catch((error) => {
      console.error('✗ Error generating notifications:', error.message);
    });
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('✓ Notifications job started - will generate notifications every hour');
};
