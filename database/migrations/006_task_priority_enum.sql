-- Replace VARCHAR + CHECK with a native PostgreSQL enum for `priority`.
--
-- Why ENUM here: the label set is stable, matches API/UI, and the column stores only those
-- values. CHECK+VARCHAR is fine too; ENUM adds a single DB-level type and clearer catalogs.
-- Adding a new priority later: ALTER TYPE task_priority ADD VALUE 'urgent' (before/after);
-- re-check app + migrations that expect the old set.
--
-- Npgsql + C#: the app still maps priority as string; SQL casts to text on read (see TaskRepository).

BEGIN;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

DO $$
BEGIN
  CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;

ALTER TABLE tasks
  ALTER COLUMN priority DROP DEFAULT,
  ALTER COLUMN priority TYPE task_priority
    USING (
      CASE TRIM(priority)
        WHEN 'high' THEN 'high'::task_priority
        WHEN 'low' THEN 'low'::task_priority
        ELSE 'medium'::task_priority
      END
    ),
  ALTER COLUMN priority SET DEFAULT 'medium'::task_priority;

COMMIT;
