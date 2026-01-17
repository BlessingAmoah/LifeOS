import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getContainerClient } from '../config/azure';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all folders
router.get('/folders', authenticate, async (req: AuthRequest, res) => {
  try {
    const { parent_folder_id } = req.query;
    let query = 'SELECT * FROM folders WHERE user_id = $1';
    const params: any[] = [req.userId];

    // Handle null/undefined properly - convert string "null" to actual null
    if (parent_folder_id && parent_folder_id !== 'null' && parent_folder_id !== 'undefined') {
      query += ' AND parent_folder_id = $2';
      params.push(parent_folder_id);
    } else {
      query += ' AND parent_folder_id IS NULL';
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
router.post(
  '/folders',
  authenticate,
  [
    body('name').notEmpty().isString(),
    body('parent_folder_id').optional().custom((value) => {
      // Allow null, undefined, or valid UUID
      if (value === null || value === undefined || value === 'null' || value === '') {
        return true;
      }
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, parent_folder_id } = req.body;
      // Convert string "null" or empty string to actual null
      const parentId = (parent_folder_id && parent_folder_id !== 'null' && parent_folder_id !== 'undefined' && parent_folder_id !== '') 
        ? parent_folder_id 
        : null;
      
      const result = await pool.query(
        'INSERT INTO folders (user_id, name, parent_folder_id) VALUES ($1, $2, $3) RETURNING *',
        [req.userId, name, parentId]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create folder error:', error);
      res.status(500).json({ error: 'Failed to create folder' });
    }
  }
);

// Update folder
router.put(
  '/folders/:id',
  authenticate,
  [body('name').optional().isString(), body('parent_folder_id').optional().isUUID()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, parent_folder_id } = req.body;
      
      // Convert string "null" to actual null for parent_folder_id
      const parentId = (parent_folder_id !== undefined && parent_folder_id !== null && parent_folder_id !== 'null' && parent_folder_id !== 'undefined' && parent_folder_id !== '') 
        ? parent_folder_id 
        : null;

      const result = await pool.query(
        `UPDATE folders SET name = COALESCE($1, name), parent_folder_id = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4 RETURNING *`,
        [name, parentId, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update folder error:', error);
      res.status(500).json({ error: 'Failed to update folder' });
    }
  }
);

// Delete folder
router.delete('/folders/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ message: 'Folder deleted successfully' });
  } catch (error: any) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Get all documents
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
      const { type, folder_id, document_type } = req.query;

      let query = 'SELECT * FROM documents WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      // Handle null/undefined properly - convert string "null" to actual null
      if (folder_id && folder_id !== 'null' && folder_id !== 'undefined') {
        query += ` AND folder_id = $${paramIndex}`;
        params.push(folder_id);
        paramIndex++;
      } else {
        query += ' AND folder_id IS NULL';
      }

      if (document_type) {
        query += ` AND document_type = $${paramIndex}`;
        params.push(document_type);
        paramIndex++;
      }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Upload document (file)
router.post(
  '/',
  authenticate,
  upload.single('file'),
  [
    body('type').optional().isIn(['immigration', 'journal_attachment']),
    body('folder_id').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type = 'immigration', folder_id } = req.body;
      const file = req.file;
      const fileName = `${req.userId}/${uuidv4()}-${file.originalname}`;

      // Upload to Azure Blob Storage
      const containerClient = await getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobUrl = blockBlobClient.url;

      // Convert string "null" to actual null
      const folderId = (folder_id && folder_id !== 'null' && folder_id !== 'undefined' && folder_id !== '') 
        ? folder_id 
        : null;

      // Save document record
      const result = await pool.query(
        `INSERT INTO documents (user_id, type, file_name, blob_url, document_type, folder_id)
         VALUES ($1, $2, $3, $4, 'file', $5)
         RETURNING *`,
        [req.userId, type, file.originalname, blobUrl, folderId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// Create text document
router.post(
  '/text',
  authenticate,
  [
    body('file_name').notEmpty().isString(),
    body('content').optional().isString(),
    body('content_format').optional().isIn(['plain', 'rich']),
    body('folder_id').optional().isUUID(),
    body('type').optional().isIn(['immigration', 'journal_attachment']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { file_name, content = '', content_format = 'rich', folder_id, type = 'immigration' } = req.body;

      // For text documents, we don't need a blob_url, but we'll create a placeholder
      const placeholderUrl = `text://${req.userId}/${uuidv4()}`;

      // Convert string "null" to actual null
      const folderId = (folder_id && folder_id !== 'null' && folder_id !== 'undefined' && folder_id !== '') 
        ? folder_id 
        : null;

      const result = await pool.query(
        `INSERT INTO documents (user_id, type, file_name, blob_url, document_type, content, content_format, folder_id)
         VALUES ($1, $2, $3, $4, 'text', $5, $6, $7)
         RETURNING *`,
        [req.userId, type, file_name, placeholderUrl, content, content_format, folderId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create text document error:', error);
      res.status(500).json({ error: 'Failed to create text document' });
    }
  }
);

// Update text document
router.put(
  '/text/:id',
  authenticate,
  [
    body('file_name').optional().isString(),
    body('content').optional().isString(),
    body('content_format').optional().isIn(['plain', 'rich']),
    body('folder_id').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { file_name, content, content_format, folder_id } = req.body;

      // Convert string "null" to actual null for folder_id
      const folderId = (folder_id !== undefined && folder_id !== null && folder_id !== 'null' && folder_id !== 'undefined' && folder_id !== '') 
        ? folder_id 
        : null;

      const result = await pool.query(
        `UPDATE documents
         SET file_name = COALESCE($1, file_name),
             content = COALESCE($2, content),
             content_format = COALESCE($3, content_format),
             folder_id = $4,
             updated_at = NOW()
         WHERE id = $5 AND user_id = $6 AND document_type = 'text'
         RETURNING *`,
        [file_name, content, content_format, folderId, req.params.id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Text document not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Update text document error:', error);
      res.status(500).json({ error: 'Failed to update text document' });
    }
  }
);

// Delete document
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get document info
    const docResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Delete from Azure Blob Storage (only for file documents)
    if (document.document_type === 'file' && document.blob_url && !document.blob_url.startsWith('text://')) {
      try {
        const containerClient = await getContainerClient();
        const blobName = document.blob_url.split('/').slice(-2).join('/');
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
      } catch (blobError) {
        console.error('Error deleting blob:', blobError);
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete database record
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
