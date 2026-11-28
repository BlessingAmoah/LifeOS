CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(20) NOT NULL CHECK (policy_type IN ('life', 'health', 'auto', 'home', 'renters', 'disability', 'travel', 'other')),
    insurer_name VARCHAR(100) NOT NULL,
    policy_suffix CHAR(4) CHECK (policy_suffix ~ '^[A-Za-z0-9]{4}$'),
    currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    premium_amount NUMERIC(18, 2) CHECK (premium_amount >= 0),
    premium_frequency VARCHAR(20) CHECK (premium_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'one_time')),
    coverage_amount NUMERIC(18, 2) CHECK (coverage_amount >= 0),
    start_date DATE,
    end_date DATE,
    renewal_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    notes VARCHAR(2000),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((premium_amount IS NULL) = (premium_frequency IS NULL)),
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX insurance_policies_user_idx
    ON insurance_policies (user_id, is_archived, policy_type, status);
