import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all status timeline entries
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM status_timeline WHERE user_id = $1 ORDER BY start_date DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching status timeline:', error);
    res.status(500).json({ error: 'Failed to fetch status timeline' });
  }
});

// Get a single entry
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM status_timeline WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Status timeline entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching status timeline entry:', error);
    res.status(500).json({ error: 'Failed to fetch status timeline entry' });
  }
});

// Create a new entry
router.post(
  '/',
  authenticate,
  [
    body('case_type').notEmpty().trim(),
    body('current_status').notEmpty().trim(),
    body('start_date').notEmpty().isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { case_type, current_status, start_date, end_date, notes } = req.body;

      const result = await pool.query(
        'INSERT INTO status_timeline (user_id, case_type, current_status, start_date, end_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.userId, case_type, current_status, start_date, end_date || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating status timeline entry:', error);
      res.status(500).json({ error: 'Failed to create status timeline entry' });
    }
  }
);

// Update an entry
router.put(
  '/:id',
  authenticate,
  [
    body('case_type').optional().trim(),
    body('current_status').optional().trim(),
    body('start_date').optional().isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { case_type, current_status, start_date, end_date, notes } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (case_type !== undefined) {
        updates.push(`case_type = $${paramIndex++}`);
        values.push(case_type);
      }
      if (current_status !== undefined) {
        updates.push(`current_status = $${paramIndex++}`);
        values.push(current_status);
      }
      if (start_date !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        values.push(start_date);
      }
      if (end_date !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        values.push(end_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE status_timeline SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Status timeline entry not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating status timeline entry:', error);
      res.status(500).json({ error: 'Failed to update status timeline entry' });
    }
  }
);

// Delete an entry
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM status_timeline WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Status timeline entry not found' });
    }

    res.json({ message: 'Status timeline entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting status timeline entry:', error);
    res.status(500).json({ error: 'Failed to delete status timeline entry' });
  }
});

export default router;
