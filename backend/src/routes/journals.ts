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
    query('category').optional().isString(),
    query('mood').optional().isString(),
    query('search').optional().isString(),
    query('tags').optional().isString(),
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { category, mood, search, tags, start_date, end_date, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM journal_entries WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (mood) {
        query += ` AND mood = $${paramIndex}`;
        params.push(mood);
        paramIndex++;
      }

      if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query += ` AND tags && $${paramIndex}::text[]`;
        params.push(tagArray);
        paramIndex++;
      }

      if (start_date) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get journals error:', error);
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  }
);

// Get single journal entry
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get journal error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// Create journal entry
router.post(
  '/',
  authenticate,
  [
    body('title').optional().isString(),
    body('content').optional().isString(),
    body('mood').optional().isString(),
    body('tags').optional().isArray(),
    body('category').optional().isIn(['spiritual', 'health', 'career','lifestyle', 'career', 'reflection', 'daily', 'weekly', 'monthly', 'quarterly']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, mood, tags, category } = req.body;

      const result = await pool.query(
        `INSERT INTO journal_entries (user_id, title, content, mood, tags, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, title, content, mood, tags || [], category]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create journal error:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

// Update journal entry
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString(),
    body('content').optional().isString(),
    body('mood').optional().isString(),
    body('tags').optional().isArray(),
    body('category').optional().isIn(['spiritual', 'health', 'career', 'reflection', 'daily', 'weekly', 'monthly', 'quarterly']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, mood, tags, category } = req.body;

      const result = await pool.query(
        `UPDATE journal_entries 
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             mood = COALESCE($3, mood),
             tags = COALESCE($4, tags),
             category = COALESCE($5, category),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, content, mood, tags, category, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update journal error:', error);
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  }
);

// Delete journal entry
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete journal error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

export default router;
