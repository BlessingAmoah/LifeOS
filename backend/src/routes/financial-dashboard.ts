import express from 'express';
import { query, validationResult } from 'express-validator';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Get financial dashboard data
router.get(
  '/',
  authenticate,
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000, max: 2100 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1;
      const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();

      // Calculate date range for the month
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0)).toISOString().split('T')[0];

      // Get income and expenses for the month
      const transactionsResult = await pool.query(
        `SELECT 
          type,
          COALESCE(SUM(amount), 0) as total,
          COUNT(*) as count
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= $2
          AND transaction_date <= $3
        GROUP BY type`,
        [req.userId, startDate, endDate]
      );

      const income = transactionsResult.rows.find((r: any) => r.type === 'income') || { total: '0', count: '0' };
      const expense = transactionsResult.rows.find((r: any) => r.type === 'expense') || { total: '0', count: '0' };
      const netCashFlow = parseFloat(income.total) - parseFloat(expense.total);
      const cashFlowSurplus = Math.max(netCashFlow, 0);

      // Get active budgets with spending
      const budgetsResult = await pool.query(
        `SELECT 
          b.*,
          COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        LEFT JOIN transactions t ON t.user_id = b.user_id 
          AND t.type = 'expense'
          AND t.category = b.category
          AND t.transaction_date >= $2
          AND t.transaction_date <= $3
        WHERE b.user_id = $1
          AND (b.end_date IS NULL OR b.end_date >= $2)
          AND b.start_date <= $3
        GROUP BY b.id
        ORDER BY b.start_date DESC`,
        [req.userId, startDate, endDate]
      );

      const budgets = budgetsResult.rows.map((row: any) => ({
        ...row,
        spent: parseFloat(row.spent),
        remaining: parseFloat(row.budget_amount) - parseFloat(row.spent),
        percentage_used: (parseFloat(row.spent) / parseFloat(row.budget_amount)) * 100,
      }));

      // Get savings goals (including emergency fund)
      const goalsResult = await pool.query(
        'SELECT * FROM savings_goals WHERE user_id = $1 AND status = $2 ORDER BY is_emergency_fund DESC, created_at DESC',
        [req.userId, 'active']
      );

      const goals = goalsResult.rows.map((row: any) => ({
        ...row,
        progress: (parseFloat(row.current_amount) / parseFloat(row.target_amount)) * 100,
      }));

      // Get recent transactions (last 10)
      const recentTransactionsResult = await pool.query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 
         ORDER BY transaction_date DESC, created_at DESC 
         LIMIT 10`,
        [req.userId]
      );

      // Get latest financial reflection (if exists - can be from reviews table with category 'financial')
      // For now, we'll return null and can add this later if reviews table has financial category

      // Calculate financial health indicators
      const incomeAmount = parseFloat(income.total);
      const expenseAmount = parseFloat(expense.total);
      const surplusRate = incomeAmount > 0 ? (cashFlowSurplus / incomeAmount) * 100 : 0;
      const expenseToIncomeRatio = incomeAmount > 0 ? (expenseAmount / incomeAmount) * 100 : 0;

      // Budget adherence (percentage of budgets not exceeded)
      const budgetsNotExceeded = budgets.filter((b: any) => b.percentage_used <= 100).length;
      const budgetAdherence = budgets.length > 0 ? (budgetsNotExceeded / budgets.length) * 100 : 100;

      res.json({
        period: {
          month: targetMonth,
          year: targetYear,
          start_date: startDate,
          end_date: endDate,
        },
        overview: {
          income: incomeAmount,
          expenses: expenseAmount,
          // Legacy API name: this is positive cash flow, not a savings balance.
          savings: cashFlowSurplus,
          net_cash_flow: netCashFlow,
          income_count: parseInt(income.count, 10),
          expense_count: parseInt(expense.count, 10),
        },
        budgets: budgets,
        savings_goals: goals,
        recent_transactions: recentTransactionsResult.rows,
        health_indicators: {
          savings_rate: surplusRate,
          expense_to_income_ratio: expenseToIncomeRatio,
          budget_adherence: budgetAdherence,
        },
      });
    } catch (error: any) {
      console.error('Get financial dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch financial dashboard' });
    }
  }
);

// Get cash flow view
router.get(
  '/cash-flow',
  authenticate,
  [
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as month,
          type,
          COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = $1
      `;
      const params: any[] = [req.userId];
      let paramIndex = 2;

      if (start_date) {
        query += ` AND transaction_date >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND transaction_date <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ` GROUP BY month, type ORDER BY month DESC`;

      const result = await pool.query(query, params);

      // Group by month
      const cashFlowByMonth: any = {};
      result.rows.forEach((row: any) => {
        const month = row.month;
        if (!cashFlowByMonth[month]) {
          cashFlowByMonth[month] = { month, income: 0, expenses: 0, net: 0 };
        }
        if (row.type === 'income') {
          cashFlowByMonth[month].income = parseFloat(row.total);
        } else {
          cashFlowByMonth[month].expenses = parseFloat(row.total);
        }
        cashFlowByMonth[month].net = cashFlowByMonth[month].income - cashFlowByMonth[month].expenses;
      });

      res.json(Object.values(cashFlowByMonth));
    } catch (error: any) {
      console.error('Get cash flow error:', error);
      res.status(500).json({ error: 'Failed to fetch cash flow' });
    }
  }
);

export default router;
