import express, { RequestHandler } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { financialCurrencies, isCalendarDate, isDecimalAmount } from '../utils/financeValidation';

const router = express.Router();
const policyTypes = ['life', 'health', 'auto', 'home', 'renters', 'disability', 'travel', 'other'];
const statuses = ['active', 'expired', 'cancelled'];
const frequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'one_time'];
const metadataFields = [
  'name', 'policy_type', 'insurer_name', 'policy_suffix', 'currency', 'premium_amount',
  'premium_frequency', 'coverage_amount', 'start_date', 'end_date', 'renewal_date', 'status', 'notes',
];
const fields = (allowed: string[]) => body().custom(value =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every(key => allowed.includes(key))
).withMessage('Unsupported policy fields');
const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
const metadata = () => [
  body('name').isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage('Policy nickname must contain 1-100 characters'),
  body('policy_type').isString().bail().isIn(policyTypes).withMessage('Choose a valid policy type'),
  body('insurer_name').isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage('Insurer name must contain 1-100 characters'),
  body('policy_suffix').optional({ nullable: true }).isString().bail().matches(/^[A-Za-z0-9]{4}$/).withMessage('Use only the last four reference characters'),
  body('currency').isString().bail().isIn(financialCurrencies).withMessage('Choose a supported currency'),
  ...['premium_amount', 'coverage_amount'].map(field =>
    body(field).optional({ nullable: true }).custom(value => isDecimalAmount(value) && !value.startsWith('-'))
      .withMessage('Amounts must be non-negative decimal strings with at most two decimal places')
  ),
  body('premium_frequency').optional({ nullable: true }).isString().bail().isIn(frequencies).withMessage('Choose a valid premium frequency'),
  body().custom(value => value && (value.premium_amount != null) === (value.premium_frequency != null))
    .withMessage('Record premium amount and frequency together, or leave both blank'),
  ...['start_date', 'end_date', 'renewal_date'].map(field =>
    body(field).optional({ nullable: true }).custom(isCalendarDate).withMessage('Use valid calendar dates')
  ),
  body('end_date').optional({ nullable: true }).custom((value, { req }) =>
    req.body.start_date == null || value >= req.body.start_date
  ).withMessage('Coverage end date cannot precede its start date'),
  body('status').isString().bail().isIn(statuses).withMessage('Choose a valid policy status'),
  body('notes').optional({ nullable: true }).isString().bail().trim().isLength({ max: 2000 }).withMessage('Notes must contain at most 2000 characters'),
];
const dateColumns = `TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
  TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, TO_CHAR(renewal_date, 'YYYY-MM-DD') AS renewal_date`;
const values = (data: Record<string, unknown>) => metadataFields.map(field => data[field] ?? null);

router.use(authenticate);

router.get('/', [
  query('include_archived').optional().isString().bail().isIn(['true', 'false']),
  query('policy_type').optional().isString().bail().isIn(policyTypes),
  query('status').optional().isString().bail().isIn(statuses),
], validate, async (req: AuthRequest, res) => {
  try {
    const params: unknown[] = [req.userId];
    const clauses = ['user_id = $1'];
    if (req.query.include_archived !== 'true') clauses.push('NOT is_archived');
    for (const field of ['policy_type', 'status']) {
      if (req.query[field] !== undefined) {
        params.push(req.query[field]);
        clauses.push(`${field} = $${params.length}`);
      }
    }
    const result = await pool.query(
      `SELECT *, ${dateColumns} FROM insurance_policies WHERE ${clauses.join(' AND ')} ORDER BY currency, name, id`, params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get insurance policies error:', error);
    res.status(500).json({ error: 'Failed to load insurance policies' });
  }
});

router.get('/:id', [param('id').isUUID()], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT *, ${dateColumns} FROM insurance_policies WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get insurance policy error:', error);
    res.status(500).json({ error: 'Failed to load insurance policy' });
  }
});

router.post('/', [fields(metadataFields), ...metadata()], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO insurance_policies (user_id, ${metadataFields.join(', ')})
       VALUES (${['$1', ...metadataFields.map((_, index) => `$${index + 2}`)].join(', ')})
       RETURNING *, ${dateColumns}`, [req.userId, ...values(req.body)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create insurance policy error:', error);
    res.status(500).json({ error: 'Failed to create insurance policy' });
  }
});

router.put('/:id', [param('id').isUUID(), fields(metadataFields), ...metadata()], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE insurance_policies SET ${metadataFields.map((field, index) => `${field} = $${index + 3}`).join(', ')},
       updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND NOT is_archived
       RETURNING *, ${dateColumns}`, [req.params.id, req.userId, ...values(req.body)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Active policy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update insurance policy error:', error);
    res.status(500).json({ error: 'Failed to update insurance policy' });
  }
});

router.patch('/:id', [
  param('id').isUUID(), fields(['is_archived']), body('is_archived').custom(value => typeof value === 'boolean'),
], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE insurance_policies SET is_archived = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING *, ${dateColumns}`,
      [req.params.id, req.userId, req.body.is_archived]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Archive insurance policy error:', error);
    res.status(500).json({ error: 'Failed to change policy archive status' });
  }
});

export default router;
