-- ============================================================================
-- Rollback for Migration 035: Evidence Bridge
-- ============================================================================
-- WARNING: This will DROP all Evidence Bridge tables and data
-- Only use this for development/testing environments
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS evidence_ingestion_attempts CASCADE;
DROP TABLE IF EXISTS evidence_lineage_links CASCADE;
DROP TABLE IF EXISTS external_evidence_attachments CASCADE;
DROP TABLE IF EXISTS external_evidence_records CASCADE;
DROP TABLE IF EXISTS external_source_credentials CASCADE;
DROP TABLE IF EXISTS external_evidence_sources CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_evidence_updated_at() CASCADE;

-- Note: This does NOT remove the migration record from supabase_migrations.schema_migrations
-- To fully reset, also run:
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '035';
