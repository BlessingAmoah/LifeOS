import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all vision boards
router.get(
  '/',
  authenticate,
  [
    query('vision_type').optional().isIn(['short', 'long']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vision_type, limit = 50, offset = 0 } = req.query;

      let queryText = 'SELECT * FROM vision_boards WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (vision_type) {
        queryText += ` AND vision_type = $${paramIndex}`;
        params.push(vision_type);
        paramIndex++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(queryText, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get vision boards error:', error);
      res.status(500).json({ error: 'Failed to fetch vision boards' });
    }
  }
);

// Get single vision board
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vision_boards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get vision board error:', error);
    res.status(500).json({ error: 'Failed to fetch vision board' });
  }
});

// Create vision board
router.post(
  '/',
  authenticate,
  [
    body('title').optional().isString(),
    body('vision_type').optional().isIn(['short', 'long']),
    body('vision_short_term').optional().isString(),
    body('vision_current_focus_theme').optional().isString(),
    body('vision_top_priorities').optional().isArray(),
    body('vision_season_of_life').optional().isString(),
    body('vision_long_term').optional().isString(),
    body('vision_career').optional().isString(),
    body('vision_lifestyle').optional().isString(),
    body('vision_financial').optional().isString(),
    body('vision_spiritual').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title = 'My Vision',
        vision_type = 'short',
        vision_short_term,
        vision_current_focus_theme,
        vision_top_priorities,
        vision_season_of_life,
        vision_long_term,
        vision_career,
        vision_lifestyle,
        vision_financial,
        vision_spiritual,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO vision_boards (
          user_id, title, vision_type,
          vision_short_term, vision_current_focus_theme, vision_top_priorities, vision_season_of_life,
          vision_long_term, vision_career, vision_lifestyle, vision_financial, vision_spiritual
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.userId,
          title,
          vision_type,
          vision_short_term,
          vision_current_focus_theme,
          vision_top_priorities || [],
          vision_season_of_life,
          vision_long_term,
          vision_career,
          vision_lifestyle,
          vision_financial,
          vision_spiritual,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create vision board error:', error);
      res.status(500).json({ error: 'Failed to create vision board' });
    }
  }
);

// Update vision board
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString(),
    body('vision_type').optional().isIn(['short', 'long']),
    body('vision_short_term').optional().isString(),
    body('vision_current_focus_theme').optional().isString(),
    body('vision_top_priorities').optional().isArray(),
    body('vision_season_of_life').optional().isString(),
    body('vision_long_term').optional().isString(),
    body('vision_career').optional().isString(),
    body('vision_lifestyle').optional().isString(),
    body('vision_financial').optional().isString(),
    body('vision_spiritual').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        vision_type,
        vision_short_term,
        vision_current_focus_theme,
        vision_top_priorities,
        vision_season_of_life,
        vision_long_term,
        vision_career,
        vision_lifestyle,
        vision_financial,
        vision_spiritual,
      } = req.body;

      const result = await pool.query(
        `UPDATE vision_boards
         SET title = COALESCE($1, title),
             vision_type = COALESCE($2, vision_type),
             vision_short_term = COALESCE($3, vision_short_term),
             vision_current_focus_theme = COALESCE($4, vision_current_focus_theme),
             vision_top_priorities = COALESCE($5, vision_top_priorities),
             vision_season_of_life = COALESCE($6, vision_season_of_life),
             vision_long_term = COALESCE($7, vision_long_term),
             vision_career = COALESCE($8, vision_career),
             vision_lifestyle = COALESCE($9, vision_lifestyle),
             vision_financial = COALESCE($10, vision_financial),
             vision_spiritual = COALESCE($11, vision_spiritual),
             updated_at = NOW()
         WHERE id = $12 AND user_id = $13
         RETURNING *`,
        [
          title,
          vision_type,
          vision_short_term,
          vision_current_focus_theme,
          vision_top_priorities,
          vision_season_of_life,
          vision_long_term,
          vision_career,
          vision_lifestyle,
          vision_financial,
          vision_spiritual,
          req.params.id,
          req.userId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vision board not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update vision board error:', error);
      res.status(500).json({ error: 'Failed to update vision board' });
    }
  }
);

// Delete vision board
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vision_boards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    res.json({ message: 'Vision board deleted successfully' });
  } catch (error: any) {
    console.error('Delete vision board error:', error);
    res.status(500).json({ error: 'Failed to delete vision board' });
  }
});

export default router;
