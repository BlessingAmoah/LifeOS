import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all deadlines
router.get(
  '/',
  authenticate,
  [
    query('is_critical').optional().isBoolean(),
    query('completed').optional().isBoolean(),
    query('upcoming').optional().isBoolean(), // Get upcoming deadlines only
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { is_critical, completed, upcoming } = req.query;

      let query = 'SELECT * FROM deadlines_reminders WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (is_critical !== undefined) {
        query += ` AND is_critical = $${paramIndex++}`;
        params.push(is_critical === 'true');
      }
      if (completed !== undefined) {
        query += ` AND completed = $${paramIndex++}`;
        params.push(completed === 'true');
      }
      if (upcoming === 'true') {
        query += ` AND deadline_date >= CURRENT_DATE AND completed = false`;
      }

      query += ' ORDER BY deadline_date ASC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching deadlines:', error);
      res.status(500).json({ error: 'Failed to fetch deadlines' });
    }
  }
);

// Get a single deadline
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM deadlines_reminders WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching deadline:', error);
    res.status(500).json({ error: 'Failed to fetch deadline' });
  }
});

// Create a new deadline
router.post(
  '/',
  authenticate,
  [
    body('deadline_type').notEmpty().trim(),
    body('deadline_date').notEmpty().isISO8601().toDate(),
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('is_critical').optional().isBoolean(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { deadline_type, deadline_date, title, description, is_critical = false, notes } = req.body;

      const result = await pool.query(
        'INSERT INTO deadlines_reminders (user_id, deadline_type, deadline_date, title, description, is_critical, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [req.userId, deadline_type, deadline_date, title, description || null, is_critical, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating deadline:', error);
      res.status(500).json({ error: 'Failed to create deadline' });
    }
  }
);

// Update a deadline
router.put(
  '/:id',
  authenticate,
  [
    body('deadline_type').optional().trim(),
    body('deadline_date').optional().isISO8601().toDate(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('is_critical').optional().isBoolean(),
    body('completed').optional().isBoolean(),
    body('completed_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { deadline_type, deadline_date, title, description, is_critical, completed, completed_date, notes } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (deadline_type !== undefined) {
        updates.push(`deadline_type = $${paramIndex++}`);
        values.push(deadline_type);
      }
      if (deadline_date !== undefined) {
        updates.push(`deadline_date = $${paramIndex++}`);
        values.push(deadline_date);
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (is_critical !== undefined) {
        updates.push(`is_critical = $${paramIndex++}`);
        values.push(is_critical);
      }
      if (completed !== undefined) {
        updates.push(`completed = $${paramIndex++}`);
        values.push(completed);
      }
      if (completed_date !== undefined) {
        updates.push(`completed_date = $${paramIndex++}`);
        values.push(completed_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE deadlines_reminders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Deadline not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating deadline:', error);
      res.status(500).json({ error: 'Failed to update deadline' });
    }
  }
);

// Delete a deadline
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM deadlines_reminders WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    res.json({ message: 'Deadline deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting deadline:', error);
    res.status(500).json({ error: 'Failed to delete deadline' });
  }
});

export default router;
