-- Financial Module Enhancements
-- Adds recurring transactions, account buckets, and emergency fund support

-- Add recurring transaction fields to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  ADD COLUMN IF NOT EXISTS account VARCHAR(50) CHECK (account IN ('checking', 'savings', 'credit_card', 'cash', 'other'));

-- Add index for recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(user_id, is_recurring) WHERE is_recurring = TRUE;

-- Add index for account filtering
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(user_id, account);

-- Add emergency fund flag to savings_goals
ALTER TABLE savings_goals
  ADD COLUMN IF NOT EXISTS is_emergency_fund BOOLEAN DEFAULT FALSE;

-- Add index for emergency fund
CREATE INDEX IF NOT EXISTS idx_savings_goals_emergency ON savings_goals(user_id, is_emergency_fund) WHERE is_emergency_fund = TRUE;

-- Comments
COMMENT ON COLUMN transactions.is_recurring IS 'Whether this transaction repeats automatically';
COMMENT ON COLUMN transactions.frequency IS 'Frequency of recurring transaction (daily, weekly, monthly, etc.)';
COMMENT ON COLUMN transactions.account IS 'Account type: checking, savings, credit_card, cash, other';
COMMENT ON COLUMN savings_goals.is_emergency_fund IS 'Whether this is an emergency fund goal';
