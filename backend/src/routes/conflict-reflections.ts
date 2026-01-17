import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all conflict reflections
router.get(
  '/',
  authenticate,
  [
    query('relationship_type').optional().isString(),
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

      const { relationship_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM conflict_reflections WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (relationship_type) {
        query += ` AND relationship_type = $${paramIndex++}`;
        params.push(relationship_type);
      }
      if (start_date) {
        query += ` AND conflict_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND conflict_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY conflict_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get conflict reflections error:', error);
      res.status(500).json({ error: 'Failed to fetch conflict reflections' });
    }
  }
);

// Get single conflict reflection
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM conflict_reflections WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conflict reflection not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get conflict reflection error:', error);
    res.status(500).json({ error: 'Failed to fetch conflict reflection' });
  }
});

// Create conflict reflection
router.post(
  '/',
  authenticate,
  [
    body('trigger').notEmpty().isString().trim(),
    body('my_response').notEmpty().isString().trim(),
    body('conflict_date').optional().isISO8601().toDate(),
    body('their_response').optional().isString(),
    body('outcome').optional().isString(),
    body('what_i_would_do_differently').optional().isString(),
    body('relationship_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { trigger, my_response, conflict_date, their_response, outcome, what_i_would_do_differently, relationship_type, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO conflict_reflections (user_id, trigger, my_response, conflict_date, their_response, outcome, what_i_would_do_differently, relationship_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          trigger,
          my_response,
          conflict_date || new Date().toISOString().split('T')[0],
          their_response || null,
          outcome || null,
          what_i_would_do_differently || null,
          relationship_type || null,
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create conflict reflection error:', error);
      res.status(500).json({ error: 'Failed to create conflict reflection' });
    }
  }
);

// Update conflict reflection
router.put(
  '/:id',
  authenticate,
  [
    body('trigger').optional().isString().trim(),
    body('my_response').optional().isString().trim(),
    body('conflict_date').optional().isISO8601().toDate(),
    body('their_response').optional().isString(),
    body('outcome').optional().isString(),
    body('what_i_would_do_differently').optional().isString(),
    body('relationship_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { trigger, my_response, conflict_date, their_response, outcome, what_i_would_do_differently, relationship_type, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM conflict_reflections WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Conflict reflection not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (trigger !== undefined) {
        updates.push(`trigger = $${paramIndex++}`);
        values.push(trigger);
      }
      if (my_response !== undefined) {
        updates.push(`my_response = $${paramIndex++}`);
        values.push(my_response);
      }
      if (conflict_date !== undefined) {
        updates.push(`conflict_date = $${paramIndex++}`);
        values.push(conflict_date);
      }
      if (their_response !== undefined) {
        updates.push(`their_response = $${paramIndex++}`);
        values.push(their_response);
      }
      if (outcome !== undefined) {
        updates.push(`outcome = $${paramIndex++}`);
        values.push(outcome);
      }
      if (what_i_would_do_differently !== undefined) {
        updates.push(`what_i_would_do_differently = $${paramIndex++}`);
        values.push(what_i_would_do_differently);
      }
      if (relationship_type !== undefined) {
        updates.push(`relationship_type = $${paramIndex++}`);
        values.push(relationship_type);
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
        `UPDATE conflict_reflections SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update conflict reflection error:', error);
      res.status(500).json({ error: 'Failed to update conflict reflection' });
    }
  }
);

// Delete conflict reflection
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM conflict_reflections WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conflict reflection not found' });
    }
    res.json({ message: 'Conflict reflection deleted successfully' });
  } catch (error: any) {
    console.error('Delete conflict reflection error:', error);
    res.status(500).json({ error: 'Failed to delete conflict reflection' });
  }
});

export default router;
