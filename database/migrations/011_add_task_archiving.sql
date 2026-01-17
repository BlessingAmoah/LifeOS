-- Migration: Add archiving support for tasks

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_month VARCHAR(7); -- Format: YYYY-MM

CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(user_id, archived_at, archived_month);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_month ON tasks(user_id, archived_month) WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN tasks.archived_at IS 'Timestamp when task was archived';
COMMENT ON COLUMN tasks.archived_month IS 'Month folder for archived task (YYYY-MM format)';
