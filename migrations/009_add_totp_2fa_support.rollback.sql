-- Rollback 009: Remove TOTP 2FA Support
-- This reverts the changes made by migration 009

-- Supprimer les colonnes ajoutées à users
ALTER TABLE users DROP COLUMN IF EXISTS totp_2fa_pending;
ALTER TABLE users DROP COLUMN IF EXISTS last_2fa_verification;

-- Supprimer les index
DROP INDEX IF EXISTS idx_totp_login_history_timestamp;
DROP INDEX IF EXISTS idx_totp_login_history_user_id;
DROP INDEX IF EXISTS idx_user_backup_codes_used;
DROP INDEX IF EXISTS idx_user_backup_codes_user_id;
DROP INDEX IF EXISTS idx_user_totp_settings_enabled;
DROP INDEX IF EXISTS idx_user_totp_settings_user_id;

-- Supprimer les tables
DROP TABLE IF EXISTS totp_login_history;
DROP TABLE IF EXISTS user_backup_codes;
DROP TABLE IF EXISTS user_totp_settings;

-- Supprimer du tracking des migrations
DELETE FROM schema_migrations 
WHERE version = '009' AND name = 'add_totp_2fa_support';
