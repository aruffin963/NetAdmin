-- Rollback: Remove TOTP Two-Factor Authentication support
-- Description: Drop all 2FA-related tables and indexes

-- Drop indexes
DROP INDEX IF EXISTS idx_totp_login_history_attempt_at;
DROP INDEX IF EXISTS idx_totp_login_history_verified;
DROP INDEX IF EXISTS idx_totp_login_history_user_id;
DROP INDEX IF EXISTS idx_user_backup_codes_used;
DROP INDEX IF EXISTS idx_user_backup_codes_code;
DROP INDEX IF EXISTS idx_user_backup_codes_user_id;
DROP INDEX IF EXISTS idx_user_totp_settings_user_id;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS totp_login_history;
DROP TABLE IF EXISTS user_backup_codes;
DROP TABLE IF EXISTS user_totp_settings;
