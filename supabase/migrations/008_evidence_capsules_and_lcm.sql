-- ============================================================================
-- AGEI Canonical Migration 008: Evidence Capsules and Lazy Capsule Materialization
-- ============================================================================
-- CIAF-LCM Concept:
--   Lazy Capsule Materialization (LCM) - the core principle that governance
--   evidence can be captured lightweight at event time, with heavy evidence
--   materialized only when needed for audit, incident review, dispute resolution,
--   regulator requests, or forensic verification.
--
-- Key Features:
--   - evidence_capsules table for lightweight governance proof
--   - Capture modes: lightweight, deferred, full, redacted, encrypted
--   - Materialization status tracking
--   - Privacy treatment and retention classification
--   - Links to receipts, evidence objects, vault objects
--   - Materialization reason tracking
--
-- Tables:
--   evidence_capsules
--
-- Depends on:
--   001_identity_and_tenancy.sql (organizations, principals)
--   007_receipts_and_lineage.sql (receipts)
--
-- Evidence Role:
--   Deferred evidence collection - capture governance proof now,
--   materialize heavy evidence later when actually needed
-- ============================================================================

-- ============================================================================
-- TABLE: evidence_capsules
-- ============================================================================
-- Purpose: Lightweight evidence capsules that can later materialize
-- Evidence: CIAF-LCM layer - defer heavy evidence until needed
--
-- Design:
--   - Every consequential governance event creates a receipt
--   - Receipt can have an associated evidence capsule
--   - Capsule contains minimal canonical payload (hashes, metadata)
--   - Heavy evidence (full prompts, responses, context) deferred
--   - Materialization triggered by: audit, incident, dispute, regulator
--
-- Materialization Flow:
--   1. Event occurs → receipt created (lightweight)
--   2. Evidence capsule created with canonical_payload (hashes + metadata)
--   3. Heavy evidence not stored (capture_mode: lightweight or deferred)
--   4. Audit/incident triggered → materialization_request created
--   5. Heavy evidence reconstructed/retrieved → evidence_object created
--   6. Capsule updated: materialization_status = materialized
-- ============================================================================

CREATE TABLE evidence_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE RESTRICT,

  -- Evidence classification
  capsule_type text NOT NULL,
  lifecycle_stage text,  -- References governance_lifecycle_stages if registry exists
  
  -- LCM capture and materialization
  capture_mode text NOT NULL DEFAULT 'lightweight' CHECK (
    capture_mode IN ('lightweight', 'deferred', 'full', 'redacted', 'encrypted')
  ),
  materialization_status text NOT NULL DEFAULT 'not_required' CHECK (
    materialization_status IN ('not_required', 'pending', 'materialized', 'failed', 'expired', 'crypto_erased')
  ),
  materialization_reason text,  -- References materialization_reason_codes if registry exists

  -- Canonical evidence
  capsule_hash text NOT NULL,
  hash_algorithm text NOT NULL DEFAULT 'sha256',
  canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
  canonical_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Evidence weight and retention
  evidence_weight text NOT NULL DEFAULT 'lightweight' CHECK (
    evidence_weight IN ('metadata_only', 'lightweight', 'standard', 'heavy', 'full')
  ),
  privacy_treatment text NOT NULL DEFAULT 'metadata_only',  -- References privacy_treatment_codes if registry exists
  retention_class text NOT NULL DEFAULT 'standard' CHECK (
    retention_class IN ('transient', 'standard', 'regulated', 'legal_hold', 'permanent')
  ),

  -- Privacy and legal classification
  data_classification text NOT NULL DEFAULT 'metadata_only',
  contains_personal_data boolean NOT NULL DEFAULT false,
  contains_sensitive_data boolean NOT NULL DEFAULT false,
  encryption_required boolean NOT NULL DEFAULT false,
  erasure_eligible boolean NOT NULL DEFAULT true,
  legal_hold boolean NOT NULL DEFAULT false,

  -- Materialization links
  materialized_evidence_object_id uuid,  -- References evidence_objects(id) - created in 009
  materialized_vault_object_id uuid,     -- References vault_objects(id) - created in 009
  materialization_request_id uuid,       -- References materialization_requests(id) - created in 028

  -- Metadata and timestamps
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES principals(id),
  materialized_at timestamptz,

  CONSTRAINT evidence_capsules_hash_format CHECK (capsule_hash ~ '^sha256:[a-f0-9]{64}$')
);

