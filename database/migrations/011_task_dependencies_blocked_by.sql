-- Rename task dependency depends_on column to blocked_by
-- and prevent mutual dependencies (A<->B) via unordered-pair uniqueness.

BEGIN;

-- Rename column
ALTER TABLE task_dependencies
  RENAME COLUMN depends_on TO blocked_by;

-- Update constraints to new column name
ALTER TABLE task_dependencies
  RENAME CONSTRAINT task_dependencies_depends_on_fkey TO task_dependencies_blocked_by_fkey;

ALTER TABLE task_dependencies
  RENAME CONSTRAINT task_dependencies_no_self_dependency TO task_dependencies_no_self_blocked_by;

-- Prevent both (A blocks B) and (B blocks A) existing at the same time by creating a unique index based on the two ids.
CREATE UNIQUE INDEX IF NOT EXISTS task_dependencies_pair_unique
ON task_dependencies (
  LEAST(task_id, blocked_by),
  GREATEST(task_id, blocked_by)
);

COMMIT;