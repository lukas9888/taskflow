-- TaskFlow seed data
--
-- Dev/demo data. Safe to re-run: it clears the table first.

BEGIN;

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

INSERT INTO tasks (title) VALUES
    ('Set up PostgreSQL'),
    ('Run the API and Swagger'),
    ('Connect Angular to backend'),
    ('Write project report draft'),
    ('Design second entity and FK'),
    ('Add PUT and DELETE endpoints'),
    ('Add form validation messages'),
    ('Test CRUD in Swagger'),
    ('Prepare oral exam demo'),
    ('Zip source without node_modules'),
    ('Write project report draft');

COMMIT;

