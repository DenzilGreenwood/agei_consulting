-- ============================================================================
-- AGEI Evidence Bridge: External Evidence Ingestion
-- ============================================================================
-- Purpose:
--   Enable external systems to send governance, verification, operational,
--   or AI event information into AGEI for preservation as independently
--   verifiable evidence.
--
-- Tables:
--   external_evidence_sources - registered external systems
--   external_source_credentials - authentication credentials (API keys, etc.)
--   external_evidence_records - core evidence data
--   external_evidence_attachments - file storage references
--   evidence_lineage_links - relationship tracking
--   evidence_ingestion_attempts - operational audit log
--
-- Evidence Flow:
--   External System → Authenticated API → Schema Validation →
--   Canonicalization → SHA-256 Hashing → Optional Encryption →
--   AGEI Receipt Creation → Signature → Merkle Eligibility →
--   Audit Pack Inclusion → Independent Verification
--
-- Storage Modes:
--   - reference_only: metadata + hash only (payload stays in source)
--   - vaulted: encrypted payload stored in AGEI
--   - evidence_capsule: complete materialized package
--
-- Integration:
--   external_evidence_records.receipt_id → receipts.id
--   receipts eligible for existing Merkle batching and audit packs
--
-- Depends on:
--   organizations, principals, receipts, signing_keys
-- ============================================================================

-- ============================================================================
-- TABLE: external_evidence_sources
-- ============================================================================
-- Purpose: Registered external systems that send evidence to AGEI
-- ============================================================================

CREATE TABLE external_evidence_sources (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Source Identity
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    
    -- Source Classification
    source_type text NOT NULL,
    environment text NOT NULL DEFAULT 'production' CHECK (
        environment IN ('development', 'test', 'staging', 'production')
    ),
    base_url text,
    
    -- Authentication
    authentication_type text NOT NULL DEFAULT 'api_key' CHECK (
        authentication_type IN ('api_key', 'signed_webhook', 'oauth', 'mtls', 'public_key')
    ),
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'disabled', 'suspended', 'archived')
    ),
    
    -- Default Settings
    default_storage_mode text NOT NULL DEFAULT 'reference_only' CHECK (
        default_storage_mode IN ('reference_only', 'vaulted', 'evidence_capsule')
    ),
    default_classification text NOT NULL DEFAULT 'internal' CHECK (
        default_classification IN ('public', 'internal', 'confidential', 'restricted')
    ),
    default_retention_days int CHECK (default_retention_days > 0),
    
    -- Permissions
    allow_payload_storage boolean NOT NULL DEFAULT false,
    require_source_signature boolean NOT NULL DEFAULT false,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by uuid REFERENCES principals(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_source_slug_per_org UNIQUE (organization_id, slug),
    CONSTRAINT source_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT source_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- Indexes
CREATE INDEX idx_external_sources_organization ON external_evidence_sources(organization_id);
CREATE INDEX idx_external_sources_slug ON external_evidence_sources(organization_id, slug);
CREATE INDEX idx_external_sources_status ON external_evidence_sources(status);
CREATE INDEX idx_external_sources_type ON external_evidence_sources(source_type);
CREATE INDEX idx_external_sources_environment ON external_evidence_sources(environment);

-- Comments
COMMENT ON TABLE external_evidence_sources IS 'Registered external systems authorized to send evidence to AGEI';
COMMENT ON COLUMN external_evidence_sources.slug IS 'URL-safe source identifier, unique per organization';
COMMENT ON COLUMN external_evidence_sources.authentication_type IS 'How the source authenticates: API key, signed webhook, etc.';
COMMENT ON COLUMN external_evidence_sources.default_storage_mode IS 'Default evidence storage: reference_only, vaulted, or evidence_capsule';
COMMENT ON COLUMN external_evidence_sources.allow_payload_storage IS 'Source is permitted to store full payloads in AGEI (required for vaulted/evidence_capsule modes)';
COMMENT ON COLUMN external_evidence_sources.require_source_signature IS 'Whether AGEI requires the source to sign evidence payloads';

-- ============================================================================
-- TABLE: external_source_credentials
-- ============================================================================
-- Purpose: Authentication credentials for external sources
-- Security: NEVER store plaintext secrets. Hash before storage.
-- ============================================================================

CREATE TABLE external_source_credentials (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    source_id uuid NOT NULL REFERENCES external_evidence_sources(id) ON DELETE CASCADE,
    
    -- Credential Type
    credential_type text NOT NULL CHECK (
        credential_type IN ('api_key', 'webhook_secret', 'oauth_client', 'public_key', 'mtls_cert')
    ),
    
    -- Credential Data
    -- API keys: store prefix (agei_ev_live_abc) + hash
    -- Public keys: store full public key
    -- OAuth: store client_id + hashed secret
    credential_identifier text, -- Non-secret prefix or client_id
    credential_hash text, -- bcrypt/scrypt hash, NEVER plaintext
    secret_reference text, -- Future: KMS/vault reference
    public_key text, -- For signature verification
    
    -- Principal Link
    -- For API keys, create a principal with type='api_key'
    principal_id uuid REFERENCES principals(id),
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'revoked', 'expired')
    ),
    last_used_at timestamptz,
    expires_at timestamptz,
    
    -- Audit
    created_by uuid REFERENCES principals(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES principals(id)
);

