-- Création de la base de données Netadmin
-- Ce script doit être exécuté par un superutilisateur PostgreSQL

-- Créer la base de données
CREATE DATABASE netadmin;

-- Se connecter à la base de données netadmin
\c netadmin;

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des organisations (pour le multi-tenant)
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    theme JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pools d'IP
CREATE TABLE ip_pools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    subnet_mask VARCHAR(15) NOT NULL,
    gateway VARCHAR(15),
    dns_servers JSONB DEFAULT '[]',
    organization_id INTEGER REFERENCES organizations(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des adresses IP
CREATE TABLE ip_addresses (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(15) UNIQUE NOT NULL,
    pool_id INTEGER REFERENCES ip_pools(id),
    status VARCHAR(20) DEFAULT 'available', -- available, allocated, reserved
    hostname VARCHAR(255),
    mac_address VARCHAR(17),
    description TEXT,
    allocated_to VARCHAR(255),
    allocated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sous-réseaux
CREATE TABLE subnets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    cidr INTEGER NOT NULL,
    gateway VARCHAR(15),
    vlan_id INTEGER,
    description TEXT,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs système
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    ip_address VARCHAR(15),
    user_id INTEGER REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization);
CREATE INDEX idx_ip_addresses_pool ON ip_addresses(pool_id);
CREATE INDEX idx_ip_addresses_status ON ip_addresses(status);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_pools_updated_at BEFORE UPDATE ON ip_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON ip_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subnets_updated_at BEFORE UPDATE ON subnets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();