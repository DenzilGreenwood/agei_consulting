-- ============================================================================
-- AGEI Canonical Migration 025: Evidence-Preserving Cryptographic Erasure
-- ============================================================================
-- CIAF-LCM Concept:
--   GDPR Article 17 right to erasure with AGEI evidence preservation.
--   Cryptographic erasure: destroy/disable encryption keys rather than
--   delete receipt metadata. Preserves governance shell, erases readable content.
--
-- Key Features:
--   - Notice acknowledgment tracking
--   - Envelope encryption for user content (master key → DEK → content)
--   - Cryptographic erasure capability (destroy DEK, keep governance metadata)
--   - Privacy erasure request workflow
--   - Privacy status dashboard view
--
-- Consolidates:
--   025_evidence_preserving_crypto_erasure.sql (base tables)
--   026_fix_encryption_keys_schema.sql (envelope encryption columns)
--   028_fix_privacy_views_auth_user_id.sql (auth_user_id pattern)
--
-- Depends on:
--   001_identity_and_tenancy.sql (organizations, principals)
--   007_receipts_and_lineage.sql (receipts)
--   017_privacy_governance.sql (legal_holds, data_subjects)
--
-- Evidence Role:
--   Evidence-preserving erasure - keep audit shell, destroy content keys
-- ============================================================================

-- ============================================================================
-- TABLE: user_data_notices
-- ============================================================================
-- Purpose: Track acknowledgment of AGEI Data & Evidence Notice
-- Evidence: Required before users can create receipts/evidence
-- ============================================================================

CREATE TABLE user_data_notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    
    -- Notice details
    notice_version text NOT NULL,
    notice_text_hash text NOT NULL,
    
    -- Acknowledgment metadata
    acknowledged_at timestamptz NOT NULL DEFAULT now(),
    ip_hash text,
    user_agent_hash text,
    
    -- AGEI receipt linkage
    receipt_id uuid REFERENCES receipts(id),
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT user_data_notices_notice_version_format CHECK (
        notice_version ~ '^\d{4}-\d{2}-\d{2}$'
    ),
    CONSTRAINT user_data_notices_hash_format CHECK (
        notice_text_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_user_data_notices_user ON user_data_notices(user_id);
CREATE INDEX idx_user_data_notices_org ON user_data_notices(organization_id);
CREATE INDEX idx_user_data_notices_version ON user_data_notices(notice_version);
CREATE INDEX idx_user_data_notices_acknowledged ON user_data_notices(acknowledged_at DESC);

-- Grant Data API access
GRANT SELECT ON user_data_notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_data_notices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_data_notices TO service_role;

COMMENT ON TABLE user_data_notices IS 'Track acknowledgment of AGEI Data & Evidence Notice required before creating evidence';
COMMENT ON COLUMN user_data_notices.notice_version IS 'Format: YYYY-MM-DD for notice version dating';
COMMENT ON COLUMN user_data_notices.notice_text_hash IS 'SHA-256 hash of the full notice text shown to user';
COMMENT ON COLUMN user_data_notices.ip_hash IS 'Hashed IP address for verification, not stored in plain text';

-- ============================================================================
-- TABLE: subject_encryption_keys
-- ============================================================================
-- Purpose: Manage encryption keys for user/session/interaction content
-- Evidence: Key lifecycle for cryptographic erasure capability
--
-- Envelope Encryption Pattern:
--   1. Master key (managed by KMS/app secret) - NOT stored in database
--   2. Data Encryption Key (DEK) - generated per user/session
--   3. DEK encrypted with master key → stored in encrypted_key_material
--   4. Content encrypted with DEK → stored in receipt_encrypted_content
--   5. Crypto-erasure: destroy DEK → content becomes unreadable
--
-- IMPORTANT: Complete envelope encryption schema from start
-- No repair migration needed (folded in from 026)
-- ============================================================================

CREATE TABLE subject_encryption_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Subject identity (use user_id for auth users, subject_id for other entities)
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id uuid, -- Legacy/other entities, nullable
    
    -- Envelope encryption: encrypted DEK storage
    encrypted_key_material text,  -- DEK encrypted with master key
    key_iv text,                   -- Initialization vector for DEK encryption
    key_auth_tag text,             -- Authentication tag (GCM mode)
    
    -- Key reference (for external KMS if used instead of envelope encryption)
    key_ref text UNIQUE,
    key_provider text NOT NULL DEFAULT 'envelope_encryption',
    key_scope text NOT NULL DEFAULT 'user' CHECK (
        key_scope IN ('user', 'session', 'interaction', 'organization')
    ),
    key_algorithm text NOT NULL DEFAULT 'aes-256-gcm',
    
    -- Key status
    key_status text NOT NULL DEFAULT 'active' CHECK (
        key_status IN ('pending', 'active', 'disabled', 'destroyed')
    ),
    created_at timestamptz NOT NULL DEFAULT now(),
    activated_at timestamptz,
    disabled_at timestamptz,
    destroyed_at timestamptz,
    
    -- Erasure tracking
    destruction_reason text,
    erasure_request_id uuid, -- Links to privacy_erasure_requests
    
    -- Metadata
    metadata jsonb,
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT subject_encryption_keys_destroyed_has_reason CHECK (
        (key_status != 'destroyed') OR (destruction_reason IS NOT NULL)
    ),
    CONSTRAINT subject_encryption_keys_identity_required CHECK (
        user_id IS NOT NULL OR subject_id IS NOT NULL
    )
);

