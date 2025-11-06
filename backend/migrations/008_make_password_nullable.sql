-- Migration: Rendre la colonne password nullable pour les utilisateurs LDAP
-- Date: 2025-11-05

-- Pour les utilisateurs LDAP, le mot de passe n'est pas stocké dans la base
-- car l'authentification se fait directement via LDAP
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

COMMENT ON COLUMN users.password IS 'Mot de passe hashé pour les utilisateurs locaux (NULL pour les utilisateurs LDAP)';
