-- ============================================================================
-- AGEI Layer: Gate Evaluation
-- ============================================================================
-- CIAF-LCM Concept:
--   Server-side policy enforcement. No self-certification - platform
--   evaluates, platform decides. Gates are enforcement points, evaluations
--   are immutable results, outcomes drive governance actions.
--
-- Tables:
--   gate_definitions, policy_evaluations, gate_evaluations
--
-- Depends on:
--   organizations, principals, schema_versions, policy_sets, policy_versions
--
-- Evidence Role:
--   No self-certification - platform evaluates, platform decides
--
-- Extension Pack:
--   Core (Required)
--
-- Key Fields:
--   evaluation_status = technical result (pass/fail/warning/error)
--   gate_outcome = governance action (approve/deny/escalate/inspect)
--   decision_reason_code = machine-readable reason
-- ============================================================================

-- ============================================================================
-- TABLE: gate_definitions
-- ============================================================================
-- Purpose: Policy enforcement points in the lifecycle
-- Evidence: Where governance checks occur
-- ============================================================================

CREATE TABLE gate_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Gate identity
    name text NOT NULL,
    slug text NOT NULL,
    gate_type text NOT NULL,
    description text,
    
    -- Gate configuration (JSONB payload)
    gate_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Associated policies
    policy_set_id uuid REFERENCES policy_sets(id),
    policy_version_id uuid REFERENCES policy_versions(id),
    
    -- Evaluation configuration
    evaluation_mode text NOT NULL DEFAULT 'strict' CHECK (
        evaluation_mode IN ('strict', 'advisory', 'logging')
    ),
    failure_action text NOT NULL DEFAULT 'block' CHECK (
        failure_action IN ('block', 'warn', 'log', 'custom')
    ),
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_required boolean NOT NULL DEFAULT false,
    
    -- Metadata
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Soft delete
    deleted_at timestamptz
);