-- Indexes for efficient queries
CREATE INDEX idx_evidence_capsules_org ON evidence_capsules(organization_id);
CREATE INDEX idx_evidence_capsules_receipt ON evidence_capsules(receipt_id);
CREATE INDEX idx_evidence_capsules_type ON evidence_capsules(capsule_type);
CREATE INDEX idx_evidence_capsules_lifecycle_stage ON evidence_capsules(lifecycle_stage) WHERE lifecycle_stage IS NOT NULL;
CREATE INDEX idx_evidence_capsules_hash ON evidence_capsules(capsule_hash);
CREATE INDEX idx_evidence_capsules_capture_mode ON evidence_capsules(capture_mode);
CREATE INDEX idx_evidence_capsules_materialization_status ON evidence_capsules(materialization_status);
CREATE INDEX idx_evidence_capsules_materialized_evidence ON evidence_capsules(materialized_evidence_object_id) 
    WHERE materialized_evidence_object_id IS NOT NULL;
CREATE INDEX idx_evidence_capsules_materialized_vault ON evidence_capsules(materialized_vault_object_id) 
    WHERE materialized_vault_object_id IS NOT NULL;
CREATE INDEX idx_evidence_capsules_legal_hold ON evidence_capsules(legal_hold) WHERE legal_hold = true;
CREATE INDEX idx_evidence_capsules_created_at ON evidence_capsules(created_at DESC);

-- Grant Data API access
GRANT SELECT ON evidence_capsules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_capsules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_capsules TO service_role;

COMMENT ON TABLE evidence_capsules IS 'CIAF-LCM: Lightweight evidence capsules that can later materialize into full evidence objects. Enables deferred heavy evidence collection.';

COMMENT ON COLUMN evidence_capsules.capsule_type IS 'Type of evidence: input_hash, output_hash, context_hash, retrieval_proof, tool_authorization, delegation_proof, etc.';
COMMENT ON COLUMN evidence_capsules.capture_mode IS 'LCM capture mode: lightweight (minimal), deferred (reconstruct later), full (captured now), redacted, encrypted';
COMMENT ON COLUMN evidence_capsules.materialization_status IS 'LCM status: not_required, pending (triggered), materialized (complete), failed, expired, crypto_erased';
COMMENT ON COLUMN evidence_capsules.materialization_reason IS 'Why materialized: AUDIT_REQUEST, INCIDENT_REVIEW, REGULATOR_REQUEST, CUSTOMER_DISPUTE, LEGAL_HOLD, etc.';
COMMENT ON COLUMN evidence_capsules.canonical_payload IS 'Minimal canonical payload captured at event time: hashes, metadata, proof fragments. Heavy evidence deferred.';
COMMENT ON COLUMN evidence_capsules.evidence_weight IS 'Evidence size/complexity: metadata_only, lightweight, standard, heavy, full';
COMMENT ON COLUMN evidence_capsules.privacy_treatment IS 'Privacy handling: metadata_only, redacted, encrypted, pseudonymized, contains_personal_data, legal_hold, crypto_erased';
COMMENT ON COLUMN evidence_capsules.retention_class IS 'Retention policy: transient (short-term), standard, regulated (compliance), legal_hold, permanent';
COMMENT ON COLUMN evidence_capsules.materialized_evidence_object_id IS 'Evidence object created when capsule is materialized (links to 009_evidence_objects_and_vault)';
COMMENT ON COLUMN evidence_capsules.materialized_vault_object_id IS 'Vault object created when capsule is sealed/vaulted (links to 009_evidence_objects_and_vault)';
COMMENT ON COLUMN evidence_capsules.materialization_request_id IS 'Request that triggered materialization (links to 028_materialization_requests_and_incidents)';

-- ============================================================================
-- CIAF-LCM DESIGN PRINCIPLES
-- ============================================================================
-- 1. Governance first: Every consequential event creates receipt + capsule
-- 2. Evidence deferred: Heavy content not stored unless needed
-- 3. Materialization triggered: Audit, incident, dispute, regulator request
-- 4. Privacy preserved: Can crypto-erase while keeping governance metadata
-- 5. Performance optimized: Most queries only touch lightweight capsules
-- 6. Compliance ready: Legal holds prevent erasure, regulate retention
-- ============================================================================

-- ============================================================================
-- EXAMPLE: Prompt Governance with LCM
-- ============================================================================
-- User submits prompt to governed AI:
--
-- 1. Gate evaluation occurs
-- 2. Receipt created (gate outcome, decision reason, timestamp)
-- 3. Evidence capsule created:
--    - capsule_type: 'input_receipt'
--    - capture_mode: 'lightweight'
--    - canonical_payload: { prompt_hash: "sha256:abc...", length: 150, language: "en" }
--    - materialization_status: 'not_required'
--    - Full prompt NOT stored
--
-- 4. AI processes, response generated
-- 5. Another capsule for output hash
--
-- 6. LATER: Incident reported → materialization_request created
-- 7. System retrieves or reconstructs full prompt from provider logs
-- 8. evidence_object created with full content
-- 9. Capsule updated:
--    - materialization_status: 'materialized'
--    - materialized_evidence_object_id: <new evidence object>
--    - materialized_at: <timestamp>
--
-- Result: Governance proof available immediately, heavy evidence only when needed
-- ============================================================================
