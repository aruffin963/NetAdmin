-- Migration: Add TOTP Two-Factor Authentication support
-- Description: Create tables for TOTP-based 2FA, backup codes, and verification history

-- Create table for storing user TOTP settings
CREATE TABLE IF NOT EXISTS user_totp_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  totp_secret VARCHAR(255) NOT NULL,
  totp_enabled BOOLEAN DEFAULT FALSE,
  backup_codes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_verified_at TIMESTAMP,
  COMMENT ON TABLE user_totp_settings IS 'Stores TOTP secret and settings for each user'
);

-- Create table for storing backup codes
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create table for TOTP verification history
CREATE TABLE IF NOT EXISTS totp_login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_totp_settings_user_id ON user_totp_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_code ON user_backup_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_used ON user_backup_codes(used);
CREATE INDEX IF NOT EXISTS idx_totp_login_history_user_id ON totp_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_login_history_verified ON totp_login_history(verified);
CREATE INDEX IF NOT EXISTS idx_totp_login_history_attempt_at ON totp_login_history(attempt_at DESC);

-- Add comments
COMMENT ON TABLE user_totp_settings IS 'Stores TOTP secret and settings for each user';
COMMENT ON COLUMN user_totp_settings.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_totp_settings.totp_secret IS 'Encrypted TOTP secret key';
COMMENT ON COLUMN user_totp_settings.totp_enabled IS 'Whether 2FA is currently enabled for this user';
COMMENT ON COLUMN user_totp_settings.backup_codes_count IS 'Number of unused backup codes';

COMMENT ON TABLE user_backup_codes IS 'Backup codes that can be used if authenticator app is unavailable';
COMMENT ON COLUMN user_backup_codes.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_backup_codes.code IS 'The backup code (hashed)';
COMMENT ON COLUMN user_backup_codes.used IS 'Whether this code has been used';

COMMENT ON TABLE totp_login_history IS 'Log of TOTP verification attempts for security audit';
COMMENT ON COLUMN totp_login_history.user_id IS 'Reference to the user';
COMMENT ON COLUMN totp_login_history.verified IS 'Whether the TOTP verification was successful';
COMMENT ON COLUMN totp_login_history.ip_address IS 'IP address from which the attempt was made';
