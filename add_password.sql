ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123';
UPDATE user_profiles SET password = '123' WHERE password IS NULL;
