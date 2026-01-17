import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all investments
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['stock', 'bond', 'mutual_fund', 'etf', 'crypto', 'real_estate', 'other']),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM investments WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      query += ` ORDER BY purchase_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get investments error:', error);
      res.status(500).json({ error: 'Failed to fetch investments' });
    }
  }
);

// Get investment summary (total value, gains/losses)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_investments,
        COALESCE(SUM(quantity * purchase_price), 0) as total_cost,
        COALESCE(SUM(quantity * COALESCE(current_price, purchase_price)), 0) as total_value,
        COALESCE(SUM(quantity * (COALESCE(current_price, purchase_price) - purchase_price)), 0) as total_gain_loss,
        COALESCE(SUM(CASE WHEN current_price IS NOT NULL AND current_price > purchase_price THEN quantity * (current_price - purchase_price) ELSE 0 END), 0) as total_gains,
        COALESCE(SUM(CASE WHEN current_price IS NOT NULL AND current_price < purchase_price THEN quantity * (purchase_price - current_price) ELSE 0 END), 0) as total_losses
      FROM investments
      WHERE user_id = $1`,
      [req.userId]
    );

    const summary = result.rows[0];
    const totalCost = parseFloat(summary.total_cost);
    const totalValue = parseFloat(summary.total_value);
    const totalGainLoss = parseFloat(summary.total_gain_loss);
    const returnPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    res.json({
      total_investments: parseInt(summary.total_investments, 10),
      total_cost: totalCost,
      total_value: totalValue,
      total_gain_loss: totalGainLoss,
      total_gains: parseFloat(summary.total_gains),
      total_losses: parseFloat(summary.total_losses),
      return_percentage: returnPercentage,
    });
  } catch (error: any) {
    console.error('Get investment summary error:', error);
    res.status(500).json({ error: 'Failed to fetch investment summary' });
  }
});

// Get single investment
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM investments WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get investment error:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

// Create investment
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().isString().trim(),
    body('type').isIn(['stock', 'bond', 'mutual_fund', 'etf', 'crypto', 'real_estate', 'other']),
    body('symbol').optional().isString(),
    body('quantity').isFloat({ min: 0.0001 }),
    body('purchase_price').isFloat({ min: 0.01 }),
    body('current_price').optional().isFloat({ min: 0 }),
    body('purchase_date').isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes } = req.body;

      const result = await pool.query(
        `INSERT INTO investments (user_id, name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          name,
          type,
          symbol || null,
          quantity,
          purchase_price,
          current_price || null,
          purchase_date,
          notes || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create investment error:', error);
      res.status(500).json({ error: 'Failed to create investment' });
    }
  }
);

// Update investment
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().isString().trim(),
    body('type').optional().isIn(['stock', 'bond', 'mutual_fund', 'etf', 'crypto', 'real_estate', 'other']),
    body('symbol').optional().isString(),
    body('quantity').optional().isFloat({ min: 0.0001 }),
    body('purchase_price').optional().isFloat({ min: 0.01 }),
    body('current_price').optional().isFloat({ min: 0 }),
    body('purchase_date').optional().isISO8601().toDate(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes } = req.body;

      // Check if investment exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM investments WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(type);
      }
      if (symbol !== undefined) {
        updates.push(`symbol = $${paramIndex++}`);
        values.push(symbol);
      }
      if (quantity !== undefined) {
        updates.push(`quantity = $${paramIndex++}`);
        values.push(quantity);
      }
      if (purchase_price !== undefined) {
        updates.push(`purchase_price = $${paramIndex++}`);
        values.push(purchase_price);
      }
      if (current_price !== undefined) {
        updates.push(`current_price = $${paramIndex++}`);
        values.push(current_price);
      }
      if (purchase_date !== undefined) {
        updates.push(`purchase_date = $${paramIndex++}`);
        values.push(purchase_date);
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
        `UPDATE investments SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update investment error:', error);
      res.status(500).json({ error: 'Failed to update investment' });
    }
  }
);

// Delete investment
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted successfully' });
  } catch (error: any) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

export default router;
