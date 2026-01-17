-- Add Investments and Net Worth tracking to Financial Module

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('stock', 'bond', 'mutual_fund', 'etf', 'crypto', 'real_estate', 'other')),
    symbol VARCHAR(50),
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(12, 2) NOT NULL CHECK (purchase_price > 0),
    current_price DECIMAL(12, 2),
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Net Worth Snapshots table
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_assets DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_liabilities DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, snapshot_date)
);

-- Net Worth Assets breakdown (for detailed tracking)
CREATE TABLE IF NOT EXISTS net_worth_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES net_worth_snapshots(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Net Worth Liabilities breakdown
CREATE TABLE IF NOT EXISTS net_worth_liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES net_worth_snapshots(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(type);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);

CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_id ON net_worth_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date ON net_worth_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_net_worth_assets_snapshot_id ON net_worth_assets(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_liabilities_snapshot_id ON net_worth_liabilities(snapshot_id);

-- Triggers for updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_net_worth_snapshots_updated_at BEFORE UPDATE ON net_worth_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE investments IS 'Investment portfolio tracking (stocks, bonds, crypto, etc.)';
COMMENT ON TABLE net_worth_snapshots IS 'Net worth snapshots over time';
COMMENT ON TABLE net_worth_assets IS 'Detailed asset breakdown for net worth snapshots';
COMMENT ON TABLE net_worth_liabilities IS 'Detailed liability breakdown for net worth snapshots';
