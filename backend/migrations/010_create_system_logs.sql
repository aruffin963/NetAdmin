-- Migration: Create system_logs table
-- Description: Store all system, console, and application logs for long-term tracking

CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  log_type VARCHAR(50) NOT NULL CHECK (log_type IN ('console', 'application', 'security', 'performance', 'integration')),
  category VARCHAR(100),
  message TEXT NOT NULL,
  source VARCHAR(255),
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(255),
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  environment VARCHAR(50),
  version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_username ON system_logs(username);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_expires_at ON system_logs(expires_at);

-- Index GIN pour recherche dans les métadonnées JSONB
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata ON system_logs USING GIN (metadata);

-- Index texte complet pour la recherche par message
CREATE INDEX IF NOT EXISTS idx_system_logs_message ON system_logs USING GIN (to_tsvector('french', message));

-- Table d'archivage pour les vieux logs
CREATE TABLE IF NOT EXISTS system_logs_archive (
  id BIGSERIAL PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  source VARCHAR(255),
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}',
  user_id INTEGER,
  username VARCHAR(255),
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  environment VARCHAR(50),
  version VARCHAR(50),
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_archive_created_at ON system_logs_archive(original_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_archive_level ON system_logs_archive(log_level);

COMMENT ON TABLE system_logs IS 'System, console, and application logs for long-term tracking and analysis';
COMMENT ON COLUMN system_logs.log_level IS 'Severity level (debug, info, warn, error, fatal)';
COMMENT ON COLUMN system_logs.log_type IS 'Type of log (console, application, security, performance, integration)';
COMMENT ON COLUMN system_logs.category IS 'Category or module (auth, api, database, frontend, etc)';
COMMENT ON COLUMN system_logs.message IS 'Log message text';
COMMENT ON COLUMN system_logs.source IS 'Source file, function, or service';
COMMENT ON COLUMN system_logs.stack_trace IS 'Stack trace for errors';
COMMENT ON COLUMN system_logs.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN system_logs.user_id IS 'Associated user if applicable';
COMMENT ON COLUMN system_logs.username IS 'Username for historical record';
COMMENT ON COLUMN system_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN system_logs.session_id IS 'Session identifier';
COMMENT ON COLUMN system_logs.environment IS 'Environment (development, staging, production)';
COMMENT ON COLUMN system_logs.version IS 'Application version';
COMMENT ON COLUMN system_logs.expires_at IS 'Automatic expiry date for retention policies';

-- Fonction pour archiver les vieux logs automatiquement
CREATE OR REPLACE FUNCTION archive_old_logs()
RETURNS TABLE(archived_count BIGINT) AS $$
BEGIN
  -- Archiver les logs de plus de 90 jours
  INSERT INTO system_logs_archive 
  SELECT 
    id, log_level, log_type, category, message, source, stack_trace,
    metadata, user_id, username, ip_address, session_id, environment, version,
    CURRENT_TIMESTAMP, created_at
  FROM system_logs
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  -- Supprimer les logs archivés
  DELETE FROM system_logs
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  RETURN QUERY SELECT CAST(ROW_COUNT AS BIGINT);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_logs() IS 'Archive and delete logs older than 90 days';
