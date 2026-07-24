-- ============================================================================
-- AGEI Layer: Receipts and Lineage
-- ============================================================================
-- CIAF-LCM Concept:
--   Receipts are atomic evidence events. Receipt links form the chain of
--   custody. Full capsules can later be materialized from receipts +
--   evidence_objects + vault_objects.
--
--   This implements the core AGEI evidence spine: lightweight, immutable,
--   cryptographically linked receipts that prove events occurred.
--
-- Tables:
--   receipts, receipt_links, receipt_batches, receipt_batch_items
--
-- Depends on:
--   organizations, principals, schema_versions, gate_evaluations,
--   policy_versions
--
-- Evidence Role:
--   Core evidence spine - lightweight, immutable, cryptographically linked
--   receipts that can be independently verified through hash chains
--
-- Extension Pack:
--   Core (Required)
--
-- Hash Standard:
--   hash_algorithm = sha256
--   canonicalization_version = agei-json-v1
--   hash format = sha256:<64 lowercase hex>
-- ============================================================================

-- ============================================================================
-- TABLE: receipts
-- ============================================================================
-- Purpose: Immutable evidence records with cryptographic integrity
-- Evidence: Proves an event occurred at a specific time with specific payload
-- ============================================================================

CREATE TABLE receipts (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Receipt Classification
    receipt_type text NOT NULL,
    receipt_number text,
    
    -- Evidence Payload
    receipt_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Cryptographic Integrity
    content_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all evidence-grade receipts)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Temporal
    event_timestamp timestamptz NOT NULL,
    
    -- Context
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    policy_version_id uuid REFERENCES policy_versions(id),
    resource_type text,
    resource_id text,
    lifecycle_stage text,
    
    -- Optional Merkle Batching
    merkle_proof jsonb,
    
    -- Verification
    is_verified boolean NOT NULL DEFAULT false,
    verification_status text,
    verified_at timestamptz,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Hash format constraint
    CONSTRAINT receipts_hash_format CHECK (
        content_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    
    -- Signature format constraint
    CONSTRAINT receipts_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

COMMENT ON TABLE receipts IS 'Immutable evidence records with cryptographic integrity. Core of AGEI evidence spine.';
COMMENT ON COLUMN receipts.receipt_number IS 'Human-readable receipt identifier for search and display';
COMMENT ON COLUMN receipts.content_hash IS 'SHA-256 hash of canonicalized receipt_payload. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN receipts.canonicalization_version IS 'Canonicalization standard used. Default: agei-json-v1';
COMMENT ON COLUMN receipts.signature IS 'REQUIRED digital signature over content_hash. Ed25519 default (88 base64 chars).';
COMMENT ON COLUMN receipts.signature_algorithm IS 'Signature algorithm. Default: ED25519. Enterprise: KMS, HSM.';
COMMENT ON COLUMN receipts.signing_key_id IS 'Reference to signing key used. Enables key rotation tracking.';
COMMENT ON COLUMN receipts.signed_by IS 'Principal who signed the receipt';
COMMENT ON COLUMN receipts.signed_at IS 'When the receipt was signed';
COMMENT ON COLUMN receipts.event_timestamp IS 'When the event actually occurred (source timestamp)';
COMMENT ON COLUMN receipts.resource_type IS 'Type of resource this receipt applies to (model, dataset, deployment, etc.)';
COMMENT ON COLUMN receipts.resource_id IS 'Identifier of the resource';
COMMENT ON COLUMN receipts.lifecycle_stage IS 'Stage in AI lifecycle (training, deployment, inference, etc.)';
COMMENT ON COLUMN receipts.is_verified IS 'Whether the receipt hash has been verified';
COMMENT ON COLUMN receipts.verification_status IS 'Detailed verification status for UI display';

-- Indexes
CREATE INDEX idx_receipts_organization ON receipts(organization_id);
CREATE INDEX idx_receipts_type ON receipts(receipt_type);
CREATE INDEX idx_receipts_number ON receipts(receipt_number) WHERE receipt_number IS NOT NULL;
CREATE INDEX idx_receipts_event_timestamp ON receipts(event_timestamp);
CREATE INDEX idx_receipts_gate_evaluation ON receipts(gate_evaluation_id) WHERE gate_evaluation_id IS NOT NULL;
CREATE INDEX idx_receipts_content_hash ON receipts(content_hash);
CREATE INDEX idx_receipts_resource ON receipts(resource_type, resource_id) WHERE resource_type IS NOT NULL;
CREATE INDEX idx_receipts_created_by ON receipts(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_receipts_signing_key ON receipts(signing_key_id);
CREATE INDEX idx_receipts_signed_by ON receipts(signed_by);
CREATE INDEX idx_receipts_signed_at ON receipts(signed_at DESC);

-- ============================================================================
-- TABLE: receipt_links
-- ============================================================================
-- Purpose: Lineage relationships between receipts (chain of custody)
-- Evidence: Proves evidence chain connections through hash references
-- ============================================================================

CREATE TABLE receipt_links (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Lineage Relationship
    -- source_receipt_id = upstream / predecessor receipt
    -- target_receipt_id = downstream / successor receipt
    source_receipt_id uuid NOT NULL REFERENCES receipts(id),
    target_receipt_id uuid NOT NULL REFERENCES receipts(id),
    
    -- Link Type
    link_type text NOT NULL,
    
    -- Context
    link_payload jsonb,
    link_order int4,
    
    -- Metadata
    metadata jsonb,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Ensure no duplicate links
    CONSTRAINT unique_receipt_link UNIQUE (source_receipt_id, target_receipt_id, link_type)
);

COMMENT ON TABLE receipt_links IS 'Lineage relationships forming chain of custody between receipts.';
COMMENT ON COLUMN receipt_links.source_receipt_id IS 'Upstream/predecessor receipt in the lineage chain';
COMMENT ON COLUMN receipt_links.target_receipt_id IS 'Downstream/successor receipt in the lineage chain';
COMMENT ON COLUMN receipt_links.link_type IS 'Type of lineage relationship: trains_on, validates, deploys, infers_with, etc.';
COMMENT ON COLUMN receipt_links.link_order IS 'Order of link when multiple links of same type (e.g., ensemble models)';

-- Indexes
CREATE INDEX idx_receipt_links_source ON receipt_links(source_receipt_id);
CREATE INDEX idx_receipt_links_target ON receipt_links(target_receipt_id);
CREATE INDEX idx_receipt_links_organization ON receipt_links(organization_id);
CREATE INDEX idx_receipt_links_type ON receipt_links(link_type);

-- ============================================================================
-- TABLE: receipt_batches
-- ============================================================================
-- Purpose: Merkle tree batching for efficient verification
-- Evidence: Allows batch verification of multiple receipts
-- ============================================================================

CREATE TABLE receipt_batches (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Batch Metadata
    batch_number bigserial,
    batch_timestamp timestamptz NOT NULL DEFAULT NOW(),
    
    -- Merkle Root
    merkle_root_hash text NOT NULL,
    batch_size int NOT NULL,
    
    -- Context
    principal_id uuid REFERENCES principals(id),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE receipt_batches IS 'Merkle tree batches for efficient multi-receipt verification';
COMMENT ON COLUMN receipt_batches.merkle_root_hash IS 'Root hash of Merkle tree over batch receipts';

-- Indexes
CREATE INDEX idx_receipt_batches_organization ON receipt_batches(organization_id);
CREATE INDEX idx_receipt_batches_timestamp ON receipt_batches(batch_timestamp);

-- ============================================================================
-- TABLE: receipt_batch_items
-- ============================================================================
-- Purpose: Receipts included in Merkle batches
-- Evidence: Maps receipts to their batch position and Merkle proof
-- ============================================================================

CREATE TABLE receipt_batch_items (
    -- Identity
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Batch Reference
    batch_id uuid NOT NULL REFERENCES receipt_batches(id),
    receipt_id uuid NOT NULL REFERENCES receipts(id),
    
    -- Merkle Position
    batch_position int NOT NULL,
    merkle_proof jsonb NOT NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Ensure receipt appears once per batch
    CONSTRAINT unique_receipt_in_batch UNIQUE (batch_id, receipt_id)
);

COMMENT ON TABLE receipt_batch_items IS 'Maps receipts to Merkle batches with verification proofs';
COMMENT ON COLUMN receipt_batch_items.merkle_proof IS 'Merkle proof path for independent verification';

-- Indexes
CREATE INDEX idx_receipt_batch_items_batch ON receipt_batch_items(batch_id);
CREATE INDEX idx_receipt_batch_items_receipt ON receipt_batch_items(receipt_id);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure hash format compliance
ALTER TABLE receipts ADD CONSTRAINT check_hash_format 
    CHECK (content_hash ~ '^sha256:[a-f0-9]{64}$');

-- Ensure hash algorithm is sha256
ALTER TABLE receipts ADD CONSTRAINT check_hash_algorithm
    CHECK (hash_algorithm = 'sha256');

-- Ensure canonicalization version
ALTER TABLE receipts ADD CONSTRAINT check_canonicalization_version
    CHECK (canonicalization_version = 'agei-json-v1');

-- ============================================================================
-- End of Migration: 005_receipts_and_lineage.sql
-- ============================================================================
