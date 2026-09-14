BEGIN;

CREATE TABLE dictation_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    user_id TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT dictation_types_id_user_unique
        UNIQUE (id, user_id)
);

CREATE UNIQUE INDEX dictation_types_user_name_unique
ON dictation_types (user_id, LOWER(name));

ALTER TABLE user_settings
ADD COLUMN dictation_types_initialized BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE dictations
ADD COLUMN dictation_type_id INTEGER;

ALTER TABLE categories
ADD COLUMN dictation_type_id INTEGER;

ALTER TABLE dictations
ADD CONSTRAINT dictations_dictation_type_user_fkey
FOREIGN KEY (dictation_type_id, user_id)
REFERENCES dictation_types(id, user_id)
ON DELETE RESTRICT;

ALTER TABLE categories
ADD CONSTRAINT categories_dictation_type_user_fkey
FOREIGN KEY (dictation_type_id, user_id)
REFERENCES dictation_types(id, user_id)
ON DELETE RESTRICT;

WITH existing_users AS (
    SELECT user_id FROM user_settings

    UNION

    SELECT user_id FROM dictations

    UNION

    SELECT user_id FROM categories
)
INSERT INTO dictation_types (
    name,
    user_id,
    is_default
)
SELECT
    default_type.name,
    existing_users.user_id,
    TRUE
FROM existing_users
CROSS JOIN (
    VALUES
        ('Ritmico'),
        ('Melodico'),
        ('Armonico')
) AS default_type(name);

UPDATE dictations
SET dictation_type_id = dictation_types.id
FROM dictation_types
WHERE dictations.user_id = dictation_types.user_id
AND dictation_types.name = CASE dictations.type
    WHEN 'rhythmic' THEN 'Ritmico'
    WHEN 'melodic' THEN 'Melodico'
    WHEN 'harmonic' THEN 'Armonico'
END;

UPDATE categories
SET dictation_type_id = dictation_types.id
FROM dictation_types
WHERE categories.user_id = dictation_types.user_id
AND dictation_types.name = CASE categories.type
    WHEN 'rhythmic' THEN 'Ritmico'
    WHEN 'melodic' THEN 'Melodico'
    WHEN 'harmonic' THEN 'Armonico'
END;

UPDATE user_settings
SET dictation_types_initialized = TRUE;

COMMIT;
