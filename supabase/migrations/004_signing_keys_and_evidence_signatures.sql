-- ============================================================================
-- AGEI AI Governance Evidence Infrastructure
-- Migration: 004 - Signing Keys and Evidence Signatures
-- ============================================================================
-- Extension Pack:
--   Core (Required)
-- ============================================================================
-- Purpose: Signature infrastructure for evidence-grade records
-- Default: Ed25519 signatures for all AGEI evidence
-- Enterprise: KMS/HSM-backed signing for audit-critical events
-- ============================================================================

-- ============================================================================
-- ENUM: key_storage_mode
-- ============================================================================

CREATE TYPE key_storage_mode AS ENUM (
    'local_demo',        -- Demo/development (insecure, not for production)
    'app_encrypted',     -- Application-managed encrypted keys
    'external_kms',      -- External KMS (AWS, Azure, GCP)
    'hsm',               -- Hardware Security Module
    'customer_managed'   -- Customer-provided key management
);

COMMENT ON TYPE key_storage_mode IS 'Key storage and management mode for signing keys';

-- ============================================================================
-- ENUM: signature_algorithm
-- ============================================================================

CREATE TYPE signature_algorithm AS ENUM (
    'ED25519',           -- Default: Fast, secure, 64-byte signatures
    'RSA-SHA256',        -- Enterprise: Industry standard
    'ECDSA-SHA256',      -- Enterprise: Elliptic curve
    'KMS',               -- External KMS-managed signing
    'HSM'                -- Hardware Security Module signing
);

COMMENT ON TYPE signature_algorithm IS 'Cryptographic signature algorithms supported by AGEI';

-- ============================================================================
-- TABLE: signing_keys
-- ============================================================================
-- Purpose: Organization signing key registry
-- Supports: Local Ed25519 keys (default) and enterprise KMS/HSM references
-- ============================================================================

CREATE TABLE signing_keys (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Key identity
    key_name text NOT NULL,
    key_purpose text NOT NULL DEFAULT 'evidence_signing',
    key_description text,
    
    -- Key storage and algorithm
    key_storage_mode key_storage_mode NOT NULL DEFAULT 'app_encrypted',
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    key_size int4,  -- 2048/4096 for RSA, 256/384 for ECDSA, 256 for Ed25519
    
    -- Public key (always stored, even for KMS)
    public_key text NOT NULL,  -- PEM or base64 encoded
    public_key_fingerprint text NOT NULL,  -- SHA-256 of public key for verification
    
    -- Private key (only for local/app-managed keys)
    encrypted_private_key text,  -- Encrypted with organization master key
    encryption_algorithm text,   -- Algorithm used to encrypt private key
    
    -- KMS/HSM references (only for external keys)
    kms_provider text,  -- aws_kms, azure_keyvault, gcp_kms, thales, etc.
    kms_key_id text,    -- KMS key identifier or ARN
    kms_region text,    -- Cloud region for KMS
    kms_config jsonb,   -- Provider-specific configuration
    
    -- Status and lifecycle
    is_active boolean NOT NULL DEFAULT true,
    is_default boolean NOT NULL DEFAULT false,  -- Default key for new signatures
    
    -- Usage tracking
    signature_count int8 NOT NULL DEFAULT 0,
    last_used_at timestamptz,
    
    -- Validity period
    valid_from timestamptz NOT NULL DEFAULT NOW(),
    valid_until timestamptz,
    
    -- Key rotation
    rotated_from uuid REFERENCES signing_keys(id),
    rotated_to uuid REFERENCES signing_keys(id),
    rotation_reason text,
    
    -- Audit
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    retired_at timestamptz,
    retired_by uuid REFERENCES principals(id),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT signing_keys_org_key_name_unique UNIQUE(organization_id, key_name),
    CONSTRAINT signing_keys_one_default_per_org EXCLUDE (organization_id WITH =) 
        WHERE (is_default = true AND is_active = true),
    
    -- Local keys must have encrypted private key
    CONSTRAINT signing_keys_local_has_private CHECK (
        (key_storage_mode IN ('local_demo', 'app_encrypted') AND encrypted_private_key IS NOT NULL) OR
        (key_storage_mode NOT IN ('local_demo', 'app_encrypted'))
    ),
    
    -- External keys must have KMS references
    CONSTRAINT signing_keys_external_has_kms CHECK (
        (key_storage_mode IN ('external_kms', 'hsm', 'customer_managed') AND kms_key_id IS NOT NULL) OR
        (key_storage_mode NOT IN ('external_kms', 'hsm', 'customer_managed'))
    ),
    
    -- Active keys must be within validity period
    CONSTRAINT signing_keys_validity_period CHECK (
        NOT is_active OR (
            valid_from <= NOW() AND 
            (valid_until IS NULL OR valid_until > NOW())
        )
    )
);

