import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all roles
router.get(
  '/',
  authenticate,
  [
    query('role_type').optional().isIn(['current', 'next', 'dream']),
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role_type, status, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM roles WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (role_type) {
        query += ` AND role_type = $${paramIndex++}`;
        params.push(role_type);
      }
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY 
        CASE role_type 
          WHEN 'current' THEN 1 
          WHEN 'next' THEN 2 
          WHEN 'dream' THEN 3 
        END,
        created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
);

// Get single role
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM roles WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create role
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('role_type').isIn(['current', 'next', 'dream']),
    body('company').optional().isString(),
    body('description').optional().isString(),
    body('requirements').optional().isArray(),
    body('salary_range').optional().isString(),
    body('location').optional().isString(),
    body('status').optional().isString(),
    body('start_date').optional().isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, role_type, company, description, requirements, salary_range, location, status, start_date, end_date, notes } = req.body;

      const result = await pool.query(
        `INSERT INTO roles (user_id, title, company, role_type, description, requirements, salary_range, location, status, start_date, end_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          req.userId,
          title,
          company || null,
          role_type,
          description || null,
          requirements || [],
          salary_range || null,
          location || null,
          status || null,
          start_date || null,
          end_date || null,
          notes || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create role error:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
);

// Update role
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('role_type').optional().isIn(['current', 'next', 'dream']),
    body('company').optional().isString(),
    body('description').optional().isString(),
    body('requirements').optional().isArray(),
    body('salary_range').optional().isString(),
    body('location').optional().isString(),
    body('status').optional().isString(),
    body('start_date').optional().isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, role_type, company, description, requirements, salary_range, location, status, start_date, end_date, notes } = req.body;

      // Check if role exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM roles WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (role_type !== undefined) {
        updates.push(`role_type = $${paramIndex++}`);
        values.push(role_type);
      }
      if (company !== undefined) {
        updates.push(`company = $${paramIndex++}`);
        values.push(company);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        values.push(requirements);
      }
      if (salary_range !== undefined) {
        updates.push(`salary_range = $${paramIndex++}`);
        values.push(salary_range);
      }
      if (location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(location);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
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
      const result = await pool.query(
        `UPDATE roles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

// Delete role
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;
