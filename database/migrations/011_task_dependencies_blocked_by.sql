BEGIN;

ALTER TABLE task_dependencies
  RENAME COLUMN depends_on TO blocked_by;

ALTER TABLE task_dependencies
  RENAME CONSTRAINT task_dependencies_depends_on_fkey TO task_dependencies_blocked_by_fkey;

ALTER TABLE task_dependencies
  RENAME CONSTRAINT task_dependencies_no_self_dependency TO task_dependencies_no_self_blocked_by;

CREATE UNIQUE INDEX IF NOT EXISTS task_dependencies_pair_unique
ON task_dependencies (
  LEAST(task_id, blocked_by),
  GREATEST(task_id, blocked_by)
);

COMMIT;
