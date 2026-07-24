-- ============================================================================
-- AGEI Layer: Audit Packs and Verification
-- ============================================================================
-- CIAF-LCM Concept:
--   Compliance export and verification. Materialized evidence packages for
--   regulators and auditors. Verification jobs for evidence reconstruction.
--
-- Tables:
--   audit_packs, audit_pack_items, verification_jobs, incidents
--
-- Depends on:
--   organizations, principals, receipts, evidence_objects, vault_objects
--
-- Evidence Role:
--   Materialized evidence packages for regulators and auditors
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- TABLE: audit_packs
-- ============================================================================
-- Purpose: Exportable audit packages for compliance
-- Evidence: Sealed evidence bundles for regulators
-- ============================================================================

CREATE TABLE audit_packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Pack identity
    pack_name text NOT NULL,
    pack_type text NOT NULL,
    description text,
    
    -- Scope
    start_date timestamptz,
    end_date timestamptz,
    scope_filter jsonb,
    
    -- Status
    status text NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'collecting', 'sealed', 'exported', 'delivered', 'error')
    ),
    
    -- Sealing
    is_sealed boolean NOT NULL DEFAULT false,
    sealed_at timestamptz,
    sealed_by uuid REFERENCES principals(id),
    
    -- Cryptographic integrity (required when sealed)
    pack_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED when sealed)
    signature text,
    signature_algorithm signature_algorithm,
    signing_key_id uuid REFERENCES signing_keys(id),
    signed_by uuid REFERENCES principals(id),
    signed_at timestamptz,
    
    -- Export
    export_format text,
    export_url text,
    exported_at timestamptz,
    
    -- Statistics
    total_items int4 DEFAULT 0,
    total_receipts int4 DEFAULT 0,
    total_evidence int4 DEFAULT 0,
    total_size_bytes int8 DEFAULT 0,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT audit_packs_hash_format CHECK (pack_hash IS NULL OR pack_hash ~ '^sha256:[a-f0-9]{64}$'),
    -- Sealed packs MUST be signed
    CONSTRAINT audit_packs_sealed_requires_signature CHECK (
        NOT is_sealed OR (
            signature IS NOT NULL AND
            signature_algorithm IS NOT NULL AND
            signing_key_id IS NOT NULL AND
            signed_by IS NOT NULL AND
            signed_at IS NOT NULL
        )
    )
);

CREATE INDEX idx_audit_packs_org ON audit_packs(organization_id);
CREATE INDEX idx_audit_packs_type ON audit_packs(pack_type);
CREATE INDEX idx_audit_packs_status ON audit_packs(status);
CREATE INDEX idx_audit_packs_sealed ON audit_packs(is_sealed) WHERE is_sealed = true;
CREATE INDEX idx_audit_packs_created ON audit_packs(created_at DESC);
CREATE INDEX idx_audit_packs_signing_key ON audit_packs(signing_key_id) WHERE signing_key_id IS NOT NULL;
CREATE INDEX idx_audit_packs_signed_by ON audit_packs(signed_by) WHERE signed_by IS NOT NULL;

COMMENT ON TABLE audit_packs IS 'Exportable audit packages. Sealed packs MUST be cryptographically signed.';
COMMENT ON COLUMN audit_packs.pack_type IS 'Pack type: compliance_export, regulator_request, incident_investigation, audit_review';
COMMENT ON COLUMN audit_packs.pack_hash IS 'SHA-256 hash of sealed audit pack. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN audit_packs.signature IS 'REQUIRED digital signature when pack is sealed. Ed25519 default.';
COMMENT ON COLUMN audit_packs.signing_key_id IS 'Reference to signing key used for sealed pack.';

-- ============================================================================
-- TABLE: audit_pack_items
-- ============================================================================
-- Purpose: Contents of audit packs
-- Evidence: Snapshots of receipts, evidence, and related objects
-- ============================================================================

