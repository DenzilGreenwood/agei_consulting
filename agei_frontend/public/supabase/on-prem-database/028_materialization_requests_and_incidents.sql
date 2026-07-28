-- ============================================================================
-- AGEI Canonical Migration 028: Materialization Requests and Incidents
-- ============================================================================
-- Purpose:
--   Complete the Lazy Capsule Materialization (LCM) lifecycle with:
--     - Materialization request tracking (why capsule expanded)
--     - Incident evidence linking (connect disputes to evidence)
--     - Evidence custody model (tamper-evident state transitions)
--     - Gate-to-receipt binding (link decisions to evidence)
--
-- CIAF-LCM Concept:
--   Evidence capsules start lightweight. When audit, incident, dispute,
--   or regulator request triggers materialization, create materialization_request
--   to track why heavy evidence was expanded. Evidence custody events create
--   tamper-evident audit trail of evidence state transitions.
--
-- Key Features:
--   - materialization_requests table (LCM trigger tracking)
--   - incident_evidence_links table (connect incidents to evidence)
--   - evidence_custody_events table (tamper-evident custody trail)
--   - gate_evaluation_receipts table (bind gate decisions to receipts)
--   - Evidence/vault object custody extensions
--
-- Extracted from:
--   031_agei_lcm_full_alignment.sql
--
-- Depends on:
--   007_receipts_and_lineage.sql (receipts)
--   008_evidence_capsules_and_lcm.sql (evidence_capsules)
--   009_evidence_objects_and_vault.sql (evidence_objects, vault_objects)
--   011_audit_packs_and_verification.sql (audit_packs)
--   012_api_service_access.sql (incidents)
--   018_auth_helpers.sql (principals)
--   022_seed_policy_gate_receipt_registries.sql (materialization_reason_codes)
--
-- Evidence Role:
--   LCM materialization tracking - why lightweight became heavy evidence
-- ============================================================================

-- ============================================================================
-- TABLE: materialization_requests
-- ============================================================================
-- Purpose: Track why lightweight evidence capsule was expanded
-- Evidence: LCM trigger record explaining materialization reason
--
-- CIAF-LCM Materialization Flow:
--   1. Lightweight capsule exists (created at event time)
--   2. Trigger occurs (audit request, incident, dispute, regulator request)
--   3. materialization_request created with reason code
--   4. System expands capsule → creates evidence_object or vault_object
--   5. Capsule updated: materialization_status = 'materialized'
--   6. Request updated: status = 'completed', output_evidence_object_id set
-- ============================================================================

CREATE TABLE materialization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  requested_by_principal_id uuid REFERENCES principals(id),

  -- Trigger details
  trigger_type text NOT NULL CHECK (
    trigger_type IN ('audit_request', 'incident_review', 'customer_dispute', 'regulator_request', 
                     'policy_violation', 'human_review', 'forensic_verification', 'legal_hold')
  ),
  trigger_reference_id uuid,
  reason_code text REFERENCES materialization_reason_codes(code),
  reason text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),

  -- Request lifecycle
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'expired')
  ),
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,

  -- Materialization outputs
  output_evidence_object_id uuid REFERENCES evidence_objects(id),
  output_vault_object_id uuid REFERENCES vault_objects(id),
  output_audit_pack_id uuid REFERENCES audit_packs(id),

  -- Metadata
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_materialization_requests_org ON materialization_requests(organization_id);
CREATE INDEX idx_materialization_requests_status ON materialization_requests(status);
CREATE INDEX idx_materialization_requests_reason ON materialization_requests(reason_code) WHERE reason_code IS NOT NULL;
CREATE INDEX idx_materialization_requests_trigger ON materialization_requests(trigger_type, trigger_reference_id);
CREATE INDEX idx_materialization_requests_requested_at ON materialization_requests(requested_at DESC);
CREATE INDEX idx_materialization_requests_priority ON materialization_requests(priority, status) 
    WHERE status IN ('pending', 'running');

-- Grant Data API access
GRANT SELECT ON materialization_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON materialization_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON materialization_requests TO service_role;

