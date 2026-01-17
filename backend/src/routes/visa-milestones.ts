import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all milestones
router.get(
  '/',
  authenticate,
  [
    query('milestone_type').optional().trim(),
    query('status').optional().isIn(['pending', 'completed', 'cancelled']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { milestone_type, status } = req.query;

      let query = 'SELECT * FROM visa_milestones WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (milestone_type) {
        query += ` AND milestone_type = $${paramIndex++}`;
        params.push(milestone_type);
      }
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ' ORDER BY milestone_date DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  }
);

// Get a single milestone
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM visa_milestones WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  }
});

// Create a new milestone
router.post(
  '/',
  authenticate,
  [
    body('milestone_type').notEmpty().trim(),
    body('milestone_date').notEmpty().isISO8601().toDate(),
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
    body('next_steps').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { milestone_type, milestone_date, title, description, status = 'pending', next_steps, notes } = req.body;

      const result = await pool.query(
        'INSERT INTO visa_milestones (user_id, milestone_type, milestone_date, title, description, status, next_steps, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [req.userId, milestone_type, milestone_date, title, description || null, status, next_steps || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ error: 'Failed to create milestone' });
    }
  }
);

// Update a milestone
router.put(
  '/:id',
  authenticate,
  [
    body('milestone_type').optional().trim(),
    body('milestone_date').optional().isISO8601().toDate(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
    body('next_steps').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { milestone_type, milestone_date, title, description, status, next_steps, notes } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (milestone_type !== undefined) {
        updates.push(`milestone_type = $${paramIndex++}`);
        values.push(milestone_type);
      }
      if (milestone_date !== undefined) {
        updates.push(`milestone_date = $${paramIndex++}`);
        values.push(milestone_date);
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (next_steps !== undefined) {
        updates.push(`next_steps = $${paramIndex++}`);
        values.push(next_steps);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE visa_milestones SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Milestone not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      res.status(500).json({ error: 'Failed to update milestone' });
    }
  }
);

// Delete a milestone
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM visa_milestones WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

export default router;
