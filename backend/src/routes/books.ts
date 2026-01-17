import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all books (with optional status filter)
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['reading_list', 'currently_reading', 'completed']),
    query('category').optional().isString(),
    query('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, category, priority } = req.query;

      let query = 'SELECT * FROM books WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }
      if (priority) {
        query += ` AND priority = $${paramIndex++}`;
        params.push(priority);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching books:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  }
);

// Get a single book
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create a new book
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().trim(),
    body('author').optional().trim(),
    body('category').optional().trim(),
    body('status').optional().isIn(['reading_list', 'currently_reading', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('why_i_want_to_read').optional().trim(),
    body('start_date').optional().isISO8601().toDate(),
    body('finish_date').optional().isISO8601().toDate(),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('reading_cadence').optional().isIn(['daily', 'weekly']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('would_reread').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        author,
        category,
        status = 'reading_list',
        priority,
        why_i_want_to_read,
        start_date,
        finish_date,
        progress,
        reading_cadence,
        rating,
        would_reread,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO books (
          user_id, title, author, category, status, priority, why_i_want_to_read,
          start_date, finish_date, progress, reading_cadence, rating, would_reread
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          req.userId,
          title,
          author || null,
          category || null,
          status,
          priority || null,
          why_i_want_to_read || null,
          start_date || null,
          finish_date || null,
          progress || null,
          reading_cadence || null,
          rating || null,
          would_reread || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating book:', error);
      res.status(500).json({ error: 'Failed to create book' });
    }
  }
);

// Update a book
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim(),
    body('author').optional().trim(),
    body('category').optional().trim(),
    body('status').optional().isIn(['reading_list', 'currently_reading', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('why_i_want_to_read').optional().trim(),
    body('start_date').optional().isISO8601().toDate(),
    body('finish_date').optional().isISO8601().toDate(),
    body('progress').optional().isInt({ min: 0, max: 100 }),
    body('reading_cadence').optional().isIn(['daily', 'weekly']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('would_reread').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        title,
        author,
        category,
        status,
        priority,
        why_i_want_to_read,
        start_date,
        finish_date,
        progress,
        reading_cadence,
        rating,
        would_reread,
      } = req.body;

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (author !== undefined) {
        updates.push(`author = $${paramIndex++}`);
        values.push(author);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }
      if (why_i_want_to_read !== undefined) {
        updates.push(`why_i_want_to_read = $${paramIndex++}`);
        values.push(why_i_want_to_read);
      }
      if (start_date !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        values.push(start_date);
      }
      if (finish_date !== undefined) {
        updates.push(`finish_date = $${paramIndex++}`);
        values.push(finish_date);
      }
      if (progress !== undefined) {
        updates.push(`progress = $${paramIndex++}`);
        values.push(progress);
      }
      if (reading_cadence !== undefined) {
        updates.push(`reading_cadence = $${paramIndex++}`);
        values.push(reading_cadence);
      }
      if (rating !== undefined) {
        updates.push(`rating = $${paramIndex++}`);
        values.push(rating);
      }
      if (would_reread !== undefined) {
        updates.push(`would_reread = $${paramIndex++}`);
        values.push(would_reread);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE books SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating book:', error);
      res.status(500).json({ error: 'Failed to update book' });
    }
  }
);

// Delete a book
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
