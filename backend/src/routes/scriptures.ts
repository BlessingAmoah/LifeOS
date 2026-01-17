import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all scriptures
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['scripture', 'affirmation', 'quote', 'prayer']),
    query('category').optional().isString(),
    query('is_favorite').optional().isBoolean(),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, category, is_favorite, search, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM scriptures WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (is_favorite === 'true') {
        query += ` AND is_favorite = true`;
      }

      if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR reference ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY is_favorite DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get scriptures error:', error);
      res.status(500).json({ error: 'Failed to fetch scriptures' });
    }
  }
);

// Get single scripture
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM scriptures WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scripture not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get scripture error:', error);
    res.status(500).json({ error: 'Failed to fetch scripture' });
  }
});

// Create scripture
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['scripture', 'affirmation', 'quote', 'prayer']),
    body('content').notEmpty().isString(),
    body('title').optional().isString(),
    body('reference').optional().isString(),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('is_favorite').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, content, title, reference, category, tags, is_favorite = false } = req.body;

      const result = await pool.query(
        `INSERT INTO scriptures (user_id, type, content, title, reference, category, tags, is_favorite)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          type,
          content,
          title || null,
          reference || null,
          category || null,
          tags || [],
          is_favorite,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create scripture error:', error);
      res.status(500).json({ error: 'Failed to create scripture' });
    }
  }
);

// Update scripture
router.put(
  '/:id',
  authenticate,
  [
    body('type').optional().isIn(['scripture', 'affirmation', 'quote', 'prayer']),
    body('content').optional().isString(),
    body('title').optional().isString(),
    body('reference').optional().isString(),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('is_favorite').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { type, content, title, reference, category, tags, is_favorite } = req.body;

      // Check if scripture exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM scriptures WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Scripture not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (reference !== undefined) {
        updates.push(`reference = $${paramIndex++}`);
        values.push(reference);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }
      if (is_favorite !== undefined) {
        updates.push(`is_favorite = $${paramIndex++}`);
        values.push(is_favorite);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE scriptures SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update scripture error:', error);
      res.status(500).json({ error: 'Failed to update scripture' });
    }
  }
);

// Delete scripture
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM scriptures WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scripture not found' });
    }
    res.json({ message: 'Scripture deleted successfully' });
  } catch (error: any) {
    console.error('Delete scripture error:', error);
    res.status(500).json({ error: 'Failed to delete scripture' });
  }
});

export default router;
