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
