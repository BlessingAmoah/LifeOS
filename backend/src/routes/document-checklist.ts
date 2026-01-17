import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all document checklist items
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['missing', 'uploaded', 'submitted']),
    query('required_for_stage').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, required_for_stage } = req.query;

      let query = 'SELECT * FROM document_checklist WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (required_for_stage) {
        query += ` AND required_for_stage = $${paramIndex++}`;
        params.push(required_for_stage);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching document checklist:', error);
      res.status(500).json({ error: 'Failed to fetch document checklist' });
    }
  }
);

// Get a single item
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM document_checklist WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document checklist item not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching document checklist item:', error);
    res.status(500).json({ error: 'Failed to fetch document checklist item' });
  }
});

// Create a new item
router.post(
  '/',
  authenticate,
  [
    body('document_name').notEmpty().trim(),
    body('required_for_stage').optional().trim(),
    body('status').optional().isIn(['missing', 'uploaded', 'submitted']),
    body('expiry_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { document_name, required_for_stage, status = 'missing', expiry_date, notes } = req.body;

      const result = await pool.query(
        'INSERT INTO document_checklist (user_id, document_name, required_for_stage, status, expiry_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.userId, document_name, required_for_stage || null, status, expiry_date || null, notes || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating document checklist item:', error);
      res.status(500).json({ error: 'Failed to create document checklist item' });
    }
  }
);

// Update an item
router.put(
  '/:id',
  authenticate,
  [
    body('document_name').optional().trim(),
    body('required_for_stage').optional().trim(),
    body('status').optional().isIn(['missing', 'uploaded', 'submitted']),
    body('expiry_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { document_name, required_for_stage, status, expiry_date, notes } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (document_name !== undefined) {
        updates.push(`document_name = $${paramIndex++}`);
        values.push(document_name);
      }
      if (required_for_stage !== undefined) {
        updates.push(`required_for_stage = $${paramIndex++}`);
        values.push(required_for_stage);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (expiry_date !== undefined) {
        updates.push(`expiry_date = $${paramIndex++}`);
        values.push(expiry_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const query = `UPDATE document_checklist SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document checklist item not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating document checklist item:', error);
      res.status(500).json({ error: 'Failed to update document checklist item' });
    }
  }
);

// Delete an item
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM document_checklist WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document checklist item not found' });
    }

    res.json({ message: 'Document checklist item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document checklist item:', error);
    res.status(500).json({ error: 'Failed to delete document checklist item' });
  }
});

export default router;
