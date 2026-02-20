-- Migration 009: Add TOTP 2FA Support
-- Description: Create tables for Two-Factor Authentication (TOTP)
-- Created: 2024-02-16

-- Table pour les paramètres TOTP de chaque utilisateur
CREATE TABLE IF NOT EXISTS user_totp_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  totp_secret VARCHAR(32) NOT NULL, -- Secret chiffré pour TOTP
  totp_enabled BOOLEAN DEFAULT false,
  backup_codes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_verified_at TIMESTAMP,
  CONSTRAINT user_totp_settings_unique_user UNIQUE(user_id)
);

-- Table pour les codes de secours
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL, -- Hachage bcrypt du code
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_backup_code UNIQUE(user_id, code_hash)
);

-- Table pour l'historique des connexions 2FA
CREATE TABLE IF NOT EXISTS totp_login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  success BOOLEAN DEFAULT true,
  method VARCHAR(50), -- 'totp' ou 'backup_code'
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer des index pour les performances
CREATE INDEX idx_user_totp_settings_user_id ON user_totp_settings(user_id);
CREATE INDEX idx_user_totp_settings_enabled ON user_totp_settings(totp_enabled);
CREATE INDEX idx_user_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX idx_user_backup_codes_used ON user_backup_codes(used);
CREATE INDEX idx_totp_login_history_user_id ON totp_login_history(user_id);
CREATE INDEX idx_totp_login_history_timestamp ON totp_login_history(timestamp);

-- Ajouter la colonne to_2fa_pending à la table users (pour le flow de vérification)
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_2fa_pending BOOLEAN DEFAULT false;

-- Ajouter une colonne pour tracker la dernière connexion 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_2fa_verification TIMESTAMP;

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE user_totp_settings IS 'Paramètres TOTP (Time-based One-Time Password) pour chaque utilisateur';
COMMENT ON TABLE user_backup_codes IS 'Codes de secours pour accès en cas de perte du téléphone';
COMMENT ON TABLE totp_login_history IS 'Historique de toutes les vérifications 2FA';
COMMENT ON COLUMN user_totp_settings.totp_secret IS 'Secret TOTP chiffré avec la clé de l''application';
COMMENT ON COLUMN user_totp_settings.backup_codes_count IS 'Nombre de codes de secours non utilisés';
COMMENT ON COLUMN user_backup_codes.code_hash IS 'Hash du code pour ne pas stocker en clair';
COMMENT ON COLUMN user_backup_codes.used IS 'Si le code a été utilisé (une seule utilisation possible)';
