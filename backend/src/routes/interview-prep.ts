import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all interview prep entries
router.get(
  '/',
  authenticate,
  [
    query('company').optional().isString(),
    query('outcome').optional().isIn(['pending', 'passed', 'failed', 'withdrawn', 'offer']),
    query('interview_type').optional().isIn(['phone', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'final']),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { company, outcome, interview_type, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM interview_prep WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (company) {
        query += ` AND company = $${paramIndex++}`;
        params.push(company);
      }
      if (outcome) {
        query += ` AND outcome = $${paramIndex++}`;
        params.push(outcome);
      }
      if (interview_type) {
        query += ` AND interview_type = $${paramIndex++}`;
        params.push(interview_type);
      }

      query += ` ORDER BY interview_date DESC NULLS LAST, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get interview prep error:', error);
      res.status(500).json({ error: 'Failed to fetch interview prep entries' });
    }
  }
);

// Get single interview prep entry
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM interview_prep WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview prep entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get interview prep error:', error);
    res.status(500).json({ error: 'Failed to fetch interview prep entry' });
  }
});

// Create interview prep entry
router.post(
  '/',
  authenticate,
  [
    body('company').notEmpty().isString().trim(),
    body('role').notEmpty().isString().trim(),
    body('interview_date').optional().isISO8601().toDate(),
    body('interview_type').optional().isIn(['phone', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'final']),
    body('stage').optional().isString(),
    body('preparation_notes').optional().isString(),
    body('questions_prepared').optional().isArray(),
    body('answers_prepared').optional().isArray(),
    body('feedback').optional().isString(),
    body('outcome').optional().isIn(['pending', 'passed', 'failed', 'withdrawn', 'offer']),
    body('follow_up_actions').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { company, role, interview_date, interview_type, stage, preparation_notes, questions_prepared, answers_prepared, feedback, outcome = 'pending', follow_up_actions } = req.body;

      const result = await pool.query(
        `INSERT INTO interview_prep (user_id, company, role, interview_date, interview_type, stage, preparation_notes, questions_prepared, answers_prepared, feedback, outcome, follow_up_actions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.userId,
          company,
          role,
          interview_date || null,
          interview_type || null,
          stage || null,
          preparation_notes || null,
          questions_prepared || [],
          answers_prepared || [],
          feedback || null,
          outcome,
          follow_up_actions || [],
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create interview prep error:', error);
      res.status(500).json({ error: 'Failed to create interview prep entry' });
    }
  }
);

// Update interview prep entry
router.put(
  '/:id',
  authenticate,
  [
    body('company').optional().isString().trim(),
    body('role').optional().isString().trim(),
    body('interview_date').optional().isISO8601().toDate(),
    body('interview_type').optional().isIn(['phone', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'final']),
    body('stage').optional().isString(),
    body('preparation_notes').optional().isString(),
    body('questions_prepared').optional().isArray(),
    body('answers_prepared').optional().isArray(),
    body('feedback').optional().isString(),
    body('outcome').optional().isIn(['pending', 'passed', 'failed', 'withdrawn', 'offer']),
    body('follow_up_actions').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { company, role, interview_date, interview_type, stage, preparation_notes, questions_prepared, answers_prepared, feedback, outcome, follow_up_actions } = req.body;

      // Check if entry exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM interview_prep WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Interview prep entry not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (company !== undefined) {
        updates.push(`company = $${paramIndex++}`);
        values.push(company);
      }
      if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
      }
      if (interview_date !== undefined) {
        updates.push(`interview_date = $${paramIndex++}`);
        values.push(interview_date);
      }
      if (interview_type !== undefined) {
        updates.push(`interview_type = $${paramIndex++}`);
        values.push(interview_type);
      }
      if (stage !== undefined) {
        updates.push(`stage = $${paramIndex++}`);
        values.push(stage);
      }
      if (preparation_notes !== undefined) {
        updates.push(`preparation_notes = $${paramIndex++}`);
        values.push(preparation_notes);
      }
      if (questions_prepared !== undefined) {
        updates.push(`questions_prepared = $${paramIndex++}`);
        values.push(questions_prepared);
      }
      if (answers_prepared !== undefined) {
        updates.push(`answers_prepared = $${paramIndex++}`);
        values.push(answers_prepared);
      }
      if (feedback !== undefined) {
        updates.push(`feedback = $${paramIndex++}`);
        values.push(feedback);
      }
      if (outcome !== undefined) {
        updates.push(`outcome = $${paramIndex++}`);
        values.push(outcome);
      }
      if (follow_up_actions !== undefined) {
        updates.push(`follow_up_actions = $${paramIndex++}`);
        values.push(follow_up_actions);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE interview_prep SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update interview prep error:', error);
      res.status(500).json({ error: 'Failed to update interview prep entry' });
    }
  }
);

// Delete interview prep entry
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM interview_prep WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview prep entry not found' });
    }
    res.json({ message: 'Interview prep entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete interview prep error:', error);
    res.status(500).json({ error: 'Failed to delete interview prep entry' });
  }
});

export default router;
