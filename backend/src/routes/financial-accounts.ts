import express, { RequestHandler } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const accountTypes = ['checking', 'savings', 'cash', 'credit_card', 'investment', 'loan', 'other'];
const currencies = ['USD', 'GHS', 'CAD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF', 'JPY'];
const metadataFields = ['name', 'account_type', 'institution_name', 'account_suffix', 'is_stale'];
const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
const fields = (allowed: string[]) => body().custom(value =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every(key => allowed.includes(key))
).withMessage('Unsupported account fields');
const metadata = () => [
  body('name').isString().bail().trim().isLength({ min: 1, max: 100 }).withMessage('Account name must contain 1-100 characters'),
  body('account_type').isString().bail().isIn(accountTypes).withMessage('Choose a valid account type'),
  body('institution_name').optional({ nullable: true }).isString().bail().trim().isLength({ min: 1, max: 100 }),
  body('account_suffix').optional({ nullable: true }).isString().bail().matches(/^\d{4}$/).withMessage('Use only the last four digits'),
  body('is_stale').optional().custom(value => typeof value === 'boolean'),
];
const balanceFields = () => [
  body('balance').isString().bail().matches(/^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/)
    .withMessage('Balance must be a decimal amount with at most two decimal places'),
  body('balance_as_of').isString().bail().matches(/^\d{4}-\d{2}-\d{2}$/).bail().custom(value =>
    !value.startsWith('0000-') && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  ).withMessage('Use a valid calendar date'),
];
const accountSelect = `
  SELECT a.*, b.balance, TO_CHAR(b.balance_as_of, 'YYYY-MM-DD') AS balance_as_of,
    b.recorded_at AS balance_recorded_at
  FROM financial_accounts a
  LEFT JOIN LATERAL (
    SELECT balance, balance_as_of, recorded_at FROM financial_account_balances
    WHERE account_id = a.id ORDER BY balance_as_of DESC, id DESC LIMIT 1
  ) b ON TRUE`;

router.use(authenticate);

router.get('/', [query('include_archived').optional().isString().bail().isIn(['true', 'false'])], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `${accountSelect} WHERE a.user_id = $1 ${req.query.include_archived === 'true' ? '' : 'AND NOT a.is_archived'}
       ORDER BY a.currency, a.name, a.id`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get financial accounts error:', error);
    res.status(500).json({ error: 'Failed to load financial accounts' });
  }
});

router.get('/:id', [param('id').isUUID()], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`${accountSelect} WHERE a.id = $1 AND a.user_id = $2`, [req.params.id, req.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Account not found' });
    const history = await pool.query(
      `SELECT b.id, b.balance, TO_CHAR(b.balance_as_of, 'YYYY-MM-DD') AS balance_as_of, b.recorded_at
       FROM financial_account_balances b JOIN financial_accounts a ON a.id = b.account_id
       WHERE a.id = $1 AND a.user_id = $2 ORDER BY b.balance_as_of DESC, b.id DESC`,
      [req.params.id, req.userId]
    );
    res.json({ account: result.rows[0], balance_history: history.rows });
  } catch (error) {
    console.error('Get financial account detail error:', error);
    res.status(500).json({ error: 'Failed to load account history' });
  }
});

router.post('/', [
  fields([...metadataFields, 'currency', 'balance', 'balance_as_of']),
  ...metadata(), body('currency').isString().bail().isIn(currencies).withMessage('Choose a supported currency'), ...balanceFields(),
], validate, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    // One statement makes the account and initial balance atomic.
    const result = await pool.query(
      `WITH new_account AS (
         INSERT INTO financial_accounts (user_id, name, account_type, currency, institution_name, account_suffix, is_stale)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
       ), initial_balance AS (
         INSERT INTO financial_account_balances (account_id, balance, balance_as_of)
         SELECT id, $8::numeric, $9::date FROM new_account RETURNING *
       )
       SELECT a.*, b.balance, TO_CHAR(b.balance_as_of, 'YYYY-MM-DD') AS balance_as_of,
         b.recorded_at AS balance_recorded_at FROM new_account a JOIN initial_balance b ON b.account_id = a.id`,
      [req.userId, data.name, data.account_type, data.currency, data.institution_name ?? null,
        data.account_suffix ?? null, data.is_stale ?? false, data.balance, data.balance_as_of]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create financial account error:', error);
    res.status(500).json({ error: 'Failed to create account and initial balance' });
  }
});

router.put('/:id', [
  param('id').isUUID(), fields(metadataFields), ...metadata(),
], validate, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const result = await pool.query(
      `UPDATE financial_accounts SET name = $3, account_type = $4, institution_name = $5,
         account_suffix = $6, is_stale = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND NOT is_archived RETURNING *`,
      [req.params.id, req.userId, data.name, data.account_type, data.institution_name ?? null,
        data.account_suffix ?? null, data.is_stale ?? false]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Active account not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update financial account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

router.patch('/:id', [
  param('id').isUUID(), fields(['is_archived']), body('is_archived').custom(value => typeof value === 'boolean'),
], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'UPDATE financial_accounts SET is_archived = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId, req.body.is_archived]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Account not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Archive financial account error:', error);
    res.status(500).json({ error: 'Failed to change account status' });
  }
});

router.post('/:id/balances', [
  param('id').isUUID(), fields(['balance', 'balance_as_of']), ...balanceFields(),
], validate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO financial_account_balances (account_id, balance, balance_as_of)
       SELECT id, $3::numeric, $4::date FROM financial_accounts
       WHERE id = $1 AND user_id = $2 AND NOT is_archived
       RETURNING id, balance, TO_CHAR(balance_as_of, 'YYYY-MM-DD') AS balance_as_of, recorded_at`,
      [req.params.id, req.userId, req.body.balance, req.body.balance_as_of]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Active account not found' });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Record account balance error:', error);
    res.status(500).json({ error: 'Failed to record account balance' });
  }
});

export default router;
