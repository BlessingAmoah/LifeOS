import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all engineering docs
router.get(
  '/',
  authenticate,
  [
    query('doc_type').optional().isIn(['architecture_note', 'adr', 'design_decision', 'learning_summary', 'code_snippet', 'markdown_doc', 'other']),
    query('category').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doc_type, category, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM engineering_docs WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (doc_type) {
        query += ` AND doc_type = $${paramIndex++}`;
        params.push(doc_type);
      }
      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }

      query += ` ORDER BY updated_at DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get engineering docs error:', error);
      res.status(500).json({ error: 'Failed to fetch engineering docs' });
    }
  }
);

// Get single engineering doc
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM engineering_docs WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Engineering doc not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get engineering doc error:', error);
    res.status(500).json({ error: 'Failed to fetch engineering doc' });
  }
});

// Create engineering doc
router.post(
  '/',
  authenticate,
  [
    body('doc_type').isIn(['architecture_note', 'adr', 'design_decision', 'learning_summary', 'code_snippet', 'markdown_doc', 'other']),
    body('title').notEmpty().isString().trim(),
    body('content').notEmpty().isString().trim(),
    body('content_format').optional().isIn(['markdown', 'plain_text', 'code']),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('related_resources').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doc_type, title, content, content_format = 'markdown', category, tags, related_resources } = req.body;

      const result = await pool.query(
        `INSERT INTO engineering_docs (user_id, doc_type, title, content, content_format, category, tags, related_resources)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          doc_type,
          title,
          content,
          content_format,
          category || null,
          tags || [],
          related_resources || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create engineering doc error:', error);
      res.status(500).json({ error: 'Failed to create engineering doc' });
    }
  }
);

// Update engineering doc
router.put(
  '/:id',
  authenticate,
  [
    body('doc_type').optional().isIn(['architecture_note', 'adr', 'design_decision', 'learning_summary', 'code_snippet', 'markdown_doc', 'other']),
    body('title').optional().isString().trim(),
    body('content').optional().isString().trim(),
    body('content_format').optional().isIn(['markdown', 'plain_text', 'code']),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('related_resources').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { doc_type, title, content, content_format, category, tags, related_resources } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM engineering_docs WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Engineering doc not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (doc_type !== undefined) {
        updates.push(`doc_type = $${paramIndex++}`);
        values.push(doc_type);
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (content_format !== undefined) {
        updates.push(`content_format = $${paramIndex++}`);
        values.push(content_format);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }
      if (related_resources !== undefined) {
        updates.push(`related_resources = $${paramIndex++}`);
        values.push(related_resources);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE engineering_docs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update engineering doc error:', error);
      res.status(500).json({ error: 'Failed to update engineering doc' });
    }
  }
);

// Delete engineering doc
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM engineering_docs WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Engineering doc not found' });
    }
    res.json({ message: 'Engineering doc deleted successfully' });
  } catch (error: any) {
    console.error('Delete engineering doc error:', error);
    res.status(500).json({ error: 'Failed to delete engineering doc' });
  }
});

export default router;
