-- Note: Using gen_random_uuid() which is built-in to PostgreSQL 13+ (no extension needed)
-- Azure PostgreSQL Flexible Server doesn't allow extensions by default

-- 1. users (Auth & Verification)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(10),
  verification_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- 2. profiles (Identity, Vision)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  identity_statement TEXT,
  vision_short_term TEXT,
  vision_long_term TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. journal_entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  mood VARCHAR(50),
  category VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_journal_user_time 
ON journal_entries(user_id, created_at DESC);

-- 4. habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  frequency VARCHAR(20), -- daily, weekly
  identity_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. habit_logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (habit_id, completed_on)
);

CREATE INDEX idx_habit_logs_date 
ON habit_logs(habit_id, completed_on);

-- 6. tasks (Sprint-style)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'backlog', -- backlog, in_progress, done
  priority INT DEFAULT 3,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_status 
ON tasks(user_id, status);

-- 7. reviews (Weekly / Quarterly)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20), -- weekly, quarterly
  wins TEXT,
  challenges TEXT,
  lessons TEXT,
  next_focus TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_user_time 
ON reviews(user_id, created_at DESC);

-- 8. health_logs
CREATE TABLE health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise TEXT,
  sleep_hours NUMERIC(4,1),
  energy_level INT CHECK (energy_level BETWEEN 1 AND 10),
  notes TEXT,
  logged_on DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, logged_on)
);

-- 9. documents (Azure Blob-backed)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  file_name VARCHAR(255),
  blob_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
