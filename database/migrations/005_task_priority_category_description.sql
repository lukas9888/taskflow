-- TaskFlow migrations
-- 005_task_priority_category_description.sql

BEGIN;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('high', 'medium', 'low'));

COMMIT;
