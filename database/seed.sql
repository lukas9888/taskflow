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
INSERT INTO users (username, password_hash)
VALUES ('demo', crypt('demo1234', gen_salt('bf')));

-- Demo categories (scoped to the demo user).
INSERT INTO user_categories (user_id, name)
SELECT u.id, c.name
FROM users u
CROSS JOIN (
  VALUES
    ('SCHOOL'),
    ('HOME'),
    ('FINANCE'),
    ('ERRANDS'),
    ('HEALTH'),
    ('SOCIAL'),
    ('WORK')
) AS c(name)
WHERE u.username = 'demo'
ON CONFLICT (user_id, name) DO NOTHING;

-- due_at: nearest 15-minute boundary to "now", then +0 / +1 / +2 calendar days with small slot offsets.
WITH anchor AS (
  SELECT (
    timestamptz 'epoch'
    + round(extract(epoch FROM now()) / 900.0) * 900 * interval '1 second'
  ) AS q
),
seed_tasks(title, category, priority, done, day_off, slot) AS (
  VALUES
    ('Finish essay draft','SCHOOL','high',false,-1,0),
    ('Submit assignment','SCHOOL','high',false,-1,1),
    ('Buy groceries','ERRANDS','medium',false,0,0),
    ('Do laundry','HOME','low',false,0,1),
    ('Pack bag for class','SCHOOL','low',true,0,2),
    ('Reply to group chat','SOCIAL','medium',false,0,3),
    ('Go for a run','HEALTH','medium',false,0,4),
    ('Pay rent','FINANCE','high',true,0,5),
    ('Clean the apartment','HOME','low',false,1,0),
    ('Read lecture slides','SCHOOL','medium',false,1,1),
    ('Prepare for presentation','SCHOOL','high',false,1,2),
    ('Book dentist appointment','HEALTH','medium',false,1,3),
    ('Call parents','SOCIAL','low',false,2,0),
    ('Return library books','ERRANDS','medium',false,2,1),
    ('Cook dinner','HOME','low',true,2,2),
    ('Check exam schedule','SCHOOL','high',true,2,3),
    ('Transfer money to savings','FINANCE','medium',false,3,0),
    ('Pick up prescription','HEALTH','medium',false,3,1),
    ('Confirm shift at work','WORK','high',false,3,2),
    ('Tidy up desk','HOME','low',false,4,0)
)
INSERT INTO tasks (user_id, title, due_at, user_category_id, priority, done)
SELECT
  u.id,
  s.title,
  a.q
    + make_interval(days => s.day_off)
    + make_interval(mins => (s.slot * 15)),
  uc.id,
  CAST(s.priority AS task_priority),
  s.done
FROM seed_tasks s
CROSS JOIN anchor a
JOIN users u ON u.username = 'demo'
JOIN user_categories uc
  ON uc.user_id = u.id
 AND uc.name = s.category;


INSERT INTO task_dependencies (task_id, blocked_by) VALUES
  (5, 6),    -- Submit assignment is blocked until essay draft is finished
  (2, 3),    -- Prepare for presentation is blocked until lecture slides are read
  (10, 9),   -- Do laundry is blocked until apartment is cleaned
  (19, 2),   -- Reply to group chat is blocked until presentation is prepared
  (20, 1),   -- Confirm shift at work is blocked until exam schedule is checked
  (11, 12),  -- Transfer money to savings is blocked until rent is paid
  (15, 16)
ON CONFLICT DO NOTHING;

COMMIT;

