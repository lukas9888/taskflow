-- TaskFlow seed data
--
-- Dev/demo data. Safe to re-run: it clears the table first.

BEGIN;

-- Used only for generating bcrypt hashes in SQL seeds.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Truncate ALL user tables (future-proof as you add more).
-- Excludes schema_migrations so applied migrations remain tracked.
DO $$
DECLARE
  truncate_stmt text;
BEGIN
  SELECT
    'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
    || ' RESTART IDENTITY CASCADE;'
  INTO truncate_stmt
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename <> 'schema_migrations';

  IF truncate_stmt IS NOT NULL THEN
    EXECUTE truncate_stmt;
  END IF;
END $$;

-- Default demo user. Password: demo1234
INSERT INTO users (username, email, password_hash)
VALUES ('demo', 'demo@taskflow.local', crypt('demo1234', gen_salt('bf')));

INSERT INTO tasks (id, user_id, title) VALUES
    (1, (SELECT id FROM users WHERE username = 'demo'), 'Set up PostgreSQL'),
    (2, (SELECT id FROM users WHERE username = 'demo'), 'Set up the API and Swagger'),
    (3, (SELECT id FROM users WHERE username = 'demo'), 'Connect Angular to backend'),
    (4, (SELECT id FROM users WHERE username = 'demo'), 'Write project report draft'),
    (5, (SELECT id FROM users WHERE username = 'demo'), 'Design second entity and FK'),
    (6, (SELECT id FROM users WHERE username = 'demo'), 'Add PUT and DELETE endpoints'),
    (7, (SELECT id FROM users WHERE username = 'demo'), 'Add form validation messages'),
    (8, (SELECT id FROM users WHERE username = 'demo'), 'Test CRUD in Swagger'),
    (9, (SELECT id FROM users WHERE username = 'demo'), 'Prepare oral exam demo'),
    (10, (SELECT id FROM users WHERE username = 'demo'), 'Zip source without node_modules');


INSERT INTO task_dependencies (task_id, depends_on) VALUES
   (3,2),
   (8,2),
   (8,6),
   (5,1), 
   (10,1),
   (10,2),
   (10,3),
   (10,5),
   (10,6),
   (10,7),
   (10,8)
  ON CONFLICT DO NOTHING;

COMMIT;

