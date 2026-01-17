import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all habits with stats (streak, success rate)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { identity_link } = req.query;
    let query = 'SELECT * FROM habits WHERE user_id = $1';
    const params: any[] = [req.userId];
    
    if (identity_link) {
      query += ' AND identity_link = $2';
      params.push(identity_link);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const habitsResult = await pool.query(query, params);

    // Get stats for each habit
    const habitsWithStats = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        // Get all logs for this habit
        const logsResult = await pool.query(
          'SELECT completed_on, status FROM habit_logs WHERE habit_id = $1 ORDER BY completed_on DESC',
          [habit.id]
        );

        // Helper function to format date as YYYY-MM-DD in local timezone
        const formatDateLocal = (date: Date | string): string => {
          const d = typeof date === 'string' ? new Date(date) : date;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Only count completed logs for streaks (positive tracking)
        const completedLogs = logsResult.rows
          .filter((row: any) => row.status === 'completed')
          .map((row: any) => formatDateLocal(row.completed_on));
        
        // Count not_completed logs for tracking missed habits
        const notCompletedLogs = logsResult.rows
          .filter((row: any) => row.status === 'not_completed')
          .map((row: any) => formatDateLocal(row.completed_on));
        
        // Get all logs (including status) for calendar view
        const allLogs = logsResult.rows.map((row: any) => ({
          date: formatDateLocal(row.completed_on),
          status: row.status || 'completed',
        }));
        
        // Calculate current streak (only for completed)
        let currentStreak = 0;
        if (completedLogs.length > 0) {
          const today = formatDateLocal(new Date());
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = formatDateLocal(yesterdayDate);
          
          // Check if completed today or yesterday to start streak
          if (completedLogs.includes(today) || completedLogs.includes(yesterday)) {
            let checkDate = completedLogs.includes(today) ? today : yesterday;
            currentStreak = 1;
            
            // Count backwards
            for (let i = 1; i < 365; i++) {
              const prevDateObj = new Date(checkDate);
              prevDateObj.setDate(prevDateObj.getDate() - i);
              const prevDate = formatDateLocal(prevDateObj);
              if (completedLogs.includes(prevDate)) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }

        // Calculate weekly success rate (last 7 days for daily habits, last 4 weeks for weekly)
        // Count both completed and not_completed for tracking
        let weeklySuccessRate = 0;
        let totalTracked = 0;
        if (habit.frequency === 'daily') {
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return formatDateLocal(date);
          });
          const completedDays = last7Days.filter(date => completedLogs.includes(date)).length;
          const notCompletedDays = last7Days.filter(date => notCompletedLogs.includes(date)).length;
          totalTracked = completedDays + notCompletedDays;
          // Success rate is based on completed vs total tracked (completed + not_completed)
          weeklySuccessRate = totalTracked > 0 ? Math.round((completedDays / totalTracked) * 100) : 0;
        } else if (habit.frequency === 'weekly') {
          // For weekly habits, check last 4 weeks
          const weeks = Array.from({ length: 4 }, (_, i) => {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { start: formatDateLocal(weekStart), end: formatDateLocal(weekEnd) };
          });
          const completedWeeks = weeks.filter(week => 
            completedLogs.some(log => log >= week.start && log <= week.end)
          ).length;
          const notCompletedWeeks = weeks.filter(week => 
            notCompletedLogs.some(log => log >= week.start && log <= week.end)
          ).length;
          totalTracked = completedWeeks + notCompletedWeeks;
          weeklySuccessRate = totalTracked > 0 ? Math.round((completedWeeks / totalTracked) * 100) : 0;
        }

        return {
          ...habit,
          currentStreak,
          weeklySuccessRate,
          totalCompletions: completedLogs.length,
          totalNotCompleted: notCompletedLogs.length,
          totalTracked: completedLogs.length + notCompletedLogs.length,
          calendarData: allLogs.map((log: any) => log.date), // Array of completion dates (YYYY-MM-DD format)
          calendarDataWithStatus: allLogs, // Array with status for calendar view
        };
      })
    );

    res.json(habitsWithStats);
  } catch (error: any) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Get single habit with logs
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const habitResult = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const logsResult = await pool.query(
      'SELECT * FROM habit_logs WHERE habit_id = $1 ORDER BY completed_on DESC',
      [req.params.id]
    );

    res.json({
      ...habitResult.rows[0],
      logs: logsResult.rows
    });
  } catch (error: any) {
    console.error('Get habit error:', error);
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

// Create habit
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().isString(),
    body('category').optional().isString(),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    body('identity_link').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, frequency, identity_link } = req.body;

      const result = await pool.query(
        `INSERT INTO habits (user_id, name, category, frequency, identity_link)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.userId, name, category, frequency, identity_link]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create habit error:', error);
      res.status(500).json({ error: 'Failed to create habit' });
    }
  }
);

// Update habit
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().isString(),
    body('category').optional().isString(),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    body('identity_link').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, frequency, identity_link } = req.body;

      const result = await pool.query(
        `UPDATE habits 
         SET name = COALESCE($1, name),
             category = COALESCE($2, category),
             frequency = COALESCE($3, frequency),
             identity_link = COALESCE($4, identity_link)
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [name, category, frequency, identity_link, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update habit error:', error);
      res.status(500).json({ error: 'Failed to update habit' });
    }
  }
);

// Delete habit
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error: any) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Log habit completion
router.post(
  '/:id/logs',
  authenticate,
  [
    body('completed_on').optional().isISO8601().toDate(),
    body('status').optional().isIn(['completed', 'not_completed', 'partial', 'not_today']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify habit belongs to user
      const habitCheck = await pool.query(
        'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
        [req.params.id, req.userId]
      );

      if (habitCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      // Format date in local timezone (YYYY-MM-DD)
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const completedOn = req.body.completed_on 
        ? (typeof req.body.completed_on === 'string' 
            ? req.body.completed_on.split('T')[0] 
            : formatDateLocal(new Date(req.body.completed_on)))
        : formatDateLocal(new Date());
      const status = req.body.status || 'completed';

      const result = await pool.query(
        `INSERT INTO habit_logs (habit_id, completed_on, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (habit_id, completed_on) 
         DO UPDATE SET status = $3
         RETURNING *`,
        [req.params.id, completedOn, status]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Log habit error:', error);
      res.status(500).json({ error: 'Failed to log habit' });
    }
  }
);

// Delete habit log
router.delete('/:id/logs/:logId', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify habit belongs to user
    const habitCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const result = await pool.query(
      'DELETE FROM habit_logs WHERE id = $1 AND habit_id = $2 RETURNING id',
      [req.params.logId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit log not found' });
    }

    res.json({ message: 'Habit log deleted successfully' });
  } catch (error: any) {
    console.error('Delete habit log error:', error);
    res.status(500).json({ error: 'Failed to delete habit log' });
  }
});

export default router;
