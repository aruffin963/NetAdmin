-- Migration: Add password reset functionality
-- Date: 2026-02-18

-- Ajouter les colonnes pour la réinitialisation de mot de passe
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMP WITH TIME ZONE;

-- Créer un index sur reset_token pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token_expires_at ON users(reset_token_expires_at);

-- Commentaires
COMMENT ON COLUMN users.reset_token IS 'Jeton pour la réinitialisation de mot de passe';
COMMENT ON COLUMN users.reset_token_expires_at IS 'Date d''expiration du jeton (1 heure)';
COMMENT ON COLUMN users.password_reset_requested_at IS 'Date de la demande de réinitialisation';
