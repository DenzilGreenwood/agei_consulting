-- ============================================================================
-- AGEI Layer: Shadow AI Governance
-- ============================================================================
-- CIAF-LCM Concept:
--   Ungoverned AI discovery and remediation. Discover and govern AI systems
--   outside official governance. Risk classification and response workflows.
--
-- Tables:
--   shadow_ai_discovery_records, shadow_ai_tool_registry,
--   shadow_ai_classifications, shadow_ai_governance_responses
--
-- Depends on:
--   organizations, principals, policy_versions, gate_evaluations,
--   receipts, evidence_objects, incidents
--
-- Evidence Role:
--   Discover and govern AI systems outside official governance
--
-- Extension Pack:
--   AGEI Shadow AI Pack (Optional)
-- ============================================================================

-- ============================================================================
-- TABLE: shadow_ai_discovery_records
-- ============================================================================
-- Purpose: Purpose-limited evidence record for unmanaged AI use discovery
-- Evidence: Shadow AI detection events
-- ============================================================================

CREATE TABLE shadow_ai_discovery_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Discovery identity
    discovery_id text NOT NULL,
    
    -- Signal source
    signal_source text NOT NULL,
    signal_type text NOT NULL,
    
    -- Observed tool
    observed_tool_id uuid,
    observed_tool_name text,
    
    -- Actor
    actor_principal_id uuid REFERENCES principals(id),
    device_or_session_ref text,
    observed_at timestamptz NOT NULL,
    
    -- Risk assessment
    confidence_score numeric,
    data_sensitivity_hint text,
    
    -- Content retention
    content_retention_mode text NOT NULL DEFAULT 'hash_only',
    
    -- Discovery payload
    discovery_payload jsonb NOT NULL,
    discovery_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    incident_id uuid,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT shadow_ai_discovery_records_hash_format CHECK (
        discovery_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_shadow_ai_discovery_records_org ON shadow_ai_discovery_records(organization_id);
CREATE INDEX idx_shadow_ai_discovery_records_discovery_id ON shadow_ai_discovery_records(discovery_id);
CREATE INDEX idx_shadow_ai_discovery_records_signal_source ON shadow_ai_discovery_records(signal_source);
CREATE INDEX idx_shadow_ai_discovery_records_tool ON shadow_ai_discovery_records(observed_tool_id);
CREATE INDEX idx_shadow_ai_discovery_records_actor ON shadow_ai_discovery_records(actor_principal_id);
CREATE INDEX idx_shadow_ai_discovery_records_observed ON shadow_ai_discovery_records(observed_at DESC);

COMMENT ON TABLE shadow_ai_discovery_records IS 'Purpose-limited evidence record for unmanaged AI use discovery';
COMMENT ON COLUMN shadow_ai_discovery_records.signal_source IS 'Signal source: network_traffic, browser_extension, endpoint_agent, user_report, etc.';
COMMENT ON COLUMN shadow_ai_discovery_records.content_retention_mode IS 'Content retention: hash_only, metadata_only, full_retention, purged';

-- ============================================================================
-- TABLE: shadow_ai_tool_registry
-- ============================================================================
-- Purpose: Registry of known/sanctioned/prohibited/unmanaged AI tools
-- Evidence: Shadow AI tool posture and approved use cases
-- ============================================================================

CREATE TABLE shadow_ai_tool_registry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Tool identity
    tool_name text NOT NULL,
    provider_name text,
    tool_url text,
    tool_category text,
    
    -- Posture
    posture text NOT NULL CHECK (
        posture IN ('approved', 'conditionally_approved', 'prohibited', 'under_review', 'unknown')
    ),
    
    -- Use cases
    approved_use_cases jsonb,
    prohibited_use_cases jsonb,
    data_handling_notes text,
    
    -- Risk rating
    risk_rating text NOT NULL CHECK (
        risk_rating IN ('low', 'medium', 'high', 'critical')
    ),
    
    -- Review
    reviewed_by uuid REFERENCES principals(id),
    reviewed_at timestamptz,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shadow_ai_tool_registry_org ON shadow_ai_tool_registry(organization_id);
CREATE INDEX idx_shadow_ai_tool_registry_name ON shadow_ai_tool_registry(tool_name);
CREATE INDEX idx_shadow_ai_tool_registry_posture ON shadow_ai_tool_registry(posture);
CREATE INDEX idx_shadow_ai_tool_registry_risk ON shadow_ai_tool_registry(risk_rating);
CREATE INDEX idx_shadow_ai_tool_registry_active ON shadow_ai_tool_registry(is_active) WHERE is_active = true;

COMMENT ON TABLE shadow_ai_tool_registry IS 'Registry of known/sanctioned/prohibited/unmanaged AI tools for shadow-AI governance';
COMMENT ON COLUMN shadow_ai_tool_registry.posture IS 'Posture: approved, conditionally_approved, prohibited, under_review, unknown';

-- ============================================================================
-- TABLE: shadow_ai_classifications
-- ============================================================================
-- Purpose: Risk and policy classification of shadow-AI discovery events
-- Evidence: Classification decisions and risk levels
-- ============================================================================

CREATE TABLE shadow_ai_classifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Discovery reference
    discovery_record_id uuid NOT NULL REFERENCES shadow_ai_discovery_records(id),
    
    -- Classification
    classification text NOT NULL,
    risk_level text NOT NULL CHECK (
        risk_level IN ('low', 'medium', 'high', 'critical')
    ),
    
    -- Policy context
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    reason_code text,
    
    -- Classification payload
    classification_payload jsonb,
    
    -- CIAF linkage
    receipt_id uuid,
    
    -- Classifier
    classified_by uuid REFERENCES principals(id),
    classified_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shadow_ai_classifications_org ON shadow_ai_classifications(organization_id);
CREATE INDEX idx_shadow_ai_classifications_discovery ON shadow_ai_classifications(discovery_record_id);
CREATE INDEX idx_shadow_ai_classifications_classification ON shadow_ai_classifications(classification);
CREATE INDEX idx_shadow_ai_classifications_risk ON shadow_ai_classifications(risk_level);

COMMENT ON TABLE shadow_ai_classifications IS 'Risk and policy classification of shadow-AI discovery events';

-- ============================================================================
-- TABLE: shadow_ai_governance_responses
-- ============================================================================
-- Purpose: Governance response/remediation actions
-- Evidence: Shadow AI remediation workflow
-- ============================================================================

CREATE TABLE shadow_ai_governance_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Discovery reference
    discovery_record_id uuid NOT NULL REFERENCES shadow_ai_discovery_records(id),
    classification_id uuid REFERENCES shadow_ai_classifications(id),
    
    -- Response action
    response_action text NOT NULL,
    response_status text NOT NULL DEFAULT 'pending',
    
    -- Owner
    owner_principal_id uuid REFERENCES principals(id),
    
    -- Timeline
    due_at timestamptz,
    completed_at timestamptz,
    
    -- Response payload
    response_payload jsonb,
    
    -- CIAF linkage
    receipt_id uuid,
    incident_id uuid,
    
    -- Migration
    migration_target text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_shadow_ai_governance_responses_org ON shadow_ai_governance_responses(organization_id);
CREATE INDEX idx_shadow_ai_governance_responses_discovery ON shadow_ai_governance_responses(discovery_record_id);
CREATE INDEX idx_shadow_ai_governance_responses_classification ON shadow_ai_governance_responses(classification_id);
CREATE INDEX idx_shadow_ai_governance_responses_action ON shadow_ai_governance_responses(response_action);
CREATE INDEX idx_shadow_ai_governance_responses_status ON shadow_ai_governance_responses(response_status);
CREATE INDEX idx_shadow_ai_governance_responses_owner ON shadow_ai_governance_responses(owner_principal_id);

COMMENT ON TABLE shadow_ai_governance_responses IS 'Governance response/remediation actions for shadow-AI discovery events';
COMMENT ON COLUMN shadow_ai_governance_responses.response_action IS 'Response action: allow, migrate_to_governed, block_access, educate, escalate, etc.';

-- Update triggers
CREATE TRIGGER update_shadow_ai_tool_registry_updated_at BEFORE UPDATE ON shadow_ai_tool_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
