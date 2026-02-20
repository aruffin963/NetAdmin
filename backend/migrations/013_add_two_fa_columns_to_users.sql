-- Migration: Add Two-Factor Authentication columns to users table
-- Description: Add direct 2FA columns to users table for easier password reset OTP

ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_secret VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_two_fa_enabled ON users(two_fa_enabled);
