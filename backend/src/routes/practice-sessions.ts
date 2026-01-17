import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all practice sessions
router.get(
  '/',
  authenticate,
  [
    query('practice_type').optional().isIn(['dsa', 'system_design', 'coding_challenge', 'algorithm', 'data_structure', 'other']),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
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

      const { practice_type, difficulty, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM practice_sessions WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (practice_type) {
        query += ` AND practice_type = $${paramIndex++}`;
        params.push(practice_type);
      }
      if (difficulty) {
        query += ` AND difficulty = $${paramIndex++}`;
        params.push(difficulty);
      }
      if (start_date) {
        query += ` AND session_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND session_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY session_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get practice sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch practice sessions' });
    }
  }
);

// Get practice session summary (for dashboard)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        practice_type,
        COUNT(*) as session_count,
        SUM(time_spent_minutes) as total_minutes,
        AVG(confidence_level) as avg_confidence
      FROM practice_sessions
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND session_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND session_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` GROUP BY practice_type ORDER BY session_count DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get practice summary error:', error);
    res.status(500).json({ error: 'Failed to fetch practice summary' });
  }
});

// Get single practice session
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get practice session error:', error);
    res.status(500).json({ error: 'Failed to fetch practice session' });
  }
});

// Create practice session
router.post(
  '/',
  authenticate,
  [
    body('practice_type').isIn(['dsa', 'system_design', 'coding_challenge', 'algorithm', 'data_structure', 'other']),
    body('topic').notEmpty().isString().trim(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
    body('confidence_level').optional().isInt({ min: 0, max: 100 }),
    body('time_spent_minutes').optional().isInt({ min: 0 }),
    body('session_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
    body('resources').optional().isArray(),
    body('problem_url').optional().isString(),
    body('solution_url').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { practice_type, topic, difficulty = 'medium', confidence_level, time_spent_minutes, session_date, notes, resources, problem_url, solution_url, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO practice_sessions (user_id, practice_type, topic, difficulty, confidence_level, time_spent_minutes, session_date, notes, resources, problem_url, solution_url, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.userId,
          practice_type,
          topic,
          difficulty,
          confidence_level || null,
          time_spent_minutes || null,
          session_date || new Date().toISOString().split('T')[0],
          notes || null,
          resources || [],
          problem_url || null,
          solution_url || null,
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create practice session error:', error);
      res.status(500).json({ error: 'Failed to create practice session' });
    }
  }
);

// Update practice session
router.put(
  '/:id',
  authenticate,
  [
    body('practice_type').optional().isIn(['dsa', 'system_design', 'coding_challenge', 'algorithm', 'data_structure', 'other']),
    body('topic').optional().isString().trim(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']),
    body('confidence_level').optional().isInt({ min: 0, max: 100 }),
    body('time_spent_minutes').optional().isInt({ min: 0 }),
    body('session_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
    body('resources').optional().isArray(),
    body('problem_url').optional().isString(),
    body('solution_url').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { practice_type, topic, difficulty, confidence_level, time_spent_minutes, session_date, notes, resources, problem_url, solution_url, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Practice session not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (practice_type !== undefined) {
        updates.push(`practice_type = $${paramIndex++}`);
        values.push(practice_type);
      }
      if (topic !== undefined) {
        updates.push(`topic = $${paramIndex++}`);
        values.push(topic);
      }
      if (difficulty !== undefined) {
        updates.push(`difficulty = $${paramIndex++}`);
        values.push(difficulty);
      }
      if (confidence_level !== undefined) {
        updates.push(`confidence_level = $${paramIndex++}`);
        values.push(confidence_level);
      }
      if (time_spent_minutes !== undefined) {
        updates.push(`time_spent_minutes = $${paramIndex++}`);
        values.push(time_spent_minutes);
      }
      if (session_date !== undefined) {
        updates.push(`session_date = $${paramIndex++}`);
        values.push(session_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (resources !== undefined) {
        updates.push(`resources = $${paramIndex++}`);
        values.push(resources);
      }
      if (problem_url !== undefined) {
        updates.push(`problem_url = $${paramIndex++}`);
        values.push(problem_url);
      }
      if (solution_url !== undefined) {
        updates.push(`solution_url = $${paramIndex++}`);
        values.push(solution_url);
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
        `UPDATE practice_sessions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update practice session error:', error);
      res.status(500).json({ error: 'Failed to update practice session' });
    }
  }
);

// Delete practice session
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM practice_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice session not found' });
    }
    res.json({ message: 'Practice session deleted successfully' });
  } catch (error: any) {
    console.error('Delete practice session error:', error);
    res.status(500).json({ error: 'Failed to delete practice session' });
  }
});

export default router;
