-- TaskFlow: minimal schema for CBS Applied Programming POC.
-- Create database in pgAdmin or: CREATE DATABASE taskflow;
-- Then run this script against that database.

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sample data (exam guide: at least 10 test records — included here)
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
    ('Zip source without node_modules');
