import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all reading goals
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'completed', 'paused']),
    query('goal_type').optional().isIn(['books_per_year', 'books_per_month', 'category_goal', 'streak']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, goal_type } = req.query;

      let query = 'SELECT * FROM reading_goals WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (goal_type) {
        query += ` AND goal_type = $${paramIndex++}`;
        params.push(goal_type);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching reading goals:', error);
      res.status(500).json({ error: 'Failed to fetch reading goals' });
    }
  }
);

// Get a single goal
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reading_goals WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create a new goal
router.post(
  '/',
  authenticate,
  [
    body('goal_type').notEmpty().isIn(['books_per_year', 'books_per_month', 'category_goal', 'streak']),
    body('target_value').notEmpty().isInt({ min: 1 }),
    body('category').optional().trim(),
    body('period_start').optional().isISO8601().toDate(),
    body('period_end').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { goal_type, target_value, category, period_start, period_end, status = 'active' } = req.body;

      const result = await pool.query(
        `INSERT INTO reading_goals (
          user_id, goal_type, target_value, current_value, category,
          period_start, period_end, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          req.userId,
          goal_type,
          target_value,
          0,
          category || null,
          period_start || null,
          period_end || null,
          status,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating reading goal:', error);
      res.status(500).json({ error: 'Failed to create reading goal' });
    }
  }
);

// Update a goal
router.put(
  '/:id',
  authenticate,
  [
    body('goal_type').optional().isIn(['books_per_year', 'books_per_month', 'category_goal', 'streak']),
    body('target_value').optional().isInt({ min: 1 }),
    body('current_value').optional().isInt({ min: 0 }),
    body('category').optional().trim(),
    body('period_start').optional().isISO8601().toDate(),
    body('period_end').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { goal_type, target_value, current_value, category, period_start, period_end, status } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (goal_type !== undefined) {
        updates.push(`goal_type = $${paramIndex++}`);
        values.push(goal_type);
      }
      if (target_value !== undefined) {
        updates.push(`target_value = $${paramIndex++}`);
        values.push(target_value);
      }
      if (current_value !== undefined) {
        updates.push(`current_value = $${paramIndex++}`);
        values.push(current_value);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (period_start !== undefined) {
        updates.push(`period_start = $${paramIndex++}`);
        values.push(period_start);
      }
      if (period_end !== undefined) {
        updates.push(`period_end = $${paramIndex++}`);
        values.push(period_end);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE reading_goals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating reading goal:', error);
      res.status(500).json({ error: 'Failed to update reading goal' });
    }
  }
);

// Delete a goal
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reading_goals WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting reading goal:', error);
    res.status(500).json({ error: 'Failed to delete reading goal' });
  }
});

export default router;
