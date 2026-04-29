-- TaskFlow migrations
-- 004_task_dependencies.sql
--
-- Task dependencies (directed edges between tasks).

BEGIN;

CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id INT NOT NULL,
    depends_on INT NOT NULL,
    CONSTRAINT task_dependencies_pkey PRIMARY KEY (task_id, depends_on),
    CONSTRAINT task_dependencies_no_self_dependency CHECK (task_id <> depends_on),
    CONSTRAINT task_dependencies_task_id_fkey
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_dependencies_depends_on_fkey
        FOREIGN KEY (depends_on) REFERENCES tasks(id) ON DELETE CASCADE
);

COMMIT;

