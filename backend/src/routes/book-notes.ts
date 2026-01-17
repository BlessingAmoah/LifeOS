import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all notes for a book
router.get(
  '/',
  authenticate,
  [
    query('book_id').notEmpty().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { book_id } = req.query;

      // Verify book belongs to user
      const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1 AND user_id = $2', [book_id, req.userId]);
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const result = await pool.query(
        'SELECT * FROM book_notes WHERE book_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [book_id, req.userId]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching book notes:', error);
      res.status(500).json({ error: 'Failed to fetch book notes' });
    }
  }
);

// Get a single note
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM book_notes WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note
router.post(
  '/',
  authenticate,
  [
    body('book_id').notEmpty().isUUID(),
    body('note_text').notEmpty().trim(),
    body('page_location').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { book_id, note_text, page_location, tags } = req.body;

      // Verify book belongs to user
      const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1 AND user_id = $2', [book_id, req.userId]);
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const result = await pool.query(
        'INSERT INTO book_notes (book_id, user_id, note_text, page_location, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [book_id, req.userId, note_text, page_location || null, tags || []]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating note:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  }
);

// Update a note
router.put(
  '/:id',
  authenticate,
  [
    body('note_text').optional().trim(),
    body('page_location').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { note_text, page_location, tags } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (note_text !== undefined) {
        updates.push(`note_text = $${paramIndex++}`);
        values.push(note_text);
      }
      if (page_location !== undefined) {
        updates.push(`page_location = $${paramIndex++}`);
        values.push(page_location);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE book_notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: 'Failed to update note' });
    }
  }
);

// Delete a note
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM book_notes WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
