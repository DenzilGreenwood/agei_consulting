-- ============================================================================
-- AGEI Layer: Agentic Runtime
-- ============================================================================
-- CIAF-LCM Concept:
--   Pre-action proof governance for autonomous agents. Agents cannot approve
--   themselves - proof before action, evidence after execution. Includes
--   behavior monitoring, anomaly detection, and privilege elevation.
--
-- Tables:
--   agent_sessions, agent_delegations, agent_tool_definitions,
--   agent_tool_invocations, pre_action_proof_bundles,
--   agent_permission_boundaries, agent_privilege_elevations,
--   agent_behavior_baselines, agent_anomaly_alerts,
--   agent_authentication_events, agent_access_reviews, artifact_release_records
--
-- Depends on:
--   organizations, principals, gate_definitions, gate_evaluations,
--   policy_versions, receipts, evidence_objects
--
-- Evidence Role:
--   Agents cannot approve themselves - proof before action,
--   evidence after execution
--
-- Extension Pack:
--   AGEI Agentic Pack (Optional)
-- ============================================================================

-- ============================================================================
-- TABLE: agent_sessions
-- ============================================================================
-- Purpose: Agentic runtime session context
-- Evidence: Governed tool/action evidence
-- ============================================================================

CREATE TABLE agent_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Session identity
    session_key text NOT NULL,
    
    -- Agent identity
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    delegating_principal_id uuid REFERENCES principals(id),
    
    -- Workflow context
    workflow_name text,
    workflow_role text,
    session_context_hash text,
    
    -- Policy binding
    policy_version_id uuid REFERENCES policy_versions(id),
    
    -- Receipt linkage
    start_receipt_id uuid,
    completion_receipt_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'paused', 'completed', 'failed', 'terminated')
    ),
    
    -- Timing
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    
    -- Timeout configuration
    max_duration_minutes int4 DEFAULT 60,
    idle_timeout_minutes int4 DEFAULT 15,
    last_activity_at timestamptz,
    
    -- Termination
    forced_termination_at timestamptz,
    termination_reason text,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT agent_sessions_hash_format CHECK (
        session_context_hash IS NULL OR session_context_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_agent_sessions_org ON agent_sessions(organization_id);
CREATE INDEX idx_agent_sessions_agent ON agent_sessions(agent_principal_id);
CREATE INDEX idx_agent_sessions_delegator ON agent_sessions(delegating_principal_id);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_started ON agent_sessions(started_at DESC);

COMMENT ON TABLE agent_sessions IS 'Agentic runtime session context for governed tool/action evidence';

-- ============================================================================
-- TABLE: agent_delegations
-- ============================================================================
-- Purpose: Scoped delegation chain evidence
-- Evidence: Agentic delegation with authority scope
-- ============================================================================

CREATE TABLE agent_delegations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Session context
    agent_session_id uuid NOT NULL REFERENCES agent_sessions(id),
    
    -- Delegation
    delegating_principal_id uuid NOT NULL REFERENCES principals(id),
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    authority_scope jsonb NOT NULL,
    purpose text,
    
    -- Validity
    valid_from timestamptz NOT NULL DEFAULT NOW(),
    valid_until timestamptz,
    
    -- Token
    delegation_token_hash text,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT agent_delegations_hash_format CHECK (
        delegation_token_hash IS NULL OR delegation_token_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_agent_delegations_org ON agent_delegations(organization_id);
CREATE INDEX idx_agent_delegations_session ON agent_delegations(agent_session_id);
CREATE INDEX idx_agent_delegations_delegator ON agent_delegations(delegating_principal_id);
CREATE INDEX idx_agent_delegations_agent ON agent_delegations(agent_principal_id);

COMMENT ON TABLE agent_delegations IS 'Scoped delegation chain evidence for agentic actions';

-- ============================================================================
-- TABLE: agent_tool_definitions
-- ============================================================================
-- Purpose: Governed tools/actions available to agents
-- Evidence: Tool registry with risk classification
-- ============================================================================

CREATE TABLE agent_tool_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Tool identity
    tool_key text NOT NULL,
    tool_name text NOT NULL,
    tool_version text NOT NULL,
    resource_class text,
    risk_class text NOT NULL,
    
    -- Schema
    allowed_parameters_schema jsonb,
    
    -- Required governance
    required_gate_definition_id uuid REFERENCES gate_definitions(id),
    required_evidence_types jsonb,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT agent_tool_definitions_unique_org_key UNIQUE (organization_id, tool_key)
);

CREATE INDEX idx_agent_tool_definitions_org ON agent_tool_definitions(organization_id);
CREATE INDEX idx_agent_tool_definitions_key ON agent_tool_definitions(tool_key);
CREATE INDEX idx_agent_tool_definitions_risk_class ON agent_tool_definitions(risk_class);
CREATE INDEX idx_agent_tool_definitions_active ON agent_tool_definitions(is_active) WHERE is_active = true;

COMMENT ON TABLE agent_tool_definitions IS 'Governed tools/actions available to agents, with risk class and required proof/gates';

-- ============================================================================
-- TABLE: pre_action_proof_bundles
-- ============================================================================
-- Purpose: Proof-carrying bundle required before agent action
-- Evidence: Pre-action verification
-- ============================================================================

CREATE TABLE pre_action_proof_bundles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Session context
    agent_session_id uuid NOT NULL REFERENCES agent_sessions(id),
    tool_definition_id uuid REFERENCES agent_tool_definitions(id),
    
    -- Context hash
    context_hash text NOT NULL,
    
    -- Proof components
    policy_check_receipt_id uuid,
    authorization_token_hash text,
    delegation_id uuid REFERENCES agent_delegations(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    risk_class text NOT NULL,
    
    -- Proof payload
    proof_payload jsonb NOT NULL,
    proof_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all pre-action proofs)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT pre_action_proof_bundles_hash_format CHECK (
        context_hash ~ '^sha256:[a-f0-9]{64}$' AND
        proof_hash ~ '^sha256:[a-f0-9]{64}$'
    ),
    CONSTRAINT pre_action_proof_bundles_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_pre_action_proof_bundles_org ON pre_action_proof_bundles(organization_id);
CREATE INDEX idx_pre_action_proof_bundles_session ON pre_action_proof_bundles(agent_session_id);
CREATE INDEX idx_pre_action_proof_bundles_tool ON pre_action_proof_bundles(tool_definition_id);
CREATE INDEX idx_pre_action_proof_bundles_gate ON pre_action_proof_bundles(gate_evaluation_id);
CREATE INDEX idx_pre_action_proof_bundles_signing_key ON pre_action_proof_bundles(signing_key_id);
CREATE INDEX idx_pre_action_proof_bundles_signed_by ON pre_action_proof_bundles(signed_by);

COMMENT ON TABLE pre_action_proof_bundles IS 'Proof-carrying bundle required before an agent/tool action executes. All proofs cryptographically signed.';
COMMENT ON COLUMN pre_action_proof_bundles.signature IS 'REQUIRED digital signature over proof_hash. Ed25519 default. Proves pre-action authorization.';

-- ============================================================================
-- TABLE: agent_tool_invocations
-- ============================================================================
-- Purpose: Agent tool/action request and execution evidence
-- Evidence: Pre-action proof linkage and execution results
-- ============================================================================

CREATE TABLE agent_tool_invocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Session context
    agent_session_id uuid NOT NULL REFERENCES agent_sessions(id),
    tool_definition_id uuid NOT NULL REFERENCES agent_tool_definitions(id),
    pre_action_proof_id uuid REFERENCES pre_action_proof_bundles(id),
    
    -- Invocation identity
    invocation_key text NOT NULL,
    action_category text,
    target_resource_type text,
    target_resource_id text,
    
    -- Request
    request_payload_hash text NOT NULL,
    request_payload jsonb,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all tool invocations)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Gate outcome
    gate_outcome text,
    
    -- Execution
    execution_status text NOT NULL,
    result_payload_hash text,
    state_change_hash text,
    
    -- CIAF linkage
    request_receipt_id uuid,
    execution_receipt_id uuid,
    evidence_object_id uuid,
    
    -- Timing
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    executed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT agent_tool_invocations_hash_format CHECK (
        request_payload_hash ~ '^sha256:[a-f0-9]{64}$' AND
        (result_payload_hash IS NULL OR result_payload_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (state_change_hash IS NULL OR state_change_hash ~ '^sha256:[a-f0-9]{64}$')
    ),
    CONSTRAINT agent_tool_invocations_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_agent_tool_invocations_org ON agent_tool_invocations(organization_id);
CREATE INDEX idx_agent_tool_invocations_session ON agent_tool_invocations(agent_session_id);
CREATE INDEX idx_agent_tool_invocations_tool ON agent_tool_invocations(tool_definition_id);
CREATE INDEX idx_agent_tool_invocations_proof ON agent_tool_invocations(pre_action_proof_id);
CREATE INDEX idx_agent_tool_invocations_status ON agent_tool_invocations(execution_status);
CREATE INDEX idx_agent_tool_invocations_signing_key ON agent_tool_invocations(signing_key_id);
CREATE INDEX idx_agent_tool_invocations_signed_by ON agent_tool_invocations(signed_by);

COMMENT ON TABLE agent_tool_invocations IS 'Agent tool/action request and execution evidence. All invocations cryptographically signed.';
COMMENT ON COLUMN agent_tool_invocations.signature IS 'REQUIRED digital signature over request_payload_hash. Ed25519 default. Proves agent action authorization.';

-- ============================================================================
-- TABLE: agent_permission_boundaries
-- ============================================================================
-- Purpose: Permission boundaries for agents
-- Evidence: Agent access control policy
-- ============================================================================

CREATE TABLE agent_permission_boundaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Agent
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    
    -- Tool boundaries
    max_allowed_tools jsonb NOT NULL,
    prohibited_tools jsonb NOT NULL,
    max_risk_class text NOT NULL,
    
    -- Data boundaries
    allowed_data_scopes jsonb,
    allowed_customer_segments jsonb,
    max_transaction_value numeric,
    
    -- Time boundaries
    allowed_time_windows jsonb,
    
    -- Approval thresholds
    requires_approval_above_amount numeric,
    requires_approval_for_tools jsonb,
    
    -- Status
    is_active boolean DEFAULT true,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_permission_boundaries_org ON agent_permission_boundaries(organization_id);
CREATE INDEX idx_agent_permission_boundaries_agent ON agent_permission_boundaries(agent_principal_id);
CREATE INDEX idx_agent_permission_boundaries_active ON agent_permission_boundaries(is_active) WHERE is_active = true;

COMMENT ON TABLE agent_permission_boundaries IS 'Permission boundaries for agents';

-- ============================================================================
-- TABLE: agent_privilege_elevations
-- ============================================================================
-- Purpose: Privilege elevation requests and approvals
-- Evidence: Temporary privilege grants
-- ============================================================================

CREATE TABLE agent_privilege_elevations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Agent
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    agent_session_id uuid REFERENCES agent_sessions(id),
    
    -- Elevation request
    elevated_role text NOT NULL,
    elevation_reason text NOT NULL,
    requested_duration_minutes int4 NOT NULL,
    
    -- Approval
    approval_status text NOT NULL DEFAULT 'pending',
    approver_principal_id uuid REFERENCES principals(id),
    approved_at timestamptz,
    
    -- Validity
    valid_from timestamptz,
    valid_until timestamptz,
    auto_revoke_at timestamptz,
    
    -- Break glass
    is_break_glass boolean DEFAULT false,
    break_glass_justification text,
    
    -- Usage tracking
    actions_performed jsonb,
    
    -- CIAF linkage
    receipt_id uuid,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_agent_privilege_elevations_org ON agent_privilege_elevations(organization_id);
CREATE INDEX idx_agent_privilege_elevations_agent ON agent_privilege_elevations(agent_principal_id);
CREATE INDEX idx_agent_privilege_elevations_session ON agent_privilege_elevations(agent_session_id);
CREATE INDEX idx_agent_privilege_elevations_status ON agent_privilege_elevations(approval_status);

COMMENT ON TABLE agent_privilege_elevations IS 'Privilege elevation requests and approvals for agents';

-- ============================================================================
-- TABLE: agent_behavior_baselines
-- ============================================================================
-- Purpose: Agent behavior baselines for anomaly detection
-- Evidence: Normal usage patterns
-- ============================================================================

CREATE TABLE agent_behavior_baselines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Agent
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    
    -- Typical behavior
    typical_tools_used jsonb,
    typical_request_volume_per_hour int4,
    typical_time_windows jsonb,
    typical_customer_segments jsonb,
    
    -- Thresholds
    max_requests_per_minute int4,
    max_failed_attempts_per_hour int4,
    unusual_tool_usage_threshold numeric,
    
    -- Baseline calculation
    baseline_calculated_at timestamptz,
    baseline_data_points int4,
    
    -- Status
    is_active boolean DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_behavior_baselines_org ON agent_behavior_baselines(organization_id);
CREATE INDEX idx_agent_behavior_baselines_agent ON agent_behavior_baselines(agent_principal_id);
CREATE INDEX idx_agent_behavior_baselines_active ON agent_behavior_baselines(is_active) WHERE is_active = true;

COMMENT ON TABLE agent_behavior_baselines IS 'Agent behavior baselines for anomaly detection. Tracks normal usage patterns to identify suspicious activity';

-- ============================================================================
-- TABLE: agent_anomaly_alerts
-- ============================================================================
-- Purpose: Anomaly detection alerts
-- Evidence: Unusual agent behavior detection
-- ============================================================================

CREATE TABLE agent_anomaly_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Agent
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    agent_session_id uuid REFERENCES agent_sessions(id),
    
    -- Anomaly
    anomaly_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description text NOT NULL,
    
    -- Deviation
    baseline_value numeric,
    observed_value numeric,
    deviation_score numeric,
    
    -- Alert status
    alert_status text NOT NULL DEFAULT 'open',
    assigned_to uuid REFERENCES principals(id),
    resolution_notes text,
    resolved_at timestamptz,
    
    -- Automated action
    automated_action_taken text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_anomaly_alerts_org ON agent_anomaly_alerts(organization_id);
CREATE INDEX idx_agent_anomaly_alerts_agent ON agent_anomaly_alerts(agent_principal_id);
CREATE INDEX idx_agent_anomaly_alerts_session ON agent_anomaly_alerts(agent_session_id);
CREATE INDEX idx_agent_anomaly_alerts_severity ON agent_anomaly_alerts(severity);
CREATE INDEX idx_agent_anomaly_alerts_status ON agent_anomaly_alerts(alert_status);

COMMENT ON TABLE agent_anomaly_alerts IS 'Anomaly detection alerts for unusual agent behavior. Triggers on deviations from established baselines';

-- ============================================================================
-- TABLE: agent_authentication_events
-- ============================================================================
-- Purpose: Agent authentication events
-- Evidence: Login and authentication tracking
-- ============================================================================

CREATE TABLE agent_authentication_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Agent
    agent_principal_id uuid NOT NULL REFERENCES principals(id),
    api_key_id uuid,
    
    -- Event
    event_type text NOT NULL,
    
    -- Context
    ip_address text,
    user_agent text,
    location_country text,
    location_city text,
    
    -- Result
    success boolean NOT NULL,
    denial_reason text,
    risk_score numeric,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_authentication_events_org ON agent_authentication_events(organization_id);
CREATE INDEX idx_agent_authentication_events_agent ON agent_authentication_events(agent_principal_id);
CREATE INDEX idx_agent_authentication_events_success ON agent_authentication_events(success);
CREATE INDEX idx_agent_authentication_events_created ON agent_authentication_events(created_at DESC);

COMMENT ON TABLE agent_authentication_events IS 'Agent authentication events for security monitoring';

-- ============================================================================
-- TABLE: agent_access_reviews
-- ============================================================================
-- Purpose: Periodic access reviews for agents
-- Evidence: Compliance and access certification
-- ============================================================================

CREATE TABLE agent_access_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Review period
    review_period_start date NOT NULL,
    review_period_end date NOT NULL,
    
    -- Review status
    review_status text NOT NULL DEFAULT 'pending',
    
    -- Agents to review
    agents_to_review jsonb NOT NULL,
    agents_reviewed jsonb,
    
    -- Review results
    access_certified jsonb,
    access_revoked jsonb,
    access_reduced jsonb,
    
    -- Reviewer
    assigned_reviewer_id uuid REFERENCES principals(id),
    completed_by uuid REFERENCES principals(id),
    completed_at timestamptz,
    
    -- SLA
    due_date date NOT NULL,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_access_reviews_org ON agent_access_reviews(organization_id);
CREATE INDEX idx_agent_access_reviews_status ON agent_access_reviews(review_status);
CREATE INDEX idx_agent_access_reviews_due ON agent_access_reviews(due_date);

COMMENT ON TABLE agent_access_reviews IS 'Periodic access reviews for agents to ensure compliance and proper authorization';

-- Update triggers
CREATE TRIGGER update_agent_tool_definitions_updated_at BEFORE UPDATE ON agent_tool_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_permission_boundaries_updated_at BEFORE UPDATE ON agent_permission_boundaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_behavior_baselines_updated_at BEFORE UPDATE ON agent_behavior_baselines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