-- Indexes
CREATE INDEX idx_external_credentials_source ON external_source_credentials(source_id);
CREATE INDEX idx_external_credentials_identifier ON external_source_credentials(credential_identifier);
CREATE INDEX idx_external_credentials_status ON external_source_credentials(status);
CREATE INDEX idx_external_credentials_expires ON external_source_credentials(expires_at) 
    WHERE expires_at IS NOT NULL AND status = 'active';

-- Comments
COMMENT ON TABLE external_source_credentials IS 'Authentication credentials for external evidence sources. NEVER store plaintext secrets.';
COMMENT ON COLUMN external_source_credentials.credential_hash IS 'Secure hash of secret (bcrypt/scrypt). NEVER plaintext.';
COMMENT ON COLUMN external_source_credentials.credential_identifier IS 'Non-secret identifier: API key prefix, OAuth client_id, etc.';
COMMENT ON COLUMN external_source_credentials.public_key IS 'Public key for signature verification (Ed25519, RSA, etc.)';
COMMENT ON COLUMN external_source_credentials.principal_id IS 'Links credential to a principal (for API keys, creates api_key principal)';

-- ============================================================================
-- TABLE: external_evidence_records
-- ============================================================================
-- Purpose: Core external evidence records with AGEI receipt integration
-- ============================================================================

