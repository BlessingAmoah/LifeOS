import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all boundaries notes
router.get(
  '/',
  authenticate,
  [
    query('boundary_type').optional().isIn(['set', 'violated', 'held', 'compromised']),
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

      const { boundary_type, relationship_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM boundaries_notes WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (boundary_type) {
        query += ` AND boundary_type = $${paramIndex++}`;
        params.push(boundary_type);
      }
      if (relationship_type) {
        query += ` AND relationship_type = $${paramIndex++}`;
        params.push(relationship_type);
      }
      if (start_date) {
        query += ` AND boundary_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND boundary_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY boundary_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get boundaries notes error:', error);
      res.status(500).json({ error: 'Failed to fetch boundaries notes' });
    }
  }
);

// Get boundaries summary (for dashboard)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        boundary_type,
        COUNT(*) as count
      FROM boundaries_notes
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND boundary_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND boundary_date <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` GROUP BY boundary_type`;

    const result = await pool.query(query, params);
    const summary: any = { set: 0, violated: 0, held: 0, compromised: 0 };
    result.rows.forEach((row: any) => {
      summary[row.boundary_type] = parseInt(row.count);
    });
    res.json(summary);
  } catch (error: any) {
    console.error('Get boundaries summary error:', error);
    res.status(500).json({ error: 'Failed to fetch boundaries summary' });
  }
});

// Get single boundary note
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM boundaries_notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boundary note not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get boundary note error:', error);
    res.status(500).json({ error: 'Failed to fetch boundary note' });
  }
});

// Create boundary note
router.post(
  '/',
  authenticate,
  [
    body('boundary_type').isIn(['set', 'violated', 'held', 'compromised']),
    body('description').notEmpty().isString().trim(),
    body('boundary_date').optional().isISO8601().toDate(),
    body('with_whom').optional().isString(),
    body('result').optional().isString(),
    body('emotional_impact').optional().isString(),
    body('relationship_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { boundary_type, description, boundary_date, with_whom, result, emotional_impact, relationship_type, tags } = req.body;

      const result_data = await pool.query(
        `INSERT INTO boundaries_notes (user_id, boundary_type, description, boundary_date, with_whom, result, emotional_impact, relationship_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          boundary_type,
          description,
          boundary_date || new Date().toISOString().split('T')[0],
          with_whom || null,
          result || null,
          emotional_impact || null,
          relationship_type || null,
          tags || [],
        ]
      );

      res.status(201).json(result_data.rows[0]);
    } catch (error: any) {
      console.error('Create boundary note error:', error);
      res.status(500).json({ error: 'Failed to create boundary note' });
    }
  }
);

// Update boundary note
router.put(
  '/:id',
  authenticate,
  [
    body('boundary_type').optional().isIn(['set', 'violated', 'held', 'compromised']),
    body('description').optional().isString().trim(),
    body('boundary_date').optional().isISO8601().toDate(),
    body('with_whom').optional().isString(),
    body('result').optional().isString(),
    body('emotional_impact').optional().isString(),
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
      const { boundary_type, description, boundary_date, with_whom, result, emotional_impact, relationship_type, tags } = req.body;

      const checkResult = await pool.query(
        'SELECT * FROM boundaries_notes WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Boundary note not found' });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (boundary_type !== undefined) {
        updates.push(`boundary_type = $${paramIndex++}`);
        values.push(boundary_type);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (boundary_date !== undefined) {
        updates.push(`boundary_date = $${paramIndex++}`);
        values.push(boundary_date);
      }
      if (with_whom !== undefined) {
        updates.push(`with_whom = $${paramIndex++}`);
        values.push(with_whom);
      }
      if (result !== undefined) {
        updates.push(`result = $${paramIndex++}`);
        values.push(result);
      }
      if (emotional_impact !== undefined) {
        updates.push(`emotional_impact = $${paramIndex++}`);
        values.push(emotional_impact);
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
      const result_data = await pool.query(
        `UPDATE boundaries_notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result_data.rows[0]);
    } catch (error: any) {
      console.error('Update boundary note error:', error);
      res.status(500).json({ error: 'Failed to update boundary note' });
    }
  }
);

// Delete boundary note
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM boundaries_notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Boundary note not found' });
    }
    res.json({ message: 'Boundary note deleted successfully' });
  } catch (error: any) {
    console.error('Delete boundary note error:', error);
    res.status(500).json({ error: 'Failed to delete boundary note' });
  }
});

export default router;