CREATE INDEX idx_gate_definitions_org ON gate_definitions(organization_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX gate_definitions_unique_org_slug ON gate_definitions(organization_id, slug) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_gate_definitions_type ON gate_definitions(gate_type);
CREATE INDEX idx_gate_definitions_active ON gate_definitions(organization_id, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_gate_definitions_policy_set ON gate_definitions(policy_set_id);
CREATE INDEX idx_gate_definitions_policy_version ON gate_definitions(policy_version_id);

COMMENT ON TABLE gate_definitions IS 'Policy enforcement points in the lifecycle (gates become evaluation triggers)';
COMMENT ON COLUMN gate_definitions.gate_type IS 'Gate type identifier. Valid values managed by ciaf_type_registry to allow extension packs to add new types (agent_pre_action, hitl_escalation, artifact_release, etc.) without schema changes.';
COMMENT ON COLUMN gate_definitions.gate_payload IS 'Full gate configuration matching gate-definition.schema.json';
COMMENT ON COLUMN gate_definitions.evaluation_mode IS 'strict (enforce), advisory (warn), logging (observe)';

-- ============================================================================
-- TABLE: policy_evaluations
-- ============================================================================
-- Purpose: Individual policy rule evaluation results
-- Evidence: Granular rule-by-rule evaluation tracking
-- ============================================================================

CREATE TABLE policy_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Policy context
    policy_version_id uuid NOT NULL REFERENCES policy_versions(id),
    policy_rule_id text NOT NULL,
    gate_evaluation_id uuid,
    
    -- Evaluated resource
    evaluated_resource_type text NOT NULL,
    evaluated_resource_id text NOT NULL,
    
    -- Evaluation result (JSONB payload)
    rule_evaluation_payload jsonb NOT NULL,
    
    -- Rule result
    rule_status text NOT NULL CHECK (rule_status IN ('pass', 'fail', 'warning', 'error', 'skipped')),
    rule_message text,
    rule_execution_duration_ms int4,
    rule_data_accessed jsonb,
    
    -- Hash for integrity
    evaluation_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    
    -- Timing
    evaluated_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata jsonb,
    evaluated_by uuid REFERENCES principals(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT policy_evaluations_hash_format CHECK (evaluation_hash ~ '^sha256:[a-f0-9]{64}$')
);

CREATE INDEX idx_policy_evaluations_org ON policy_evaluations(organization_id);
CREATE INDEX idx_policy_evaluations_policy_version ON policy_evaluations(policy_version_id);
CREATE INDEX idx_policy_evaluations_gate ON policy_evaluations(gate_evaluation_id);
CREATE INDEX idx_policy_evaluations_resource ON policy_evaluations(evaluated_resource_type, evaluated_resource_id);
CREATE INDEX idx_policy_evaluations_status ON policy_evaluations(rule_status);
CREATE INDEX idx_policy_evaluations_hash ON policy_evaluations(evaluation_hash);

COMMENT ON TABLE policy_evaluations IS 'Individual policy rule evaluation results. Gate evaluations aggregate these into governance outcomes.';
COMMENT ON COLUMN policy_evaluations.rule_evaluation_payload IS 'Full rule evaluation result';
COMMENT ON COLUMN policy_evaluations.rule_status IS 'Technical evaluation result: pass, fail, warning, error, skipped';

-- ============================================================================
-- TABLE: gate_evaluations
-- ============================================================================
-- Purpose: Immutable gate evaluation results
-- Evidence: Server-side governance decisions with cryptographic integrity
-- ============================================================================

CREATE TABLE gate_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Gate reference
    gate_definition_id uuid NOT NULL REFERENCES gate_definitions(id),
    policy_version_id uuid REFERENCES policy_versions(id),
    
    -- Evaluation context
    evaluated_resource_type text NOT NULL,
    evaluated_resource_id text NOT NULL,
    
    -- Evaluation result (JSONB payload)
    evaluation_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Technical evaluation status
    evaluation_status text NOT NULL CHECK (
        evaluation_status IN ('pass', 'fail', 'warning', 'error', 'skipped')
    ),
    
    -- Governance gate outcome (what action to take)
    gate_outcome text NOT NULL CHECK (
        gate_outcome IN ('approve', 'deny', 'escalate', 'inspect', 'require_approval', 'require_elevation')
    ),
    
    -- Decision reason code (why this outcome)
    decision_reason_code text,
    
    -- Rule-level results
    rules_evaluated int4 NOT NULL DEFAULT 0,
    rules_passed int4 NOT NULL DEFAULT 0,
    rules_failed int4 NOT NULL DEFAULT 0,
    rules_warnings int4 NOT NULL DEFAULT 0,
    
    -- Override/exception handling
    is_overridden boolean NOT NULL DEFAULT false,
    override_reason text,
    override_by uuid REFERENCES principals(id),
    override_at timestamptz,
    
    -- Hash for integrity
    evaluation_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all gate evaluations)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Timing
    started_at timestamptz NOT NULL,
    completed_at timestamptz NOT NULL,
    duration_ms int4,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    evaluated_by uuid REFERENCES principals(id),
    
    CONSTRAINT gate_evaluations_timing_check CHECK (completed_at >= started_at),
    CONSTRAINT gate_evaluations_hash_format CHECK (evaluation_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT gate_evaluations_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_gate_evaluations_org ON gate_evaluations(organization_id);
CREATE INDEX idx_gate_evaluations_gate ON gate_evaluations(gate_definition_id);
CREATE INDEX idx_gate_evaluations_policy_version ON gate_evaluations(policy_version_id);
CREATE INDEX idx_gate_evaluations_resource ON gate_evaluations(evaluated_resource_type, evaluated_resource_id);
CREATE INDEX idx_gate_evaluations_evaluation_status ON gate_evaluations(evaluation_status);
CREATE INDEX idx_gate_evaluations_gate_outcome ON gate_evaluations(gate_outcome);
CREATE INDEX idx_gate_evaluations_decision_reason ON gate_evaluations(decision_reason_code) 
    WHERE decision_reason_code IS NOT NULL;
CREATE INDEX idx_gate_evaluations_hash ON gate_evaluations(evaluation_hash);
CREATE INDEX idx_gate_evaluations_completed ON gate_evaluations(completed_at DESC);
CREATE INDEX idx_gate_evaluations_overridden ON gate_evaluations(is_overridden) WHERE is_overridden = true;
CREATE INDEX idx_gate_evaluations_signing_key ON gate_evaluations(signing_key_id);
CREATE INDEX idx_gate_evaluations_signed_by ON gate_evaluations(signed_by);

COMMENT ON TABLE gate_evaluations IS 'Immutable gate evaluation results. All evaluations cryptographically signed.';
COMMENT ON COLUMN gate_evaluations.evaluation_payload IS 'Full evaluation result matching gate-evaluation.schema.json';
COMMENT ON COLUMN gate_evaluations.evaluation_status IS 'Technical result: pass, fail, warning, error, skipped';
COMMENT ON COLUMN gate_evaluations.gate_outcome IS 'Governance action: approve, deny, escalate, inspect, require_approval, require_elevation';
COMMENT ON COLUMN gate_evaluations.decision_reason_code IS 'Machine-readable reason code for the outcome';
COMMENT ON COLUMN gate_evaluations.evaluation_hash IS 'SHA-256 hash of canonicalized evaluation_payload. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN gate_evaluations.signature IS 'REQUIRED digital signature over evaluation_hash. Ed25519 default.';
COMMENT ON COLUMN gate_evaluations.signing_key_id IS 'Reference to signing key used. Enables key rotation tracking.';

-- Add FK from policy_evaluations to gate_evaluations
ALTER TABLE policy_evaluations
    ADD CONSTRAINT fk_policy_evaluations_gate
    FOREIGN KEY (gate_evaluation_id)
    REFERENCES gate_evaluations(id);

-- Update triggers
CREATE TRIGGER update_gate_definitions_updated_at BEFORE UPDATE ON gate_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
