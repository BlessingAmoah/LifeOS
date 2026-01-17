import express from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get all tasks
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['backlog', 'in_progress', 'done']),
    query('sprint_id').optional().isString(),
    query('view').optional().isIn(['all', 'sprint', 'standup']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, sprint_id, view, limit = 50, offset = 0, archived, archived_month } = req.query;

      let query = 'SELECT * FROM tasks WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      // By default, exclude archived tasks unless explicitly requested
      const isArchived = archived === 'true' || archived === '1';
      if (isArchived) {
        query += ` AND archived_at IS NOT NULL`;
        if (archived_month && typeof archived_month === 'string') {
          query += ` AND archived_month = $${paramIndex}`;
          params.push(archived_month);
          paramIndex++;
        }
      } else {
        query += ` AND archived_at IS NULL`;
      }

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (sprint_id) {
        query += ` AND sprint_id = $${paramIndex}`;
        params.push(sprint_id);
        paramIndex++;
      }

      // Standup view: tasks due today or in progress
      if (view === 'standup') {
        const today = new Date().toISOString().split('T')[0];
        query += ` AND (due_date = $${paramIndex}::date OR status = 'in_progress')`;
        params.push(today);
        paramIndex++;
      }

      query += ` ORDER BY due_date ASC NULLS LAST, task_time ASC NULLS LAST, priority DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

// Archive completed tasks for a specific month
router.post(
  '/archive',
  authenticate,
  [
    body('month').optional().isString().matches(/^\d{4}-\d{2}$/), // YYYY-MM format
    body('archive_all_done').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { month, archive_all_done = false } = req.body;
      
      // If no month specified, use current month
      const archiveMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
      const now = new Date();

      let query = `UPDATE tasks 
                   SET archived_at = $1, archived_month = $2
                   WHERE user_id = $3 AND status = 'done' AND archived_at IS NULL`;
      const params: any[] = [now, archiveMonth, req.userId];

      if (!archive_all_done) {
        // Only archive tasks completed in the specified month
        const monthStart = new Date(`${archiveMonth}-01`);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        query += ` AND updated_at >= $4 AND updated_at <= $5`;
        params.push(monthStart, monthEnd);
      }

      query += ` RETURNING id`;

      const result = await pool.query(query, params);

      res.json({
        message: `Archived ${result.rows.length} task(s) to ${archiveMonth}`,
        archived_count: result.rows.length,
        archived_month: archiveMonth,
      });
    } catch (error: any) {
      console.error('Archive tasks error:', error);
      res.status(500).json({ error: 'Failed to archive tasks' });
    }
  }
);

// Get archived tasks by month (must be before /:id route)
router.get(
  '/archived',
  authenticate,
  [
    query('month').optional().isString().matches(/^\d{4}-\d{2}$/),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { month, limit = 50, offset = 0 } = req.query;

      let query = `SELECT * FROM tasks 
                   WHERE user_id = $1 AND archived_at IS NOT NULL`;
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (month) {
        query += ` AND archived_month = $${paramIndex}`;
        params.push(month);
        paramIndex++;
      }

      query += ` ORDER BY archived_at DESC, updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Get archived tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch archived tasks' });
    }
  }
);

// Get list of months with archived tasks
router.get('/archived/months', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT archived_month, COUNT(*) as task_count
       FROM tasks 
       WHERE user_id = $1 AND archived_at IS NOT NULL AND archived_month IS NOT NULL
       GROUP BY archived_month
       ORDER BY archived_month DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get archived months error:', error);
    res.status(500).json({ error: 'Failed to fetch archived months' });
  }
});

// Unarchive a task
router.post('/:id/unarchive', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET archived_at = NULL, archived_month = NULL
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Unarchive task error:', error);
    res.status(500).json({ error: 'Failed to unarchive task' });
  }
});

// Get single task (must be after /archived routes)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['backlog', 'in_progress', 'done']),
    body('priority').optional().isInt(),
    body('due_date').optional().isISO8601().toDate(),
    body('task_time').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      // Accept both HH:MM and HH:MM:SS formats (HTML time input can return either)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (timeRegex.test(value)) {
        return true;
      }
      throw new Error('Time must be in HH:MM or HH:MM:SS format');
    }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, status = 'backlog', priority = 0, due_date, task_time, sprint_id, sprint_name, retrospective_notes } = req.body;

      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, description, status, priority, due_date, task_time, sprint_id, sprint_name, retrospective_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [req.userId, title, description, status, priority, due_date || null, task_time || null, sprint_id, sprint_name, retrospective_notes]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Update task
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null/undefined (field not provided)
      }
      return typeof value === 'string' && value.trim().length > 0;
    }).withMessage('Title must be a non-empty string'),
    body('description').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      return typeof value === 'string';
    }),
    body('status').optional().isIn(['backlog', 'in_progress', 'done']),
    body('priority').optional().isInt({ min: 0 }),
    body('due_date').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      // Accept both ISO8601 and YYYY-MM-DD formats
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (iso8601Regex.test(value) || dateOnlyRegex.test(value)) {
        return true;
      }
      throw new Error('Invalid date format');
    }),
    body('task_time').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      // Accept both HH:MM and HH:MM:SS formats (HTML time input can return either)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (timeRegex.test(value)) {
        return true;
      }
      throw new Error('Time must be in HH:MM or HH:MM:SS format');
    }),
    body('sprint_id').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      return typeof value === 'string';
    }),
    body('sprint_name').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      return typeof value === 'string';
    }),
    body('retrospective_notes').optional().custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty
      }
      return typeof value === 'string';
    }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Task update validation errors:', JSON.stringify(errors.array(), null, 2));
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, status, priority, due_date, task_time, sprint_id, sprint_name, retrospective_notes } = req.body;
      
      console.log('Task update request body:', { title, description, status, priority, due_date, task_time, sprint_id, sprint_name, retrospective_notes });

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description === '' ? null : description);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }
      if (due_date !== undefined) {
        updates.push(`due_date = $${paramIndex++}`);
        // Convert empty string to null, or keep the date value
        values.push(due_date === '' || due_date === null ? null : due_date);
      }
      if (task_time !== undefined) {
        updates.push(`task_time = $${paramIndex++}`);
        // Convert empty string to null, or convert HH:MM:SS to HH:MM format
        if (task_time === '' || task_time === null) {
          values.push(null);
        } else {
          // Convert HH:MM:SS to HH:MM if needed (HTML time input returns HH:MM:SS)
          const timeValue = task_time.length > 5 ? task_time.substring(0, 5) : task_time;
          values.push(timeValue);
        }
      }
      if (sprint_id !== undefined) {
        updates.push(`sprint_id = $${paramIndex++}`);
        values.push(sprint_id === '' ? null : sprint_id);
      }
      if (sprint_name !== undefined) {
        updates.push(`sprint_name = $${paramIndex++}`);
        values.push(sprint_name === '' ? null : sprint_name);
      }
      if (retrospective_notes !== undefined) {
        updates.push(`retrospective_notes = $${paramIndex++}`);
        values.push(retrospective_notes === '' ? null : retrospective_notes);
      }

      // Always update updated_at, so if no other fields, we still have one update
      // But we should have at least one field from the request
      if (updates.length === 0) {
        console.error('No fields provided for update');
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(req.params.id, req.userId);
      
      console.log('Update query:', `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length}`);
      console.log('Update values:', values);

      const result = await pool.query(
        `UPDATE tasks 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

// Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
