import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all health logs
router.get(
  '/',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limit = 50, offset = 0 } = req.query;

      const result = await pool.query(
        `SELECT * FROM health_logs 
         WHERE user_id = $1 
         ORDER BY logged_on DESC 
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('Get health logs error:', error);
      res.status(500).json({ error: 'Failed to fetch health logs' });
    }
  }
);

// Get single health log
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM health_logs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health log not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get health log error:', error);
    res.status(500).json({ error: 'Failed to fetch health log' });
  }
});

// Create health log
router.post(
  '/',
  authenticate,
  [
    body('exercise').optional().isString(),
    body('sleep_hours').optional().isFloat({ min: 0, max: 24 }),
    body('energy_level').optional().isInt({ min: 1, max: 10 }),
    body('notes').optional().isString(),
    body('logged_on').optional().isISO8601().toDate(),
    body('nutrition_notes').optional().isString(),
    body('weight').optional().isFloat({ min: 0 }),
    body('blood_pressure_systolic').optional().isInt({ min: 0, max: 300 }),
    body('blood_pressure_diastolic').optional().isInt({ min: 0, max: 200 }),
    body('heart_rate').optional().isInt({ min: 0, max: 300 }),
    body('mental_health_score').optional().isInt({ min: 1, max: 10 }),
    body('mental_health_notes').optional().isString(),
    body('mood').optional().isString(),
    body('stress_level').optional().isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        exercise, sleep_hours, energy_level, notes, logged_on,
        nutrition_notes, weight, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, mental_health_score, mental_health_notes, mood, stress_level
      } = req.body;
      const loggedOn = logged_on || new Date().toISOString().split('T')[0];

      const result = await pool.query(
        `INSERT INTO health_logs (
          user_id, exercise, sleep_hours, energy_level, notes, logged_on,
          nutrition_notes, weight, blood_pressure_systolic, blood_pressure_diastolic,
          heart_rate, mental_health_score, mental_health_notes, mood, stress_level
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (user_id, logged_on) 
         DO UPDATE SET 
           exercise = EXCLUDED.exercise,
           sleep_hours = EXCLUDED.sleep_hours,
           energy_level = EXCLUDED.energy_level,
           notes = EXCLUDED.notes,
           nutrition_notes = EXCLUDED.nutrition_notes,
           weight = EXCLUDED.weight,
           blood_pressure_systolic = EXCLUDED.blood_pressure_systolic,
           blood_pressure_diastolic = EXCLUDED.blood_pressure_diastolic,
           heart_rate = EXCLUDED.heart_rate,
           mental_health_score = EXCLUDED.mental_health_score,
           mental_health_notes = EXCLUDED.mental_health_notes,
           mood = EXCLUDED.mood,
           stress_level = EXCLUDED.stress_level
         RETURNING *`,
        [
          req.userId, exercise, sleep_hours, energy_level, notes, loggedOn,
          nutrition_notes, weight, blood_pressure_systolic, blood_pressure_diastolic,
          heart_rate, mental_health_score, mental_health_notes, mood, stress_level
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create health log error:', error);
      res.status(500).json({ error: 'Failed to create health log' });
    }
  }
);

// Update health log
router.put(
  '/:id',
  authenticate,
  [
    body('exercise').optional().isString(),
    body('sleep_hours').optional().isFloat({ min: 0, max: 24 }),
    body('energy_level').optional().isInt({ min: 1, max: 10 }),
    body('notes').optional().isString(),
    body('logged_on').optional().isISO8601().toDate(),
    body('nutrition_notes').optional().isString(),
    body('weight').optional().isFloat({ min: 0 }),
    body('blood_pressure_systolic').optional().isInt({ min: 0, max: 300 }),
    body('blood_pressure_diastolic').optional().isInt({ min: 0, max: 200 }),
    body('heart_rate').optional().isInt({ min: 0, max: 300 }),
    body('mental_health_score').optional().isInt({ min: 1, max: 10 }),
    body('mental_health_notes').optional().isString(),
    body('mood').optional().isString(),
    body('stress_level').optional().isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        exercise, sleep_hours, energy_level, notes, logged_on,
        nutrition_notes, weight, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, mental_health_score, mental_health_notes, mood, stress_level
      } = req.body;

      const result = await pool.query(
        `UPDATE health_logs 
         SET exercise = COALESCE($1, exercise),
             sleep_hours = COALESCE($2, sleep_hours),
             energy_level = COALESCE($3, energy_level),
             notes = COALESCE($4, notes),
             logged_on = COALESCE($5, logged_on),
             nutrition_notes = COALESCE($6, nutrition_notes),
             weight = COALESCE($7, weight),
             blood_pressure_systolic = COALESCE($8, blood_pressure_systolic),
             blood_pressure_diastolic = COALESCE($9, blood_pressure_diastolic),
             heart_rate = COALESCE($10, heart_rate),
             mental_health_score = COALESCE($11, mental_health_score),
             mental_health_notes = COALESCE($12, mental_health_notes),
             mood = COALESCE($13, mood),
             stress_level = COALESCE($14, stress_level)
         WHERE id = $15 AND user_id = $16
         RETURNING *`,
        [
          exercise, sleep_hours, energy_level, notes, logged_on,
          nutrition_notes, weight, blood_pressure_systolic, blood_pressure_diastolic,
          heart_rate, mental_health_score, mental_health_notes, mood, stress_level,
          req.params.id, req.userId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Health log not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update health log error:', error);
      res.status(500).json({ error: 'Failed to update health log' });
    }
  }
);

// Delete health log
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM health_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health log not found' });
    }

    res.json({ message: 'Health log deleted successfully' });
  } catch (error: any) {
    console.error('Delete health log error:', error);
    res.status(500).json({ error: 'Failed to delete health log' });
  }
});

export default router;
