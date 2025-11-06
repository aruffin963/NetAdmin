-- Migration: Create activity_logs table
-- Description: Store all user actions and system events for audit trail

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour améliorer les performances de recherche
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_username ON activity_logs(username);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_status ON activity_logs(status);

-- Index GIN pour recherche dans les détails JSONB
CREATE INDEX idx_activity_logs_details ON activity_logs USING GIN (details);

COMMENT ON TABLE activity_logs IS 'Audit trail of all user actions and system events';
COMMENT ON COLUMN activity_logs.user_id IS 'Reference to the user who performed the action';
COMMENT ON COLUMN activity_logs.username IS 'Username for historical record even if user is deleted';
COMMENT ON COLUMN activity_logs.action IS 'Type of action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)';
COMMENT ON COLUMN activity_logs.resource_type IS 'Type of resource affected (ORGANIZATION, SUBNET, VLAN, PASSWORD, etc.)';
COMMENT ON COLUMN activity_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN activity_logs.resource_name IS 'Name of the affected resource for easy reference';
COMMENT ON COLUMN activity_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN activity_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN activity_logs.user_agent IS 'Browser/client user agent';
COMMENT ON COLUMN activity_logs.status IS 'Status of the action (success, error, warning)';
COMMENT ON COLUMN activity_logs.error_message IS 'Error message if action failed';
