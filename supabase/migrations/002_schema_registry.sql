-- ============================================================================
-- AGEI Layer: Schema Registry
-- ============================================================================
-- CIAF-LCM Concept:
--   Typed, versioned evidence payloads. Schema registry tracks JSON schema
--   evolution and CIAF type vocabulary. Ensures evidence is not just JSON
--   blobs but typed, versioned, schema-validated data.
--
-- Tables:
--   schema_versions, ciaf_type_registry
--
-- Depends on:
--   organizations, principals
--
-- Evidence Role:
--   Ensures evidence is not just JSON blobs but typed, versioned,
--   schema-validated data
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- TABLE: schema_versions
-- ============================================================================
-- Purpose: Registry of JSON schema versions for evidence payload validation
-- Evidence: Schema versioning for payload integrity and evolution
-- ============================================================================

CREATE TABLE schema_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schema identity
    schema_type text NOT NULL,
    version text NOT NULL,
    
    -- Schema definition
    json_schema jsonb NOT NULL,
    
    -- Canonicalization tracking
    canonicalization_version text DEFAULT '1.0.0',
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_deprecated boolean NOT NULL DEFAULT false,
    deprecated_at timestamptz,
    
    -- Migration support
    migration_notes text,
    previous_version_id uuid REFERENCES schema_versions(id),
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT schema_versions_unique_type_version UNIQUE (schema_type, version)
);

CREATE INDEX idx_schema_versions_type ON schema_versions(schema_type);
CREATE INDEX idx_schema_versions_active ON schema_versions(schema_type, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_schema_versions_created ON schema_versions(created_at DESC);

-- Grant Data API access
GRANT SELECT ON schema_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_versions TO service_role;

COMMENT ON TABLE schema_versions IS 'Registry of JSON schema versions for evidence payload validation';
COMMENT ON COLUMN schema_versions.schema_type IS 'Type of schema (e.g., receipt, policy, gate-evaluation)';
COMMENT ON COLUMN schema_versions.json_schema IS 'Full JSON Schema definition for validation';
COMMENT ON COLUMN schema_versions.canonicalization_version IS 'Canonicalization standard version for hashing';
COMMENT ON COLUMN schema_versions.migration_notes IS 'Instructions for migrating from previous version';

-- ============================================================================
-- TABLE: ciaf_type_registry
-- ============================================================================
-- Purpose: CIAF-LCM extension vocabulary for lifecycle, provenance, agentic
-- Evidence: Type registry for extension packs and vocabulary
-- ============================================================================

CREATE TABLE ciaf_type_registry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Type identity
    type_family text NOT NULL,
    type_key text NOT NULL,
    display_name text NOT NULL,
    description text,
    
    -- Extension pack
    extension_pack text NOT NULL,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ciaf_type_registry_unique_family_key UNIQUE (type_family, type_key)
);

CREATE INDEX idx_ciaf_type_registry_family ON ciaf_type_registry(type_family);
CREATE INDEX idx_ciaf_type_registry_key ON ciaf_type_registry(type_key);
CREATE INDEX idx_ciaf_type_registry_extension_pack ON ciaf_type_registry(extension_pack);
CREATE INDEX idx_ciaf_type_registry_active ON ciaf_type_registry(is_active) WHERE is_active = true;

-- Grant Data API access
GRANT SELECT ON ciaf_type_registry TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ciaf_type_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ciaf_type_registry TO service_role;

COMMENT ON TABLE ciaf_type_registry IS 'CIAF-LCM extension vocabulary for full lifecycle, provenance, agentic interactions, and shadow AI';
COMMENT ON COLUMN ciaf_type_registry.type_family IS 'Type family (e.g., receipt_type, event_type, resource_type)';
COMMENT ON COLUMN ciaf_type_registry.type_key IS 'Unique key within family';
COMMENT ON COLUMN ciaf_type_registry.extension_pack IS 'Extension pack (Core, Lifecycle, Agentic, Privacy, Provenance, Shadow AI)';
