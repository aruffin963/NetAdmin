-- Migration 008: Example - Add support_level to organizations
-- Description: This migration adds a support_level column to track support tier for each organization
-- Created: 2024-02-16

-- Add column if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS support_level VARCHAR(50) DEFAULT 'standard'
CHECK (support_level IN ('free', 'standard', 'premium', 'enterprise'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organizations_support_level 
ON organizations(support_level);

-- Update existing records with default value
UPDATE organizations 
SET support_level = 'standard' 
WHERE support_level IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN organizations.support_level 
IS 'Support tier level: free, standard, premium, or enterprise';

-- Log the migration
INSERT INTO schema_migrations (version, name, status) 
VALUES ('008', 'add_support_level_to_organizations', 'success')
ON CONFLICT DO NOTHING;
