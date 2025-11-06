-- Migration: Création de la table sessions pour l'authentification et gestion des sessions
-- Date: 2025-11-05

-- Modifier la table users existante pour ajouter les colonnes LDAP
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ldap_dn TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Mettre à jour les colonnes existantes si nécessaire
ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Créer la table sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Créer la table pour l'auto-save (sauvegarde automatique du travail en cours)
CREATE TABLE IF NOT EXISTS auto_saves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    page_path VARCHAR(255) NOT NULL,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_path)
);

-- Créer des index pour performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auto_saves_user_id ON auto_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_saves_page_path ON auto_saves(page_path);

-- Créer les fonctions pour updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_auto_saves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

DROP TRIGGER IF EXISTS trigger_auto_saves_updated_at ON auto_saves;
CREATE TRIGGER trigger_auto_saves_updated_at
    BEFORE UPDATE ON auto_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_auto_saves_updated_at();

-- Fonction pour nettoyer les sessions expirées (à appeler périodiquement)
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commenter les tables et colonnes
COMMENT ON TABLE users IS 'Table des utilisateurs authentifiés via LDAP';
COMMENT ON TABLE sessions IS 'Table des sessions utilisateurs avec expiration de 15 minutes';
COMMENT ON TABLE auto_saves IS 'Table pour sauvegarder automatiquement le travail en cours';
COMMENT ON COLUMN sessions.expires_at IS 'Date d''expiration de la session (15 minutes après last_activity_at)';
COMMENT ON COLUMN sessions.last_activity_at IS 'Date de la dernière activité pour renouveler la session';
