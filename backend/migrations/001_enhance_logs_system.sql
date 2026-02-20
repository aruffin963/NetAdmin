-- Migration pour le système de logs amélioré
-- Date: Janvier 2024

-- 1. Créer la table principale activity_logs si elle n'existe pas
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Créer les indices pour améliorer les performances

-- Index sur created_at pour les requêtes de plage de dates
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at DESC);

-- Index sur username pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_activity_logs_username 
ON activity_logs(username);

-- Index sur status pour filtrage
CREATE INDEX IF NOT EXISTS idx_activity_logs_status 
ON activity_logs(status);

-- Index sur resource_type (catégorie) pour filtrage
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type 
ON activity_logs(resource_type);

-- Index sur action pour recherche des sources
CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
ON activity_logs(action);

-- Index composé pour requêtes courantes
CREATE INDEX IF NOT EXISTS idx_activity_logs_composite 
ON activity_logs(status, created_at DESC);

-- Index pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_activity_logs_trgm_message 
ON activity_logs USING gin(resource_name gin_trgm_ops);

-- 3. Créer la table d'archive (optionnel)
CREATE TABLE IF NOT EXISTS activity_logs_archive (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur archived_at pour les autres requêtes d'archive
CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_archived_at 
ON activity_logs_archive(archived_at DESC);

-- 4. Ajouter une colonne 'source' si elle n'existe pas
-- ALTER TABLE activity_logs ADD COLUMN source VARCHAR(100) DEFAULT 'system';

-- 5. Ajouter une colonne 'level' si elle n'existe pas (alias pour status)
-- ALTER TABLE activity_logs ADD COLUMN level VARCHAR(50) DEFAULT 'info';

-- 6. Ajouter des colonnes pour device et category si elles n'existent pas
-- ALTER TABLE activity_logs ADD COLUMN device_id VARCHAR(255);
-- ALTER TABLE activity_logs ADD COLUMN device_name VARCHAR(255);
-- ALTER TABLE activity_logs ADD COLUMN category VARCHAR(100);

-- 7. Créer une fonction de trigger pour update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Créer le trigger si n'existe pas
DROP TRIGGER IF EXISTS update_activity_logs_updated_at on activity_logs;
CREATE TRIGGER update_activity_logs_updated_at BEFORE UPDATE
ON activity_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Politique de retención - función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Archivar logs antiguos
  INSERT INTO activity_logs_archive
  SELECT * FROM activity_logs 
  WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
  
  -- Eliminar logs antiguos de la tabla principal
  DELETE FROM activity_logs 
  WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Ver para obtener estadísticas rápidamente
CREATE OR REPLACE VIEW v_activity_logs_stats AS
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT username) as unique_users,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
  resource_type,
  DATE_TRUNC('day', created_at) as date
FROM activity_logs
GROUP BY resource_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 11. Ver para logs recientes
CREATE OR REPLACE VIEW v_recent_activity_logs AS
SELECT 
  id, username, action, resource_type, resource_id, resource_name,
  status, created_at, ip_address
FROM activity_logs
ORDER BY created_at DESC
LIMIT 100;

-- Verificación de integridad
SELECT 
  't'::regclass::text as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as last_entry
FROM activity_logs
GROUP BY table_name;

-- Nota: Este script debe ejecutarse como superusuario o usuario con permisos suficientes
-- Asegúrese de que la extensión pg_trgm está instalada para la búsqueda full-text:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
