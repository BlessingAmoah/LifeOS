import express from 'express';
import multer from 'multer';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getContainerClient, generateBlobSASUrl } from '../config/azure';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all uploaded documents
router.get(
  '/',
  authenticate,
  [
    query('document_type').optional().trim(),
    query('linked_stage').optional().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { document_type, linked_stage } = req.query;

      let query = 'SELECT * FROM uploaded_documents WHERE user_id = $1';
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (document_type) {
        query += ` AND document_type = $${paramIndex++}`;
        params.push(document_type);
      }
      if (linked_stage) {
        query += ` AND linked_stage = $${paramIndex++}`;
        params.push(linked_stage);
      }

      query += ' ORDER BY uploaded_date DESC';

      const result = await pool.query(query, params);

      // Generate SAS URLs for each document
      const documentsWithUrls = await Promise.all(
        result.rows.map(async (doc) => {
          try {
            const sasUrl = generateBlobSASUrl(doc.blob_url);
            return { ...doc, access_url: sasUrl };
          } catch (error) {
            console.error(`Error generating SAS URL for document ${doc.id}:`, error);
            return { ...doc, access_url: doc.blob_url };
          }
        })
      );

      res.json(documentsWithUrls);
    } catch (error: any) {
      console.error('Error fetching uploaded documents:', error);
      res.status(500).json({ error: 'Failed to fetch uploaded documents' });
    }
  }
);

// Get a single document
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM uploaded_documents WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];
    try {
      const sasUrl = generateBlobSASUrl(doc.blob_url);
      res.json({ ...doc, access_url: sasUrl });
    } catch (error) {
      res.json({ ...doc, access_url: doc.blob_url });
    }
  } catch (error: any) {
    console.error('Error fetching uploaded document:', error);
    res.status(500).json({ error: 'Failed to fetch uploaded document' });
  }
});

// Upload a new document
router.post(
  '/',
  authenticate,
  upload.single('file'),
  [
    body('document_type').notEmpty().trim(),
    body('linked_stage').optional().trim(),
    body('uploaded_date').optional().isISO8601().toDate(),
    body('expiry_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
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

      const { document_type, linked_stage, uploaded_date, expiry_date, notes } = req.body;
      const file = req.file;

      // Upload to Azure Blob Storage
      const containerClient = await getContainerClient();
      const blobName = `immigration/${req.userId}/${uuidv4()}-${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobUrl = blockBlobClient.url;

      // Save metadata to database
      const result = await pool.query(
        'INSERT INTO uploaded_documents (user_id, document_type, file_name, blob_url, linked_stage, uploaded_date, expiry_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          req.userId,
          document_type,
          file.originalname,
          blobUrl,
          linked_stage || null,
          uploaded_date || new Date(),
          expiry_date || null,
          notes || null,
        ]
      );

      // Generate SAS URL for response
      const sasUrl = generateBlobSASUrl(blobUrl);
      res.status(201).json({ ...result.rows[0], access_url: sasUrl });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// Update a document (metadata only, not the file itself)
router.put(
  '/:id',
  authenticate,
  [
    body('document_type').optional().trim(),
    body('linked_stage').optional().trim(),
    body('uploaded_date').optional().isISO8601().toDate(),
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
      const { document_type, linked_stage, uploaded_date, expiry_date, notes } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (document_type !== undefined) {
        updates.push(`document_type = $${paramIndex++}`);
        values.push(document_type);
      }
      if (linked_stage !== undefined) {
        updates.push(`linked_stage = $${paramIndex++}`);
        values.push(linked_stage);
      }
      if (uploaded_date !== undefined) {
        updates.push(`uploaded_date = $${paramIndex++}`);
        values.push(uploaded_date);
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
      const query = `UPDATE uploaded_documents SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const doc = result.rows[0];
      try {
        const sasUrl = generateBlobSASUrl(doc.blob_url);
        res.json({ ...doc, access_url: sasUrl });
      } catch (error) {
        res.json({ ...doc, access_url: doc.blob_url });
      }
    } catch (error: any) {
      console.error('Error updating document:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }
);

// Delete a document
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get document to delete blob
    const docResult = await pool.query('SELECT blob_url FROM uploaded_documents WHERE id = $1 AND user_id = $2', [id, req.userId]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from database
    const result = await pool.query('DELETE FROM uploaded_documents WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);

    // Delete from Azure Blob Storage (optional - can be done asynchronously)
    try {
      const containerClient = await getContainerClient();
      const blobUrl = new URL(docResult.rows[0].blob_url);
      const blobName = blobUrl.pathname.substring(1); // Remove leading /
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (blobError) {
      console.error('Error deleting blob:', blobError);
      // Continue even if blob deletion fails
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
