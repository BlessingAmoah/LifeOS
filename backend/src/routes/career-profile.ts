import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get career profile (or create if doesn't exist)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM career_profile WHERE user_id = $1',
      [req.userId]
    );

    // If no profile exists, create one
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO career_profile (user_id) VALUES ($1) RETURNING *',
        [req.userId]
      );
      return res.json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get career profile error:', error);
    res.status(500).json({ error: 'Failed to fetch career profile' });
  }
});

// Update career profile
router.put(
  '/',
  authenticate,
  [
    body('current_theme').optional().isString().trim(),
    body('current_focus').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { current_theme, current_focus } = req.body;

      // Check if profile exists
      const checkResult = await pool.query(
        'SELECT * FROM career_profile WHERE user_id = $1',
        [req.userId]
      );

      let result;
      if (checkResult.rows.length === 0) {
        // Create new profile
        result = await pool.query(
          `INSERT INTO career_profile (user_id, current_theme, current_focus)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [req.userId, current_theme || null, current_focus || null]
        );
      } else {
        // Update existing profile
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (current_theme !== undefined) {
          updates.push(`current_theme = $${paramIndex++}`);
          values.push(current_theme);
        }
        if (current_focus !== undefined) {
          updates.push(`current_focus = $${paramIndex++}`);
          values.push(current_focus);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.userId);
        result = await pool.query(
          `UPDATE career_profile SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $${paramIndex++}
           RETURNING *`,
          values
        );
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update career profile error:', error);
      res.status(500).json({ error: 'Failed to update career profile' });
    }
  }
);

export default router;
