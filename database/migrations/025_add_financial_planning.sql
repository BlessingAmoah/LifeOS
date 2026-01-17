-- Financial Planning Module Migration
-- Creates table for financial planning: retirement, major purchases, education, etc.

-- Financial Plans table
CREATE TABLE IF NOT EXISTS financial_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('retirement', 'education', 'major_purchase', 'emergency_fund', 'debt_payoff', 'investment', 'other')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE,
    monthly_contribution DECIMAL(12, 2),
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_financial_plans_user_id ON financial_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_plans_type ON financial_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_financial_plans_status ON financial_plans(status);
CREATE INDEX IF NOT EXISTS idx_financial_plans_target_date ON financial_plans(target_date);

-- Trigger for updated_at
CREATE TRIGGER update_financial_plans_updated_at BEFORE UPDATE ON financial_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE financial_plans IS 'Long-term financial planning: retirement, education, major purchases, etc.';
