import pool from '../config/db';

/**
 * Generate notifications for:
 * - Upcoming deadlines (immigration, tasks, etc.)
 * - Habit streaks (milestones, broken streaks)
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

      // 2. Check for habit streaks (7, 14, 30, 50, 100 day milestones)
      // Get daily habits for this user
      const habitsResult = await pool.query(
        `SELECT h.id, h.name
         FROM habits h
         WHERE h.user_id = $1
           AND h.frequency = 'daily'
           AND h.id NOT IN (
             SELECT related_id FROM notifications 
             WHERE user_id = $1 
               AND type = 'habit_streak' 
               AND related_module = 'habits'
               AND created_at >= CURRENT_DATE - INTERVAL '1 day'
           )`,
        [userId]
      );

      for (const habit of habitsResult.rows) {
        // Calculate current streak by checking habit_logs
        const logsResult = await pool.query(
          `SELECT completed_on, status 
           FROM habit_logs 
           WHERE habit_id = $1 
           ORDER BY completed_on DESC`,
          [habit.id]
        );

        // Only count completed logs for streaks
        const completedLogs = logsResult.rows
          .filter((row: any) => row.status === 'completed')
          .map((row: any) => new Date(row.completed_on).toISOString().split('T')[0]);

        // Calculate current streak
        let currentStreak = 0;
        if (completedLogs.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          // Check if there's a log for today or yesterday to start counting
          let checkDate = completedLogs.includes(today) ? today : yesterday;
          let streakDate = new Date(checkDate);
          
          // Count consecutive days backwards
          while (completedLogs.includes(streakDate.toISOString().split('T')[0])) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          }
        }

        // Check if streak matches a milestone
        if ([7, 14, 30, 50, 100].includes(currentStreak)) {
          await pool.query(
            `INSERT INTO notifications (
              user_id, type, title, message, related_module, related_id, priority
            ) VALUES ($1, 'habit_streak', $2, $3, 'habits', $4, 'medium')
            ON CONFLICT DO NOTHING`,
            [
              userId,
              `🔥 ${currentStreak}-Day Streak!`,
              `Congratulations! You've maintained "${habit.name}" for ${currentStreak} days!`,
              habit.id,
            ]
          );
        }
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