CREATE INDEX idx_subject_encryption_keys_org ON subject_encryption_keys(organization_id);
CREATE INDEX idx_subject_encryption_keys_user ON subject_encryption_keys(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_subject_encryption_keys_subject ON subject_encryption_keys(subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX idx_subject_encryption_keys_ref ON subject_encryption_keys(key_ref) WHERE key_ref IS NOT NULL;
CREATE INDEX idx_subject_encryption_keys_status ON subject_encryption_keys(key_status);
CREATE INDEX idx_subject_encryption_keys_scope ON subject_encryption_keys(key_scope);
CREATE INDEX idx_subject_encryption_keys_destroyed ON subject_encryption_keys(destroyed_at) WHERE destroyed_at IS NOT NULL;

-- Grant Data API access
GRANT SELECT ON subject_encryption_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON subject_encryption_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subject_encryption_keys TO service_role;

COMMENT ON TABLE subject_encryption_keys IS 'Manage encryption keys for user/session/interaction content - supports envelope encryption and cryptographic erasure';
COMMENT ON COLUMN subject_encryption_keys.user_id IS 'User this encryption key belongs to (auth.users.id) - use this for auth users';
COMMENT ON COLUMN subject_encryption_keys.subject_id IS 'Subject ID for non-auth entities (principals, agents, services) - nullable';
COMMENT ON COLUMN subject_encryption_keys.encrypted_key_material IS 'Encrypted Data Encryption Key (DEK) - encrypted with master key (envelope encryption)';
COMMENT ON COLUMN subject_encryption_keys.key_iv IS 'Initialization vector for the encrypted DEK';
COMMENT ON COLUMN subject_encryption_keys.key_auth_tag IS 'Authentication tag for GCM mode (DEK encryption)';
COMMENT ON COLUMN subject_encryption_keys.key_ref IS 'External KMS key reference (alternative to envelope encryption) - NEVER store actual key here';
COMMENT ON COLUMN subject_encryption_keys.key_scope IS 'Granularity: user (all content), session (one session), interaction (one receipt)';
COMMENT ON COLUMN subject_encryption_keys.destruction_reason IS 'Why key was destroyed: cryptographic_erasure, security_incident, key_rotation, user_request';

-- ============================================================================
-- TABLE: receipt_encrypted_content
-- ============================================================================
-- Purpose: Encrypted content storage separate from receipt metadata
-- Evidence: Allows cryptographic erasure while preserving governance shell
-- ============================================================================

CREATE TABLE receipt_encrypted_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    subject_id uuid NOT NULL,
    
    -- Encryption details
    encryption_key_ref text NOT NULL,
    encrypted_payload jsonb NOT NULL,
    payload_content_hash text,
    encryption_alg text NOT NULL DEFAULT 'aes-256-gcm',
    encryption_status text NOT NULL DEFAULT 'active' CHECK (
        encryption_status IN ('active', 'crypto_erased', 'key_rotated')
    ),
    
    -- Erasure tracking
    crypto_erased_at timestamptz,
    erasure_request_id uuid, -- Links to privacy_erasure_requests
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT receipt_encrypted_content_erased_has_timestamp CHECK (
        (encryption_status != 'crypto_erased') OR (crypto_erased_at IS NOT NULL)
    ),
    CONSTRAINT receipt_encrypted_content_hash_format CHECK (
        payload_content_hash IS NULL OR payload_content_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_receipt_encrypted_content_receipt ON receipt_encrypted_content(receipt_id);
CREATE INDEX idx_receipt_encrypted_content_org ON receipt_encrypted_content(organization_id);
CREATE INDEX idx_receipt_encrypted_content_subject ON receipt_encrypted_content(subject_id);
CREATE INDEX idx_receipt_encrypted_content_key_ref ON receipt_encrypted_content(encryption_key_ref);
CREATE INDEX idx_receipt_encrypted_content_status ON receipt_encrypted_content(encryption_status);
CREATE INDEX idx_receipt_encrypted_content_erased ON receipt_encrypted_content(crypto_erased_at) WHERE crypto_erased_at IS NOT NULL;

-- Grant Data API access
GRANT SELECT ON receipt_encrypted_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_encrypted_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_encrypted_content TO service_role;

COMMENT ON TABLE receipt_encrypted_content IS 'Encrypted content storage separate from receipt metadata - enables evidence-preserving cryptographic erasure';
COMMENT ON COLUMN receipt_encrypted_content.encrypted_payload IS 'Encrypted prompts, outputs, uploaded content, free-text context - NOT in plain receipt JSON';
COMMENT ON COLUMN receipt_encrypted_content.encryption_status IS 'active: readable with key; crypto_erased: key destroyed, content unreadable';
COMMENT ON COLUMN receipt_encrypted_content.crypto_erased_at IS 'When cryptographic erasure occurred - content is now unreadable';

-- ============================================================================
-- TABLE: privacy_erasure_requests
-- ============================================================================
-- Purpose: Track cryptographic erasure requests (GDPR Article 17)
-- Evidence: Erasure requests become evidence themselves
-- ============================================================================

CREATE TABLE privacy_erasure_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    subject_id uuid NOT NULL,
    requested_by uuid REFERENCES auth.users(id),
    
    -- Request details
    request_type text NOT NULL DEFAULT 'cryptographic_erasure' CHECK (
        request_type IN ('cryptographic_erasure', 'full_deletion', 'restricted_deletion')
    ),
    request_status text NOT NULL DEFAULT 'pending' CHECK (
        request_status IN ('pending', 'processing', 'completed', 'denied', 'restricted_due_to_hold')
    ),
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    
    -- Processing results
    affected_receipt_count integer DEFAULT 0,
    affected_keys_count integer DEFAULT 0,
    data_categories_erased text[] DEFAULT ARRAY[]::text[],
    data_categories_retained text[] DEFAULT ARRAY[]::text[],
    retention_basis text[] DEFAULT ARRAY[]::text[],
    
    -- Legal/security holds
    legal_hold_detected boolean DEFAULT false,
    legal_hold_ids uuid[], -- References legal_holds(id)
    verification_limitation_notice_given boolean DEFAULT true,
    
    -- AGEI receipt linkage
    erasure_receipt_id uuid REFERENCES receipts(id),
    
    -- Notes
    notes text,
    denial_reason text,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT privacy_erasure_requests_processed_has_timestamp CHECK (
        (request_status NOT IN ('completed', 'denied', 'restricted_due_to_hold')) OR (processed_at IS NOT NULL)
    ),
    CONSTRAINT privacy_erasure_requests_denied_has_reason CHECK (
        (request_status != 'denied') OR (denial_reason IS NOT NULL)
    )
);

CREATE INDEX idx_privacy_erasure_requests_org ON privacy_erasure_requests(organization_id);
CREATE INDEX idx_privacy_erasure_requests_subject ON privacy_erasure_requests(subject_id);
CREATE INDEX idx_privacy_erasure_requests_requested_by ON privacy_erasure_requests(requested_by);
CREATE INDEX idx_privacy_erasure_requests_status ON privacy_erasure_requests(request_status);
CREATE INDEX idx_privacy_erasure_requests_requested_at ON privacy_erasure_requests(requested_at DESC);
CREATE INDEX idx_privacy_erasure_requests_processed_at ON privacy_erasure_requests(processed_at DESC);
CREATE INDEX idx_privacy_erasure_requests_hold_detected ON privacy_erasure_requests(legal_hold_detected) WHERE legal_hold_detected = true;

-- Grant Data API access
GRANT SELECT ON privacy_erasure_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_erasure_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_erasure_requests TO service_role;

COMMENT ON TABLE privacy_erasure_requests IS 'Track GDPR Article 17 erasure requests - requests become evidence themselves';
COMMENT ON COLUMN privacy_erasure_requests.request_type IS 'cryptographic_erasure: destroy keys; full_deletion: remove rows; restricted_deletion: keep audit metadata';
COMMENT ON COLUMN privacy_erasure_requests.verification_limitation_notice_given IS 'User was warned that cryptographic erasure may limit later verification/investigation';
COMMENT ON COLUMN privacy_erasure_requests.retention_basis IS 'Legal basis for retained metadata: audit_integrity, security, legal_claims_defense, compliance';

-- ============================================================================
-- VIEW: privacy_status_summary
-- ============================================================================
-- Purpose: Summary view for user privacy status dashboard
--
-- AGEI PATTERN: Uses principals.auth_user_id, NOT external_id::uuid
-- Consolidated from migration 028 fix
-- ============================================================================

CREATE OR REPLACE VIEW privacy_status_summary AS
SELECT 
    u.id as user_id,
    u.email,
    o.id as organization_id,
    o.name as organization_name,
    
    -- Notice acknowledgment
    (SELECT notice_version 
     FROM user_data_notices 
     WHERE user_id = u.id 
     ORDER BY acknowledged_at DESC 
     LIMIT 1) as latest_notice_version,
    (SELECT acknowledged_at 
     FROM user_data_notices 
     WHERE user_id = u.id 
     ORDER BY acknowledged_at DESC 
     LIMIT 1) as latest_notice_acknowledged_at,
    
    -- Encryption keys (using user_id)
    (SELECT COUNT(*) 
     FROM subject_encryption_keys 
     WHERE user_id = u.id 
     AND key_status = 'active') as active_encryption_keys,
    (SELECT COUNT(*) 
     FROM subject_encryption_keys 
     WHERE user_id = u.id 
     AND key_status = 'destroyed') as destroyed_encryption_keys,
    
    -- Erasure requests (using user_id)
    (SELECT COUNT(*) 
     FROM privacy_erasure_requests 
     WHERE subject_id = u.id) as total_erasure_requests,
    (SELECT COUNT(*) 
     FROM privacy_erasure_requests 
     WHERE subject_id = u.id 
     AND request_status = 'completed') as completed_erasure_requests,
    (SELECT COUNT(*) 
     FROM privacy_erasure_requests 
     WHERE subject_id = u.id 
     AND request_status = 'restricted_due_to_hold') as restricted_erasure_requests,
    
    -- Legal holds (via data subjects)
    (SELECT COUNT(*) 
     FROM legal_holds lh
     JOIN data_subjects ds ON ds.id = lh.applies_to_data_subject_id
     WHERE ds.subject_key_hash = encode(sha256(u.id::text::bytea), 'hex')
     AND lh.status = 'active') as active_legal_holds,
    
    -- Encrypted content (using user_id)
    (SELECT COUNT(*) 
     FROM receipt_encrypted_content 
     WHERE subject_id = u.id 
     AND encryption_status = 'active') as active_encrypted_receipts,
    (SELECT COUNT(*) 
     FROM receipt_encrypted_content 
     WHERE subject_id = u.id 
     AND encryption_status = 'crypto_erased') as crypto_erased_receipts
    
FROM auth.users u
-- AGEI PATTERN: Use auth_user_id instead of external_id::uuid
LEFT JOIN principals p ON p.auth_user_id = u.id AND p.deleted_at IS NULL
LEFT JOIN organization_members om ON om.principal_id = p.id AND om.deleted_at IS NULL
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE u.deleted_at IS NULL;

COMMENT ON VIEW privacy_status_summary IS 'Summary view for user privacy status dashboard - uses auth_user_id for safe joins (NOT external_id::uuid)';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- AGEI PATTERN: All policies use auth_user_id, NOT external_id::uuid
-- Consolidated from migration 028 fix
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_data_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_encrypted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_erasure_requests ENABLE ROW LEVEL SECURITY;

-- user_data_notices policies
CREATE POLICY "Users can view their own data notices"
    ON user_data_notices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create data notice records"
    ON user_data_notices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- subject_encryption_keys policies
CREATE POLICY "Users can view their own encryption keys"
    ON subject_encryption_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view encryption keys in their org"
    ON subject_encryption_keys FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM principals p
            JOIN organization_members om ON om.principal_id = p.id
            WHERE p.auth_user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.deleted_at IS NULL
        )
    );

