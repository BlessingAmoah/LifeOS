-- Career Module Migration
-- Creates tables for career tracking: career_goals, skills, roles, feedback_notes, resume_versions, interview_prep, milestones

-- Career Goals table
CREATE TABLE IF NOT EXISTS career_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(100), -- e.g., "Promotion", "Skill Development", "Role Change"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Skills table (skills roadmap)
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- e.g., "Technical", "Soft Skills", "Leadership"
    proficiency_level VARCHAR(50) DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    target_level VARCHAR(50) CHECK (target_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    notes TEXT,
    resources TEXT[], -- Links to courses, books, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (current, next, dream)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('current', 'next', 'dream')),
    description TEXT,
    requirements TEXT[], -- List of requirements/skills needed
    salary_range VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50), -- e.g., "applying", "interviewing", "offered", "accepted"
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Notes table
CREATE TABLE IF NOT EXISTS feedback_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL, -- e.g., "Manager", "Peer", "Self-reflection"
    feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'performance', 'strength', 'improvement', 'career')),
    content TEXT NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action_items TEXT[], -- List of action items from feedback
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume Versions table
CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT, -- URL to resume file in Azure Blob Storage
    target_role VARCHAR(255), -- Role this resume is tailored for
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    is_current BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview Prep table
CREATE TABLE IF NOT EXISTS interview_prep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    interview_date DATE,
    interview_type VARCHAR(50) CHECK (interview_type IN ('phone', 'video', 'onsite', 'technical', 'behavioral', 'panel', 'final')),
    stage VARCHAR(50), -- e.g., "initial", "technical", "final"
    preparation_notes TEXT,
    questions_prepared TEXT[], -- List of questions to ask
    answers_prepared TEXT[], -- List of answers prepared
    feedback TEXT, -- Post-interview feedback
    outcome VARCHAR(50) CHECK (outcome IN ('pending', 'passed', 'failed', 'withdrawn', 'offer')),
    follow_up_actions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Career Milestones table (promotion/growth milestones)
CREATE TABLE IF NOT EXISTS career_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('promotion', 'role_change', 'skill_achievement', 'certification', 'project_completion', 'recognition', 'other')),
    achieved_date DATE NOT NULL,
    description TEXT,
    impact TEXT, -- Description of impact/achievement
    skills_gained TEXT[],
    recognition TEXT, -- Awards, acknowledgments, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON career_goals(status);
CREATE INDEX IF NOT EXISTS idx_career_goals_category ON career_goals(category);

CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_proficiency ON skills(proficiency_level);

CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id);
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(role_type);
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);

CREATE INDEX IF NOT EXISTS idx_feedback_notes_user_id ON feedback_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notes_type ON feedback_notes(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_notes_date ON feedback_notes(received_date);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_is_current ON resume_versions(is_current);

CREATE INDEX IF NOT EXISTS idx_interview_prep_user_id ON interview_prep(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_company ON interview_prep(company);
CREATE INDEX IF NOT EXISTS idx_interview_prep_outcome ON interview_prep(outcome);

CREATE INDEX IF NOT EXISTS idx_career_milestones_user_id ON career_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_career_milestones_type ON career_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_career_milestones_date ON career_milestones(achieved_date);

-- Triggers for updated_at
CREATE TRIGGER update_career_goals_updated_at BEFORE UPDATE ON career_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_notes_updated_at BEFORE UPDATE ON feedback_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON resume_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_prep_updated_at BEFORE UPDATE ON interview_prep
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_milestones_updated_at BEFORE UPDATE ON career_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE career_goals IS 'Career goals with target dates and priorities';
COMMENT ON TABLE skills IS 'Skills roadmap with proficiency levels';
COMMENT ON TABLE roles IS 'Current, next, and dream roles tracking';
COMMENT ON TABLE feedback_notes IS 'Feedback received from various sources';
COMMENT ON TABLE resume_versions IS 'Different versions of resume tailored for different roles';
COMMENT ON TABLE interview_prep IS 'Interview preparation and tracking';
COMMENT ON TABLE career_milestones IS 'Career milestones including promotions, role changes, achievements';