-- Indexes
CREATE INDEX idx_signing_keys_org ON signing_keys(organization_id);
CREATE INDEX idx_signing_keys_active ON signing_keys(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_signing_keys_default ON signing_keys(organization_id, is_default) WHERE is_default = true;
CREATE INDEX idx_signing_keys_fingerprint ON signing_keys(public_key_fingerprint);
CREATE INDEX idx_signing_keys_purpose ON signing_keys(key_purpose);
CREATE INDEX idx_signing_keys_storage_mode ON signing_keys(key_storage_mode);
CREATE INDEX idx_signing_keys_validity ON signing_keys(valid_from, valid_until);

-- Comments
COMMENT ON TABLE signing_keys IS 'Organization signing key registry. Default: Ed25519 app-managed keys. Enterprise: KMS/HSM references.';
COMMENT ON COLUMN signing_keys.key_storage_mode IS 'Where and how the key is stored (local_demo, app_encrypted, external_kms, hsm, customer_managed)';
COMMENT ON COLUMN signing_keys.signature_algorithm IS 'Cryptographic algorithm (ED25519, RSA-SHA256, ECDSA-SHA256, KMS, HSM)';
COMMENT ON COLUMN signing_keys.public_key_fingerprint IS 'SHA-256 fingerprint of public key for quick verification';
COMMENT ON COLUMN signing_keys.encrypted_private_key IS 'Private key encrypted with organization master key (only for app-managed keys)';
COMMENT ON COLUMN signing_keys.kms_key_id IS 'KMS key ARN/ID for external key management (AWS KMS, Azure Key Vault, GCP KMS, etc.)';
COMMENT ON COLUMN signing_keys.signature_count IS 'Total signatures created with this key (updated via trigger)';

-- ============================================================================
-- TABLE: evidence_signatures
-- ============================================================================
-- Purpose: Universal signature record for all evidence-grade AGEI objects
-- Records: Receipts, policies, vault objects, audit packs, watermarks, etc.
-- ============================================================================

CREATE TABLE evidence_signatures (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Signed object reference
    signed_object_type text NOT NULL,  -- 'receipt', 'policy_version', 'vault_object', etc.
    signed_object_id uuid NOT NULL,    -- ID of the signed record
    
    -- Signature payload (what was signed)
    signature_payload jsonb NOT NULL,  -- The canonicalized payload that was signed
    signature_payload_hash text NOT NULL,  -- SHA-256 hash of the payload
    
    -- Signature
    signature text NOT NULL,  -- Base64 encoded signature
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    
    -- Signing key reference
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    key_fingerprint text NOT NULL,  -- Public key fingerprint at time of signing
    
    -- Signer identity
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Verification
    verification_status text,  -- 'valid', 'invalid', 'key_expired', 'key_revoked', 'not_verified'
    verified_at timestamptz,
    verified_by uuid REFERENCES principals(id),
    verification_details jsonb,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT evidence_signatures_object_unique UNIQUE(signed_object_type, signed_object_id),
    CONSTRAINT evidence_signatures_hash_format CHECK (
        signature_payload_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

-- Indexes
CREATE INDEX idx_evidence_signatures_org ON evidence_signatures(organization_id);
CREATE INDEX idx_evidence_signatures_object ON evidence_signatures(signed_object_type, signed_object_id);
CREATE INDEX idx_evidence_signatures_key ON evidence_signatures(signing_key_id);
CREATE INDEX idx_evidence_signatures_signer ON evidence_signatures(signed_by);
CREATE INDEX idx_evidence_signatures_signed_at ON evidence_signatures(signed_at DESC);
CREATE INDEX idx_evidence_signatures_hash ON evidence_signatures(signature_payload_hash);
CREATE INDEX idx_evidence_signatures_verification ON evidence_signatures(verification_status);

-- Comments
COMMENT ON TABLE evidence_signatures IS 'Universal signature records for all evidence-grade AGEI objects. Supports verification and audit.';
COMMENT ON COLUMN evidence_signatures.signed_object_type IS 'Type of object signed (receipt, policy_version, gate_evaluation, vault_object, audit_pack, etc.)';
COMMENT ON COLUMN evidence_signatures.signature_payload IS 'The exact canonicalized JSONB payload that was signed';
COMMENT ON COLUMN evidence_signatures.signature_payload_hash IS 'SHA-256 hash of signature_payload for quick verification';
COMMENT ON COLUMN evidence_signatures.signature IS 'Cryptographic signature (base64 encoded). Ed25519 = 88 chars.';
COMMENT ON COLUMN evidence_signatures.key_fingerprint IS 'Public key fingerprint at time of signing (for key rotation tracking)';

-- ============================================================================
-- TRIGGER: Update signing key usage counter
-- ============================================================================

CREATE OR REPLACE FUNCTION update_signing_key_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE signing_keys
    SET 
        signature_count = signature_count + 1,
        last_used_at = NEW.signed_at
    WHERE id = NEW.signing_key_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_signing_key_usage
    AFTER INSERT ON evidence_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_signing_key_usage();

COMMENT ON FUNCTION update_signing_key_usage IS 'Increment signing key usage counter when new signature is created';

-- ============================================================================
-- FUNCTION: Get default signing key for organization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_default_signing_key(org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    key_id uuid;
BEGIN
    SELECT id INTO key_id
    FROM signing_keys
    WHERE organization_id = org_id
      AND is_active = true
      AND is_default = true
      AND valid_from <= NOW()
      AND (valid_until IS NULL OR valid_until > NOW())
    LIMIT 1;
    
    RETURN key_id;
END;
$$;

COMMENT ON FUNCTION get_default_signing_key IS 'Get the default active signing key for an organization';
