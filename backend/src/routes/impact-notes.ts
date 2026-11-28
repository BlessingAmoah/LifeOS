import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all impact notes
router.get(
  '/',
  authenticate,
  [
    query('impact_type').optional().isIn(['project', 'metric', 'problem_solved', 'achievement', 'recognition', 'other']),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { impact_type, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM impact_notes WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (impact_type) {
        query += ` AND impact_type = $${paramIndex++}`;
        params.push(impact_type);
      }

      query += ` ORDER BY date_achieved DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get impact notes error:', error);
      res.status(500).json({ error: 'Failed to fetch impact notes' });
    }
  }
);

// Get single impact note
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM impact_notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Impact note not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get impact note error:', error);
    res.status(500).json({ error: 'Failed to fetch impact note' });
  }
});

// Create impact note
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('description').notEmpty().isString().trim(),
    body('impact_type').optional().isIn(['project', 'metric', 'problem_solved', 'achievement', 'recognition', 'other']),
    body('metrics').optional().isString(),
    body('date_achieved').optional().isISO8601().toDate(),
    body('skills_demonstrated').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, impact_type = 'project', metrics, date_achieved, skills_demonstrated, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO impact_notes (user_id, title, description, impact_type, metrics, date_achieved, skills_demonstrated, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          title,
          description,
          impact_type,
          metrics || null,
          date_achieved || new Date().toISOString().split('T')[0],
          skills_demonstrated || [],
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create impact note error:', error);
      res.status(500).json({ error: 'Failed to create impact note' });
    }
  }
);

// Update impact note
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('impact_type').optional().isIn(['project', 'metric', 'problem_solved', 'achievement', 'recognition', 'other']),
    body('metrics').optional().isString(),
    body('date_achieved').optional().isISO8601().toDate(),
    body('skills_demonstrated').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, impact_type, metrics, date_achieved, skills_demonstrated, tags } = req.body;

      // Check if note exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM impact_notes WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Impact note not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (impact_type !== undefined) {
        updates.push(`impact_type = $${paramIndex++}`);
        values.push(impact_type);
      }
      if (metrics !== undefined) {
        updates.push(`metrics = $${paramIndex++}`);
        values.push(metrics);
      }
      if (date_achieved !== undefined) {
        updates.push(`date_achieved = $${paramIndex++}`);
        values.push(date_achieved);
      }
      if (skills_demonstrated !== undefined) {
        updates.push(`skills_demonstrated = $${paramIndex++}`);
        values.push(skills_demonstrated);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE impact_notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update impact note error:', error);
      res.status(500).json({ error: 'Failed to update impact note' });
    }
  }
);

// Delete impact note
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM impact_notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Impact note not found' });
    }
    res.json({ message: 'Impact note deleted successfully' });
  } catch (error: any) {
    console.error('Delete impact note error:', error);
    res.status(500).json({ error: 'Failed to delete impact note' });
  }
});

export default router;
