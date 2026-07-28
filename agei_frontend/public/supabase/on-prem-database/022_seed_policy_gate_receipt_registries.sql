-- ============================================================================
-- AGEI Canonical Migration 022: Policy/Gate/Receipt Registries
-- ============================================================================
-- Purpose:
--   Canonical AGEI vocabulary registries for:
--     - Receipt types (taxonomy of evidence receipts)
--     - Governance lifecycle stages (where gates/receipts apply)
--     - Decision reason codes (why gate approved/denied/escalated)
--     - Materialization reason codes (why evidence expanded)
--     - Privacy treatment codes (privacy handling vocabulary)
--
-- CIAF-LCM Design:
--   Text registries instead of PostgreSQL enums enable vocabulary evolution
--   without enum rewrite migrations. Registries provide:
--     - Canonical taxonomy preventing type drift
--     - Default configurations for capture/retention/privacy
--     - Machine-readable decision/reason codes
--     - Audit trail of vocabulary changes
--
-- Extracted from:
--   031_agei_lcm_full_alignment.sql
--
-- Depends on:
--   001_identity_and_tenancy.sql (organizations)
--
-- Used by:
--   007_receipts_and_lineage.sql (references receipt_type_registry)
--   008_evidence_capsules_and_lcm.sql (references privacy_treatment_codes, etc.)
--   Various other migrations (reference these canonical vocabularies)
-- ============================================================================

-- ============================================================================
-- TABLE: receipt_type_registry
-- ============================================================================
-- Purpose: Canonical taxonomy of AGEI receipt types
-- Prevents receipt_type drift across services and organizations
-- ============================================================================

