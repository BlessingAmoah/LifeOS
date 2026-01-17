import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all quotes for a book
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
        'SELECT * FROM book_quotes WHERE book_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [book_id, req.userId]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching book quotes:', error);
      res.status(500).json({ error: 'Failed to fetch book quotes' });
    }
  }
);

// Get a single quote
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM book_quotes WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Create a new quote
router.post(
  '/',
  authenticate,
  [
    body('book_id').notEmpty().isUUID(),
    body('quote_text').notEmpty().trim(),
    body('page').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { book_id, quote_text, page, tags } = req.body;

      // Verify book belongs to user
      const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1 AND user_id = $2', [book_id, req.userId]);
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const result = await pool.query(
        'INSERT INTO book_quotes (book_id, user_id, quote_text, page, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [book_id, req.userId, quote_text, page || null, tags || []]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating quote:', error);
      res.status(500).json({ error: 'Failed to create quote' });
    }
  }
);

// Update a quote
router.put(
  '/:id',
  authenticate,
  [
    body('quote_text').optional().trim(),
    body('page').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { quote_text, page, tags } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (quote_text !== undefined) {
        updates.push(`quote_text = $${paramIndex++}`);
        values.push(quote_text);
      }
      if (page !== undefined) {
        updates.push(`page = $${paramIndex++}`);
        values.push(page);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE book_quotes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating quote:', error);
      res.status(500).json({ error: 'Failed to update quote' });
    }
  }
);

// Delete a quote
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM book_quotes WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

export default router;
