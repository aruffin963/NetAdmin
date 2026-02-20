-- Migration 012: Add OTP columns for password reset
-- Created: 2026-02-18
-- Purpose: Add OTP and OTP expiration columns for password reset via OTP

BEGIN;

-- Add OTP columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);
CREATE INDEX IF NOT EXISTS idx_users_reset_otp_expires_at ON users(reset_otp_expires_at);

-- Add comments
COMMENT ON COLUMN users.reset_otp IS 'SHA256 hashed OTP for password reset (10 minute expiration)';
COMMENT ON COLUMN users.reset_otp_expires_at IS 'Expiration time for reset OTP';

COMMIT;
