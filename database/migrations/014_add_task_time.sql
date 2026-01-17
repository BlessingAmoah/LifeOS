-- Add time field to tasks for scheduling
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_time TIME;

CREATE INDEX IF NOT EXISTS idx_tasks_time ON tasks(user_id, due_date, task_time) WHERE task_time IS NOT NULL;

COMMENT ON COLUMN tasks.task_time IS 'Specific time for the task (HH:MM format)';
