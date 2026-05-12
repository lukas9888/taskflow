BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS user_id INT;

INSERT INTO users (username, email, password_hash)
VALUES ('demo', 'demo@taskflow.local', crypt('demo1234', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

UPDATE tasks
SET user_id = (SELECT id FROM users WHERE username = 'demo')
WHERE user_id IS NULL;

ALTER TABLE tasks
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE tasks
    ADD CONSTRAINT tasks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

COMMIT;

