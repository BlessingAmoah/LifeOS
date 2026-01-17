-- Migration: Add sprint features to tasks
-- This adds sprint_id, sprint_name, and retrospective_notes to tasks table

-- Add sprint fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS sprint_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS sprint_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS retrospective_notes TEXT;

-- Create index for sprint queries
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(user_id, sprint_id);

-- Add comment
COMMENT ON COLUMN tasks.sprint_id IS 'Sprint identifier (e.g., "2026-W03" for week 3 of 2026)';
COMMENT ON COLUMN tasks.sprint_name IS 'Human-readable sprint name';
COMMENT ON COLUMN tasks.retrospective_notes IS 'Retrospective notes for this task';