COMMENT ON TABLE materialization_requests IS 'CIAF-LCM trigger record: explains why lightweight evidence was expanded into full materialized evidence.';
COMMENT ON COLUMN materialization_requests.trigger_type IS 'What triggered materialization: audit_request, incident_review, customer_dispute, regulator_request, policy_violation, human_review, forensic_verification, legal_hold';
COMMENT ON COLUMN materialization_requests.trigger_reference_id IS 'ID of triggering entity (incident ID, audit pack ID, legal hold ID, etc.)';
COMMENT ON COLUMN materialization_requests.reason_code IS 'Canonical reason code from materialization_reason_codes registry';
COMMENT ON COLUMN materialization_requests.output_evidence_object_id IS 'Evidence object created by materialization';
COMMENT ON COLUMN materialization_requests.output_vault_object_id IS 'Vault object created by materialization';
COMMENT ON COLUMN materialization_requests.output_audit_pack_id IS 'Audit pack created by materialization';

-- Add foreign key from evidence_capsules to materialization_requests
-- (if evidence_capsules table exists and doesn't already have this FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'evidence_capsules')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'fk_evidence_capsules_materialization_request'
     )
  THEN
    ALTER TABLE evidence_capsules
      ADD CONSTRAINT fk_evidence_capsules_materialization_request
      FOREIGN KEY (materialization_request_id)
      REFERENCES materialization_requests(id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ============================================================================
-- TABLE: incident_evidence_links
-- ============================================================================
-- Purpose: Link incidents/disputes to relevant evidence
-- Evidence: Connects incident investigations to receipts, capsules, objects
-- ============================================================================

CREATE TABLE incident_evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  
  -- Evidence targets (at least one required)
  receipt_id uuid REFERENCES receipts(id) ON DELETE RESTRICT,
  evidence_capsule_id uuid REFERENCES evidence_capsules(id) ON DELETE RESTRICT,
  evidence_object_id uuid REFERENCES evidence_objects(id) ON DELETE RESTRICT,
  vault_object_id uuid REFERENCES vault_objects(id) ON DELETE RESTRICT,
  audit_pack_id uuid REFERENCES audit_packs(id) ON DELETE SET NULL,
  
  -- Link details
  link_type text NOT NULL DEFAULT 'supporting_evidence' CHECK (
    link_type IN ('supporting_evidence', 'disputed_evidence', 'exonerating_evidence', 
                  'context_evidence', 'expert_analysis', 'external_evidence')
  ),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES principals(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  CONSTRAINT incident_evidence_links_has_target CHECK (
    receipt_id IS NOT NULL 
    OR evidence_capsule_id IS NOT NULL 
    OR evidence_object_id IS NOT NULL 
    OR vault_object_id IS NOT NULL 
    OR audit_pack_id IS NOT NULL
  )
);

CREATE INDEX idx_incident_evidence_links_incident ON incident_evidence_links(incident_id);
CREATE INDEX idx_incident_evidence_links_org ON incident_evidence_links(organization_id);
CREATE INDEX idx_incident_evidence_links_receipt ON incident_evidence_links(receipt_id) WHERE receipt_id IS NOT NULL;
CREATE INDEX idx_incident_evidence_links_capsule ON incident_evidence_links(evidence_capsule_id) WHERE evidence_capsule_id IS NOT NULL;
CREATE INDEX idx_incident_evidence_links_evidence ON incident_evidence_links(evidence_object_id) WHERE evidence_object_id IS NOT NULL;
CREATE INDEX idx_incident_evidence_links_vault ON incident_evidence_links(vault_object_id) WHERE vault_object_id IS NOT NULL;
CREATE INDEX idx_incident_evidence_links_audit_pack ON incident_evidence_links(audit_pack_id) WHERE audit_pack_id IS NOT NULL;

-- Grant Data API access
GRANT SELECT ON incident_evidence_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_evidence_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incident_evidence_links TO service_role;

COMMENT ON TABLE incident_evidence_links IS 'Links incidents/disputes to receipts, capsules, evidence objects, vault objects, and audit packs.';
COMMENT ON COLUMN incident_evidence_links.link_type IS 'Relationship: supporting_evidence, disputed_evidence, exonerating_evidence, context_evidence, expert_analysis, external_evidence';

-- ============================================================================
-- EXTEND: evidence_objects and vault_objects
-- ============================================================================
-- Add custody model fields to existing tables
-- ============================================================================

ALTER TABLE evidence_objects
  ADD COLUMN IF NOT EXISTS custody_state text NOT NULL DEFAULT 'created' CHECK (
    custody_state IN ('created', 'under_review', 'approved', 'sealed', 'archived', 
                      'legal_hold', 'crypto_erased', 'deleted')
  ),
  ADD COLUMN IF NOT EXISTS custody_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS privacy_treatment text NOT NULL DEFAULT 'metadata_only',
  ADD COLUMN IF NOT EXISTS data_classification text NOT NULL DEFAULT 'metadata_only',
  ADD COLUMN IF NOT EXISTS contains_personal_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_sensitive_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS erasure_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_capsule_id uuid REFERENCES evidence_capsules(id);

ALTER TABLE vault_objects
  ADD COLUMN IF NOT EXISTS custody_state text NOT NULL DEFAULT 'vaulted' CHECK (
    custody_state IN ('vaulted', 'unsealed', 'under_review', 'sealed', 'archived', 
                      'legal_hold', 'crypto_erased', 'deleted')
  ),
  ADD COLUMN IF NOT EXISTS custody_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS privacy_treatment text NOT NULL DEFAULT 'metadata_only',
  ADD COLUMN IF NOT EXISTS data_classification text NOT NULL DEFAULT 'metadata_only',
  ADD COLUMN IF NOT EXISTS contains_personal_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_sensitive_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS erasure_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_capsule_id uuid REFERENCES evidence_capsules(id);

CREATE INDEX IF NOT EXISTS idx_evidence_objects_custody_state ON evidence_objects(custody_state);
CREATE INDEX IF NOT EXISTS idx_evidence_objects_privacy_treatment ON evidence_objects(privacy_treatment);
CREATE INDEX IF NOT EXISTS idx_evidence_objects_legal_hold ON evidence_objects(legal_hold) WHERE legal_hold = true;
CREATE INDEX IF NOT EXISTS idx_evidence_objects_source_capsule ON evidence_objects(source_capsule_id) WHERE source_capsule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vault_objects_custody_state ON vault_objects(custody_state);
CREATE INDEX IF NOT EXISTS idx_vault_objects_privacy_treatment ON vault_objects(privacy_treatment);
CREATE INDEX IF NOT EXISTS idx_vault_objects_legal_hold ON vault_objects(legal_hold) WHERE legal_hold = true;
CREATE INDEX IF NOT EXISTS idx_vault_objects_source_capsule ON vault_objects(source_capsule_id) WHERE source_capsule_id IS NOT NULL;

COMMENT ON COLUMN evidence_objects.custody_state IS 'Custody lifecycle: created → under_review → approved/sealed → archived/legal_hold/crypto_erased';
COMMENT ON COLUMN evidence_objects.source_capsule_id IS 'Evidence capsule that was materialized to create this evidence object';
COMMENT ON COLUMN vault_objects.custody_state IS 'Vault lifecycle: vaulted → unsealed → under_review → sealed → archived/legal_hold/crypto_erased';
COMMENT ON COLUMN vault_objects.source_capsule_id IS 'Evidence capsule that was materialized to create this vault object';

-- ============================================================================
-- TABLE: evidence_custody_events
-- ============================================================================
-- Purpose: Tamper-evident audit trail of evidence state transitions
-- Evidence: Custody chain-of-custody for compliance and forensics
-- ============================================================================

CREATE TABLE evidence_custody_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  
  -- Evidence targets (at least one required)
  receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  evidence_capsule_id uuid REFERENCES evidence_capsules(id) ON DELETE SET NULL,
  evidence_object_id uuid REFERENCES evidence_objects(id) ON DELETE SET NULL,
  vault_object_id uuid REFERENCES vault_objects(id) ON DELETE SET NULL,

  -- Custody event details
  custody_event_type text NOT NULL CHECK (
    custody_event_type IN ('created', 'reviewed', 'approved', 'denied', 'sealed', 'unsealed', 
                           'transferred', 'archived', 'legal_hold_applied', 'legal_hold_released',
                           'crypto_erased', 'materialized', 'exported', 'verified', 'deleted')
  ),
  custody_state_before text,
  custody_state_after text,
  actor_principal_id uuid REFERENCES principals(id),

  -- Tamper evidence
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_hash text,
  hash_algorithm text NOT NULL DEFAULT 'sha256',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT evidence_custody_events_has_target CHECK (
    receipt_id IS NOT NULL 
    OR evidence_capsule_id IS NOT NULL 
    OR evidence_object_id IS NOT NULL 
    OR vault_object_id IS NOT NULL
  ),
  CONSTRAINT evidence_custody_events_hash_format CHECK (
    event_hash IS NULL OR event_hash ~ '^sha256:[a-f0-9]{64}$'
  )
);