CREATE TABLE receipt_type_registry (
  receipt_type text PRIMARY KEY,
  description text NOT NULL,
  
  -- LCM defaults
  default_capture_mode text NOT NULL DEFAULT 'lightweight' CHECK (
    default_capture_mode IN ('lightweight', 'deferred', 'full', 'redacted', 'encrypted')
  ),
  default_retention_class text NOT NULL DEFAULT 'standard' CHECK (
    default_retention_class IN ('transient', 'standard', 'regulated', 'legal_hold', 'permanent')
  ),
  default_privacy_treatment text NOT NULL DEFAULT 'metadata_only',
  
  -- Receipt requirements
  requires_signature boolean NOT NULL DEFAULT true,
  requires_lineage boolean NOT NULL DEFAULT true,
  is_consequential boolean NOT NULL DEFAULT true,
  
  -- Lifecycle
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_receipt_type_registry_active ON receipt_type_registry(active) WHERE active = true;

-- Grant Data API access
GRANT SELECT ON receipt_type_registry TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_type_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_type_registry TO service_role;

COMMENT ON TABLE receipt_type_registry IS 'Canonical AGEI receipt taxonomy. Prevents receipt_type drift across services.';
COMMENT ON COLUMN receipt_type_registry.requires_signature IS 'Whether receipts of this type should be cryptographically signed.';
COMMENT ON COLUMN receipt_type_registry.is_consequential IS 'Whether this receipt type records a consequential governance decision.';

-- ============================================================================
-- TABLE: governance_lifecycle_stages
-- ============================================================================
-- Purpose: Canonical lifecycle points where gates/receipts can be enforced
-- Defines the governance workflow stages in CIAF-LCM process
-- ============================================================================

CREATE TABLE governance_lifecycle_stages (
  stage_code text PRIMARY KEY,
  label text NOT NULL,
  description text,
  stage_order int4 NOT NULL DEFAULT 0,
  
  -- Default requirements
  default_gate_required boolean NOT NULL DEFAULT false,
  default_receipt_required boolean NOT NULL DEFAULT true,
  default_capture_mode text NOT NULL DEFAULT 'lightweight' CHECK (
    default_capture_mode IN ('lightweight', 'deferred', 'full', 'redacted', 'encrypted')
  ),
  
  -- Lifecycle
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_governance_lifecycle_stages_order ON governance_lifecycle_stages(stage_order);
CREATE INDEX idx_governance_lifecycle_stages_active ON governance_lifecycle_stages(active) WHERE active = true;

-- Grant Data API access
GRANT SELECT ON governance_lifecycle_stages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON governance_lifecycle_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON governance_lifecycle_stages TO service_role;

COMMENT ON TABLE governance_lifecycle_stages IS 'Canonical lifecycle points where AGEI can enforce gates and create receipts.';
COMMENT ON COLUMN governance_lifecycle_stages.stage_order IS 'Sequence order for typical CIAF-LCM workflow visualization.';

-- ============================================================================
-- TABLE: decision_reason_codes
-- ============================================================================
-- Purpose: Machine-readable codes for gate outcomes and decisions
-- Enables consistent decision reasoning across policy engines
-- ============================================================================

CREATE TABLE decision_reason_codes (
  code text PRIMARY KEY,
  category text NOT NULL,
  default_outcome text CHECK (
    default_outcome IS NULL OR default_outcome IN ('approve', 'deny', 'escalate', 'inspect', 'require_approval', 'require_elevation')
  ),
  severity text NOT NULL DEFAULT 'medium' CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  description text NOT NULL,
  
  -- Lifecycle
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_decision_reason_codes_category ON decision_reason_codes(category);
CREATE INDEX idx_decision_reason_codes_severity ON decision_reason_codes(severity);
CREATE INDEX idx_decision_reason_codes_active ON decision_reason_codes(active) WHERE active = true;

-- Grant Data API access
GRANT SELECT ON decision_reason_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_reason_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_reason_codes TO service_role;

COMMENT ON TABLE decision_reason_codes IS 'Machine-readable decision codes for gate outcomes, denials, escalations, and inspections.';
COMMENT ON COLUMN decision_reason_codes.category IS 'Decision category: approval, denial, escalation, inspection, privilege, privacy, legal, error.';
COMMENT ON COLUMN decision_reason_codes.default_outcome IS 'Typical outcome when this reason applies: approve, deny, escalate, inspect, require_approval, require_elevation.';

-- ============================================================================
-- TABLE: materialization_reason_codes
-- ============================================================================
-- Purpose: Reasons why lightweight evidence capsule is expanded
-- Tracks why heavy evidence materialization was triggered
-- ============================================================================

CREATE TABLE materialization_reason_codes (
  code text PRIMARY KEY,
  category text NOT NULL,
  description text NOT NULL,
  default_priority text NOT NULL DEFAULT 'normal' CHECK (
    default_priority IN ('low', 'normal', 'high', 'urgent')
  ),
  
  -- Lifecycle
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_materialization_reason_codes_category ON materialization_reason_codes(category);
CREATE INDEX idx_materialization_reason_codes_priority ON materialization_reason_codes(default_priority);
CREATE INDEX idx_materialization_reason_codes_active ON materialization_reason_codes(active) WHERE active = true;

-- Grant Data API access
GRANT SELECT ON materialization_reason_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON materialization_reason_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON materialization_reason_codes TO service_role;

COMMENT ON TABLE materialization_reason_codes IS 'Reasons a lightweight capsule is expanded into materialized evidence.';
COMMENT ON COLUMN materialization_reason_codes.category IS 'Materialization category: audit, regulatory, incident, dispute, policy, hitl, verification, legal.';

-- ============================================================================
-- TABLE: privacy_treatment_codes
-- ============================================================================
-- Purpose: Canonical privacy handling vocabulary
-- Used across receipts, capsules, evidence, vault, audit packs
-- ============================================================================

CREATE TABLE privacy_treatment_codes (
  code text PRIMARY KEY,
  description text NOT NULL,
  
  -- Privacy characteristics
  contains_personal_data boolean NOT NULL DEFAULT false,
  contains_sensitive_data boolean NOT NULL DEFAULT false,
  encryption_required boolean NOT NULL DEFAULT false,
  erasure_eligible boolean NOT NULL DEFAULT true,
  legal_hold_compatible boolean NOT NULL DEFAULT true,
  
  -- Lifecycle
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_privacy_treatment_codes_active ON privacy_treatment_codes(active) WHERE active = true;
CREATE INDEX idx_privacy_treatment_codes_personal_data ON privacy_treatment_codes(contains_personal_data) 
    WHERE contains_personal_data = true;
CREATE INDEX idx_privacy_treatment_codes_sensitive_data ON privacy_treatment_codes(contains_sensitive_data) 
    WHERE contains_sensitive_data = true;

-- Grant Data API access
GRANT SELECT ON privacy_treatment_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_treatment_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_treatment_codes TO service_role;

COMMENT ON TABLE privacy_treatment_codes IS 'Canonical privacy treatment vocabulary for receipts, capsules, evidence, vault objects, and audit packs.';
COMMENT ON COLUMN privacy_treatment_codes.erasure_eligible IS 'Whether evidence with this treatment can be crypto-erased.';
COMMENT ON COLUMN privacy_treatment_codes.legal_hold_compatible IS 'Whether this treatment is compatible with legal hold requirements.';

-- ============================================================================
-- SEED: Receipt Type Registry
-- ============================================================================
-- Canonical AGEI receipt types for governance evidence
-- ============================================================================

INSERT INTO receipt_type_registry (
  receipt_type, description, default_capture_mode, default_retention_class,
  default_privacy_treatment, requires_signature, requires_lineage, is_consequential
)
VALUES
  ('identity_receipt', 'Records principal/session identity context for a governed event.', 'lightweight', 'standard', 'metadata_only', true, true, true),
  ('session_receipt', 'Records creation or continuation of an AI/user/agent session.', 'lightweight', 'standard', 'metadata_only', true, true, true),
  ('provider_config_receipt', 'Records model/provider/runtime configuration used for an interaction.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('input_receipt', 'Records hash and governed metadata for user/system input.', 'lightweight', 'standard', 'encrypted', true, true, true),
  ('retrieval_receipt', 'Records retrieval, context, RAG, or tool context supplied to the model.', 'deferred', 'standard', 'encrypted', true, true, true),
  ('policy_evaluation_receipt', 'Records policy rule evaluation evidence.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('gate_evaluation_receipt', 'Records governance gate decision and reason code.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('tool_authorization_receipt', 'Records authorization or denial of a tool/action request.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('delegation_receipt', 'Records agent delegation, scope, and authority transfer.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('model_output_receipt', 'Records model output metadata and hash.', 'lightweight', 'standard', 'encrypted', true, true, true),
  ('artifact_release_receipt', 'Records release of AI-generated artifact to a user or downstream system.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('watermark_receipt', 'Records watermark/provenance descriptor for released artifact.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('verification_receipt', 'Records artifact, receipt, signature, lineage, or audit verification result.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('hitl_request_receipt', 'Records human-in-the-loop review request.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('hitl_decision_receipt', 'Records human-in-the-loop decision and reviewer authority.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('audit_pack_receipt', 'Records generation, sealing, export, or delivery of an audit pack.', 'full', 'legal_hold', 'redacted', true, true, true),
  ('privacy_notice_receipt', 'Records notice presentation or acknowledgment.', 'lightweight', 'regulated', 'metadata_only', true, true, true),
  ('crypto_erasure_receipt', 'Records evidence-preserving key erasure or encryption-key destruction.', 'lightweight', 'regulated', 'crypto_erased', true, true, true),
  ('incident_receipt', 'Records incident/dispute lifecycle evidence.', 'deferred', 'legal_hold', 'metadata_only', true, true, true),
  ('access_receipt', 'Records meaningful evidence access or organization-context access event.', 'lightweight', 'standard', 'metadata_only', true, true, false)
ON CONFLICT (receipt_type) DO UPDATE SET
  description = EXCLUDED.description,
  default_capture_mode = EXCLUDED.default_capture_mode,
  default_retention_class = EXCLUDED.default_retention_class,
  default_privacy_treatment = EXCLUDED.default_privacy_treatment,
  requires_signature = EXCLUDED.requires_signature,
  requires_lineage = EXCLUDED.requires_lineage,
  is_consequential = EXCLUDED.is_consequential,
  updated_at = now();

-- ============================================================================
-- SEED: Governance Lifecycle Stages
-- ============================================================================
-- Canonical lifecycle points in CIAF-LCM process
-- ============================================================================

INSERT INTO governance_lifecycle_stages (
  stage_code, label, description, stage_order, default_gate_required, default_receipt_required, default_capture_mode
)
VALUES
  ('model_registered', 'Model Registered', 'Model or provider registered for governed use.', 100, false, true, 'lightweight'),
  ('provider_configured', 'Provider Configured', 'Provider/model/runtime configuration selected.', 110, false, true, 'lightweight'),
  ('session_started', 'Session Started', 'User, service, or agent session created.', 120, false, true, 'lightweight'),
  ('prompt_received', 'Prompt Received', 'User/system input received.', 200, true, true, 'lightweight'),
  ('context_retrieved', 'Context Retrieved', 'RAG/tool/memory context retrieved.', 210, true, true, 'deferred'),
  ('policy_evaluated', 'Policy Evaluated', 'Policy rules evaluated.', 300, true, true, 'lightweight'),
  ('gate_evaluated', 'Gate Evaluated', 'Governance gate decision produced.', 310, true, true, 'lightweight'),
  ('tool_requested', 'Tool Requested', 'Agent/service requested tool or privileged action.', 400, true, true, 'lightweight'),
  ('tool_approved', 'Tool Approved', 'Tool/action was approved.', 410, true, true, 'lightweight'),
  ('tool_denied', 'Tool Denied', 'Tool/action was denied.', 420, true, true, 'lightweight'),
  ('agent_delegated', 'Agent Delegated', 'Authority delegated to another agent/session.', 430, true, true, 'lightweight'),
  ('human_review_requested', 'Human Review Requested', 'HITL review requested.', 500, true, true, 'lightweight'),
  ('human_review_decided', 'Human Review Decided', 'HITL decision recorded.', 510, true, true, 'lightweight'),
  ('model_output_generated', 'Model Output Generated', 'Model generated output.', 600, true, true, 'lightweight'),
  ('artifact_created', 'Artifact Created', 'Artifact created from governed output.', 700, true, true, 'lightweight'),
  ('artifact_released', 'Artifact Released', 'Artifact released to user/downstream system.', 710, true, true, 'lightweight'),
  ('artifact_verified', 'Artifact Verified', 'Artifact/provenance verification performed.', 720, false, true, 'lightweight'),
  ('audit_pack_generated', 'Audit Pack Generated', 'Audit pack generated or sealed.', 800, false, true, 'full'),
  ('incident_opened', 'Incident Opened', 'Incident/dispute investigation opened.', 900, true, true, 'deferred'),
  ('privacy_request_received', 'Privacy Request Received', 'Privacy/DSR/erasure request received.', 1000, true, true, 'lightweight'),
  ('crypto_erasure_completed', 'Crypto-Erasure Completed', 'Subject-specific key erasure completed.', 1010, true, true, 'lightweight')
ON CONFLICT (stage_code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  stage_order = EXCLUDED.stage_order,
  default_gate_required = EXCLUDED.default_gate_required,
  default_receipt_required = EXCLUDED.default_receipt_required,
  default_capture_mode = EXCLUDED.default_capture_mode;

-- ============================================================================
-- SEED: Decision Reason Codes
-- ============================================================================
-- Machine-readable codes for gate decisions
-- ============================================================================

INSERT INTO decision_reason_codes (code, category, default_outcome, severity, description)
VALUES
  ('POLICY_APPROVED', 'approval', 'approve', 'low', 'All applicable policy checks passed.'),
  ('LOW_RISK_ALLOWED', 'approval', 'approve', 'low', 'Risk is within allowed threshold.'),
  ('MISSING_REQUIRED_EVIDENCE', 'inspection', 'inspect', 'medium', 'Required evidence was missing or incomplete.'),
  ('AMBIGUOUS_REQUEST', 'inspection', 'inspect', 'medium', 'Request requires inspection because intent or context is ambiguous.'),
  ('HITL_REQUIRED', 'escalation', 'escalate', 'high', 'Human review is required before action may continue.'),
  ('AUTHORITY_SCOPE_EXCEEDED', 'privilege', 'require_elevation', 'high', 'Principal or agent attempted an action outside its authority scope.'),
  ('POLICY_RULE_VIOLATED', 'denial', 'deny', 'high', 'One or more policy rules failed.'),
  ('PROHIBITED_ACTION', 'denial', 'deny', 'critical', 'The requested action is prohibited.'),
  ('PRIVACY_RESTRICTION', 'privacy', 'deny', 'high', 'Privacy treatment or data-rights rule blocks the action.'),
  ('LEGAL_HOLD_REQUIRED', 'legal', 'escalate', 'critical', 'Evidence is under or may require legal hold.'),
  ('SYSTEM_ERROR', 'error', 'inspect', 'high', 'Policy/gate system encountered an error and requires inspection.')
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  default_outcome = EXCLUDED.default_outcome,
  severity = EXCLUDED.severity,
  description = EXCLUDED.description;

-- ============================================================================
-- SEED: Materialization Reason Codes
-- ============================================================================
-- Reasons for expanding lightweight capsules into full evidence
-- ============================================================================

INSERT INTO materialization_reason_codes (code, category, description, default_priority)
VALUES
  ('AUDIT_REQUEST', 'audit', 'Evidence materialized for audit review.', 'normal'),
  ('REGULATOR_REQUEST', 'regulatory', 'Evidence materialized for regulator/supervisory request.', 'high'),
  ('INCIDENT_REVIEW', 'incident', 'Evidence materialized for incident investigation.', 'high'),
  ('CUSTOMER_DISPUTE', 'dispute', 'Evidence materialized for customer dispute or complaint.', 'normal'),
  ('POLICY_VIOLATION', 'policy', 'Evidence materialized due to policy violation.', 'high'),
  ('HUMAN_REVIEW', 'hitl', 'Evidence materialized for human review.', 'normal'),
  ('FORENSIC_VERIFICATION', 'verification', 'Evidence materialized for forensic/provenance verification.', 'high'),
  ('LEGAL_HOLD', 'legal', 'Evidence materialized because legal hold applies.', 'urgent')
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  default_priority = EXCLUDED.default_priority;

-- ============================================================================
-- SEED: Privacy Treatment Codes
-- ============================================================================
-- Canonical privacy handling vocabulary
-- ============================================================================

INSERT INTO privacy_treatment_codes (
  code, description, contains_personal_data, contains_sensitive_data,
  encryption_required, erasure_eligible, legal_hold_compatible
)
VALUES
  ('metadata_only', 'Governance metadata only; no readable user content expected.', false, false, false, true, true),
  ('redacted', 'Readable content was redacted before storage or export.', false, false, false, true, true),
  ('encrypted', 'Readable content is encrypted and requires subject or tenant key.', true, false, true, true, true),
  ('pseudonymized', 'Identifiers are pseudonymized but may remain linkable under controlled conditions.', true, false, true, true, true),
  ('contains_personal_data', 'Contains personal data and needs privacy controls.', true, false, true, true, true),
  ('contains_sensitive_data', 'Contains sensitive data and requires heightened controls.', true, true, true, true, true),
  ('legal_hold', 'Evidence is preserved because legal/regulatory hold applies.', true, false, true, false, true),
  ('crypto_erased', 'Subject-specific readable content is unavailable due to key erasure.', false, false, false, false, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  contains_personal_data = EXCLUDED.contains_personal_data,
  contains_sensitive_data = EXCLUDED.contains_sensitive_data,
  encryption_required = EXCLUDED.encryption_required,
  erasure_eligible = EXCLUDED.erasure_eligible,
  legal_hold_compatible = EXCLUDED.legal_hold_compatible;

-- ============================================================================
-- AGEI CANONICAL REGISTRIES COMPLETE
-- ============================================================================
-- All AGEI services should reference these canonical vocabularies:
--
-- Receipt types: Use receipt_type_registry for consistent receipt taxonomy
-- Lifecycle stages: Reference governance_lifecycle_stages for gate/receipt points
-- Decision codes: Use decision_reason_codes for machine-readable gate outcomes
-- Materialization: Reference materialization_reason_codes for evidence expansion
-- Privacy: Use privacy_treatment_codes for consistent privacy handling
--
-- Text registries enable vocabulary evolution without enum rewrites.
-- Seed data provides sensible AGEI defaults for all governance use cases.
-- ============================================================================
