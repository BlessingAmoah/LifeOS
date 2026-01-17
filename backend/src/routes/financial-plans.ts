import express, { Request, Response } from 'express';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all financial plans
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT * FROM financial_plans WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching financial plans:', error);
    res.status(500).json({ error: 'Failed to fetch financial plans' });
  }
});

// Get single financial plan
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM financial_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financial plan not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching financial plan:', error);
    res.status(500).json({ error: 'Failed to fetch financial plan' });
  }
});

// Create financial plan
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      plan_type,
      title,
      description,
      target_amount,
      current_amount = 0,
      target_date,
      monthly_contribution,
      interest_rate = 0,
      status = 'active',
      priority = 'medium',
      notes,
    } = req.body;

    if (!plan_type || !title || !target_amount) {
      return res.status(400).json({ error: 'plan_type, title, and target_amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO financial_plans (
        user_id, plan_type, title, description, target_amount, current_amount,
        target_date, monthly_contribution, interest_rate, status, priority, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        plan_type,
        title,
        description || null,
        target_amount,
        current_amount,
        target_date || null,
        monthly_contribution || null,
        interest_rate,
        status,
        priority,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating financial plan:', error);
    res.status(500).json({ error: 'Failed to create financial plan' });
  }
});

// Update financial plan
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      plan_type,
      title,
      description,
      target_amount,
      current_amount,
      target_date,
      monthly_contribution,
      interest_rate,
      status,
      priority,
      notes,
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (plan_type !== undefined) {
      updates.push(`plan_type = $${paramCount++}`);
      values.push(plan_type);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (target_amount !== undefined) {
      updates.push(`target_amount = $${paramCount++}`);
      values.push(target_amount);
    }
    if (current_amount !== undefined) {
      updates.push(`current_amount = $${paramCount++}`);
      values.push(current_amount);
    }
    if (target_date !== undefined) {
      updates.push(`target_date = $${paramCount++}`);
      values.push(target_date);
    }
    if (monthly_contribution !== undefined) {
      updates.push(`monthly_contribution = $${paramCount++}`);
      values.push(monthly_contribution);
    }
    if (interest_rate !== undefined) {
      updates.push(`interest_rate = $${paramCount++}`);
      values.push(interest_rate);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const result = await pool.query(
      `UPDATE financial_plans SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financial plan not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating financial plan:', error);
    res.status(500).json({ error: 'Failed to update financial plan' });
  }
});

// Delete financial plan
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM financial_plans WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financial plan not found' });
    }

    res.json({ message: 'Financial plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting financial plan:', error);
    res.status(500).json({ error: 'Failed to delete financial plan' });
  }
});

export default router;