CREATE INDEX idx_evidence_custody_events_org ON evidence_custody_events(organization_id);
CREATE INDEX idx_evidence_custody_events_type ON evidence_custody_events(custody_event_type);
CREATE INDEX idx_evidence_custody_events_created ON evidence_custody_events(created_at DESC);
CREATE INDEX idx_evidence_custody_events_receipt ON evidence_custody_events(receipt_id) WHERE receipt_id IS NOT NULL;
CREATE INDEX idx_evidence_custody_events_capsule ON evidence_custody_events(evidence_capsule_id) WHERE evidence_capsule_id IS NOT NULL;
CREATE INDEX idx_evidence_custody_events_evidence ON evidence_custody_events(evidence_object_id) WHERE evidence_object_id IS NOT NULL;
CREATE INDEX idx_evidence_custody_events_vault ON evidence_custody_events(vault_object_id) WHERE vault_object_id IS NOT NULL;

-- Grant Data API access
GRANT SELECT ON evidence_custody_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_custody_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_custody_events TO service_role;

COMMENT ON TABLE evidence_custody_events IS 'Tamper-evident custody transitions for receipts, capsules, evidence objects, and vault objects. Creates chain-of-custody audit trail.';
COMMENT ON COLUMN evidence_custody_events.custody_event_type IS 'Event type: created, reviewed, approved, denied, sealed, unsealed, transferred, archived, legal_hold_applied, legal_hold_released, crypto_erased, materialized, exported, verified, deleted';
COMMENT ON COLUMN evidence_custody_events.event_hash IS 'SHA-256 hash of event_payload for tamper detection';
COMMENT ON COLUMN evidence_custody_events.actor_principal_id IS 'Principal who performed the custody action';

