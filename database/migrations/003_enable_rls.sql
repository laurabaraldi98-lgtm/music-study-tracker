BEGIN;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_user_policy
ON categories
FOR ALL
USING (
    user_id = current_setting('app.user_id', true)
)
WITH CHECK (
    user_id = current_setting('app.user_id', true)
);

CREATE POLICY collections_user_policy
ON collections
FOR ALL
USING (
    user_id = current_setting('app.user_id', true)
)
WITH CHECK (
    user_id = current_setting('app.user_id', true)
);

CREATE POLICY dictations_user_policy
ON dictations
FOR ALL
USING (
    user_id = current_setting('app.user_id', true)
)
WITH CHECK (
    user_id = current_setting('app.user_id', true)
);

CREATE POLICY dictation_types_user_policy
ON dictation_types
FOR ALL
USING (
    user_id = current_setting('app.user_id', true)
)
WITH CHECK (
    user_id = current_setting('app.user_id', true)
);

CREATE POLICY user_settings_user_policy
ON user_settings
FOR ALL
USING (
    user_id = current_setting('app.user_id', true)
)
WITH CHECK (
    user_id = current_setting('app.user_id', true)
);

COMMIT;