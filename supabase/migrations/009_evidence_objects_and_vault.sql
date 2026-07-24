-- ============================================================================
-- AGEI Layer: Evidence Objects and Vault
-- ============================================================================
-- CIAF-LCM Concept:
--   Lazy Capsule Materialization. Lightweight receipts all the time, full
--   evidence capsules when triggered, sealed vault for retention.
--
-- Tables:
--   evidence_objects, vault_objects
--
-- Depends on:
--   organizations, principals, schema_versions, receipts
--
-- Evidence Role:
--   - Lightweight receipts all the time
--   - Full evidence capsules when triggered
--   - Sealed vault for retention
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- TABLE: evidence_objects
-- ============================================================================
-- Purpose: Evidence payload storage - supports receipts with proof data
-- Evidence: Materialized evidence capsules with cryptographic integrity
-- ============================================================================

CREATE TABLE evidence_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Evidence classification
    evidence_type text NOT NULL,
    
    -- Evidence payload
    evidence_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Cryptographic integrity
    content_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all evidence objects)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Receipt linkage
    receipt_id uuid,
    
    -- Resource reference
    resource_type text,
    resource_id text,
    
    -- Payload metadata
    payload_size_bytes int4,
    
    -- External storage
    storage_bucket text,
    storage_path text,
    storage_content_hash text,
    media_type text,
    size_bytes int8,
    
    -- Sealing
    is_sealed boolean NOT NULL DEFAULT false,
    sealed_at timestamptz,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT evidence_objects_hash_format CHECK (content_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT evidence_objects_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_evidence_objects_org ON evidence_objects(organization_id);
CREATE INDEX idx_evidence_objects_type ON evidence_objects(evidence_type);
CREATE INDEX idx_evidence_objects_receipt ON evidence_objects(receipt_id);
CREATE INDEX idx_evidence_objects_resource ON evidence_objects(resource_type, resource_id);
CREATE INDEX idx_evidence_objects_hash ON evidence_objects(content_hash);
CREATE INDEX idx_evidence_objects_sealed ON evidence_objects(is_sealed) WHERE is_sealed = true;
CREATE INDEX idx_evidence_objects_created ON evidence_objects(created_at DESC);
CREATE INDEX idx_evidence_objects_signing_key ON evidence_objects(signing_key_id);
CREATE INDEX idx_evidence_objects_signed_by ON evidence_objects(signed_by);

COMMENT ON TABLE evidence_objects IS 'Evidence payload storage. All evidence objects cryptographically signed.';
COMMENT ON COLUMN evidence_objects.evidence_payload IS 'Full evidence capsule payload';
COMMENT ON COLUMN evidence_objects.content_hash IS 'SHA-256 hash of canonicalized evidence_payload. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN evidence_objects.signature IS 'REQUIRED digital signature over content_hash. Ed25519 default.';
COMMENT ON COLUMN evidence_objects.signing_key_id IS 'Reference to signing key used. Enables key rotation tracking.';
COMMENT ON COLUMN evidence_objects.storage_bucket IS 'External storage bucket for large payloads';
COMMENT ON COLUMN evidence_objects.storage_path IS 'External storage path for large payloads';
COMMENT ON COLUMN evidence_objects.is_sealed IS 'Once sealed, evidence object becomes immutable';

-- ============================================================================
-- TABLE: vault_objects
-- ============================================================================
-- Purpose: Sealed, archived evidence - completely immutable and cryptographically sealed
-- Evidence: Long-term retention with cryptographic sealing
-- ============================================================================

CREATE TABLE vault_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Vault classification
    vault_type text NOT NULL,
    
    -- Vault payload
    vault_payload jsonb NOT NULL,
    
    -- Cryptographic integrity
    content_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for vault - highest security)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    sealed_by uuid NOT NULL REFERENCES principals(id),
    sealed_at timestamptz NOT NULL,
    
    -- Source references
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Merkle batching
    merkle_root text,
    batch_receipt_ids uuid[],
    
    -- Retention
    retention_until timestamptz,
    compliance_tags jsonb,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT vault_objects_hash_format CHECK (content_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT vault_objects_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_vault_objects_org ON vault_objects(organization_id);
CREATE INDEX idx_vault_objects_type ON vault_objects(vault_type);
CREATE INDEX idx_vault_objects_receipt ON vault_objects(receipt_id);
CREATE INDEX idx_vault_objects_evidence ON vault_objects(evidence_object_id);
CREATE INDEX idx_vault_objects_hash ON vault_objects(content_hash);
CREATE INDEX idx_vault_objects_sealed_by ON vault_objects(sealed_by);
CREATE INDEX idx_vault_objects_sealed_at ON vault_objects(sealed_at DESC);
CREATE INDEX idx_vault_objects_retention ON vault_objects(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_vault_objects_signing_key ON vault_objects(signing_key_id);
CREATE INDEX idx_vault_objects_signed_by ON vault_objects(signed_by);

COMMENT ON TABLE vault_objects IS 'Sealed, archived evidence - completely immutable and cryptographically sealed. Highest security signatures required.';
COMMENT ON COLUMN vault_objects.vault_payload IS 'Sealed evidence package';
COMMENT ON COLUMN vault_objects.content_hash IS 'SHA-256 hash of canonicalized vault_payload. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN vault_objects.signature IS 'REQUIRED digital signature over content_hash. Ed25519 default. Enterprise: KMS/HSM.';
COMMENT ON COLUMN vault_objects.signing_key_id IS 'Reference to signing key used. Enables key rotation tracking.';
COMMENT ON COLUMN vault_objects.merkle_root IS 'Merkle root for batch verification';
COMMENT ON COLUMN vault_objects.retention_until IS 'Retention deadline for compliance';

-- Add FK from evidence_objects to receipts (receipts table created in migration 005)
-- This will be added after receipts table is created
