BEGIN;

CREATE TABLE IF NOT EXISTS user_categories (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(64) NOT NULL,
    CONSTRAINT user_categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_categories_user_id_name_key
        UNIQUE (user_id, name)
);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS user_category_id INT,
    DROP COLUMN IF EXISTS category;

COMMIT;