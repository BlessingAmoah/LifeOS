import express, { Request, Response } from 'express';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Career Analytics
router.get('/career', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { range = 'month' } = req.query;
    
    let dateFilter = '';
    if (range === 'week') {
      dateFilter = "AND updated_at >= NOW() - INTERVAL '7 days'";
    } else if (range === 'month') {
      dateFilter = "AND updated_at >= NOW() - INTERVAL '1 month'";
    } else if (range === 'quarter') {
      dateFilter = "AND updated_at >= NOW() - INTERVAL '3 months'";
    } else if (range === 'year') {
      dateFilter = "AND updated_at >= NOW() - INTERVAL '1 year'";
    }

    // Skills improved (skills with target_level and progress)
    const skillsResult = await pool.query(
      `SELECT COUNT(*) as count,
              AVG(CASE 
                WHEN target_level IS NOT NULL THEN 
                  CASE 
                    WHEN proficiency_level = 'beginner' AND target_level = 'intermediate' THEN 33.33
                    WHEN proficiency_level = 'beginner' AND target_level = 'advanced' THEN 66.66
                    WHEN proficiency_level = 'beginner' AND target_level = 'expert' THEN 100
                    WHEN proficiency_level = 'intermediate' AND target_level = 'advanced' THEN 50
                    WHEN proficiency_level = 'intermediate' AND target_level = 'expert' THEN 100
                    WHEN proficiency_level = 'advanced' AND target_level = 'expert' THEN 100
                    WHEN proficiency_level = target_level THEN 100
                    ELSE 0
                  END
                ELSE NULL
              END) as avg_progress
       FROM skills 
       WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    // Goals completed
    const goalsResult = await pool.query(
      `SELECT COUNT(*) as count FROM career_goals 
       WHERE user_id = $1 AND status = 'completed' ${dateFilter}`,
      [userId]
    );

    // Milestones achieved
    const milestonesResult = await pool.query(
      `SELECT COUNT(*) as count FROM career_milestones 
       WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    res.json({
      skills_improved: parseInt(skillsResult.rows[0].count) || 0,
      avg_skill_progress: parseFloat(skillsResult.rows[0].avg_progress) || 0,
      goals_completed: parseInt(goalsResult.rows[0].count) || 0,
      milestones_achieved: parseInt(milestonesResult.rows[0].count) || 0,
    });
  } catch (error: any) {
    console.error('Career analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch career analytics' });
  }
});

// Financial Analytics
router.get('/financial', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { range = 'month' } = req.query;
    
    let dateFilter = '';
    if (range === 'week') {
      dateFilter = "AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (range === 'month') {
      dateFilter = "AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'quarter') {
      dateFilter = "AND transaction_date >= DATE_TRUNC('quarter', CURRENT_DATE)";
    } else if (range === 'year') {
      dateFilter = "AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
       FROM transactions 
       WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    const totalIncome = parseFloat(result.rows[0].total_income) || 0;
    const totalExpenses = parseFloat(result.rows[0].total_expenses) || 0;
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netCashFlow / totalIncome) * 100) : 0;

    res.json({
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      savings_rate: savingsRate,
    });
  } catch (error: any) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// Health Analytics
router.get('/health', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { range = 'month' } = req.query;
    
    let dateFilter = '';
    if (range === 'week') {
      dateFilter = "AND logged_on >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (range === 'month') {
      dateFilter = "AND logged_on >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'quarter') {
      dateFilter = "AND logged_on >= DATE_TRUNC('quarter', CURRENT_DATE)";
    } else if (range === 'year') {
      dateFilter = "AND logged_on >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    const result = await pool.query(
      `SELECT 
        AVG(sleep_hours) as avg_sleep,
        AVG(energy_level) as avg_energy,
        COUNT(CASE WHEN exercise IS NOT NULL AND exercise != '' THEN 1 END) as exercise_days
       FROM health_logs 
       WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    // Health goals progress
    const goalsResult = await pool.query(
      `SELECT AVG(
        CASE 
          WHEN target_value IS NOT NULL AND current_value IS NOT NULL THEN
            (current_value / target_value) * 100
          ELSE NULL
        END
      ) as avg_progress
       FROM health_goals 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    res.json({
      avg_sleep: parseFloat(result.rows[0].avg_sleep) || 0,
      avg_energy: parseFloat(result.rows[0].avg_energy) || 0,
      exercise_days: parseInt(result.rows[0].exercise_days) || 0,
      goals_progress: parseFloat(goalsResult.rows[0].avg_progress) || 0,
    });
  } catch (error: any) {
    console.error('Health analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch health analytics' });
  }
});

// Technical Growth Analytics
router.get('/technical', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { range = 'month' } = req.query;
    
    let dateFilter = '';
    if (range === 'week') {
      dateFilter = "AND session_date >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (range === 'month') {
      dateFilter = "AND session_date >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'quarter') {
      dateFilter = "AND session_date >= DATE_TRUNC('quarter', CURRENT_DATE)";
    } else if (range === 'year') {
      dateFilter = "AND session_date >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    // Practice sessions
    const practiceResult = await pool.query(
      `SELECT COUNT(*) as count, SUM(time_spent_minutes) as total_minutes
       FROM practice_sessions 
       WHERE user_id = $1 ${dateFilter}`,
      [userId]
    );

    // Engineering docs - use created_at for date filtering
    let docsDateFilter = '';
    if (range === 'week') {
      docsDateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (range === 'month') {
      docsDateFilter = "AND created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'quarter') {
      docsDateFilter = "AND created_at >= DATE_TRUNC('quarter', CURRENT_DATE)";
    } else if (range === 'year') {
      docsDateFilter = "AND created_at >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    const docsResult = await pool.query(
      `SELECT COUNT(*) as count FROM engineering_docs 
       WHERE user_id = $1 ${docsDateFilter}`,
      [userId]
    );

    // Engineering wins - use win_date for date filtering
    let winsDateFilter = '';
    if (range === 'week') {
      winsDateFilter = "AND win_date >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (range === 'month') {
      winsDateFilter = "AND win_date >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (range === 'quarter') {
      winsDateFilter = "AND win_date >= DATE_TRUNC('quarter', CURRENT_DATE)";
    } else if (range === 'year') {
      winsDateFilter = "AND win_date >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    const winsResult = await pool.query(
      `SELECT COUNT(*) as count FROM engineering_wins 
       WHERE user_id = $1 ${winsDateFilter}`,
      [userId]
    );

    const totalMinutes = parseInt(practiceResult.rows[0].total_minutes) || 0;
    const totalHours = totalMinutes / 60;

    res.json({
      practice_sessions: parseInt(practiceResult.rows[0].count) || 0,
      total_hours: totalHours,
      docs_created: parseInt(docsResult.rows[0].count) || 0,
      wins_logged: parseInt(winsResult.rows[0].count) || 0,
    });
  } catch (error: any) {
    console.error('Technical analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch technical analytics' });
  }
});

export default router;
