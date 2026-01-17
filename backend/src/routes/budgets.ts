import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all budgets
router.get(
  '/',
  authenticate,
  [
    query('period').optional().isIn(['weekly', 'monthly', 'yearly']),
    query('active').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { period, active } = req.query;

      let query = 'SELECT * FROM budgets WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (period) {
        query += ` AND period = $${paramIndex}`;
        params.push(period);
        paramIndex++;
      }

      if (active === 'true') {
        const today = new Date().toISOString().split('T')[0];
        query += ` AND (end_date IS NULL OR end_date >= $${paramIndex}) AND start_date <= $${paramIndex}`;
        params.push(today, today);
        paramIndex += 2;
      }

      query += ' ORDER BY start_date DESC, created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get budgets error:', error);
      res.status(500).json({ error: 'Failed to fetch budgets' });
    }
  }
);

// Get budget summary with spending
router.get('/summary', authenticate, [
  query('period').optional().isIn(['weekly', 'monthly', 'yearly']),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        b.*,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id 
        AND t.type = 'expense'
        AND t.category = b.category
        AND t.transaction_date >= b.start_date
        AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)
      WHERE b.user_id = $1
        AND (b.end_date IS NULL OR b.end_date >= $2)
        AND b.start_date <= $2
    `;
    const params: any[] = [req.userId, today];
    let paramIndex = 3;

    if (period) {
      query += ` AND b.period = $${paramIndex}`;
      params.push(period);
      paramIndex++;
    }

    query += ' GROUP BY b.id ORDER BY b.start_date DESC';

    const result = await pool.query(query, params);
    
    const budgets = result.rows.map((row: any) => ({
      ...row,
      spent: parseFloat(row.spent),
      remaining: parseFloat(row.budget_amount) - parseFloat(row.spent),
      percentage_used: (parseFloat(row.spent) / parseFloat(row.budget_amount)) * 100,
    }));

    res.json(budgets);
  } catch (error: any) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

// Get single budget
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Create budget
router.post(
  '/',
  authenticate,
  [
    body('category').notEmpty().isString().trim(),
    body('budget_amount').isFloat({ min: 0.01 }),
    body('period').isIn(['weekly', 'monthly', 'yearly']),
    body('start_date').isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('description').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { category, budget_amount, period, start_date, end_date, description } = req.body;

      const result = await pool.query(
        `INSERT INTO budgets (user_id, category, budget_amount, period, start_date, end_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          category,
          budget_amount,
          period,
          start_date,
          end_date || null,
          description || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create budget error:', error);
      res.status(500).json({ error: 'Failed to create budget' });
    }
  }
);

// Update budget
router.put(
  '/:id',
  authenticate,
  [
    body('category').optional().isString().trim(),
    body('budget_amount').optional().isFloat({ min: 0.01 }),
    body('period').optional().isIn(['weekly', 'monthly', 'yearly']),
    body('start_date').optional().isISO8601().toDate(),
    body('end_date').optional().isISO8601().toDate(),
    body('description').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { category, budget_amount, period, start_date, end_date, description } = req.body;

      // Check if budget exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (budget_amount !== undefined) {
        updates.push(`budget_amount = $${paramIndex++}`);
        values.push(budget_amount);
      }
      if (period !== undefined) {
        updates.push(`period = $${paramIndex++}`);
        values.push(period);
      }
      if (start_date !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        values.push(start_date);
      }
      if (end_date !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        values.push(end_date);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE budgets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update budget error:', error);
      res.status(500).json({ error: 'Failed to update budget' });
    }
  }
);

// Delete budget
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