-- ============================================================================
-- TABLE: gate_evaluation_receipts
-- ============================================================================
-- Purpose: Bind gate evaluations to receipts
-- Evidence: Links consequential gate decisions to evidence receipts
-- ============================================================================

CREATE TABLE gate_evaluation_receipts (
  gate_evaluation_id uuid NOT NULL REFERENCES gate_evaluations(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  
  relationship_type text NOT NULL DEFAULT 'records_decision' CHECK (
    relationship_type IN ('records_decision', 'supports_decision', 'records_override', 
                          'records_human_review', 'records_error')
  ),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES principals(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  PRIMARY KEY (gate_evaluation_id, receipt_id)
);

CREATE INDEX idx_gate_eval_receipts_gate ON gate_evaluation_receipts(gate_evaluation_id);
CREATE INDEX idx_gate_eval_receipts_receipt ON gate_evaluation_receipts(receipt_id);
CREATE INDEX idx_gate_eval_receipts_org ON gate_evaluation_receipts(organization_id);

-- Grant Data API access
GRANT SELECT ON gate_evaluation_receipts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_evaluation_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_evaluation_receipts TO service_role;

COMMENT ON TABLE gate_evaluation_receipts IS 'Binding between consequential gate decisions and AGEI receipts. Ensures every gate decision has evidence linkage.';
COMMENT ON COLUMN gate_evaluation_receipts.relationship_type IS 'How receipt relates to gate: records_decision (primary), supports_decision (context), records_override (human override), records_human_review (HITL), records_error (system error)';

-- Backfill simple one-to-one links where receipts already reference gate_evaluation_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'gate_evaluation_id'
  ) THEN
    INSERT INTO gate_evaluation_receipts (gate_evaluation_id, receipt_id, organization_id, relationship_type, created_at)
    SELECT r.gate_evaluation_id, r.id, r.organization_id, 'records_decision', now()
    FROM receipts r
    WHERE r.gate_evaluation_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- AGEI MATERIALIZATION AND INCIDENT EVIDENCE COMPLETE
-- ============================================================================
-- CIAF-LCM Materialization Flow:
--   1. Event occurs → receipt + lightweight capsule created
--   2. Audit/incident/dispute triggers materialization
--   3. materialization_request created with reason code
--   4. System expands capsule → evidence_object/vault_object
--   5. evidence_custody_events tracks state transitions
--   6. Incident investigation links evidence via incident_evidence_links
--   7. Gate decisions bound to receipts via gate_evaluation_receipts
--
-- Evidence Custody Chain:
--   created → under_review → approved → sealed → archived/legal_hold/crypto_erased
--   Every transition logged in evidence_custody_events with:
--     - Actor (who performed action)
--     - State change (before → after)
--     - Event hash (tamper detection)
--     - Timestamp (when transition occurred)
--
-- Incident Investigation:
--   - Incident created (customer complaint, policy violation, security event)
--   - materialization_request triggered (reason: INCIDENT_REVIEW)
--   - Lightweight capsules materialized to full evidence
--   - Evidence linked via incident_evidence_links
--   - Investigation proceeds with full evidence available
--   - Resolution documented in incident record
-- ============================================================================
