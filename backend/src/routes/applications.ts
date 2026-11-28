import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all applications
router.get(
  '/',
  authenticate,
  [
    query('stage').optional().isIn(['applied', 'screening', 'interview', 'final', 'offer', 'rejected', 'withdrawn']),
    query('company').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { stage, company, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM applications WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (stage) {
        query += ` AND stage = $${paramIndex++}`;
        params.push(stage);
      }
      if (company) {
        query += ` AND company = $${paramIndex++}`;
        params.push(company);
      }

      query += ` ORDER BY application_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }
);

// Get single application
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create application
router.post(
  '/',
  authenticate,
  [
    body('company').notEmpty().isString().trim(),
    body('role').notEmpty().isString().trim(),
    body('stage').optional().isIn(['applied', 'screening', 'interview', 'final', 'offer', 'rejected', 'withdrawn']),
    body('application_date').optional().isISO8601().toDate(),
    body('job_url').optional().isString(),
    body('notes').optional().isString(),
    body('salary_range').optional().isString(),
    body('location').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { company, role, stage = 'applied', application_date, job_url, notes, salary_range, location } = req.body;

      const result = await pool.query(
        `INSERT INTO applications (user_id, company, role, stage, application_date, job_url, notes, salary_range, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          company,
          role,
          stage,
          application_date || new Date().toISOString().split('T')[0],
          job_url || null,
          notes || null,
          salary_range || null,
          location || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create application error:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  }
);

// Update application
router.put(
  '/:id',
  authenticate,
  [
    body('company').optional().isString().trim(),
    body('role').optional().isString().trim(),
    body('stage').optional().isIn(['applied', 'screening', 'interview', 'final', 'offer', 'rejected', 'withdrawn']),
    body('application_date').optional().isISO8601().toDate(),
    body('job_url').optional().isString(),
    body('notes').optional().isString(),
    body('salary_range').optional().isString(),
    body('location').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { company, role, stage, application_date, job_url, notes, salary_range, location } = req.body;

      // Check if application exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
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
      if (stage !== undefined) {
        updates.push(`stage = $${paramIndex++}`);
        values.push(stage);
      }
      if (application_date !== undefined) {
        updates.push(`application_date = $${paramIndex++}`);
        values.push(application_date);
      }
      if (job_url !== undefined) {
        updates.push(`job_url = $${paramIndex++}`);
        values.push(job_url);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (salary_range !== undefined) {
        updates.push(`salary_range = $${paramIndex++}`);
        values.push(salary_range);
      }
      if (location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(location);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE applications SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update application error:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  }
);

// Delete application
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
