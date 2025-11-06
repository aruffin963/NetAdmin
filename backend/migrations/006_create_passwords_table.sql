-- Migration: Création de la table passwords pour le générateur de mots de passe
-- Date: 2025-11-05

-- Créer la table passwords
CREATE TABLE IF NOT EXISTS passwords (
    id SERIAL PRIMARY KEY,
    application VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    secret_key VARCHAR(255),
    length INTEGER NOT NULL DEFAULT 16,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Créer un index sur application et username pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_passwords_application ON passwords(application);
CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
CREATE INDEX IF NOT EXISTS idx_passwords_created_by ON passwords(created_by);
CREATE INDEX IF NOT EXISTS idx_passwords_created_at ON passwords(created_at DESC);

-- Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_passwords_updated_at ON passwords;
CREATE TRIGGER trigger_passwords_updated_at
    BEFORE UPDATE ON passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_passwords_updated_at();

-- Commenter la table et les colonnes
COMMENT ON TABLE passwords IS 'Table pour stocker les mots de passe générés avec leurs paramètres';
COMMENT ON COLUMN passwords.id IS 'Identifiant unique du mot de passe';
COMMENT ON COLUMN passwords.application IS 'Nom de l''application pour laquelle le mot de passe est généré';
COMMENT ON COLUMN passwords.username IS 'Nom d''utilisateur associé au mot de passe';
COMMENT ON COLUMN passwords.password_hash IS 'Mot de passe hashé (bcrypt)';
COMMENT ON COLUMN passwords.secret_key IS 'Clé secrète utilisée pour la génération';
COMMENT ON COLUMN passwords.length IS 'Longueur du mot de passe généré';
COMMENT ON COLUMN passwords.created_by IS 'Utilisateur qui a créé le mot de passe';
COMMENT ON COLUMN passwords.created_at IS 'Date de création';
COMMENT ON COLUMN passwords.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN passwords.last_accessed_at IS 'Date du dernier accès au mot de passe';
COMMENT ON COLUMN passwords.notes IS 'Notes optionnelles';
COMMENT ON COLUMN passwords.is_active IS 'Indicateur si le mot de passe est actif';
