-- Technical Growth Module Migration
-- Combines: Deep Technical Practice, Engineering Documentation, Engineering Wins
-- Three sections: Practice, Documentation, Wins

-- Practice Sessions table (DSA, System Design, etc.)
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_type VARCHAR(50) NOT NULL CHECK (practice_type IN ('dsa', 'system_design', 'coding_challenge', 'algorithm', 'data_structure', 'other')),
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
    time_spent_minutes INTEGER,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    resources TEXT[], -- Links to LeetCode, notes, repos, etc.
    problem_url TEXT,
    solution_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Engineering Documentation table (Architecture notes, ADRs, Design decisions, etc.)
CREATE TABLE IF NOT EXISTS engineering_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('architecture_note', 'adr', 'design_decision', 'learning_summary', 'code_snippet', 'markdown_doc', 'other')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_format VARCHAR(20) DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'plain_text', 'code')),
    category VARCHAR(100), -- e.g., "Backend", "Frontend", "Infrastructure"
    tags TEXT[],
    related_resources TEXT[], -- Links to related docs, repos, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Engineering Wins table (Weekly wins, problems solved, impact, lessons)
CREATE TABLE IF NOT EXISTS engineering_wins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    win_type VARCHAR(50) DEFAULT 'general' CHECK (win_type IN ('problem_solved', 'feature_shipped', 'bug_fixed', 'performance_improvement', 'code_quality', 'learning', 'other')),
    description TEXT NOT NULL,
    impact TEXT, -- Description of impact
    problem_solved TEXT, -- What problem was solved
    lessons_learned TEXT,
    confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
    win_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[],
    related_practice_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
    related_doc_id UUID REFERENCES engineering_docs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_type ON practice_sessions(practice_type);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_date ON practice_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_difficulty ON practice_sessions(difficulty);

CREATE INDEX IF NOT EXISTS idx_engineering_docs_user_id ON engineering_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_engineering_docs_type ON engineering_docs(doc_type);
CREATE INDEX IF NOT EXISTS idx_engineering_docs_category ON engineering_docs(category);

CREATE INDEX IF NOT EXISTS idx_engineering_wins_user_id ON engineering_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_engineering_wins_type ON engineering_wins(win_type);
CREATE INDEX IF NOT EXISTS idx_engineering_wins_date ON engineering_wins(win_date);

-- Triggers for updated_at
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engineering_docs_updated_at BEFORE UPDATE ON engineering_docs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engineering_wins_updated_at BEFORE UPDATE ON engineering_wins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE practice_sessions IS 'DSA, system design, and technical practice sessions';
COMMENT ON TABLE engineering_docs IS 'Architecture notes, ADRs, design decisions, learning summaries, code snippets';
COMMENT ON TABLE engineering_wins IS 'Engineering wins, problems solved, impact, lessons learned';
