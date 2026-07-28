-- ============================================================================
-- AGEI Layer: Downstream Provenance and Watermarking
-- ============================================================================
-- CIAF-LCM Concept:
--   Output verification and forensic matching. What did the AI produce?
--   Can artifacts be matched back to governed events? Explicit watermarks
--   and forensic fingerprints for provenance verification.
--
-- Tables:
--   artifact_release_records, watermark_descriptors, forensic_fingerprints,
--   provenance_verification_records
--
-- Depends on:
--   organizations, principals, receipts, evidence_objects, gate_evaluations,
--   policy_versions
--
-- Evidence Role:
--   What did the AI produce? Can artifacts be matched back to governed events?
--
-- Extension Pack:
--   AGEI Provenance Pack (Optional)
-- ============================================================================

-- ============================================================================
-- TABLE: watermark_descriptors
-- ============================================================================
-- Purpose: Explicit watermark evidence
-- Evidence: Visible/metadata/QR/embedded/steganographic markers
-- ============================================================================

CREATE TABLE watermark_descriptors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Artifact reference
    artifact_release_id uuid NOT NULL,
    
    -- Watermark classification
    watermark_type text NOT NULL,
    method_name text NOT NULL,
    method_version text NOT NULL,
    
    -- Watermark payload
    watermark_payload_hash text,
    marker_id text,
    location_descriptor jsonb,
    verification_hints jsonb,
    
    -- Cryptographic integrity
    descriptor_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all watermark descriptors)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT watermark_descriptors_hash_format CHECK (
        descriptor_hash ~ '^sha256:[a-f0-9]{64}$' AND
        (watermark_payload_hash IS NULL OR watermark_payload_hash ~ '^sha256:[a-f0-9]{64}$')
    ),
    CONSTRAINT watermark_descriptors_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_watermark_descriptors_org ON watermark_descriptors(organization_id);
CREATE INDEX idx_watermark_descriptors_artifact ON watermark_descriptors(artifact_release_id);
CREATE INDEX idx_watermark_descriptors_type ON watermark_descriptors(watermark_type);
CREATE INDEX idx_watermark_descriptors_marker ON watermark_descriptors(marker_id);
CREATE INDEX idx_watermark_descriptors_signing_key ON watermark_descriptors(signing_key_id);
CREATE INDEX idx_watermark_descriptors_signed_by ON watermark_descriptors(signed_by);

COMMENT ON TABLE watermark_descriptors IS 'Explicit watermark evidence. All descriptors cryptographically signed.';
COMMENT ON COLUMN watermark_descriptors.watermark_type IS 'Watermark type: visible, metadata, qr_code, embedded, steganographic, audio, etc.';
COMMENT ON COLUMN watermark_descriptors.marker_id IS 'Unique watermark identifier for tracking';
COMMENT ON COLUMN watermark_descriptors.signature IS 'REQUIRED digital signature over descriptor_hash. Ed25519 default.';

-- ============================================================================
-- TABLE: forensic_fingerprints
-- ============================================================================
-- Purpose: Forensic fingerprint evidence
-- Evidence: Downstream provenance when watermarks are missing/degraded
-- ============================================================================

