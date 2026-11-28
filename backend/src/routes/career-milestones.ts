import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all career milestones
router.get(
  '/',
  authenticate,
  [
    query('milestone_type').optional().isIn(['promotion', 'role_change', 'skill_achievement', 'certification', 'project_completion', 'recognition', 'other']),
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

      const { milestone_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM career_milestones WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (milestone_type) {
        query += ` AND milestone_type = $${paramIndex++}`;
        params.push(milestone_type);
      }
      if (start_date) {
        query += ` AND achieved_date >= $${paramIndex++}`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND achieved_date <= $${paramIndex++}`;
        params.push(end_date);
      }

      query += ` ORDER BY achieved_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get career milestones error:', error);
      res.status(500).json({ error: 'Failed to fetch career milestones' });
    }
  }
);

// Get single career milestone
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM career_milestones WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Career milestone not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get career milestone error:', error);
    res.status(500).json({ error: 'Failed to fetch career milestone' });
  }
});

// Create career milestone
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('milestone_type').isIn(['promotion', 'role_change', 'skill_achievement', 'certification', 'project_completion', 'recognition', 'other']),
    body('achieved_date').isISO8601().toDate(),
    body('description').optional().isString(),
    body('impact').optional().isString(),
    body('skills_gained').optional().isArray(),
    body('recognition').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, milestone_type, achieved_date, description, impact, skills_gained, recognition } = req.body;

      const result = await pool.query(
        `INSERT INTO career_milestones (user_id, title, milestone_type, achieved_date, description, impact, skills_gained, recognition)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId,
          title,
          milestone_type,
          achieved_date,
          description || null,
          impact || null,
          skills_gained || [],
          recognition || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create career milestone error:', error);
      res.status(500).json({ error: 'Failed to create career milestone' });
    }
  }
);

// Update career milestone
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('milestone_type').optional().isIn(['promotion', 'role_change', 'skill_achievement', 'certification', 'project_completion', 'recognition', 'other']),
    body('achieved_date').optional().isISO8601().toDate(),
    body('description').optional().isString(),
    body('impact').optional().isString(),
    body('skills_gained').optional().isArray(),
    body('recognition').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, milestone_type, achieved_date, description, impact, skills_gained, recognition } = req.body;

      // Check if milestone exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM career_milestones WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Career milestone not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (milestone_type !== undefined) {
        updates.push(`milestone_type = $${paramIndex++}`);
        values.push(milestone_type);
      }
      if (achieved_date !== undefined) {
        updates.push(`achieved_date = $${paramIndex++}`);
        values.push(achieved_date);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (impact !== undefined) {
        updates.push(`impact = $${paramIndex++}`);
        values.push(impact);
      }
      if (skills_gained !== undefined) {
        updates.push(`skills_gained = $${paramIndex++}`);
        values.push(skills_gained);
      }
      if (recognition !== undefined) {
        updates.push(`recognition = $${paramIndex++}`);
        values.push(recognition);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE career_milestones SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update career milestone error:', error);
      res.status(500).json({ error: 'Failed to update career milestone' });
    }
  }
);

// Delete career milestone
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM career_milestones WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Career milestone not found' });
    }
    res.json({ message: 'Career milestone deleted successfully' });
  } catch (error: any) {
    console.error('Delete career milestone error:', error);
    res.status(500).json({ error: 'Failed to delete career milestone' });
  }
});

export default router;