CREATE POLICY "System can manage encryption keys"
    ON subject_encryption_keys FOR ALL
    USING (true)
    WITH CHECK (true);

-- receipt_encrypted_content policies
CREATE POLICY "Users can view their own encrypted content"
    ON receipt_encrypted_content FOR SELECT
    USING (auth.uid() = subject_id);

CREATE POLICY "Admins can view encrypted content in their org"
    ON receipt_encrypted_content FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM principals p
            JOIN organization_members om ON om.principal_id = p.id
            WHERE p.auth_user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.deleted_at IS NULL
        )
    );

CREATE POLICY "System can manage encrypted content"
    ON receipt_encrypted_content FOR ALL
    USING (true)
    WITH CHECK (true);

-- privacy_erasure_requests policies
CREATE POLICY "Users can view their own erasure requests"
    ON privacy_erasure_requests FOR SELECT
    USING (auth.uid() = subject_id OR auth.uid() = requested_by);

CREATE POLICY "Users can create erasure requests for themselves"
    ON privacy_erasure_requests FOR INSERT
    WITH CHECK (auth.uid() = subject_id OR auth.uid() = requested_by);

CREATE POLICY "Admins can view erasure requests in their org"
    ON privacy_erasure_requests FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM principals p
            JOIN organization_members om ON om.principal_id = p.id
            WHERE p.auth_user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.deleted_at IS NULL
        )
    );

