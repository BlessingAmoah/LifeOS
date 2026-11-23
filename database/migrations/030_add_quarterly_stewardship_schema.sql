-- Migration: Add Quarterly Stewardship Schema
-- Implements quarterly locking, snapshots, Evidence of Grace, Identity Proofs, and Quarterly Audit Engine
-- This migration enables the "Schema of Grace" - historical integrity and quarterly stewardship

-- =====================================================
-- 1. QUARTERLY SNAPSHOT TABLES (One per pillar)
-- =====================================================

-- Identity Snapshots
CREATE TABLE IF NOT EXISTS identity_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    identity_statement TEXT,
    yearly_manifesto TEXT,
    core_values JSONB,
    principles JSONB,
    strengths JSONB,
    growth_areas JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_identity_snapshots_user_quarter ON identity_snapshots(user_id, year, quarter);
CREATE INDEX idx_identity_snapshots_archived ON identity_snapshots(user_id, is_archived);

-- Employment Snapshots
CREATE TABLE IF NOT EXISTS employment_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    quarterly_okrs JSONB,
    skill_spike TEXT,
    "current_role" TEXT,
    impact_summary TEXT,
    work_altar_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_employment_snapshots_user_quarter ON employment_snapshots(user_id, year, quarter);
CREATE INDEX idx_employment_snapshots_archived ON employment_snapshots(user_id, is_archived);

-- Finance Snapshots
CREATE TABLE IF NOT EXISTS finance_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    net_worth NUMERIC(15,2),
    total_assets NUMERIC(15,2),
    total_liabilities NUMERIC(15,2),
    savings_rate NUMERIC(5,2),
    giving_ratio NUMERIC(5,2),
    investing_ratio NUMERIC(5,2),
    yearly_wealth_goals JSONB,
    quarterly_reflection TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_finance_snapshots_user_quarter ON finance_snapshots(user_id, year, quarter);
CREATE INDEX idx_finance_snapshots_archived ON finance_snapshots(user_id, is_archived);

-- Immigration Snapshots
CREATE TABLE IF NOT EXISTS immigration_snapshots (
    id SERIAL PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    current_status TEXT,
    case_type TEXT,
    next_deadline DATE,
    quarterly_brief TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_immigration_snapshots_user_quarter ON immigration_snapshots(user_id, year, quarter);
CREATE INDEX idx_immigration_snapshots_archived ON immigration_snapshots(user_id, is_archived);

-- Health Snapshots
CREATE TABLE IF NOT EXISTS health_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    avg_energy_level NUMERIC(3,1),
    avg_sleep_hours NUMERIC(4,2),
    avg_stress_level NUMERIC(3,1),
    fitness_benchmarks JSONB,
    capacity_vs_demand_reflection TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_health_snapshots_user_quarter ON health_snapshots(user_id, year, quarter);
CREATE INDEX idx_health_snapshots_archived ON health_snapshots(user_id, is_archived);

-- Christian Life Snapshots
CREATE TABLE IF NOT EXISTS christian_life_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    rule_of_life_upward TEXT,
    rule_of_life_inward TEXT,
    rule_of_life_withward TEXT,
    rule_of_life_outward TEXT,
    scripture_anchors JSONB,
    quarterly_spiritual_audit TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_christian_life_snapshots_user_quarter ON christian_life_snapshots(user_id, year, quarter);
CREATE INDEX idx_christian_life_snapshots_archived ON christian_life_snapshots(user_id, is_archived);

-- Personal Growth Snapshots
CREATE TABLE IF NOT EXISTS personal_growth_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    learning_themes JSONB,
    character_formation_notes TEXT,
    quarterly_growth_audit TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_personal_growth_snapshots_user_quarter ON personal_growth_snapshots(user_id, year, quarter);
CREATE INDEX idx_personal_growth_snapshots_archived ON personal_growth_snapshots(user_id, is_archived);

-- =====================================================
-- 2. EVIDENCE OF GRACE (Cross-pillar testimony archive)
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_of_grace (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pillar VARCHAR(50) NOT NULL CHECK (pillar IN ('identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth')),
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    testimony TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidence_of_grace_user ON evidence_of_grace(user_id);
CREATE INDEX idx_evidence_of_grace_pillar ON evidence_of_grace(pillar);
CREATE INDEX idx_evidence_of_grace_quarter ON evidence_of_grace(year, quarter);

-- =====================================================
-- 3. IDENTITY PROOFS (1 photo per pillar per quarter)
-- =====================================================

CREATE TABLE IF NOT EXISTS identity_proofs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pillar VARCHAR(50) NOT NULL CHECK (pillar IN ('identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth')),
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pillar, quarter, year)
);

CREATE INDEX idx_identity_proofs_user ON identity_proofs(user_id);
CREATE INDEX idx_identity_proofs_pillar ON identity_proofs(pillar);
CREATE INDEX idx_identity_proofs_quarter ON identity_proofs(year, quarter);

-- =====================================================
-- 4. QUARTERLY AUDIT ENGINE
-- =====================================================

CREATE TABLE IF NOT EXISTS quarterly_audits (
    id SERIAL PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pillar VARCHAR(50) NOT NULL CHECK (pillar IN ('identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth')),
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    vision TEXT,
    reality TEXT,
    gap_delta TEXT,
    root_cause TEXT,
    stop_items JSONB,
    start_items JSONB,
    continue_items JSONB,
    next_commitments JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pillar, quarter, year)
);

