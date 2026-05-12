-- Non-superuser API role (RLS applies). Run as superuser (e.g. postgres).
-- Username=taskflow_app; password=taskflow_app (local only — change in production).
-- If the role already exists: ALTER ROLE taskflow_app PASSWORD 'taskflow_app';

BEGIN;

DO $body$
BEGIN
  CREATE ROLE taskflow_app LOGIN PASSWORD 'taskflow_app'
    NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$body$;

DO $body$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO taskflow_app', current_database());
END
$body$;

GRANT USAGE ON SCHEMA public TO taskflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO taskflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskflow_app;

ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taskflow_app;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO taskflow_app;

COMMIT;
