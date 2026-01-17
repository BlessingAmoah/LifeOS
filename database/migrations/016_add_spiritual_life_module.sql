-- Spiritual Life Module Migration
-- Creates tables for spiritual tracking: spiritual_goals, prayer_logs, scriptures, reflection_prompts

-- Spiritual Goals table
CREATE TABLE IF NOT EXISTS spiritual_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
    target_value INTEGER,
    current_value INTEGER DEFAULT 0,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prayer/Meditation Logs table
CREATE TABLE IF NOT EXISTS prayer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('prayer', 'meditation', 'worship', 'devotion')),
    duration_minutes INTEGER,
    notes TEXT,
    scripture_reference VARCHAR(200),
    logged_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, logged_on, type)
);

-- Scriptures/Affirmations table
CREATE TABLE IF NOT EXISTS scriptures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('scripture', 'affirmation', 'quote', 'prayer')),
    title VARCHAR(255),
    content TEXT NOT NULL,
    reference VARCHAR(200),
    category VARCHAR(100),
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reflection Prompts table (predefined and user-created)
CREATE TABLE IF NOT EXISTS reflection_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system prompts
    prompt_text TEXT NOT NULL,
    category VARCHAR(100),
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily/Weekly Reflections table
CREATE TABLE IF NOT EXISTS spiritual_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_type VARCHAR(20) NOT NULL CHECK (reflection_type IN ('daily', 'weekly')),
    prompt_id UUID REFERENCES reflection_prompts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    scripture_id UUID REFERENCES scriptures(id) ON DELETE SET NULL,
    reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, reflection_date, reflection_type)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spiritual_goals_user_id ON spiritual_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_goals_status ON spiritual_goals(status);
CREATE INDEX IF NOT EXISTS idx_spiritual_goals_type ON spiritual_goals(goal_type);

CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_id ON prayer_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_date ON prayer_logs(logged_on);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_type ON prayer_logs(type);

CREATE INDEX IF NOT EXISTS idx_scriptures_user_id ON scriptures(user_id);
CREATE INDEX IF NOT EXISTS idx_scriptures_type ON scriptures(type);
CREATE INDEX IF NOT EXISTS idx_scriptures_favorite ON scriptures(user_id, is_favorite);

CREATE INDEX IF NOT EXISTS idx_reflection_prompts_user_id ON reflection_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_prompts_category ON reflection_prompts(category);

CREATE INDEX IF NOT EXISTS idx_spiritual_reflections_user_id ON spiritual_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_reflections_date ON spiritual_reflections(reflection_date);
CREATE INDEX IF NOT EXISTS idx_spiritual_reflections_type ON spiritual_reflections(reflection_type);

-- Triggers for updated_at
CREATE TRIGGER update_spiritual_goals_updated_at BEFORE UPDATE ON spiritual_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_logs_updated_at BEFORE UPDATE ON prayer_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scriptures_updated_at BEFORE UPDATE ON scriptures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflection_prompts_updated_at BEFORE UPDATE ON reflection_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spiritual_reflections_updated_at BEFORE UPDATE ON spiritual_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE spiritual_goals IS 'Spiritual goals with target values and dates';
COMMENT ON TABLE prayer_logs IS 'Prayer and meditation logs with duration and notes';
COMMENT ON TABLE scriptures IS 'Scriptures, affirmations, quotes, and prayers storage';
COMMENT ON TABLE reflection_prompts IS 'Reflection prompts (system and user-created)';
COMMENT ON TABLE spiritual_reflections IS 'Daily and weekly spiritual reflections';