CREATE TABLE forensic_fingerprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Artifact reference
    artifact_release_id uuid,
    
    -- Fingerprint method
    fingerprint_method text NOT NULL,
    fingerprint_version text NOT NULL,
    artifact_type text NOT NULL,
    
    -- Fingerprint payload
    fingerprint_payload jsonb NOT NULL,
    fingerprint_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all forensic fingerprints)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Fingerprint configuration
    zone_count int4,
    zone_size int4,
    top_k int4,
    threshold numeric,
    match_rule text,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT forensic_fingerprints_hash_format CHECK (
        fingerprint_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    CONSTRAINT forensic_fingerprints_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_forensic_fingerprints_org ON forensic_fingerprints(organization_id);
CREATE INDEX idx_forensic_fingerprints_artifact ON forensic_fingerprints(artifact_release_id);
CREATE INDEX idx_forensic_fingerprints_method ON forensic_fingerprints(fingerprint_method);
CREATE INDEX idx_forensic_fingerprints_type ON forensic_fingerprints(artifact_type);
CREATE INDEX idx_forensic_fingerprints_signing_key ON forensic_fingerprints(signing_key_id);
CREATE INDEX idx_forensic_fingerprints_signed_by ON forensic_fingerprints(signed_by);

COMMENT ON TABLE forensic_fingerprints IS 'Forensic fingerprint evidence. All fingerprints cryptographically signed.';
COMMENT ON COLUMN forensic_fingerprints.fingerprint_method IS 'Fingerprint method: image_hash, audio_spectral, text_semantic, etc.';
COMMENT ON COLUMN forensic_fingerprints.zone_count IS 'Number of zones for zoned fingerprinting';
COMMENT ON COLUMN forensic_fingerprints.signature IS 'REQUIRED digital signature over fingerprint_hash. Ed25519 default.';

-- ============================================================================
-- TABLE: provenance_verification_records
-- ============================================================================
-- Purpose: Investigator/reviewer workflow records
-- Evidence: Downstream artifact provenance verification
-- ============================================================================

CREATE TABLE provenance_verification_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Verification identity
    verification_id text NOT NULL,
    
    -- Suspect artifact
    suspect_artifact_type text NOT NULL,
    suspect_artifact_hash text,
    suspect_storage_bucket text,
    suspect_storage_path text,
    
    -- Verification method
    verification_method text NOT NULL,
    verification_result text NOT NULL,
    confidence_score numeric,
    
    -- Matched records
    matched_artifact_release_id uuid,
    matched_fingerprint_id uuid REFERENCES forensic_fingerprints(id),
    
    -- CIAF linkage
    verification_receipt_id uuid,
    evidence_object_id uuid,
    
    -- Reviewer
    reviewer_principal_id uuid REFERENCES principals(id),
    verified_at timestamptz NOT NULL,
    
    -- Verification payload
    verification_payload jsonb,
    verification_payload_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all provenance verifications)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT provenance_verification_records_hash_format CHECK (
        (suspect_artifact_hash IS NULL OR suspect_artifact_hash ~ '^sha256:[a-f0-9]{64}$') AND
        verification_payload_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    CONSTRAINT provenance_verification_records_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_provenance_verification_records_org ON provenance_verification_records(organization_id);
CREATE INDEX idx_provenance_verification_records_verification_id ON provenance_verification_records(verification_id);
CREATE INDEX idx_provenance_verification_records_artifact_type ON provenance_verification_records(suspect_artifact_type);
CREATE INDEX idx_provenance_verification_records_result ON provenance_verification_records(verification_result);
CREATE INDEX idx_provenance_verification_records_matched_release ON provenance_verification_records(matched_artifact_release_id);
CREATE INDEX idx_provenance_verification_records_signing_key ON provenance_verification_records(signing_key_id);
CREATE INDEX idx_provenance_verification_records_signed_by ON provenance_verification_records(signed_by);

COMMENT ON TABLE provenance_verification_records IS 'Investigator/reviewer workflow records. All verifications cryptographically signed.';
COMMENT ON COLUMN provenance_verification_records.verification_method IS 'Verification method: watermark_check, fingerprint_match, hash_comparison, etc.';
COMMENT ON COLUMN provenance_verification_records.confidence_score IS 'Confidence score 0-1 for fuzzy matching methods';
COMMENT ON COLUMN provenance_verification_records.signature IS 'REQUIRED digital signature over verification_payload_hash. Ed25519 default.';

-- ============================================================================
-- TABLE: artifact_release_records
-- ============================================================================
-- Purpose: Downstream artifact release evidence
-- Evidence: Pre/post watermark hashes and policy/gate context for released artifacts
-- ============================================================================

CREATE TABLE artifact_release_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Release identity
    release_id text NOT NULL,
    artifact_type text NOT NULL,
    artifact_id text NOT NULL,
    
    -- Source linkage
    source_receipt_id uuid,
    release_receipt_id uuid,
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    
    -- Watermarking
    pre_watermark_hash text,
    post_watermark_hash text,
    release_content_hash text,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all artifact releases)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Distribution
    distribution_context text,
    released_to text,
    released_by uuid REFERENCES principals(id),
    released_at timestamptz NOT NULL,
    
    -- CIAF linkage
    evidence_object_id uuid,
    vault_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT artifact_release_records_hash_format CHECK (
        (pre_watermark_hash IS NULL OR pre_watermark_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (post_watermark_hash IS NULL OR post_watermark_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (release_content_hash IS NULL OR release_content_hash ~ '^sha256:[a-f0-9]{64}$')
    ),
    CONSTRAINT artifact_release_records_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_artifact_release_records_org ON artifact_release_records(organization_id);
CREATE INDEX idx_artifact_release_records_release_id ON artifact_release_records(release_id);
CREATE INDEX idx_artifact_release_records_artifact ON artifact_release_records(artifact_type, artifact_id);
CREATE INDEX idx_artifact_release_records_released ON artifact_release_records(released_at DESC);
CREATE INDEX idx_artifact_release_records_signing_key ON artifact_release_records(signing_key_id);
CREATE INDEX idx_artifact_release_records_signed_by ON artifact_release_records(signed_by);

COMMENT ON TABLE artifact_release_records IS 'Downstream artifact release evidence. All releases cryptographically signed.';
COMMENT ON COLUMN artifact_release_records.signature IS 'REQUIRED digital signature. Ed25519 default.';
