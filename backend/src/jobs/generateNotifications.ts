import pool from '../config/db';

/**
 * Generate notifications for:
 * - Upcoming deadlines (immigration, tasks, etc.)
 * - Career tasks (upcoming interviews, deadlines)
 */
export async function generateNotifications() {
  try {
    // Get all active users
    const usersResult = await pool.query('SELECT id FROM users WHERE is_verified = true');
    const users = usersResult.rows;

    for (const user of users) {
      const userId = user.id;

      // 1. Check for upcoming deadlines (next 7 days)
      const deadlinesResult = await pool.query(
        `SELECT id, title, deadline_date, is_critical
         FROM deadlines_reminders
         WHERE user_id = $1 
           AND completed = false
           AND deadline_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
           AND id NOT IN (
             SELECT related_id FROM notifications 
             WHERE user_id = $1 
               AND type = 'deadline' 
               AND related_module = 'immigration'
               AND scheduled_for >= CURRENT_DATE
           )`,
        [userId]
      );

      for (const deadline of deadlinesResult.rows) {
        await pool.query(
          `INSERT INTO notifications (
            user_id, type, title, message, related_module, related_id,
            priority, scheduled_for
          ) VALUES ($1, 'deadline', $2, $3, 'immigration', $4, $5, $6)
          ON CONFLICT DO NOTHING`,
          [
            userId,
            deadline.is_critical ? `⚠️ Critical: ${deadline.title}` : `⏰ Upcoming: ${deadline.title}`,
            `Deadline: ${new Date(deadline.deadline_date).toLocaleDateString()}`,
            deadline.id,
            deadline.is_critical ? 'urgent' : 'high',
            deadline.deadline_date,
          ]
        );
      }


      // 3. Check for upcoming career tasks/interviews
      const interviewsResult = await pool.query(
        `SELECT id, company, role, interview_date
         FROM interview_prep
         WHERE user_id = $1
           AND outcome = 'pending'
           AND interview_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
           AND id NOT IN (
             SELECT related_id FROM notifications
             WHERE user_id = $1
               AND type = 'career_task'
               AND related_module = 'career'
           )`,
        [userId]
      );

      for (const interview of interviewsResult.rows) {
        await pool.query(
          `INSERT INTO notifications (
            user_id, type, title, message, related_module, related_id,
            priority, scheduled_for
          ) VALUES ($1, 'career_task', $2, $3, 'career', $4, 'high', $5)
          ON CONFLICT DO NOTHING`,
          [
            userId,
            `🎤 Interview: ${interview.company}`,
            `Interview for ${interview.role} on ${new Date(interview.interview_date).toLocaleDateString()}`,
            interview.id,
            interview.interview_date,
          ]
        );
      }
    }

    console.log('✓ Notifications generated successfully');
  } catch (error: any) {
    console.error('Error generating notifications:', error);
    throw error;
  }
}
