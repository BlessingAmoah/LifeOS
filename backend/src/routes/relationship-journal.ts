import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all journal entries
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

      let query = 'SELECT * FROM relationship_journal WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (relationship_type) {
        query += ` AND relationship_type = $${paramIndex++}`;
        params.push(relationship_type);
      }
      if (start_date) {
        query += ` AND entry_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND entry_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY entry_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get relationship journal error:', error);
      res.status(500).json({ error: 'Failed to fetch relationship journal entries' });
    }
  }
);

// Get single journal entry
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM relationship_journal WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// Create journal entry
router.post(
  '/',
  authenticate,
  [
    body('content').notEmpty().isString().trim(),
    body('entry_date').optional().isISO8601().toDate(),
    body('relationship_type').optional().isString(),
    body('emotion_tag').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, entry_date, relationship_type, emotion_tag, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO relationship_journal (user_id, content, entry_date, relationship_type, emotion_tag, tags)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.userId,
          content,
          entry_date || new Date().toISOString().split('T')[0],
          relationship_type || null,
          emotion_tag || null,
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create journal entry error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

// Update journal entry
router.put(
  '/:id',
  authenticate,
  [
    body('content').optional().isString().trim(),
    body('entry_date').optional().isISO8601().toDate(),
    body('relationship_type').optional().isString(),
    body('emotion_tag').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { content, entry_date, relationship_type, emotion_tag, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM relationship_journal WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (entry_date !== undefined) {
        updates.push(`entry_date = $${paramIndex++}`);
        values.push(entry_date);
      }
      if (relationship_type !== undefined) {
        updates.push(`relationship_type = $${paramIndex++}`);
        values.push(relationship_type);
      }
      if (emotion_tag !== undefined) {
        updates.push(`emotion_tag = $${paramIndex++}`);
        values.push(emotion_tag);
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
        `UPDATE relationship_journal SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update journal entry error:', error);
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  }
);

// Delete journal entry
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM relationship_journal WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

export default router;
