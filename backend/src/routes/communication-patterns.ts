import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all communication patterns
router.get(
  '/',
  authenticate,
  [
    query('pattern_type').optional().isIn(['listening', 'avoidance', 'defensiveness', 'assertiveness', 'over_explaining', 'other']),
    query('relationship_type').optional().isString(),
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

      const { pattern_type, relationship_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM communication_patterns WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (pattern_type) {
        query += ` AND pattern_type = $${paramIndex++}`;
        params.push(pattern_type);
      }
      if (relationship_type) {
        query += ` AND relationship_type = $${paramIndex++}`;
        params.push(relationship_type);
      }
      if (start_date) {
        query += ` AND pattern_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND pattern_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY pattern_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get communication patterns error:', error);
      res.status(500).json({ error: 'Failed to fetch communication patterns' });
    }
  }
);

// Get communication patterns summary (for dashboard)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        pattern_type,
        COUNT(*) as pattern_count
      FROM communication_patterns
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND pattern_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND pattern_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` GROUP BY pattern_type ORDER BY pattern_count DESC LIMIT 5`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get communication patterns summary error:', error);
    res.status(500).json({ error: 'Failed to fetch communication patterns summary' });
  }
});

// Get single communication pattern
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM communication_patterns WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication pattern not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get communication pattern error:', error);
    res.status(500).json({ error: 'Failed to fetch communication pattern' });
  }
});

// Create communication pattern
router.post(
  '/',
  authenticate,
  [
    body('pattern_type').isIn(['listening', 'avoidance', 'defensiveness', 'assertiveness', 'over_explaining', 'other']),
    body('pattern_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
    body('relationship_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { pattern_type, pattern_date, notes, relationship_type, tags } = req.body;

      const result = await pool.query(
        `INSERT INTO communication_patterns (user_id, pattern_type, pattern_date, notes, relationship_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.userId,
          pattern_type,
          pattern_date || new Date().toISOString().split('T')[0],
          notes || null,
          relationship_type || null,
          tags || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create communication pattern error:', error);
      res.status(500).json({ error: 'Failed to create communication pattern' });
    }
  }
);

// Update communication pattern
router.put(
  '/:id',
  authenticate,
  [
    body('pattern_type').optional().isIn(['listening', 'avoidance', 'defensiveness', 'assertiveness', 'over_explaining', 'other']),
    body('pattern_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
    body('relationship_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { pattern_type, pattern_date, notes, relationship_type, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM communication_patterns WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Communication pattern not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (pattern_type !== undefined) {
        updates.push(`pattern_type = $${paramIndex++}`);
        values.push(pattern_type);
      }
      if (pattern_date !== undefined) {
        updates.push(`pattern_date = $${paramIndex++}`);
        values.push(pattern_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (relationship_type !== undefined) {
        updates.push(`relationship_type = $${paramIndex++}`);
        values.push(relationship_type);
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
        `UPDATE communication_patterns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update communication pattern error:', error);
      res.status(500).json({ error: 'Failed to update communication pattern' });
    }
  }
);

// Delete communication pattern
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM communication_patterns WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication pattern not found' });
    }
    res.json({ message: 'Communication pattern deleted successfully' });
  } catch (error: any) {
    console.error('Delete communication pattern error:', error);
    res.status(500).json({ error: 'Failed to delete communication pattern' });
  }
});

export default router;
