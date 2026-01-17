import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all case notes
router.get(
  '/',
  authenticate,
  [
    query('note_type').optional().trim(),
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { note_type, start_date, end_date } = req.query;

      let query = 'SELECT * FROM case_notes WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (note_type) {
        query += ` AND note_type = $${paramIndex++}`;
        params.push(note_type);
      }
      if (start_date) {
        query += ` AND note_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND note_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ' ORDER BY note_date DESC, created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching case notes:', error);
      res.status(500).json({ error: 'Failed to fetch case notes' });
    }
  }
);

// Get a single note
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM case_notes WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case note not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching case note:', error);
    res.status(500).json({ error: 'Failed to fetch case note' });
  }
});

// Create a new note
router.post(
  '/',
  authenticate,
  [
    body('note_date').optional().isISO8601().toDate(),
    body('note_type').optional().trim(),
    body('title').optional().trim(),
    body('content').notEmpty().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { note_date, note_type, title, content, tags } = req.body;

      const result = await pool.query(
        'INSERT INTO case_notes (user_id, note_date, note_type, title, content, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.userId, note_date || new Date(), note_type || null, title || null, content, tags || []]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating case note:', error);
      res.status(500).json({ error: 'Failed to create case note' });
    }
  }
);

// Update a note
router.put(
  '/:id',
  authenticate,
  [
    body('note_date').optional().isISO8601().toDate(),
    body('note_type').optional().trim(),
    body('title').optional().trim(),
    body('content').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { note_date, note_type, title, content, tags } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (note_date !== undefined) {
        updates.push(`note_date = $${paramIndex++}`);
        values.push(note_date);
      }
      if (note_type !== undefined) {
        updates.push(`note_type = $${paramIndex++}`);
        values.push(note_type);
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE case_notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Case note not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating case note:', error);
      res.status(500).json({ error: 'Failed to update case note' });
    }
  }
);

// Delete a note
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM case_notes WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case note not found' });
    }

    res.json({ message: 'Case note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting case note:', error);
    res.status(500).json({ error: 'Failed to delete case note' });
  }
});

export default router;
