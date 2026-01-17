import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all health goals
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'completed', 'paused']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM health_goals WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get health goals error:', error);
      res.status(500).json({ error: 'Failed to fetch health goals' });
    }
  }
);

// Get single health goal
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM health_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health goal not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get health goal error:', error);
    res.status(500).json({ error: 'Failed to fetch health goal' });
  }
});

// Create health goal
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString(),
    body('description').optional().isString(),
    body('target_value').optional().isFloat({ min: 0 }),
    body('current_value').optional().isFloat({ min: 0 }),
    body('unit').optional().isString(),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, target_value, current_value = 0, unit, target_date, status = 'active' } = req.body;

      const result = await pool.query(
        `INSERT INTO health_goals (user_id, title, description, target_value, current_value, unit, target_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.userId, title, description, target_value, current_value, unit, target_date, status]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create health goal error:', error);
      res.status(500).json({ error: 'Failed to create health goal' });
    }
  }
);

// Update health goal
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('target_value').optional().isFloat({ min: 0 }),
    body('current_value').optional().isFloat({ min: 0 }),
    body('unit').optional().isString(),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, target_value, current_value, unit, target_date, status } = req.body;

      const result = await pool.query(
        `UPDATE health_goals 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             target_value = COALESCE($3, target_value),
             current_value = COALESCE($4, current_value),
             unit = COALESCE($5, unit),
             target_date = COALESCE($6, target_date),
             status = COALESCE($7, status),
             updated_at = NOW()
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [title, description, target_value, current_value, unit, target_date, status, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Health goal not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update health goal error:', error);
      res.status(500).json({ error: 'Failed to update health goal' });
    }
  }
);

// Delete health goal
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM health_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health goal not found' });
    }

    res.json({ message: 'Health goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete health goal error:', error);
    res.status(500).json({ error: 'Failed to delete health goal' });
  }
});

export default router;
