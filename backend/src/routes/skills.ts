import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all skills
router.get(
  '/',
  authenticate,
  [
    query('category').optional().isString(),
    query('proficiency_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { category, proficiency_level, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM skills WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }
      if (proficiency_level) {
        query += ` AND proficiency_level = $${paramIndex++}`;
        params.push(proficiency_level);
      }

      query += ` ORDER BY category, name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get skills error:', error);
      res.status(500).json({ error: 'Failed to fetch skills' });
    }
  }
);

// Get single skill
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM skills WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get skill error:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

// Create skill
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().isString().trim(),
    body('category').optional().isString(),
    body('proficiency_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('target_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('notes').optional().isString(),
    body('resources').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, category, proficiency_level = 'beginner', target_level, notes, resources } = req.body;

      const result = await pool.query(
        `INSERT INTO skills (user_id, name, category, proficiency_level, target_level, notes, resources)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          name,
          category || null,
          proficiency_level,
          target_level || null,
          notes || null,
          resources || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create skill error:', error);
      res.status(500).json({ error: 'Failed to create skill' });
    }
  }
);

// Update skill
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().isString().trim(),
    body('category').optional().isString(),
    body('proficiency_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('target_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('notes').optional().isString(),
    body('resources').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, category, proficiency_level, target_level, notes, resources } = req.body;

      // Check if skill exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM skills WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (proficiency_level !== undefined) {
        updates.push(`proficiency_level = $${paramIndex++}`);
        values.push(proficiency_level);
      }
      if (target_level !== undefined) {
        updates.push(`target_level = $${paramIndex++}`);
        values.push(target_level);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (resources !== undefined) {
        updates.push(`resources = $${paramIndex++}`);
        values.push(resources);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE skills SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update skill error:', error);
      res.status(500).json({ error: 'Failed to update skill' });
    }
  }
);

// Delete skill
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM skills WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ message: 'Skill deleted successfully' });
  } catch (error: any) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
