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

-- due_at: nearest 15-minute boundary to "now", then +0 / +1 / +2 calendar days with small slot offsets.
WITH anchor AS (
  SELECT (
    timestamptz 'epoch'
    + round(extract(epoch FROM now()) / 900.0) * 900 * interval '1 second'
  ) AS q
),
seed_tasks(title, day_off, slot) AS (
  VALUES
    ('Set up PostgreSQL', 0, 0),
    ('Set up the API and Swagger', 0, 1),
    ('Connect Angular to backend', 0, 2),
    ('Write project report draft', 0, 3),
    ('Design second entity and FK', 1, 0),
    ('Add PUT and DELETE endpoints', 1, 1),
    ('Add form validation messages', 1, 2),
    ('Test CRUD in Swagger', 2, 0),
    ('Prepare oral exam demo', 2, 1),
    ('Zip source without node_modules', 2, 2)
)
INSERT INTO tasks (user_id, title, due_at)
SELECT
  (SELECT id FROM users WHERE username = 'demo'),
  s.title,
  a.q
    + make_interval(days => s.day_off)
    + make_interval(mins => (s.slot * 15))
FROM seed_tasks s
CROSS JOIN anchor a;


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

