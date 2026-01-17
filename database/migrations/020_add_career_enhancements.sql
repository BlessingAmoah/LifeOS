-- Career Module Enhancements
-- Adds: career_profile (theme/focus), impact_notes (evidence), applications (job application tracker)

-- Career Profile table (one per user, stores current theme/focus)
CREATE TABLE IF NOT EXISTS career_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_theme VARCHAR(255), -- e.g., "Interview readiness", "Leadership growth"
    current_focus TEXT, -- Description of current career focus/season
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Impact Notes table (evidence of achievements, projects, metrics)
CREATE TABLE IF NOT EXISTS impact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact_type VARCHAR(50) DEFAULT 'project' CHECK (impact_type IN ('project', 'metric', 'problem_solved', 'achievement', 'recognition', 'other')),
    metrics TEXT, -- e.g., "-30% bugs", "5 interviews completed"
    date_achieved DATE NOT NULL DEFAULT CURRENT_DATE,
    skills_demonstrated TEXT[], -- Skills shown in this impact
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applications table (job application tracker)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    stage VARCHAR(50) DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'final', 'offer', 'rejected', 'withdrawn')),
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    job_url TEXT,
    notes TEXT,
    salary_range VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_profile_user_id ON career_profile(user_id);

CREATE INDEX IF NOT EXISTS idx_impact_notes_user_id ON impact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_notes_type ON impact_notes(impact_type);
CREATE INDEX IF NOT EXISTS idx_impact_notes_date ON impact_notes(date_achieved);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);

-- Triggers for updated_at
CREATE TRIGGER update_career_profile_updated_at BEFORE UPDATE ON career_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impact_notes_updated_at BEFORE UPDATE ON impact_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE career_profile IS 'User career profile with current theme/focus';
COMMENT ON TABLE impact_notes IS 'Evidence of achievements, projects, metrics for resume and interviews';
COMMENT ON TABLE applications IS 'Job application tracker';