CREATE TABLE audit_pack_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_pack_id uuid NOT NULL REFERENCES audit_packs(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Item reference
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    
    -- Item snapshot
    item_snapshot jsonb NOT NULL,
    item_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all audit pack items)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Ordering
    item_order int4,
    item_section text,
    
    -- Metadata
    metadata jsonb,
    added_at timestamptz NOT NULL DEFAULT NOW(),
    added_by uuid REFERENCES principals(id),
    
    CONSTRAINT audit_pack_items_hash_format CHECK (item_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT audit_pack_items_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_audit_pack_items_pack ON audit_pack_items(audit_pack_id);
CREATE INDEX idx_audit_pack_items_org ON audit_pack_items(organization_id);
CREATE INDEX idx_audit_pack_items_type ON audit_pack_items(item_type);
CREATE INDEX idx_audit_pack_items_item_id ON audit_pack_items(item_id);
CREATE INDEX idx_audit_pack_items_order ON audit_pack_items(audit_pack_id, item_order);
CREATE INDEX idx_audit_pack_items_signing_key ON audit_pack_items(signing_key_id);
CREATE INDEX idx_audit_pack_items_signed_by ON audit_pack_items(signed_by);

COMMENT ON TABLE audit_pack_items IS 'Contents of audit packs. All items cryptographically signed.';
COMMENT ON COLUMN audit_pack_items.item_type IS 'Item type: receipt, evidence_object, vault_object, gate_evaluation, etc.';
COMMENT ON COLUMN audit_pack_items.item_snapshot IS 'Point-in-time snapshot of the item';
COMMENT ON COLUMN audit_pack_items.item_hash IS 'SHA-256 hash of item_snapshot. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN audit_pack_items.signature IS 'REQUIRED digital signature over item_hash. Ed25519 default.';
COMMENT ON COLUMN audit_pack_items.signing_key_id IS 'Reference to signing key used.';

-- ============================================================================
-- TABLE: verification_jobs
-- ============================================================================
-- Purpose: Verification task tracking
-- Evidence: Evidence reconstruction and verification
-- ============================================================================

CREATE TABLE verification_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Job identity
    job_type text NOT NULL,
    job_name text,
    
    -- Target
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    
    -- Configuration
    verification_config jsonb,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'running', 'completed', 'failed', 'cancelled')
    ),
    
    -- Results
    result_status text,
    result_payload jsonb,
    result_hash text,
    canonicalization_version text DEFAULT 'agei-json-v1',
    
    -- Findings
    findings jsonb,
    errors jsonb,
    warnings jsonb,
    
    -- Statistics
    items_checked int4 DEFAULT 0,
    items_passed int4 DEFAULT 0,
    items_failed int4 DEFAULT 0,
    
    -- Timing
    started_at timestamptz,
    completed_at timestamptz,
    duration_ms int4,
    
    -- Metadata
    triggered_by uuid REFERENCES principals(id),
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT verification_jobs_hash_format CHECK (result_hash IS NULL OR result_hash ~ '^sha256:[a-f0-9]{64}$')
);

CREATE INDEX idx_verification_jobs_org ON verification_jobs(organization_id);
CREATE INDEX idx_verification_jobs_type ON verification_jobs(job_type);
CREATE INDEX idx_verification_jobs_status ON verification_jobs(status);
CREATE INDEX idx_verification_jobs_target ON verification_jobs(target_type, target_id);
CREATE INDEX idx_verification_jobs_created ON verification_jobs(created_at DESC);

COMMENT ON TABLE verification_jobs IS 'Verification task tracking - evidence can be reconstructed and verified';
COMMENT ON COLUMN verification_jobs.job_type IS 'Job type: hash_verification, lineage_verification, signature_verification, etc.';
COMMENT ON COLUMN verification_jobs.result_hash IS 'SHA-256 hash of verification result. Format: sha256:<64 hex chars>';

-- ============================================================================
-- TABLE: incidents
-- ============================================================================
-- Purpose: Security and compliance incidents
-- Evidence: Incident tracking and investigation
-- ============================================================================

CREATE TABLE incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Incident identity
    incident_number text NOT NULL,
    title text NOT NULL,
    description text,
    
    -- Classification
    incident_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    status text NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'investigating', 'contained', 'resolved', 'closed')
    ),
    
    -- Related evidence
    related_receipt_ids uuid[],
    related_resource_type text,
    related_resource_id text,
    gate_evaluation_id uuid,
    
    -- Investigation
    root_cause text,
    impact_assessment text,
    corrective_actions jsonb,
    
    -- Timeline
    detected_at timestamptz NOT NULL DEFAULT NOW(),
    contained_at timestamptz,
    resolved_at timestamptz,
    
    -- Assignment
    assigned_to uuid REFERENCES principals(id),
    reported_by uuid REFERENCES principals(id),
    
    -- Audit pack linkage
    audit_pack_id uuid REFERENCES audit_packs(id),
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_incidents_org ON incidents(organization_id);
CREATE INDEX idx_incidents_number ON incidents(incident_number);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_detected ON incidents(detected_at DESC);
CREATE INDEX idx_incidents_assigned ON incidents(assigned_to);

COMMENT ON TABLE incidents IS 'Security and compliance incidents requiring investigation and corrective action';
COMMENT ON COLUMN incidents.incident_type IS 'Incident type: policy_violation, security_breach, data_leak, model_drift, etc.';

-- Update triggers
CREATE TRIGGER update_audit_packs_updated_at BEFORE UPDATE ON audit_packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_jobs_updated_at BEFORE UPDATE ON verification_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
