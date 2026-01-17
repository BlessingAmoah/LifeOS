import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getContainerClient } from '../config/azure';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    // Allow images and common diagram formats
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf', // For PDF diagrams
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// Get all projects
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Upload project image (must be before /:id route)
router.post(
  '/:id/image',
  authenticate,
  upload.single('image'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { id } = req.params;

      // Check if project exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const file = req.file;
      const fileName = `projects/${req.userId}/${uuidv4()}-${file.originalname}`;

      // Upload to Azure Blob Storage
      const containerClient = await getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobUrl = blockBlobClient.url;

      // Update project with image URL
      const result = await pool.query(
        'UPDATE projects SET image_url = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
        [blobUrl, id, req.userId]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Upload project image error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Delete project image
router.delete('/:id/image', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = checkResult.rows[0];
    if (project.image_url) {
      // Extract blob name from URL and delete from Azure
      try {
        const url = new URL(project.image_url);
        const blobName = url.pathname.split('/').slice(2).join('/'); // Remove container name
        const containerClient = await getContainerClient();
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
      } catch (error: any) {
        console.error('Error deleting blob:', error);
        // Continue even if blob deletion fails
      }
    }

    // Update project to remove image URL
    const result = await pool.query(
      'UPDATE projects SET image_url = NULL, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Delete project image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Get single project
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('github_url')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('GitHub URL must be a valid URL'),
    body('deployment_url')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('Deployment URL must be a valid URL'),
    body('status').isIn(['not_started', 'in_progress', 'completed', 'stalled']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, github_url, deployment_url, status } = req.body;
      const result = await pool.query(
        `INSERT INTO projects (user_id, title, description, github_url, deployment_url, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, title, description || null, github_url || null, deployment_url || null, status || 'not_started']
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim(),
    body('description').optional().isString(),
    body('github_url')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('GitHub URL must be a valid URL'),
    body('deployment_url')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('Deployment URL must be a valid URL'),
    body('status').optional().isIn(['not_started', 'in_progress', 'completed', 'stalled']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, github_url, deployment_url, status } = req.body;

      // Check if project exists and belongs to user
      const checkResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (github_url !== undefined) {
        updates.push(`github_url = $${paramIndex++}`);
        values.push(github_url);
      }
      if (deployment_url !== undefined) {
        updates.push(`deployment_url = $${paramIndex++}`);
        values.push(deployment_url);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      // Note: image_url is updated via separate endpoint

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.userId);
      const result = await pool.query(
        `UPDATE projects SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Delete project
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
