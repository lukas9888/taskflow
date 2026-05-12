BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

INSERT INTO users (username, password_hash)
VALUES ('demo', crypt('demo1234', gen_salt('bf')));

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
  (5, 6),
  (2, 3),
  (10, 9),
  (19, 2),
  (20, 1),
  (11, 12),
  (15, 16)
ON CONFLICT DO NOTHING;

COMMIT;
