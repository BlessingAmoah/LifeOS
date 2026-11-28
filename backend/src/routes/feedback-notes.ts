import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all feedback notes
router.get(
  '/',
  authenticate,
  [
    query('feedback_type').optional().isIn(['general', 'performance', 'strength', 'improvement', 'career']),
    query('source').optional().isString(),
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

      const { feedback_type, source, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM feedback_notes WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (feedback_type) {
        query += ` AND feedback_type = $${paramIndex++}`;
        params.push(feedback_type);
      }
      if (source) {
        query += ` AND source = $${paramIndex++}`;
        params.push(source);
      }
      if (start_date) {
        query += ` AND received_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND received_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY received_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get feedback notes error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback notes' });
    }
  }
);

// Get single feedback note
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM feedback_notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback note not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get feedback note error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback note' });
  }
});

// Create feedback note
router.post(
  '/',
  authenticate,
  [
    body('source').notEmpty().isString().trim(),
    body('feedback_type').optional().isIn(['general', 'performance', 'strength', 'improvement', 'career']),
    body('content').notEmpty().isString().trim(),
    body('received_date').optional().isISO8601().toDate(),
    body('action_items').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { source, feedback_type = 'general', content, received_date, action_items, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO feedback_notes (user_id, source, feedback_type, content, received_date, action_items, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          source,
          feedback_type,
          content,
          received_date || new Date().toISOString().split('T')[0],
          action_items || [],
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create feedback note error:', error);
      res.status(500).json({ error: 'Failed to create feedback note' });
    }
  }
);

// Update feedback note
router.put(
  '/:id',
  authenticate,
  [
    body('source').optional().isString().trim(),
    body('feedback_type').optional().isIn(['general', 'performance', 'strength', 'improvement', 'career']),
    body('content').optional().isString().trim(),
    body('received_date').optional().isISO8601().toDate(),
    body('action_items').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { source, feedback_type, content, received_date, action_items, tags } = req.body;

      // Check if note exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM feedback_notes WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Feedback note not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (source !== undefined) {
        updates.push(`source = $${paramIndex++}`);
        values.push(source);
      }
      if (feedback_type !== undefined) {
        updates.push(`feedback_type = $${paramIndex++}`);
        values.push(feedback_type);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (received_date !== undefined) {
        updates.push(`received_date = $${paramIndex++}`);
        values.push(received_date);
      }
      if (action_items !== undefined) {
        updates.push(`action_items = $${paramIndex++}`);
        values.push(action_items);
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
        `UPDATE feedback_notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update feedback note error:', error);
      res.status(500).json({ error: 'Failed to update feedback note' });
    }
  }
);

// Delete feedback note
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM feedback_notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback note not found' });
    }
    res.json({ message: 'Feedback note deleted successfully' });
  } catch (error: any) {
    console.error('Delete feedback note error:', error);
    res.status(500).json({ error: 'Failed to delete feedback note' });
  }
});

export default router;
