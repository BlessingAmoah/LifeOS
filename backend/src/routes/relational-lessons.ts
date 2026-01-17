import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all relational lessons
router.get(
  '/',
  authenticate,
  [
    query('source_type').optional().isString(),
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

      const { source_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM relational_lessons WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (source_type) {
        query += ` AND source_type = $${paramIndex++}`;
        params.push(source_type);
      }
      if (start_date) {
        query += ` AND learned_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND learned_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY learned_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get relational lessons error:', error);
      res.status(500).json({ error: 'Failed to fetch relational lessons' });
    }
  }
);

// Get single relational lesson
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM relational_lessons WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relational lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get relational lesson error:', error);
    res.status(500).json({ error: 'Failed to fetch relational lesson' });
  }
});

// Create relational lesson
router.post(
  '/',
  authenticate,
  [
    body('lesson').notEmpty().isString().trim(),
    body('learned_date').optional().isISO8601().toDate(),
    body('source_type').optional().isString(),
    body('source_id').optional().isUUID(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { lesson, learned_date, source_type, source_id, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO relational_lessons (user_id, lesson, learned_date, source_type, source_id, tags)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.userId,
          lesson,
          learned_date || new Date().toISOString().split('T')[0],
          source_type || null,
          source_id || null,
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create relational lesson error:', error);
      res.status(500).json({ error: 'Failed to create relational lesson' });
    }
  }
);

// Update relational lesson
router.put(
  '/:id',
  authenticate,
  [
    body('lesson').optional().isString().trim(),
    body('learned_date').optional().isISO8601().toDate(),
    body('source_type').optional().isString(),
    body('source_id').optional().isUUID(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { lesson, learned_date, source_type, source_id, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM relational_lessons WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Relational lesson not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (lesson !== undefined) {
        updates.push(`lesson = $${paramIndex++}`);
        values.push(lesson);
      }
      if (learned_date !== undefined) {
        updates.push(`learned_date = $${paramIndex++}`);
        values.push(learned_date);
      }
      if (source_type !== undefined) {
        updates.push(`source_type = $${paramIndex++}`);
        values.push(source_type);
      }
      if (source_id !== undefined) {
        updates.push(`source_id = $${paramIndex++}`);
        values.push(source_id);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE relational_lessons SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update relational lesson error:', error);
      res.status(500).json({ error: 'Failed to update relational lesson' });
    }
  }
);

// Delete relational lesson
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM relational_lessons WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relational lesson not found' });
    }
    res.json({ message: 'Relational lesson deleted successfully' });
  } catch (error: any) {
    console.error('Delete relational lesson error:', error);
    res.status(500).json({ error: 'Failed to delete relational lesson' });
  }
});

export default router;
