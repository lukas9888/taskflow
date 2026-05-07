-- TaskFlow migrations
-- 009_rls.sql
--
-- Row Level Security for tasks, task_dependencies, and user_categories.
BEGIN;

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_isolation_policy ON tasks
  USING (user_id = current_setting('app.current_user_id', true)::int);

-- task_dependencies (scoped via task ownership)
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY deps_isolation_policy ON task_dependencies
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE user_id = current_setting('app.current_user_id', true)::int
    )
  );

-- user_categories
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_categories_isolation_policy ON user_categories
  USING (user_id = current_setting('app.current_user_id', true)::int);

COMMIT;