CREATE POLICY "Admins can update erasure requests in their org"
    ON privacy_erasure_requests FOR UPDATE
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM principals p
            JOIN organization_members om ON om.principal_id = p.id
            WHERE p.auth_user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.deleted_at IS NULL
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON user_data_notices TO authenticated;
GRANT INSERT ON user_data_notices TO authenticated;
GRANT SELECT ON subject_encryption_keys TO authenticated;
GRANT SELECT ON receipt_encrypted_content TO authenticated;
GRANT SELECT, INSERT ON privacy_erasure_requests TO authenticated;
GRANT SELECT ON privacy_status_summary TO authenticated;

-- ============================================================================
-- AGEI EVIDENCE-PRESERVING CRYPTOGRAPHIC ERASURE COMPLETE
-- ============================================================================
-- Envelope encryption pattern:
--   1. Master key managed outside database (KMS or app secret)
--   2. DEK (Data Encryption Key) per user/session
--   3. DEK encrypted with master key → stored in encrypted_key_material
--   4. Content encrypted with DEK → stored in receipt_encrypted_content
--   5. Crypto-erasure: destroy DEK → content unreadable, metadata preserved
--
-- GDPR Article 17 compliance:
--   - User requests erasure via privacy_erasure_requests
--   - System destroys subject_encryption_keys (updates key_status = 'destroyed')
--   - receipt_encrypted_content becomes unreadable (encryption_status = 'crypto_erased')
--   - Receipt metadata, governance evidence, audit trail preserved
--   - Legal holds block erasure (legal_hold_detected, verification_limitation_notice_given)
--
-- Complete schema from start - no repair migrations needed:
--   ✅ Envelope encryption columns (encrypted_key_material, key_iv, key_auth_tag)
--   ✅ user_id column for auth users
--   ✅ All views use auth_user_id (NOT external_id::uuid)
--   ✅ All RLS policies use auth_user_id
-- ============================================================================
