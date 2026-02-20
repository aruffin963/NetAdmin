-- Rollback 008: Remove support_level from organizations
-- This reverts the changes made by migration 008

-- Remove the index
DROP INDEX IF EXISTS idx_organizations_support_level;

-- Remove the column
ALTER TABLE organizations 
DROP COLUMN IF EXISTS support_level;

-- Remove the migration record
DELETE FROM schema_migrations 
WHERE version = '008' AND name = 'add_support_level_to_organizations';
