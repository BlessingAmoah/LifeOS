import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all engineering wins
router.get(
  '/',
  authenticate,
  [
    query('win_type').optional().isIn(['problem_solved', 'feature_shipped', 'bug_fixed', 'performance_improvement', 'code_quality', 'learning', 'other']),
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { win_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM engineering_wins WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (win_type) {
        query += ` AND win_type = $${paramIndex++}`;
        params.push(win_type);
      }
      if (start_date) {
        query += ` AND win_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND win_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY win_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get engineering wins error:', error);
      res.status(500).json({ error: 'Failed to fetch engineering wins' });
    }
  }
);

// Get engineering wins summary (for dashboard)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        COUNT(*) as total_wins,
        AVG(confidence_level) as avg_confidence,
        COUNT(CASE WHEN win_type = 'problem_solved' THEN 1 END) as problems_solved,
        COUNT(CASE WHEN win_type = 'feature_shipped' THEN 1 END) as features_shipped
      FROM engineering_wins
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND win_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND win_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0] || { total_wins: 0, avg_confidence: 0, problems_solved: 0, features_shipped: 0 });
  } catch (error: any) {
    console.error('Get engineering wins summary error:', error);
    res.status(500).json({ error: 'Failed to fetch engineering wins summary' });
  }
});

// Get single engineering win
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM engineering_wins WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Engineering win not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get engineering win error:', error);
    res.status(500).json({ error: 'Failed to fetch engineering win' });
  }
});

// Create engineering win
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('description').notEmpty().isString().trim(),
    body('win_type').optional().isIn(['problem_solved', 'feature_shipped', 'bug_fixed', 'performance_improvement', 'code_quality', 'learning', 'other']),
    body('impact').optional().isString(),
    body('problem_solved').optional().isString(),
    body('lessons_learned').optional().isString(),
    body('confidence_level').optional().isInt({ min: 0, max: 100 }),
    body('win_date').optional().isISO8601().toDate(),
    body('tags').optional().isArray(),
    body('related_practice_id').optional().isUUID(),
    body('related_doc_id').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, win_type = 'general', impact, problem_solved, lessons_learned, confidence_level, win_date, tags, related_practice_id, related_doc_id } = req.body;

      const result = await pool.query(
        `INSERT INTO engineering_wins (user_id, title, description, win_type, impact, problem_solved, lessons_learned, confidence_level, win_date, tags, related_practice_id, related_doc_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.userId,
          title,
          description,
          win_type,
          impact || null,
          problem_solved || null,
          lessons_learned || null,
          confidence_level || null,
          win_date || new Date().toISOString().split('T')[0],
          tags || [],
          related_practice_id || null,
          related_doc_id || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create engineering win error:', error);
      res.status(500).json({ error: 'Failed to create engineering win' });
    }
  }
);

// Update engineering win
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('win_type').optional().isIn(['problem_solved', 'feature_shipped', 'bug_fixed', 'performance_improvement', 'code_quality', 'learning', 'other']),
    body('impact').optional().isString(),
    body('problem_solved').optional().isString(),
    body('lessons_learned').optional().isString(),
    body('confidence_level').optional().isInt({ min: 0, max: 100 }),
    body('win_date').optional().isISO8601().toDate(),
    body('tags').optional().isArray(),
    body('related_practice_id').optional().isUUID(),
    body('related_doc_id').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, win_type, impact, problem_solved, lessons_learned, confidence_level, win_date, tags, related_practice_id, related_doc_id } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM engineering_wins WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Engineering win not found' });
      }

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
      if (win_type !== undefined) {
        updates.push(`win_type = $${paramIndex++}`);
        values.push(win_type);
      }
      if (impact !== undefined) {
        updates.push(`impact = $${paramIndex++}`);
        values.push(impact);
      }
      if (problem_solved !== undefined) {
        updates.push(`problem_solved = $${paramIndex++}`);
        values.push(problem_solved);
      }
      if (lessons_learned !== undefined) {
        updates.push(`lessons_learned = $${paramIndex++}`);
        values.push(lessons_learned);
      }
      if (confidence_level !== undefined) {
        updates.push(`confidence_level = $${paramIndex++}`);
        values.push(confidence_level);
      }
      if (win_date !== undefined) {
        updates.push(`win_date = $${paramIndex++}`);
        values.push(win_date);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }
      if (related_practice_id !== undefined) {
        updates.push(`related_practice_id = $${paramIndex++}`);
        values.push(related_practice_id);
      }
      if (related_doc_id !== undefined) {
        updates.push(`related_doc_id = $${paramIndex++}`);
        values.push(related_doc_id);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE engineering_wins SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update engineering win error:', error);
      res.status(500).json({ error: 'Failed to update engineering win' });
    }
  }
);

// Delete engineering win
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM engineering_wins WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Engineering win not found' });
    }
    res.json({ message: 'Engineering win deleted successfully' });
  } catch (error: any) {
    console.error('Delete engineering win error:', error);
    res.status(500).json({ error: 'Failed to delete engineering win' });
  }
});

export default router;
