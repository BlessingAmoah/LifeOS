import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all savings goals
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'completed', 'paused']),
    query('is_emergency_fund').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, is_emergency_fund } = req.query;

      let query = 'SELECT * FROM savings_goals WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (is_emergency_fund === 'true') {
        query += ` AND is_emergency_fund = true`;
      } else if (is_emergency_fund === 'false') {
        query += ` AND is_emergency_fund = false`;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get savings goals error:', error);
      res.status(500).json({ error: 'Failed to fetch savings goals' });
    }
  }
);

// Get single savings goal
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get savings goal error:', error);
    res.status(500).json({ error: 'Failed to fetch savings goal' });
  }
});

// Create savings goal
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().isString().trim(),
    body('target_amount').isFloat({ min: 0.01 }),
    body('current_amount').optional().isFloat({ min: 0 }),
    body('target_date').optional().isISO8601().toDate(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, target_amount, current_amount = 0, target_date, description, status = 'active', is_emergency_fund = false } = req.body;

      const result = await pool.query(
        `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description, status, is_emergency_fund)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          name,
          target_amount,
          current_amount,
          target_date || null,
          description || null,
          status,
          is_emergency_fund,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create savings goal error:', error);
      res.status(500).json({ error: 'Failed to create savings goal' });
    }
  }
);

// Update savings goal
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().isString().trim(),
    body('target_amount').optional().isFloat({ min: 0.01 }),
    body('current_amount').optional().isFloat({ min: 0 }),
    body('target_date').optional().isISO8601().toDate(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'paused']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, target_amount, current_amount, target_date, description, status, is_emergency_fund } = req.body;

      // Check if savings goal exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Savings goal not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (target_amount !== undefined) {
        updates.push(`target_amount = $${paramIndex++}`);
        values.push(target_amount);
      }
      if (current_amount !== undefined) {
        updates.push(`current_amount = $${paramIndex++}`);
        values.push(current_amount);
      }
      if (target_date !== undefined) {
        updates.push(`target_date = $${paramIndex++}`);
        values.push(target_date);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (is_emergency_fund !== undefined) {
        updates.push(`is_emergency_fund = $${paramIndex++}`);
        values.push(is_emergency_fund);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE savings_goals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update savings goal error:', error);
      res.status(500).json({ error: 'Failed to update savings goal' });
    }
  }
);

// Delete savings goal
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    res.json({ message: 'Savings goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

export default router;
