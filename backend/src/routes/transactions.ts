import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all transactions
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['income', 'expense']),
    query('category').optional().isString(),
    query('account').optional().isIn(['checking', 'savings', 'credit_card', 'cash', 'other']),
    query('is_recurring').optional().isBoolean(),
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

      const { type, category, account, is_recurring, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM transactions WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (account) {
        query += ` AND account = $${paramIndex}`;
        params.push(account);
        paramIndex++;
      }

      if (is_recurring === 'true') {
        query += ` AND is_recurring = true`;
      } else if (is_recurring === 'false') {
        query += ` AND is_recurring = false`;
      }

      if (start_date) {
        query += ` AND transaction_date >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND transaction_date <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

// Get transaction summary (income, expenses, net)
router.get('/summary', authenticate, [
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND transaction_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND transaction_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' GROUP BY type';

    const result = await pool.query(query, params);
    
    const income = result.rows.find((r: any) => r.type === 'income') || { total: '0', count: '0' };
    const expense = result.rows.find((r: any) => r.type === 'expense') || { total: '0', count: '0' };
    const net = parseFloat(income.total) - parseFloat(expense.total);

    res.json({
      income: parseFloat(income.total),
      expense: parseFloat(expense.total),
      net,
      income_count: parseInt(income.count, 10),
      expense_count: parseInt(expense.count, 10),
    });
  } catch (error: any) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
});

// Get single transaction
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['income', 'expense']),
    body('amount').isFloat({ min: 0.01 }),
    body('category').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('transaction_date').optional().isISO8601().toDate(),
    body('payment_method').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, amount, category, description, transaction_date, payment_method, tags, is_recurring, frequency, account } = req.body;

      const result = await pool.query(
        `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date, payment_method, tags, is_recurring, frequency, account)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          req.userId,
          type,
          amount,
          category,
          description || null,
          transaction_date || new Date().toISOString().split('T')[0],
          payment_method || null,
          tags || [],
          is_recurring || false,
          frequency || null,
          account || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

// Update transaction
router.put(
  '/:id',
  authenticate,
  [
    body('type').optional().isIn(['income', 'expense']),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('category').optional().isString().trim(),
    body('description').optional().isString(),
    body('transaction_date').optional().isISO8601().toDate(),
    body('payment_method').optional().isString(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { type, amount, category, description, transaction_date, payment_method, tags, is_recurring, frequency, account } = req.body;

      // Check if transaction exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (amount !== undefined) {
        updates.push(`amount = $${paramIndex++}`);
        values.push(amount);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (transaction_date !== undefined) {
        updates.push(`transaction_date = $${paramIndex++}`);
        values.push(transaction_date);
      }
      if (payment_method !== undefined) {
        updates.push(`payment_method = $${paramIndex++}`);
        values.push(payment_method);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }
      if (is_recurring !== undefined) {
        updates.push(`is_recurring = $${paramIndex++}`);
        values.push(is_recurring);
      }
      if (frequency !== undefined) {
        updates.push(`frequency = $${paramIndex++}`);
        values.push(frequency);
      }
      if (account !== undefined) {
        updates.push(`account = $${paramIndex++}`);
        values.push(account);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE transactions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }
);

// Delete transaction
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
