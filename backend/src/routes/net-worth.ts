import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all net worth snapshots
router.get(
  '/',
  authenticate,
  [
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

      const { start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM net_worth_snapshots WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (start_date) {
        query += ` AND snapshot_date >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND snapshot_date <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` ORDER BY snapshot_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get net worth snapshots error:', error);
      res.status(500).json({ error: 'Failed to fetch net worth snapshots' });
    }
  }
);

// Get latest net worth snapshot (must be before /:id route)
router.get('/latest', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM net_worth_snapshots WHERE user_id = $1 ORDER BY snapshot_date DESC LIMIT 1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      // Return 200 with null to indicate no data exists, not a missing route
      return res.status(200).json(null);
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('Get latest net worth snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch latest net worth snapshot' });
  }
});

// Get single net worth snapshot with details
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get snapshot
    const snapshotResult = await pool.query(
      'SELECT * FROM net_worth_snapshots WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (snapshotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Net worth snapshot not found' });
    }

    const snapshot = snapshotResult.rows[0];

    // Get assets
    const assetsResult = await pool.query(
      'SELECT * FROM net_worth_assets WHERE snapshot_id = $1 ORDER BY amount DESC',
      [id]
    );

    // Get liabilities
    const liabilitiesResult = await pool.query(
      'SELECT * FROM net_worth_liabilities WHERE snapshot_id = $1 ORDER BY amount DESC',
      [id]
    );

    res.json({
      ...snapshot,
      assets: assetsResult.rows,
      liabilities: liabilitiesResult.rows,
    });
  } catch (error: any) {
    console.error('Get net worth snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch net worth snapshot' });
  }
});

// Create net worth snapshot
router.post(
  '/',
  authenticate,
  [
    body('snapshot_date').isISO8601().toDate(),
    body('total_assets').isFloat({ min: 0 }),
    body('total_liabilities').isFloat({ min: 0 }),
    body('notes').optional().isString(),
    body('assets').optional().isArray(),
    body('liabilities').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { snapshot_date, total_assets, total_liabilities, notes, assets, liabilities } = req.body;
      const net_worth = total_assets - total_liabilities;

      // Start transaction
      await pool.query('BEGIN');

      try {
        // Create snapshot
        const snapshotResult = await pool.query(
          `INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, total_liabilities, net_worth, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            req.userId,
            snapshot_date,
            total_assets,
            total_liabilities,
            net_worth,
            notes || null,
          ]
        );

        const snapshot = snapshotResult.rows[0];
        const snapshotId = snapshot.id;

        // Insert assets if provided
        if (assets && Array.isArray(assets)) {
          for (const asset of assets) {
            await pool.query(
              `INSERT INTO net_worth_assets (snapshot_id, category, amount, description)
               VALUES ($1, $2, $3, $4)`,
              [snapshotId, asset.category, asset.amount, asset.description || null]
            );
          }
        }

        // Insert liabilities if provided
        if (liabilities && Array.isArray(liabilities)) {
          for (const liability of liabilities) {
            await pool.query(
              `INSERT INTO net_worth_liabilities (snapshot_id, category, amount, description)
               VALUES ($1, $2, $3, $4)`,
              [snapshotId, liability.category, liability.amount, liability.description || null]
            );
          }
        }

        await pool.query('COMMIT');

        // Fetch complete snapshot with details
        const assetsResult = await pool.query(
          'SELECT * FROM net_worth_assets WHERE snapshot_id = $1',
          [snapshotId]
        );
        const liabilitiesResult = await pool.query(
          'SELECT * FROM net_worth_liabilities WHERE snapshot_id = $1',
          [snapshotId]
        );

        res.status(201).json({
          ...snapshot,
          assets: assetsResult.rows,
          liabilities: liabilitiesResult.rows,
        });
      } catch (error: any) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Net worth snapshot already exists for this date' });
      }
      console.error('Create net worth snapshot error:', error);
      res.status(500).json({ error: 'Failed to create net worth snapshot' });
    }
  }
);

// Update net worth snapshot
router.put(
  '/:id',
  authenticate,
  [
    body('snapshot_date').optional().isISO8601().toDate(),
    body('total_assets').optional().isFloat({ min: 0 }),
    body('total_liabilities').optional().isFloat({ min: 0 }),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { snapshot_date, total_assets, total_liabilities, notes } = req.body;

      // Check if snapshot exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM net_worth_snapshots WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Net worth snapshot not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (snapshot_date !== undefined) {
        updates.push(`snapshot_date = $${paramIndex++}`);
        values.push(snapshot_date);
      }
      if (total_assets !== undefined) {
        updates.push(`total_assets = $${paramIndex++}`);
        values.push(total_assets);
      }
      if (total_liabilities !== undefined) {
        updates.push(`total_liabilities = $${paramIndex++}`);
        values.push(total_liabilities);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Recalculate net worth if assets or liabilities changed
      if (total_assets !== undefined || total_liabilities !== undefined) {
        const currentSnapshot = checkResult.rows[0];
        const newAssets = total_assets !== undefined ? total_assets : parseFloat(currentSnapshot.total_assets);
        const newLiabilities = total_liabilities !== undefined ? total_liabilities : parseFloat(currentSnapshot.total_liabilities);
        updates.push(`net_worth = $${paramIndex++}`);
        values.push(newAssets - newLiabilities);
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE net_worth_snapshots SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update net worth snapshot error:', error);
      res.status(500).json({ error: 'Failed to update net worth snapshot' });
    }
  }
);

// Delete net worth snapshot
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM net_worth_snapshots WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Net worth snapshot not found' });
    }
    res.json({ message: 'Net worth snapshot deleted successfully' });
  } catch (error: any) {
    console.error('Delete net worth snapshot error:', error);
    res.status(500).json({ error: 'Failed to delete net worth snapshot' });
  }
});

export default router;
