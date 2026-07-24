-- ============================================================================
-- AGEI Layer: HITL Governance
-- ============================================================================
-- CIAF-LCM Concept:
--   Human-in-the-loop as evidence. When gate says "escalate", human decision
--   becomes cryptographic evidence. Uses structured columns for queryability,
--   not loose JSONB decision_payload.
--
-- Tables:
--   hitl_policies, hitl_requests, hitl_decisions, approval_tokens,
--   notification_events, reviewer_role_grants
--
-- Depends on:
--   organizations, principals, gate_evaluations, policy_versions, receipts
--
-- Evidence Role:
--   When gate says "escalate", human decision becomes cryptographic evidence
--
-- Extension Pack:
--   AGEI HITL Pack (Optional)
--
-- Design Note:
--   Uses structured columns for queryability, not loose JSONB decision_payload
-- ============================================================================

-- ============================================================================
-- TABLE: hitl_policies
-- ============================================================================
-- Purpose: Policy-driven HITL configuration
-- Evidence: HITL policy definitions
-- ============================================================================

CREATE TABLE hitl_policies (
    hitl_policy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Policy identity
    policy_name text NOT NULL,
    policy_description text,
    
    -- Trigger conditions
    require_hitl_for_request_types text[] NOT NULL,
    require_hitl_for_risk_levels risk_classification[] NOT NULL,
    require_hitl_for_reason_codes text[],
    
    -- Reviewer configuration
    allowed_reviewer_roles reviewer_role[] NOT NULL,
    dual_approval_required_for text[],
    
    -- SLA configuration
    sla_low_risk_minutes int4 DEFAULT 1440,
    sla_medium_risk_minutes int4 DEFAULT 720,
    sla_high_risk_minutes int4 DEFAULT 240,
    sla_critical_manual_close boolean DEFAULT true,
    
    -- Decision requirements
    require_reason_code boolean DEFAULT true,
    require_comment_for_denial boolean DEFAULT true,
    require_customer_safe_template boolean DEFAULT false,
    
    -- Status
    is_active boolean DEFAULT true,
    version int4 NOT NULL DEFAULT 1,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_hitl_policies_org ON hitl_policies(organization_id);
CREATE INDEX idx_hitl_policies_active ON hitl_policies(is_active) WHERE is_active = true;

COMMENT ON TABLE hitl_policies IS 'Policy-driven HITL configuration';
COMMENT ON COLUMN hitl_policies.sla_low_risk_minutes IS 'SLA in minutes for low-risk requests';

-- ============================================================================
-- TABLE: hitl_requests
-- ============================================================================
-- Purpose: HITL requests requiring human review
-- Evidence: Created when policy gate returns escalate outcome
-- ============================================================================

CREATE TABLE hitl_requests (
    hitl_request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number text,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Source context
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    original_receipt_id uuid,
    
    -- Request type
    request_type text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    
    -- Policy context
    policy_version_id uuid REFERENCES policy_versions(id),
    policy_reason_code text NOT NULL,
    risk_classification risk_classification NOT NULL DEFAULT 'medium',
    
    -- Review assignment
    required_reviewer_role reviewer_role NOT NULL,
    assigned_reviewer_id uuid REFERENCES principals(id),
    dual_approval_required boolean DEFAULT false,
    secondary_reviewer_id uuid REFERENCES principals(id),
    
    -- Evidence context
    evidence_summary jsonb NOT NULL,
    evidence_summary_hash text,
    ai_request_details jsonb,
    lineage_context jsonb,
    
    -- Customer context
    customer_facing boolean DEFAULT false,
    customer_context jsonb,
    proposed_customer_message text,
    
    -- Workflow control
    status hitl_request_status NOT NULL DEFAULT 'pending',
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    opened_at timestamptz,
    expires_at timestamptz NOT NULL,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT hitl_requests_expiration_check CHECK (expires_at > requested_at),
    CONSTRAINT hitl_requests_hash_format CHECK (
        evidence_summary_hash IS NULL OR evidence_summary_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_hitl_requests_org ON hitl_requests(organization_id);
CREATE INDEX idx_hitl_requests_status ON hitl_requests(status);
CREATE INDEX idx_hitl_requests_reviewer_role ON hitl_requests(required_reviewer_role);
CREATE INDEX idx_hitl_requests_assigned_reviewer ON hitl_requests(assigned_reviewer_id);
CREATE INDEX idx_hitl_requests_expires_at ON hitl_requests(expires_at) WHERE status = 'pending';
CREATE INDEX idx_hitl_requests_gate_evaluation ON hitl_requests(gate_evaluation_id);
CREATE INDEX idx_hitl_requests_risk ON hitl_requests(risk_classification);

COMMENT ON TABLE hitl_requests IS 'HITL requests requiring human review - created when policy gate returns escalate outcome';
COMMENT ON COLUMN hitl_requests.evidence_summary IS 'Structured evidence packet for reviewer decision';
COMMENT ON COLUMN hitl_requests.evidence_summary_hash IS 'SHA-256 hash of evidence_summary. Format: sha256:<64 hex chars>';

-- ============================================================================
-- TABLE: hitl_decisions
-- ============================================================================
-- Purpose: Human decisions on HITL requests
-- Evidence: These become cryptographic evidence in AGEI
-- ============================================================================

CREATE TABLE hitl_decisions (
    decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hitl_request_id uuid NOT NULL REFERENCES hitl_requests(hitl_request_id) ON DELETE CASCADE,
    
    -- Reviewer
    reviewer_principal_id uuid NOT NULL REFERENCES principals(id),
    reviewer_role reviewer_role NOT NULL,
    
    -- Decision
    decision hitl_decision_type NOT NULL,
    decision_reason_code text NOT NULL,
    decision_comment text,
    
    -- Approval conditions
    conditions jsonb,
    conditions_expire_at timestamptz,
    
    -- Modified output
    modified_output jsonb,
    modification_rationale text,
    
    -- Customer communication
    customer_response_required boolean DEFAULT false,
    customer_response_template_id text,
    approved_customer_message text,
    do_not_disclose_internal_reason boolean DEFAULT false,
    
    -- Policy version
    policy_version_id uuid REFERENCES policy_versions(id),
    
    -- Evidence reviewed hash
    evidence_reviewed_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all HITL decisions)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Dual approval
    is_primary_decision boolean DEFAULT true,
    secondary_decision_id uuid REFERENCES hitl_decisions(decision_id),
    
    -- Receipt linkage
    decision_receipt_id uuid,
    
    -- Timing
    decided_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT hitl_decisions_hash_format CHECK (evidence_reviewed_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT hitl_decisions_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_hitl_decisions_request ON hitl_decisions(hitl_request_id);
CREATE INDEX idx_hitl_decisions_reviewer ON hitl_decisions(reviewer_principal_id);
CREATE INDEX idx_hitl_decisions_decision ON hitl_decisions(decision);
CREATE INDEX idx_hitl_decisions_decided ON hitl_decisions(decided_at DESC);
CREATE INDEX idx_hitl_decisions_receipt ON hitl_decisions(decision_receipt_id);
CREATE INDEX idx_hitl_decisions_signing_key ON hitl_decisions(signing_key_id);
CREATE INDEX idx_hitl_decisions_signed_by ON hitl_decisions(signed_by);

COMMENT ON TABLE hitl_decisions IS 'Human decisions on HITL requests. All decisions cryptographically signed and become evidence.';
COMMENT ON COLUMN hitl_decisions.evidence_reviewed_hash IS 'Hash of evidence reviewed for decision integrity';
COMMENT ON COLUMN hitl_decisions.signature IS 'REQUIRED digital signature over evidence_reviewed_hash. Ed25519 default. Proves human decision authenticity.';

-- ============================================================================
-- TABLE: approval_tokens
-- ============================================================================
-- Purpose: Secure tokens for HITL decision links sent via email
-- Evidence: Token lifecycle for secure approval workflows
-- ============================================================================

CREATE TABLE approval_tokens (
    token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hitl_request_id uuid NOT NULL REFERENCES hitl_requests(hitl_request_id) ON DELETE CASCADE,
    
    -- Token
    token_hash text NOT NULL UNIQUE,
    
    -- Lifecycle
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    
    -- Usage
    used_at timestamptz,
    use_count int4 DEFAULT 0,
    max_uses int4 DEFAULT 1,
    
    -- Security
    last_used_from_ip inet,
    last_used_user_agent text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_tokens_request ON approval_tokens(hitl_request_id);
CREATE INDEX idx_approval_tokens_hash ON approval_tokens(token_hash);
CREATE INDEX idx_approval_tokens_expires ON approval_tokens(expires_at);

COMMENT ON TABLE approval_tokens IS 'Secure tokens for HITL decision links sent via email';

-- ============================================================================
-- TABLE: notification_events
-- ============================================================================
-- Purpose: SendGrid notification tracking for HITL escalations
-- Evidence: Notification delivery audit trail
-- ============================================================================

CREATE TABLE notification_events (
    notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hitl_request_id uuid NOT NULL REFERENCES hitl_requests(hitl_request_id) ON DELETE CASCADE,
    
    -- SendGrid details
    sendgrid_message_id text,
    sendgrid_template_id text,
    
    -- Recipient
    recipient_email text NOT NULL,
    recipient_principal_id uuid REFERENCES principals(id),
    
    -- Content
    subject text,
    template_data jsonb,
    
    -- Status
    status notification_status NOT NULL DEFAULT 'pending',
    
    -- Lifecycle
    sent_at timestamptz,
    delivered_at timestamptz,
    bounced_at timestamptz,
    clicked_at timestamptz,
    failed_at timestamptz,
    
    -- Error tracking
    error_message text,
    bounce_reason text,
    
    -- Approval token linkage
    approval_token_id uuid REFERENCES approval_tokens(token_id),
    approval_link_clicked boolean DEFAULT false,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_events_request ON notification_events(hitl_request_id);
CREATE INDEX idx_notification_events_status ON notification_events(status);
CREATE INDEX idx_notification_events_recipient ON notification_events(recipient_email);
CREATE INDEX idx_notification_events_sendgrid ON notification_events(sendgrid_message_id);

COMMENT ON TABLE notification_events IS 'SendGrid notification tracking for HITL escalations';

-- ============================================================================
-- TABLE: reviewer_role_grants
-- ============================================================================
-- Purpose: Authorization for principals to make HITL decisions
-- Evidence: Reviewer authorization records
-- ============================================================================

CREATE TABLE reviewer_role_grants (
    grant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id uuid NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Grant details
    reviewer_role reviewer_role NOT NULL,
    allowed_request_types text[],
    allowed_risk_levels risk_classification[],
    max_decision_authority text,
    
    -- Lifecycle
    granted_at timestamptz NOT NULL DEFAULT NOW(),
    granted_by uuid REFERENCES principals(id),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES principals(id),
    expires_at timestamptz,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviewer_role_grants_principal ON reviewer_role_grants(principal_id);
CREATE INDEX idx_reviewer_role_grants_org ON reviewer_role_grants(organization_id);
CREATE INDEX idx_reviewer_role_grants_role ON reviewer_role_grants(reviewer_role);
CREATE INDEX idx_reviewer_role_grants_active ON reviewer_role_grants(principal_id) 
    WHERE revoked_at IS NULL;

COMMENT ON TABLE reviewer_role_grants IS 'Authorization for principals to make HITL decisions';

-- Update triggers
CREATE TRIGGER update_hitl_policies_updated_at BEFORE UPDATE ON hitl_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hitl_requests_updated_at BEFORE UPDATE ON hitl_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_events_updated_at BEFORE UPDATE ON notification_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviewer_role_grants_updated_at BEFORE UPDATE ON reviewer_role_grants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
