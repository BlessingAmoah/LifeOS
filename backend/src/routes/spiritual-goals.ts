import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all spiritual goals
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'completed', 'paused']),
    query('goal_type').optional().isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, goal_type } = req.query;

      let query = 'SELECT * FROM spiritual_goals WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (goal_type) {
        query += ` AND goal_type = $${paramIndex}`;
        params.push(goal_type);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get spiritual goals error:', error);
      res.status(500).json({ error: 'Failed to fetch spiritual goals' });
    }
  }
);

// Get single spiritual goal
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM spiritual_goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spiritual goal not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get spiritual goal error:', error);
    res.status(500).json({ error: 'Failed to fetch spiritual goal' });
  }
});

// Create spiritual goal
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('goal_type').isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
    body('target_value').optional().isInt({ min: 1 }),
    body('current_value').optional().isInt({ min: 0 }),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, goal_type, target_value, current_value = 0, target_date, status = 'active' } = req.body;

      const result = await pool.query(
        `INSERT INTO spiritual_goals (user_id, title, description, goal_type, target_value, current_value, target_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          title,
          description || null,
          goal_type,
          target_value || null,
          current_value,
          target_date || null,
          status,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create spiritual goal error:', error);
      res.status(500).json({ error: 'Failed to create spiritual goal' });
    }
  }
);

// Update spiritual goal
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('description').optional().isString(),
    body('goal_type').optional().isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
    body('target_value').optional().isInt({ min: 1 }),
    body('current_value').optional().isInt({ min: 0 }),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, goal_type, target_value, current_value, target_date, status } = req.body;

      // Check if goal exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM spiritual_goals WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Spiritual goal not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
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
      if (target_date !== undefined) {
        updates.push(`target_date = $${paramIndex++}`);
        values.push(target_date);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE spiritual_goals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update spiritual goal error:', error);
      res.status(500).json({ error: 'Failed to update spiritual goal' });
    }
  }
);

// Delete spiritual goal
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM spiritual_goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spiritual goal not found' });
    }
    res.json({ message: 'Spiritual goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete spiritual goal error:', error);
    res.status(500).json({ error: 'Failed to delete spiritual goal' });
  }
});

export default router;
