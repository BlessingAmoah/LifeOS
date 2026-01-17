-- Migration: Add health goals table

CREATE TABLE IF NOT EXISTS health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value NUMERIC(10,2),
  current_value NUMERIC(10,2) DEFAULT 0,
  unit VARCHAR(50), -- e.g., 'hours', 'days', 'lbs', 'workouts'
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, paused
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_goals_user ON health_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_health_goals_date ON health_goals(user_id, target_date);

-- Add trigger for updated_at
CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