CREATE TABLE external_evidence_records (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    source_id uuid NOT NULL REFERENCES external_evidence_sources(id) ON DELETE RESTRICT,
    
    -- External Identity
    external_record_id text NOT NULL,
    external_event_type text NOT NULL,
    source_event_id text,
    source_event_version text,
    
    -- Temporal
    source_occurred_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL DEFAULT NOW(),
    canonicalized_at timestamptz,
    
    -- Storage & Classification
    storage_mode text NOT NULL CHECK (
        storage_mode IN ('reference_only', 'vaulted', 'evidence_capsule')
    ),
    classification text NOT NULL DEFAULT 'internal' CHECK (
        classification IN ('public', 'internal', 'confidential', 'restricted')
    ),
    retention_until timestamptz,
    legal_hold boolean NOT NULL DEFAULT false,
    
    -- Context References
    actor_reference jsonb, -- {type, id, name, email}
    agent_reference jsonb, -- {id, name, version}
    model_reference jsonb, -- {id, name, version, provider}
    workflow_reference jsonb, -- {id, name, version}
    policy_reference text,
    decision text,
    outcome text,
    
    -- Source Location
    source_locator jsonb, -- {type: 'api'|'file'|'stream', uri, metadata}
    source_content_type text,
    
    -- Payload Storage
    -- reference_only: canonical_payload is NULL
    -- vaulted: encrypted_payload contains encrypted JSON
    -- evidence_capsule: canonical_payload contains full materialized package
    canonical_payload jsonb, 
    canonical_payload_hash text NOT NULL, -- ALWAYS required
    original_payload_hash text, -- Source's hash (if provided)
    
    -- Encryption (for vaulted mode)
    encrypted_payload text, -- Base64 ciphertext
    encryption_key_id uuid,
    encryption_algorithm text,
    
    -- Redaction
    redaction_policy_version text,
    
    -- Source Signature Verification
    source_signature text,
    source_signature_algorithm text,
    source_signature_valid boolean,
    
    -- Verification Status
    verification_status text NOT NULL DEFAULT 'received' CHECK (
        verification_status IN (
            'received',
            'canonicalized',
            'hashed',
            'signed',
            'verified',
            'verification_failed',
            'quarantined',
            'sealed',
            'archived'
        )
    ),
    verification_error text,
    
    -- AGEI Receipt Integration (CRITICAL)
    receipt_id uuid REFERENCES receipts(id),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Audit
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Constraints
    CONSTRAINT unique_external_record UNIQUE (organization_id, source_id, external_record_id),
    CONSTRAINT valid_canonical_hash CHECK (
        canonical_payload_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    CONSTRAINT payload_storage_rules CHECK (
        (storage_mode = 'reference_only' AND canonical_payload IS NULL AND encrypted_payload IS NULL)
        OR (storage_mode = 'vaulted' AND encrypted_payload IS NOT NULL)
        OR (storage_mode = 'evidence_capsule' AND canonical_payload IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_external_evidence_organization ON external_evidence_records(organization_id);
CREATE INDEX idx_external_evidence_source ON external_evidence_records(source_id);
CREATE INDEX idx_external_evidence_external_id ON external_evidence_records(external_record_id);
CREATE INDEX idx_external_evidence_receipt ON external_evidence_records(receipt_id);
CREATE INDEX idx_external_evidence_status ON external_evidence_records(verification_status);
CREATE INDEX idx_external_evidence_source_occurred ON external_evidence_records(source_occurred_at);
CREATE INDEX idx_external_evidence_received ON external_evidence_records(received_at);
CREATE INDEX idx_external_evidence_hash ON external_evidence_records(canonical_payload_hash);
CREATE INDEX idx_external_evidence_event_type ON external_evidence_records(external_event_type);
CREATE INDEX idx_external_evidence_decision ON external_evidence_records(decision) WHERE decision IS NOT NULL;
CREATE INDEX idx_external_evidence_legal_hold ON external_evidence_records(legal_hold) WHERE legal_hold = true;

-- Comments
COMMENT ON TABLE external_evidence_records IS 'External evidence ingested into AGEI with cryptographic receipts';
COMMENT ON COLUMN external_evidence_records.external_record_id IS 'Source system''s unique identifier for this evidence';
COMMENT ON COLUMN external_evidence_records.storage_mode IS 'How evidence is stored: reference_only (metadata only), vaulted (encrypted), evidence_capsule (full)';
COMMENT ON COLUMN external_evidence_records.canonical_payload_hash IS 'SHA-256 hash of canonicalized payload. ALWAYS required for integrity.';
COMMENT ON COLUMN external_evidence_records.receipt_id IS 'Links to AGEI receipt - critical for Merkle sealing and audit packs';
COMMENT ON COLUMN external_evidence_records.verification_status IS 'Evidence processing status through AGEI workflow';
COMMENT ON COLUMN external_evidence_records.legal_hold IS 'Prevents deletion/erasure for legal preservation';
COMMENT ON COLUMN external_evidence_records.encrypted_payload IS 'Encrypted evidence payload for vaulted storage mode';

-- ============================================================================
-- TABLE: external_evidence_attachments
-- ============================================================================
-- Purpose: File attachments for external evidence
-- ============================================================================

CREATE TABLE external_evidence_attachments (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    external_evidence_record_id uuid NOT NULL REFERENCES external_evidence_records(id) ON DELETE CASCADE,
    
    -- File Metadata
    filename text NOT NULL,
    mime_type text,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    
    -- Storage
    storage_path text NOT NULL, -- Supabase Storage path
    storage_bucket text NOT NULL DEFAULT 'evidence-attachments',
    
    -- Integrity
    content_hash text NOT NULL CHECK (
        content_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    
    -- Encryption
    encrypted boolean NOT NULL DEFAULT false,
    encryption_key_id uuid,
    encryption_algorithm text,
    
    -- Classification
    classification text NOT NULL DEFAULT 'internal' CHECK (
        classification IN ('public', 'internal', 'confidential', 'restricted')
    ),
    
    -- Audit
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Constraints
    CONSTRAINT attachment_filename_not_empty CHECK (length(trim(filename)) > 0)
);

-- Indexes
CREATE INDEX idx_external_attachments_evidence ON external_evidence_attachments(external_evidence_record_id);
CREATE INDEX idx_external_attachments_organization ON external_evidence_attachments(organization_id);
CREATE INDEX idx_external_attachments_hash ON external_evidence_attachments(content_hash);

-- Comments
COMMENT ON TABLE external_evidence_attachments IS 'File attachments for external evidence records';
COMMENT ON COLUMN external_evidence_attachments.storage_path IS 'Path in Supabase Storage (private bucket)';
COMMENT ON COLUMN external_evidence_attachments.content_hash IS 'SHA-256 hash of file content for integrity verification';

-- ============================================================================
-- TABLE: evidence_lineage_links
-- ============================================================================
-- Purpose: Flexible lineage relationships between evidence and other entities
-- ============================================================================

CREATE TABLE evidence_lineage_links (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Source (Evidence Record)
    source_record_id uuid NOT NULL REFERENCES external_evidence_records(id) ON DELETE CASCADE,
    
    -- Target (Flexible)
    target_entity_type text NOT NULL CHECK (
        target_entity_type IN (
            'receipt',
            'policy',
            'policy_version',
            'gate_evaluation',
            'agent',
            'model',
            'workflow',
            'audit_pack',
            'merkle_batch',
            'incident',
            'review_request',
            'external_evidence_record',
            'evidence_capsule'
        )
    ),
    target_entity_id uuid NOT NULL,
    
    -- Relationship Type
    relationship_type text NOT NULL CHECK (
        relationship_type IN (
            'derived_from',
            'supports',
            'verifies',
            'supersedes',
            'triggered',
            'approved_by',
            'governed_by',
            'included_in',
            'related_to',
            'resulted_in',
            'validated_by'
        )
    ),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by uuid REFERENCES principals(id),
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_evidence_lineage_source ON evidence_lineage_links(source_record_id);
CREATE INDEX idx_evidence_lineage_target ON evidence_lineage_links(target_entity_type, target_entity_id);
CREATE INDEX idx_evidence_lineage_organization ON evidence_lineage_links(organization_id);
CREATE INDEX idx_evidence_lineage_relationship ON evidence_lineage_links(relationship_type);

-- Comments
COMMENT ON TABLE evidence_lineage_links IS 'Lineage relationships between external evidence and other AGEI entities';
COMMENT ON COLUMN evidence_lineage_links.target_entity_type IS 'Type of entity this evidence relates to';
COMMENT ON COLUMN evidence_lineage_links.relationship_type IS 'Nature of the relationship: derived_from, supports, verifies, etc.';

-- ============================================================================
-- TABLE: evidence_ingestion_attempts
-- ============================================================================
-- Purpose: Operational audit log of all ingestion attempts
-- Security: NO RAW PAYLOADS stored in this table
-- ============================================================================

CREATE TABLE evidence_ingestion_attempts (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    source_id uuid REFERENCES external_evidence_sources(id) ON DELETE SET NULL,
    
    -- Request Identity
    request_id uuid NOT NULL,
    idempotency_key text,
    external_record_id text,
    
    -- Status
    status text NOT NULL CHECK (
        status IN ('success', 'failed', 'quarantined', 'duplicate', 'rejected')
    ),
    http_status int CHECK (http_status >= 100 AND http_status < 600),
    error_code text,
    error_message text,
    
    -- Metrics
    payload_size_bytes bigint,
    processing_duration_ms int,
    
    -- Request Context (for abuse detection)
    ip_address text,
    user_agent text,
    
    -- Timing
    started_at timestamptz NOT NULL,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ingestion_attempts_organization ON evidence_ingestion_attempts(organization_id);
CREATE INDEX idx_ingestion_attempts_source ON evidence_ingestion_attempts(source_id);
CREATE INDEX idx_ingestion_attempts_request ON evidence_ingestion_attempts(request_id);
CREATE INDEX idx_ingestion_attempts_idempotency ON evidence_ingestion_attempts(idempotency_key);
CREATE INDEX idx_ingestion_attempts_status ON evidence_ingestion_attempts(status);
CREATE INDEX idx_ingestion_attempts_created ON evidence_ingestion_attempts(created_at);
CREATE INDEX idx_ingestion_attempts_external_id ON evidence_ingestion_attempts(external_record_id);

-- Comments
COMMENT ON TABLE evidence_ingestion_attempts IS 'Operational audit log of evidence ingestion attempts. NO RAW PAYLOADS.';
COMMENT ON COLUMN evidence_ingestion_attempts.idempotency_key IS 'Idempotency-Key header value for duplicate detection';
COMMENT ON COLUMN evidence_ingestion_attempts.processing_duration_ms IS 'Time taken to process the request (milliseconds)';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE external_evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_source_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_evidence_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_lineage_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_ingestion_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: external_evidence_sources
-- ============================================================================

-- Service role: full access (for API ingestion)
CREATE POLICY external_sources_service_full
    ON external_evidence_sources
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users: organization-scoped access
CREATE POLICY external_sources_org_select
    ON external_evidence_sources
    FOR SELECT
    TO authenticated
    USING (is_organization_member(organization_id));

-- Owner/admin: can manage sources
CREATE POLICY external_sources_admin_all
    ON external_evidence_sources
    FOR ALL
    TO authenticated
    USING (has_any_role(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (has_any_role(organization_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- RLS POLICIES: external_source_credentials
-- ============================================================================

-- Service role: full access
CREATE POLICY external_credentials_service_full
    ON external_source_credentials
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Owner/admin only: credentials are sensitive
CREATE POLICY external_credentials_admin_select
    ON external_source_credentials
    FOR SELECT
    TO authenticated
    USING (has_any_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY external_credentials_admin_manage
    ON external_source_credentials
    FOR ALL
    TO authenticated
    USING (has_role(organization_id, 'owner'))
    WITH CHECK (has_role(organization_id, 'owner'));

-- ============================================================================
-- RLS POLICIES: external_evidence_records
-- ============================================================================

-- Service role: full access
CREATE POLICY external_evidence_service_full
    ON external_evidence_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Organization members: read access
CREATE POLICY external_evidence_org_select
    ON external_evidence_records
    FOR SELECT
    TO authenticated
    USING (is_organization_member(organization_id));

-- Owner/admin: can update (e.g., legal hold)
CREATE POLICY external_evidence_admin_update
    ON external_evidence_records
    FOR UPDATE
    TO authenticated
    USING (has_any_role(organization_id, ARRAY['owner', 'admin']))
    WITH CHECK (has_any_role(organization_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- RLS POLICIES: external_evidence_attachments
-- ============================================================================

-- Service role: full access
CREATE POLICY external_attachments_service_full
    ON external_evidence_attachments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Organization members: read access
CREATE POLICY external_attachments_org_select
    ON external_evidence_attachments
    FOR SELECT
    TO authenticated
    USING (is_organization_member(organization_id));

-- ============================================================================
-- RLS POLICIES: evidence_lineage_links
-- ============================================================================

-- Service role: full access
CREATE POLICY evidence_lineage_service_full
    ON evidence_lineage_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Organization members: read access
CREATE POLICY evidence_lineage_org_select
    ON evidence_lineage_links
    FOR SELECT
    TO authenticated
    USING (is_organization_member(organization_id));

-- All authenticated: can create lineage links
CREATE POLICY evidence_lineage_org_insert
    ON evidence_lineage_links
    FOR INSERT
    TO authenticated
    WITH CHECK (is_organization_member(organization_id));

-- ============================================================================
-- RLS POLICIES: evidence_ingestion_attempts
-- ============================================================================

-- Service role: full access
CREATE POLICY ingestion_attempts_service_full
    ON evidence_ingestion_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Owner/admin: read operational logs
CREATE POLICY ingestion_attempts_admin_select
    ON evidence_ingestion_attempts
    FOR SELECT
    TO authenticated
    USING (has_any_role(organization_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant to service role (for API usage)
GRANT ALL ON external_evidence_sources TO service_role;
GRANT ALL ON external_source_credentials TO service_role;
GRANT ALL ON external_evidence_records TO service_role;
GRANT ALL ON external_evidence_attachments TO service_role;
GRANT ALL ON evidence_lineage_links TO service_role;
GRANT ALL ON evidence_ingestion_attempts TO service_role;

-- Grant to authenticated (RLS enforces actual permissions)
GRANT SELECT, INSERT, UPDATE ON external_evidence_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE ON external_source_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON external_evidence_records TO authenticated;
GRANT SELECT, INSERT ON external_evidence_attachments TO authenticated;
GRANT SELECT, INSERT ON evidence_lineage_links TO authenticated;
GRANT SELECT ON evidence_ingestion_attempts TO authenticated;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_evidence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_external_sources_timestamp
    BEFORE UPDATE ON external_evidence_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_evidence_updated_at();

CREATE TRIGGER update_external_evidence_timestamp
    BEFORE UPDATE ON external_evidence_records
    FOR EACH ROW
    EXECUTE FUNCTION update_evidence_updated_at();

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Migration 035: AGEI Evidence Bridge schema complete
-- Tables: 6 new tables created
-- RLS: All policies configured
-- Indexes: Performance optimized
-- Integration: Ready for receipt linkage and Merkle sealing
