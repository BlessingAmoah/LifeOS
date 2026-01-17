import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all reflections
router.get(
  '/',
  authenticate,
  [
    query('reflection_type').optional().isIn(['daily', 'weekly']),
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reflection_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM spiritual_reflections WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (reflection_type) {
        query += ` AND reflection_type = $${paramIndex}`;
        params.push(reflection_type);
        paramIndex++;
      }

      if (start_date) {
        query += ` AND reflection_date >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND reflection_date <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY reflection_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get reflections error:', error);
      res.status(500).json({ error: 'Failed to fetch reflections' });
    }
  }
);

// Get single reflection
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM spiritual_reflections WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get reflection error:', error);
    res.status(500).json({ error: 'Failed to fetch reflection' });
  }
});

// Create reflection
router.post(
  '/',
  authenticate,
  [
    body('reflection_type').isIn(['daily', 'weekly']),
    body('content').notEmpty().isString(),
    body('prompt_id').optional().isUUID(),
    body('scripture_id').optional().isUUID(),
    body('reflection_date').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reflection_type, content, prompt_id, scripture_id, reflection_date } = req.body;

      const result = await pool.query(
        `INSERT INTO spiritual_reflections (user_id, reflection_type, content, prompt_id, scripture_id, reflection_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.userId,
          reflection_type,
          content,
          prompt_id || null,
          scripture_id || null,
          reflection_date || new Date().toISOString().split('T')[0],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Reflection already exists for this date and type' });
      }
      console.error('Create reflection error:', error);
      res.status(500).json({ error: 'Failed to create reflection' });
    }
  }
);

// Update reflection
router.put(
  '/:id',
  authenticate,
  [
    body('reflection_type').optional().isIn(['daily', 'weekly']),
    body('content').optional().isString(),
    body('prompt_id').optional().isUUID(),
    body('scripture_id').optional().isUUID(),
    body('reflection_date').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { reflection_type, content, prompt_id, scripture_id, reflection_date } = req.body;

      // Check if reflection exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM spiritual_reflections WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Reflection not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (reflection_type !== undefined) {
        updates.push(`reflection_type = $${paramIndex++}`);
        values.push(reflection_type);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (prompt_id !== undefined) {
        updates.push(`prompt_id = $${paramIndex++}`);
        values.push(prompt_id);
      }
      if (scripture_id !== undefined) {
        updates.push(`scripture_id = $${paramIndex++}`);
        values.push(scripture_id);
      }
      if (reflection_date !== undefined) {
        updates.push(`reflection_date = $${paramIndex++}`);
        values.push(reflection_date);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE spiritual_reflections SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update reflection error:', error);
      res.status(500).json({ error: 'Failed to update reflection' });
    }
  }
);

// Delete reflection
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM spiritual_reflections WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    res.json({ message: 'Reflection deleted successfully' });
  } catch (error: any) {
    console.error('Delete reflection error:', error);
    res.status(500).json({ error: 'Failed to delete reflection' });
  }
});

export default router;
