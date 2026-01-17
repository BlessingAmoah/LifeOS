import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all career goals
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['active', 'completed', 'paused', 'abandoned']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('category').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, priority, category, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM career_goals WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (priority) {
        query += ` AND priority = $${paramIndex++}`;
        params.push(priority);
      }
      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }

      query += ` ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        target_date ASC NULLS LAST,
        created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get career goals error:', error);
      res.status(500).json({ error: 'Failed to fetch career goals' });
    }
  }
);

// Get single career goal
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM career_goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Career goal not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get career goal error:', error);
    res.status(500).json({ error: 'Failed to fetch career goal' });
  }
});

// Create career goal
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused', 'abandoned']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, target_date, status = 'active', priority = 'medium', category } = req.body;

      const result = await pool.query(
        `INSERT INTO career_goals (user_id, title, description, target_date, status, priority, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          title,
          description || null,
          target_date || null,
          status,
          priority,
          category || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create career goal error:', error);
      res.status(500).json({ error: 'Failed to create career goal' });
    }
  }
);

// Update career goal
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('description').optional().isString(),
    body('target_date').optional().isISO8601().toDate(),
    body('status').optional().isIn(['active', 'completed', 'paused', 'abandoned']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, target_date, status, priority, category } = req.body;

      // Check if goal exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM career_goals WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Career goal not found' });
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
      if (target_date !== undefined) {
        updates.push(`target_date = $${paramIndex++}`);
        values.push(target_date);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE career_goals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update career goal error:', error);
      res.status(500).json({ error: 'Failed to update career goal' });
    }
  }
);

// Delete career goal
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM career_goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Career goal not found' });
    }
    res.json({ message: 'Career goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete career goal error:', error);
    res.status(500).json({ error: 'Failed to delete career goal' });
  }
});

export default router;
