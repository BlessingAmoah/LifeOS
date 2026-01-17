import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all takeaways for a book
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
        'SELECT * FROM book_takeaways WHERE book_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [book_id, req.userId]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching book takeaways:', error);
      res.status(500).json({ error: 'Failed to fetch book takeaways' });
    }
  }
);

// Get a single takeaway
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM book_takeaways WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Takeaway not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching takeaway:', error);
    res.status(500).json({ error: 'Failed to fetch takeaway' });
  }
});

// Create a new takeaway
router.post(
  '/',
  authenticate,
  [
    body('book_id').notEmpty().isUUID(),
    body('takeaway_text').notEmpty().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { book_id, takeaway_text } = req.body;

      // Verify book belongs to user
      const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1 AND user_id = $2', [book_id, req.userId]);
      if (bookCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const result = await pool.query(
        'INSERT INTO book_takeaways (book_id, user_id, takeaway_text) VALUES ($1, $2, $3) RETURNING *',
        [book_id, req.userId, takeaway_text]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating takeaway:', error);
      res.status(500).json({ error: 'Failed to create takeaway' });
    }
  }
);

// Update a takeaway
router.put(
  '/:id',
  authenticate,
  [
    body('takeaway_text').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { takeaway_text } = req.body;

      if (!takeaway_text) {
        return res.status(400).json({ error: 'takeaway_text is required' });
      }

      const result = await pool.query(
        'UPDATE book_takeaways SET takeaway_text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
        [takeaway_text, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Takeaway not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating takeaway:', error);
      res.status(500).json({ error: 'Failed to update takeaway' });
    }
  }
);

// Delete a takeaway
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM book_takeaways WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Takeaway not found' });
    }

    res.json({ message: 'Takeaway deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting takeaway:', error);
    res.status(500).json({ error: 'Failed to delete takeaway' });
  }
});

export default router;
