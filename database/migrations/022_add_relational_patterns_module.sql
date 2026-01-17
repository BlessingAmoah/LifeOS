-- Relational Patterns Module Migration
-- Lightweight, reflective feature for understanding relationship patterns over time

-- Relationship Journal table
CREATE TABLE IF NOT EXISTS relationship_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    relationship_type VARCHAR(50), -- e.g., "family", "partner", "friend", "work", "other"
    emotion_tag VARCHAR(50), -- Optional emotion tag
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conflict Reflections table
CREATE TABLE IF NOT EXISTS conflict_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conflict_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trigger TEXT NOT NULL, -- What triggered the conflict
    my_response TEXT NOT NULL, -- How I responded
    their_response TEXT, -- How they responded (optional)
    outcome TEXT, -- What happened
    what_i_would_do_differently TEXT,
    relationship_type VARCHAR(50), -- e.g., "family", "partner", "friend", "work"
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communication Patterns table
CREATE TABLE IF NOT EXISTS communication_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('listening', 'avoidance', 'defensiveness', 'assertiveness', 'over_explaining', 'other')),
    notes TEXT, -- Additional context
    relationship_type VARCHAR(50), -- e.g., "family", "partner", "friend", "work"
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Boundaries Notes table
CREATE TABLE IF NOT EXISTS boundaries_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boundary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    boundary_type VARCHAR(50) NOT NULL CHECK (boundary_type IN ('set', 'violated', 'held', 'compromised')),
    description TEXT NOT NULL,
    with_whom VARCHAR(100), -- Optional, anonymized label (e.g., "colleague", "family member")
    result TEXT, -- What happened
    emotional_impact TEXT, -- How it felt
    relationship_type VARCHAR(50), -- e.g., "family", "partner", "friend", "work"
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lessons Learned table (can be auto-linked from journals or conflicts)
CREATE TABLE IF NOT EXISTS relational_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson TEXT NOT NULL, -- Short reflective takeaway
    learned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_type VARCHAR(50), -- e.g., "journal", "conflict", "boundary", "pattern"
    source_id UUID, -- Optional link to source entry
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_relationship_journal_user_id ON relationship_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_journal_date ON relationship_journal(entry_date);
CREATE INDEX IF NOT EXISTS idx_relationship_journal_type ON relationship_journal(relationship_type);

CREATE INDEX IF NOT EXISTS idx_conflict_reflections_user_id ON conflict_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_conflict_reflections_date ON conflict_reflections(conflict_date);
CREATE INDEX IF NOT EXISTS idx_conflict_reflections_type ON conflict_reflections(relationship_type);

CREATE INDEX IF NOT EXISTS idx_communication_patterns_user_id ON communication_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_patterns_date ON communication_patterns(pattern_date);
CREATE INDEX IF NOT EXISTS idx_communication_patterns_type ON communication_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_boundaries_notes_user_id ON boundaries_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_boundaries_notes_date ON boundaries_notes(boundary_date);
CREATE INDEX IF NOT EXISTS idx_boundaries_notes_type ON boundaries_notes(boundary_type);

CREATE INDEX IF NOT EXISTS idx_relational_lessons_user_id ON relational_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_relational_lessons_date ON relational_lessons(learned_date);

-- Triggers for updated_at
CREATE TRIGGER update_relationship_journal_updated_at BEFORE UPDATE ON relationship_journal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflict_reflections_updated_at BEFORE UPDATE ON conflict_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_patterns_updated_at BEFORE UPDATE ON communication_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boundaries_notes_updated_at BEFORE UPDATE ON boundaries_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relational_lessons_updated_at BEFORE UPDATE ON relational_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE relationship_journal IS 'Free-form relationship journal entries';
COMMENT ON TABLE conflict_reflections IS 'Reflections on conflicts and how they were handled';
COMMENT ON TABLE communication_patterns IS 'Communication patterns observed in relationships';
COMMENT ON TABLE boundaries_notes IS 'Boundaries set, violated, held, or compromised';
COMMENT ON TABLE relational_lessons IS 'Lessons learned from relational experiences';
