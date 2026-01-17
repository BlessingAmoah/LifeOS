-- Migration: Add review enhancements
-- Add fields for templates, goal progress, and habit analysis

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS template_used VARCHAR(50),
ADD COLUMN IF NOT EXISTS goal_progress JSONB,
ADD COLUMN IF NOT EXISTS habit_analysis JSONB;

-- Add comment
COMMENT ON COLUMN reviews.template_used IS 'Template name used for this review';
COMMENT ON COLUMN reviews.goal_progress IS 'JSON object tracking goal progress';
COMMENT ON COLUMN reviews.habit_analysis IS 'JSON object with habit performance analysis';
