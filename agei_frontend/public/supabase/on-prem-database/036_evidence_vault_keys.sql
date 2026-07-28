-- ============================================================================
-- AGEI Evidence Bridge: Vault Key Management
-- ============================================================================
-- Purpose:
--   Encryption key management for vaulted evidence storage.
--   Implements envelope encryption pattern for evidence payloads.
--
-- Security Model:
--   - Master Key (env var) → Vault DEK (this table) → Evidence Payload
--   - Per-organization isolation
--   - Key rotation support
--   - Cryptographic erasure capability
--
-- Depends on:
--   035_evidence_bridge.sql (external_evidence_records table)
-- ============================================================================

-- ============================================================================
-- TABLE: evidence_vault_keys
-- ============================================================================
-- Purpose: Data Encryption Keys (DEKs) for vaulted evidence storage
-- Security: NEVER store plaintext keys. Keys encrypted at rest with master key from environment
-- ============================================================================

CREATE TABLE evidence_vault_keys (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Key Metadata
    key_name text NOT NULL,
    key_description text,
    
    -- Key Material (encrypted)
    encrypted_key_material text NOT NULL, -- Base64 AES-256-GCM encrypted DEK
    key_iv text NOT NULL, -- Base64 initialization vector
    key_auth_tag text NOT NULL, -- Base64 authentication tag for verification
    encryption_algorithm text NOT NULL DEFAULT 'aes-256-gcm',
    
    -- Status
    key_status text NOT NULL DEFAULT 'active' CHECK (
        key_status IN ('pending', 'active', 'rotated', 'destroyed')
    ),
    
    -- Lifecycle
    created_at timestamptz NOT NULL DEFAULT NOW(),
    rotated_at timestamptz,
    destroyed_at timestamptz,
    
    -- Audit
    created_by uuid REFERENCES principals(id),
    
    -- Constraints
    CONSTRAINT key_name_not_empty CHECK (length(trim(key_name)) > 0),
    CONSTRAINT destroyed_key_wiped CHECK (
        (key_status = 'destroyed' AND encrypted_key_material IS NULL AND key_iv IS NULL AND key_auth_tag IS NULL)
        OR (key_status != 'destroyed')
    )
);

-- Indexes
CREATE INDEX idx_vault_keys_organization ON evidence_vault_keys(organization_id);
CREATE INDEX idx_vault_keys_status ON evidence_vault_keys(key_status);
CREATE INDEX idx_vault_keys_active ON evidence_vault_keys(organization_id, key_status) 
    WHERE key_status = 'active';

-- Comments
COMMENT ON TABLE evidence_vault_keys IS 'Encryption keys for vaulted evidence storage (envelope encryption pattern)';
COMMENT ON COLUMN evidence_vault_keys.encrypted_key_material IS 'AES-256 DEK encrypted with master key. NULL after destruction.';
COMMENT ON COLUMN evidence_vault_keys.key_iv IS 'Initialization vector for DEK encryption. NULL after destruction.';
COMMENT ON COLUMN evidence_vault_keys.key_auth_tag IS 'GCM authentication tag for DEK. NULL after destruction.';
COMMENT ON COLUMN evidence_vault_keys.key_status IS 'pending=being created, active=in use, rotated=replaced, destroyed=crypto erased';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE evidence_vault_keys ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY vault_keys_service_full
    ON evidence_vault_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Owner/admin: read only (key material is sensitive)
CREATE POLICY vault_keys_admin_select
    ON evidence_vault_keys
    FOR SELECT
    TO authenticated
    USING (has_any_role(organization_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON evidence_vault_keys TO service_role;
GRANT SELECT ON evidence_vault_keys TO authenticated;

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Migration 036: Evidence vault key management complete
-- Table: evidence_vault_keys created
-- RLS: Configured for organization isolation
-- Ready for: Vaulted evidence storage
