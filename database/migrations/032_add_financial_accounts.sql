CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'cash', 'credit_card', 'investment', 'loan', 'other')),
    currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    institution_name VARCHAR(100),
    account_suffix CHAR(4) CHECK (account_suffix ~ '^[0-9]{4}$'),
    source VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (source = 'manual'),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX financial_accounts_user_idx ON financial_accounts (user_id, is_archived);

CREATE TABLE financial_account_balances (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
    balance NUMERIC(18, 2) NOT NULL,
    balance_as_of DATE NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX financial_account_balances_latest_idx
    ON financial_account_balances (account_id, balance_as_of DESC, id DESC);
