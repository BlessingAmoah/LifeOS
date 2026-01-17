import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all reviews
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM reviews WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }
);

// Get single review
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create review
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['daily', 'weekly', 'monthly', 'quarterly']),
    body('wins').optional().isString(),
    body('challenges').optional().isString(),
    body('lessons').optional().isString(),
    body('next_focus').optional().isString(),
    body('template_used').optional().isString(),
    body('goal_progress').optional().isObject(),
    body('habit_analysis').optional().isObject(),
    body('life_balance_scores').optional().isObject(),
    body('strategic_adjustments').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, wins, challenges, lessons, next_focus, template_used, goal_progress, habit_analysis, life_balance_scores, strategic_adjustments } = req.body;

      const result = await pool.query(
        `INSERT INTO reviews (user_id, type, wins, challenges, lessons, next_focus, template_used, goal_progress, habit_analysis, life_balance_scores, strategic_adjustments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [req.userId, type, wins, challenges, lessons, next_focus, template_used, JSON.stringify(goal_progress || {}), JSON.stringify(habit_analysis || {}), JSON.stringify(life_balance_scores || {}), strategic_adjustments]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create review error:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }
);

// Update review
router.put(
  '/:id',
  authenticate,
  [
    body('wins').optional().isString(),
    body('challenges').optional().isString(),
    body('lessons').optional().isString(),
    body('next_focus').optional().isString(),
    body('template_used').optional().isString(),
    body('goal_progress').optional().isObject(),
    body('habit_analysis').optional().isObject(),
    body('life_balance_scores').optional().isObject(),
    body('strategic_adjustments').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { wins, challenges, lessons, next_focus, template_used, goal_progress, habit_analysis, life_balance_scores, strategic_adjustments } = req.body;

      const result = await pool.query(
        `UPDATE reviews 
         SET wins = COALESCE($1, wins),
             challenges = COALESCE($2, challenges),
             lessons = COALESCE($3, lessons),
             next_focus = COALESCE($4, next_focus),
             template_used = COALESCE($5, template_used),
             goal_progress = COALESCE($6::jsonb, goal_progress),
             habit_analysis = COALESCE($7::jsonb, habit_analysis),
             life_balance_scores = COALESCE($8::jsonb, life_balance_scores),
             strategic_adjustments = COALESCE($9, strategic_adjustments)
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [wins, challenges, lessons, next_focus, template_used, JSON.stringify(goal_progress || {}), JSON.stringify(habit_analysis || {}), JSON.stringify(life_balance_scores || {}), strategic_adjustments, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update review error:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  }
);

// Delete review
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
