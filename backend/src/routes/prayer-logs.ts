import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all prayer logs
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['prayer', 'meditation', 'worship', 'devotion']),
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

      const { type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM prayer_logs WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (start_date) {
        query += ` AND logged_on >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND logged_on <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY logged_on DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get prayer logs error:', error);
      res.status(500).json({ error: 'Failed to fetch prayer logs' });
    }
  }
);

// Get prayer log summary (streaks, total time, etc.)
router.get('/summary', authenticate, [
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COUNT(DISTINCT logged_on) as days_logged
      FROM prayer_logs
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND logged_on >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND logged_on <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' GROUP BY type';

    const result = await pool.query(query, params);
    
    const summary = result.rows.map((row: any) => ({
      type: row.type,
      count: parseInt(row.count, 10),
      total_minutes: parseInt(row.total_minutes, 10),
      days_logged: parseInt(row.days_logged, 10),
    }));

    res.json(summary);
  } catch (error: any) {
    console.error('Get prayer log summary error:', error);
    res.status(500).json({ error: 'Failed to fetch prayer log summary' });
  }
});

// Get single prayer log
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM prayer_logs WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer log not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get prayer log error:', error);
    res.status(500).json({ error: 'Failed to fetch prayer log' });
  }
});

// Create prayer log
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['prayer', 'meditation', 'worship', 'devotion']),
    body('duration_minutes').optional().isInt({ min: 0 }),
    body('notes').optional().isString(),
    body('scripture_reference').optional().isString(),
    body('logged_on').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, duration_minutes, notes, scripture_reference, logged_on } = req.body;

      const result = await pool.query(
        `INSERT INTO prayer_logs (user_id, type, duration_minutes, notes, scripture_reference, logged_on)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.userId,
          type,
          duration_minutes || null,
          notes || null,
          scripture_reference || null,
          logged_on || new Date().toISOString().split('T')[0],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Prayer log already exists for this date and type' });
      }
      console.error('Create prayer log error:', error);
      res.status(500).json({ error: 'Failed to create prayer log' });
    }
  }
);

// Update prayer log
router.put(
  '/:id',
  authenticate,
  [
    body('type').optional().isIn(['prayer', 'meditation', 'worship', 'devotion']),
    body('duration_minutes').optional().isInt({ min: 0 }),
    body('notes').optional().isString(),
    body('scripture_reference').optional().isString(),
    body('logged_on').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { type, duration_minutes, notes, scripture_reference, logged_on } = req.body;

      // Check if prayer log exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM prayer_logs WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Prayer log not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (duration_minutes !== undefined) {
        updates.push(`duration_minutes = $${paramIndex++}`);
        values.push(duration_minutes);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (scripture_reference !== undefined) {
        updates.push(`scripture_reference = $${paramIndex++}`);
        values.push(scripture_reference);
      }
      if (logged_on !== undefined) {
        updates.push(`logged_on = $${paramIndex++}`);
        values.push(logged_on);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE prayer_logs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update prayer log error:', error);
      res.status(500).json({ error: 'Failed to update prayer log' });
    }
  }
);

// Delete prayer log
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM prayer_logs WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer log not found' });
    }
    res.json({ message: 'Prayer log deleted successfully' });
  } catch (error: any) {
    console.error('Delete prayer log error:', error);
    res.status(500).json({ error: 'Failed to delete prayer log' });
  }
});

export default router;
