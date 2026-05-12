BEGIN;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_isolation_policy ON tasks
  USING (user_id = current_setting('app.current_user_id', true)::int);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY deps_isolation_policy ON task_dependencies
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE user_id = current_setting('app.current_user_id', true)::int
    )
  );

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_categories_isolation_policy ON user_categories
  USING (user_id = current_setting('app.current_user_id', true)::int);

COMMIT;
