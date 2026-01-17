import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all resume versions
router.get(
  '/',
  authenticate,
  [
    query('is_current').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { is_current, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM resume_versions WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (is_current === 'true') {
        query += ` AND is_current = true`;
      } else if (is_current === 'false') {
        query += ` AND is_current = false`;
      }

      query += ` ORDER BY is_current DESC, last_updated DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get resume versions error:', error);
      res.status(500).json({ error: 'Failed to fetch resume versions' });
    }
  }
);

// Get single resume version
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM resume_versions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume version not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get resume version error:', error);
    res.status(500).json({ error: 'Failed to fetch resume version' });
  }
});

// Create resume version
router.post(
  '/',
  authenticate,
  [
    body('version_name').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('file_url').optional().isString(),
    body('target_role').optional().isString(),
    body('last_updated').optional().isISO8601().toDate(),
    body('is_current').optional().isBoolean(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { version_name, description, file_url, target_role, last_updated, is_current = false, notes } = req.body;

      // If setting as current, unset other current resumes
      if (is_current) {
        await pool.query(
          'UPDATE resume_versions SET is_current = false WHERE user_id = $1',
          [req.userId]
        );
      }

      const result = await pool.query(
        `INSERT INTO resume_versions (user_id, version_name, description, file_url, target_role, last_updated, is_current, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          version_name,
          description || null,
          file_url || null,
          target_role || null,
          last_updated || new Date().toISOString().split('T')[0],
          is_current,
          notes || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create resume version error:', error);
      res.status(500).json({ error: 'Failed to create resume version' });
    }
  }
);

// Update resume version
router.put(
  '/:id',
  authenticate,
  [
    body('version_name').optional().isString().trim(),
    body('description').optional().isString(),
    body('file_url').optional().isString(),
    body('target_role').optional().isString(),
    body('last_updated').optional().isISO8601().toDate(),
    body('is_current').optional().isBoolean(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { version_name, description, file_url, target_role, last_updated, is_current, notes } = req.body;

      // Check if resume exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM resume_versions WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Resume version not found' });
      }

      // If setting as current, unset other current resumes
      if (is_current === true) {
        await pool.query(
          'UPDATE resume_versions SET is_current = false WHERE user_id = $1 AND id != $2',
          [req.userId, id]
        );
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (version_name !== undefined) {
        updates.push(`version_name = $${paramIndex++}`);
        values.push(version_name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (file_url !== undefined) {
        updates.push(`file_url = $${paramIndex++}`);
        values.push(file_url);
      }
      if (target_role !== undefined) {
        updates.push(`target_role = $${paramIndex++}`);
        values.push(target_role);
      }
      if (last_updated !== undefined) {
        updates.push(`last_updated = $${paramIndex++}`);
        values.push(last_updated);
      }
      if (is_current !== undefined) {
        updates.push(`is_current = $${paramIndex++}`);
        values.push(is_current);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE resume_versions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update resume version error:', error);
      res.status(500).json({ error: 'Failed to update resume version' });
    }
  }
);

// Delete resume version
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM resume_versions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume version not found' });
    }
    res.json({ message: 'Resume version deleted successfully' });
  } catch (error: any) {
    console.error('Delete resume version error:', error);
    res.status(500).json({ error: 'Failed to delete resume version' });
  }
});

export default router;
