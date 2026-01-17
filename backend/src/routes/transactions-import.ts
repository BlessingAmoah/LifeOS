import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { body, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  account?: string;
  is_recurring?: boolean;
  notes?: string;
}

// Parse CSV file
const parseCSV = (buffer: Buffer): Promise<CSVTransaction[]> => {
  return new Promise((resolve, reject) => {
    const results: CSVTransaction[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row: any) => {
        // Normalize column names (case-insensitive)
        const normalizedRow: any = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.toLowerCase().trim();
          normalizedRow[normalizedKey] = row[key];
        });

        // Validate required fields
        if (!normalizedRow.date || !normalizedRow.description || !normalizedRow.amount || !normalizedRow.category || !normalizedRow.type) {
          return; // Skip invalid rows
        }

        // Parse amount
        const amount = parseFloat(normalizedRow.amount.toString().replace(/[^0-9.-]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return; // Skip invalid amounts
        }

        // Validate type
        const type = normalizedRow.type.toLowerCase().trim();
        if (type !== 'income' && type !== 'expense') {
          return; // Skip invalid types
        }

        results.push({
          date: normalizedRow.date.trim(),
          description: normalizedRow.description.trim(),
          amount: amount,
          category: normalizedRow.category.trim(),
          type: type as 'income' | 'expense',
          account: normalizedRow.account?.trim() || undefined,
          is_recurring: normalizedRow.is_recurring?.toLowerCase().trim() === 'true',
          notes: normalizedRow.notes?.trim() || undefined,
        });
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// Preview CSV import (validate and return preview)
router.post(
  '/preview',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const transactions = await parseCSV(req.file.buffer);

      if (transactions.length === 0) {
        return res.status(400).json({ error: 'No valid transactions found in CSV' });
      }

      // Return preview with validation results
      res.json({
        preview: transactions.slice(0, 10), // First 10 for preview
        total: transactions.length,
        valid: transactions.length,
        invalid: 0, // Could be enhanced to track invalid rows
      });
    } catch (error: any) {
      console.error('CSV preview error:', error);
      res.status(500).json({ error: 'Failed to parse CSV file' });
    }
  }
);

// Import CSV transactions
router.post(
  '/import',
  authenticate,
  upload.single('file'),
  [
    body('skip_duplicates').optional().isBoolean(),
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

      const { skip_duplicates } = req.body;
      const transactions = await parseCSV(req.file.buffer);

      if (transactions.length === 0) {
        return res.status(400).json({ error: 'No valid transactions found in CSV' });
      }

      // Insert transactions
      const inserted: any[] = [];
      const skipped: any[] = [];

      for (const txn of transactions) {
        try {
          // Validate date format
          const date = new Date(txn.date);
          if (isNaN(date.getTime())) {
            skipped.push({ ...txn, error: 'Invalid date format' });
            continue;
          }

          // Check for duplicates if skip_duplicates is true
          if (skip_duplicates) {
            const existing = await pool.query(
              `SELECT id FROM transactions 
               WHERE user_id = $1 
                 AND transaction_date = $2 
                 AND amount = $3 
                 AND description = $4 
                 AND type = $5`,
              [req.userId, txn.date, txn.amount, txn.description, txn.type]
            );

            if (existing.rows.length > 0) {
              skipped.push({ ...txn, error: 'Duplicate transaction' });
              continue;
            }
          }

          const result = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date, account, is_recurring, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
              req.userId,
              txn.type,
              txn.amount,
              txn.category,
              txn.description,
              txn.date,
              txn.account || null,
              txn.is_recurring || false,
              txn.notes || null,
            ]
          );

          inserted.push(result.rows[0]);
        } catch (error: any) {
          if (error.code === '23505') { // Unique constraint violation
            skipped.push({ ...txn, error: 'Duplicate transaction' });
          } else {
            skipped.push({ ...txn, error: error.message });
          }
        }
      }

      res.json({
        imported: inserted.length,
        skipped: skipped.length,
        total: transactions.length,
        inserted: inserted,
        skipped_details: skipped,
      });
    } catch (error: any) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: 'Failed to import CSV file' });
    }
  }
);

export default router;
