-- Migration: Add status field to habit_logs for tracking completion status

ALTER TABLE habit_logs
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Update existing records to have 'completed' status
UPDATE habit_logs SET status = 'completed' WHERE status IS NULL;

-- Add constraint for valid status values
ALTER TABLE habit_logs
ADD CONSTRAINT check_habit_status CHECK (status IN ('completed', 'not_completed', 'partial', 'not_today'));

CREATE INDEX IF NOT EXISTS idx_habit_logs_status ON habit_logs(habit_id, completed_on, status);

COMMENT ON COLUMN habit_logs.status IS 'Status: completed (Yes), not_completed (No), partial (Partially complete), not_today (Not today''s task)';