CREATE INDEX idx_quarterly_audits_user ON quarterly_audits(user_id);
CREATE INDEX idx_quarterly_audits_quarter ON quarterly_audits(year, quarter);
CREATE INDEX idx_quarterly_audits_completed ON quarterly_audits(user_id, completed_at);

-- =====================================================
-- 5. EMPLOYMENT ROADMAP (Mermaid.js diagrams)
-- =====================================================

CREATE TABLE IF NOT EXISTS employment_roadmaps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    mermaid_syntax TEXT NOT NULL,
    skill_spike TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_employment_roadmaps_user ON employment_roadmaps(user_id);
CREATE INDEX idx_employment_roadmaps_current ON employment_roadmaps(user_id, is_current);

-- =====================================================
-- 6. RULE OF LIFE (Christian Life pillar)
-- =====================================================

CREATE TABLE IF NOT EXISTS rule_of_life (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    upward TEXT,
    inward TEXT,
    withward TEXT,
    outward TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quarter, year)
);

CREATE INDEX idx_rule_of_life_user ON rule_of_life(user_id);
CREATE INDEX idx_rule_of_life_current ON rule_of_life(user_id, is_current);

-- =====================================================
-- 7. QUARTERLY LOCK STATUS (Track current quarter)
-- =====================================================

CREATE TABLE IF NOT EXISTS quarterly_lock_status (
    id SERIAL PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_quarter VARCHAR(2) NOT NULL CHECK (current_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    current_year INTEGER NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMP,
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_quarterly_lock_status_user ON quarterly_lock_status(user_id);

-- =====================================================
-- 8. ADD QUARTERLY FIELDS TO EXISTING TABLES
-- =====================================================

-- Add quarterly tracking to profiles (for identity statement)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS quarterly_identity_statement TEXT,
ADD COLUMN IF NOT EXISTS yearly_manifesto TEXT,
ADD COLUMN IF NOT EXISTS current_quarter VARCHAR(2) CHECK (current_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
ADD COLUMN IF NOT EXISTS current_year INTEGER;

-- Add quarterly tracking to career-related tables
ALTER TABLE career_goals
ADD COLUMN IF NOT EXISTS quarter VARCHAR(2) CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
ADD COLUMN IF NOT EXISTS year INTEGER;

ALTER TABLE skills
ADD COLUMN IF NOT EXISTS skill_spike_quarter VARCHAR(2) CHECK (skill_spike_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
ADD COLUMN IF NOT EXISTS skill_spike_year INTEGER;

-- Add impact log table for Employment
CREATE TABLE IF NOT EXISTS impact_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    impact_description TEXT NOT NULL,
    metrics JSONB,
    lessons_learned TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_impact_logs_user ON impact_logs(user_id);
CREATE INDEX idx_impact_logs_quarter ON impact_logs(year, quarter);

-- Add work-altar note to employment snapshots (already in table above)
-- Add intercession & legacy log for Christian Life
CREATE TABLE IF NOT EXISTS intercession_legacy_logs (
    id SERIAL PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('intercession', 'legacy')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_intercession_legacy_logs_user ON intercession_legacy_logs(user_id);
CREATE INDEX idx_intercession_legacy_logs_type ON intercession_legacy_logs(log_type);
CREATE INDEX idx_intercession_legacy_logs_quarter ON intercession_legacy_logs(year, quarter);

-- Add comments for documentation
COMMENT ON TABLE identity_snapshots IS 'Quarterly snapshots of identity pillar - locked when quarter ends';
COMMENT ON TABLE employment_snapshots IS 'Quarterly snapshots of employment pillar - locked when quarter ends';
COMMENT ON TABLE finance_snapshots IS 'Quarterly snapshots of finance pillar - locked when quarter ends';
COMMENT ON TABLE immigration_snapshots IS 'Quarterly snapshots of immigration pillar - locked when quarter ends';
COMMENT ON TABLE health_snapshots IS 'Quarterly snapshots of health pillar - locked when quarter ends';
COMMENT ON TABLE christian_life_snapshots IS 'Quarterly snapshots of christian_life pillar - locked when quarter ends';
COMMENT ON TABLE personal_growth_snapshots IS 'Quarterly snapshots of personal_growth pillar - locked when quarter ends';
COMMENT ON TABLE evidence_of_grace IS 'Cross-pillar testimony archive - moments of divine intervention';
COMMENT ON TABLE identity_proofs IS '1 photo per pillar per quarter - Polaroid-style gallery';
COMMENT ON TABLE quarterly_audits IS 'Quarterly Audit Engine - Vision vs Reality, Gap Analysis, Stop/Start/Continue';
COMMENT ON TABLE employment_roadmaps IS 'Mermaid.js career roadmaps - stored as text, rendered in real-time';
COMMENT ON TABLE rule_of_life IS 'Rule of Life (Upward, Inward, Withward, Outward) - Christian Life pillar';
COMMENT ON TABLE quarterly_lock_status IS 'Tracks current quarter and lock status for each user';
COMMENT ON TABLE impact_logs IS 'Employment impact tracking - auto-generates Yearly Brag Sheet';
COMMENT ON TABLE intercession_legacy_logs IS 'Intercession & Legacy Log - Christian Life pillar';
