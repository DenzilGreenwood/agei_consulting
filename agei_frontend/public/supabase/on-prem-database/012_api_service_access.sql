-- ============================================================================
-- AGEI Layer: API Service Access
-- ============================================================================
-- CIAF-LCM Concept:
--   API authentication and service bundles. Service-level access control
--   with API keys, quotas, and audit trails. Webhook delivery for
--   customer integrations.
--
-- Tables:
--   ciaf_services, organization_service_entitlements, api_clients, api_keys,
--   api_key_service_grants, api_request_logs, api_usage_daily,
--   service_output_links, webhook_endpoints, webhook_delivery_logs
--
-- Depends on:
--   organizations, principals, gate_definitions, gate_evaluations, receipts,
--   evidence_objects, vault_objects, audit_packs, verification_jobs
--
-- Evidence Role:
--   API access audit trail and service-level access control
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- TABLE: ciaf_services
-- ============================================================================
-- Purpose: Service catalog for CIAF-LCM API
-- Evidence: Service definitions for access control
-- ============================================================================

CREATE TABLE ciaf_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service identity
    service_key text NOT NULL UNIQUE,
    service_name text NOT NULL,
    service_family text NOT NULL,
    description text,
    
    -- Service configuration
    default_scopes jsonb DEFAULT '[]'::jsonb,
    required_role text,
    requires_signature boolean NOT NULL DEFAULT false,
    requires_gate boolean NOT NULL DEFAULT false,
    default_gate_type text,
    
    -- Schema
    input_schema_type text,
    output_schema_type text,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_ciaf_services_key ON ciaf_services(service_key);
CREATE INDEX idx_ciaf_services_family ON ciaf_services(service_family);
CREATE INDEX idx_ciaf_services_active ON ciaf_services(is_active) WHERE is_active = true;

COMMENT ON TABLE ciaf_services IS 'Service catalog for CIAF-LCM API. Each service represents a distinct capability.';
COMMENT ON COLUMN ciaf_services.service_key IS 'Unique service identifier (e.g., events.submit, receipts.read)';
COMMENT ON COLUMN ciaf_services.service_family IS 'Service family grouping (e.g., events, receipts, policies)';

-- ============================================================================
-- TABLE: organization_service_entitlements
-- ============================================================================
-- Purpose: Organization-level service permissions
-- Evidence: Service access grants at org level
-- ============================================================================

CREATE TABLE organization_service_entitlements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES ciaf_services(id) ON DELETE CASCADE,
    
    -- Entitlement status
    entitlement_status text NOT NULL DEFAULT 'active' CHECK (
        entitlement_status IN ('active', 'suspended', 'revoked', 'expired')
    ),
    
    -- Scopes and quotas
    allowed_scopes jsonb DEFAULT '[]'::jsonb,
    quota_config jsonb DEFAULT '{}'::jsonb,
    rate_limit_per_minute int8,
    monthly_quota int8,
    
    -- Validity
    valid_from timestamptz NOT NULL DEFAULT NOW(),
    valid_until timestamptz,
    
    -- Policy/gate bindings
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_definition_id uuid REFERENCES gate_definitions(id),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT org_service_entitlements_unique UNIQUE (organization_id, service_id)
);

CREATE INDEX idx_org_service_entitlements_org ON organization_service_entitlements(organization_id);
CREATE INDEX idx_org_service_entitlements_service ON organization_service_entitlements(service_id);
CREATE INDEX idx_org_service_entitlements_status ON organization_service_entitlements(entitlement_status);

COMMENT ON TABLE organization_service_entitlements IS 'Organization-level service permissions, scopes, quotas, and optional policy/gate bindings';

-- ============================================================================
-- TABLE: api_clients
-- ============================================================================
-- Purpose: Named external/internal API clients
-- Evidence: Client registry for API access
-- ============================================================================

CREATE TABLE api_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    principal_id uuid NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
    
    -- Client identity
    client_name text NOT NULL,
    client_key text NOT NULL,
    client_type text NOT NULL CHECK (client_type IN ('web', 'mobile', 'server', 'cli', 'integration')),
    description text,
    
    -- Owner
    owner_principal_id uuid REFERENCES principals(id),
    
    -- Environment
    environment text NOT NULL DEFAULT 'production' CHECK (
        environment IN ('development', 'staging', 'production')
    ),
    
    -- Security
    allowed_origins jsonb DEFAULT '[]'::jsonb,
    allowed_ips jsonb DEFAULT '[]'::jsonb,
    default_scopes jsonb DEFAULT '[]'::jsonb,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Soft delete
    deleted_at timestamptz,
    
    CONSTRAINT api_clients_unique_org_key UNIQUE (organization_id, client_key)
);

CREATE INDEX idx_api_clients_org ON api_clients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_api_clients_principal ON api_clients(principal_id);
CREATE INDEX idx_api_clients_key ON api_clients(client_key);
CREATE INDEX idx_api_clients_type ON api_clients(client_type);
CREATE INDEX idx_api_clients_active ON api_clients(is_active) WHERE is_active = true;

COMMENT ON TABLE api_clients IS 'Named external/internal API clients bound to a principal and organization';

-- ============================================================================
-- TABLE: api_keys
-- ============================================================================
-- Purpose: Hashed API keys for external service access
-- Evidence: API key lifecycle and security
-- ============================================================================

CREATE TABLE api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    api_client_id uuid NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
    principal_id uuid NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
    
    -- Key identity
    key_name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL UNIQUE,
    key_hash_algorithm text NOT NULL DEFAULT 'sha256',
    
    -- Scopes and restrictions
    scopes jsonb DEFAULT '[]'::jsonb,
    allowed_origins jsonb DEFAULT '[]'::jsonb,
    allowed_ips jsonb DEFAULT '[]'::jsonb,
    
    -- Usage tracking
    last_used_at timestamptz,
    last_used_ip text,
    last_used_user_agent text,
    usage_count int8 NOT NULL DEFAULT 0,
    
    -- Expiration
    expires_at timestamptz,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Lifecycle
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES principals(id),
    revoke_reason text,
    
    -- Security
    rotation_required_at timestamptz,
    rotation_policy_days int4,
    compromised_at timestamptz,
    compromise_reason text,
    
    -- MFA
    requires_mfa boolean DEFAULT false,
    mfa_secret_hash text,
    requires_step_up_for_tools jsonb,
    
    -- Geofencing
    geofencing_enabled boolean DEFAULT false,
    allowed_countries jsonb,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_client ON api_keys(api_client_id);
CREATE INDEX idx_api_keys_principal ON api_keys(principal_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE api_keys IS 'Hashed API keys for external service access. Raw keys are never stored';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the full API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for identification (e.g., agei_sk_...)';

-- ============================================================================
-- TABLE: api_key_service_grants
-- ============================================================================
-- Purpose: Service-level grants for API keys
-- Evidence: Fine-grained service access control
-- ============================================================================

CREATE TABLE api_key_service_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES ciaf_services(id) ON DELETE CASCADE,
    
    -- Grant status
    grant_status text NOT NULL DEFAULT 'active' CHECK (
        grant_status IN ('active', 'suspended', 'revoked', 'expired')
    ),
    
    -- Scopes and quotas
    granted_scopes jsonb DEFAULT '[]'::jsonb,
    rate_limit_per_minute int8,
    monthly_quota int8,
    
    -- Validity
    valid_from timestamptz NOT NULL DEFAULT NOW(),
    valid_until timestamptz,
    
    -- Lifecycle
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES principals(id),
    revoke_reason text,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT api_key_service_grants_unique UNIQUE (api_key_id, service_id)
);

CREATE INDEX idx_api_key_service_grants_org ON api_key_service_grants(organization_id);
CREATE INDEX idx_api_key_service_grants_key ON api_key_service_grants(api_key_id);
CREATE INDEX idx_api_key_service_grants_service ON api_key_service_grants(service_id);
CREATE INDEX idx_api_key_service_grants_status ON api_key_service_grants(grant_status);

COMMENT ON TABLE api_key_service_grants IS 'Service-level grants for API keys. Use this to scope keys to vault services';

-- ============================================================================
-- TABLE: api_request_logs
-- ============================================================================
-- Purpose: API/service call evidence log
-- Evidence: Complete API access audit trail
-- ============================================================================

CREATE TABLE api_request_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request context
    api_client_id uuid REFERENCES api_clients(id),
    api_key_id uuid REFERENCES api_keys(id),
    principal_id uuid REFERENCES principals(id),
    service_id uuid REFERENCES ciaf_services(id),
    
    -- Request details
    request_id text NOT NULL,
    request_method text NOT NULL,
    request_path text NOT NULL,
    request_ip text,
    user_agent text,
    requested_scope text,
    
    -- Request hash
    request_hash text,
    request_hash_algorithm text DEFAULT 'sha256',
    request_canonicalization_version text DEFAULT 'agei-json-v1',
    
    -- Response
    response_status_code int4,
    response_hash text,
    service_status text NOT NULL,
    
    -- CIAF linkage
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    vault_object_id uuid,
    audit_pack_id uuid REFERENCES audit_packs(id),
    verification_job_id uuid REFERENCES verification_jobs(id),
    
    -- Error handling
    error_code text,
    error_message text,
    
    -- Timing
    started_at timestamptz NOT NULL DEFAULT NOW(),
    completed_at timestamptz,
    duration_ms int4,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT api_request_logs_hash_format CHECK (
        request_hash IS NULL OR request_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_api_request_logs_org ON api_request_logs(organization_id);
CREATE INDEX idx_api_request_logs_client ON api_request_logs(api_client_id);
CREATE INDEX idx_api_request_logs_key ON api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_principal ON api_request_logs(principal_id);
CREATE INDEX idx_api_request_logs_service ON api_request_logs(service_id);
CREATE INDEX idx_api_request_logs_request_id ON api_request_logs(request_id);
CREATE INDEX idx_api_request_logs_started ON api_request_logs(started_at DESC);
CREATE INDEX idx_api_request_logs_status ON api_request_logs(response_status_code);

COMMENT ON TABLE api_request_logs IS 'API/service call evidence log. Each external call can link to receipts, gate evaluations, vault objects, and audit packs';

-- ============================================================================
-- TABLE: api_usage_daily
-- ============================================================================
-- Purpose: Daily API usage rollups
-- Evidence: Usage metrics for quotas and billing
-- ============================================================================

CREATE TABLE api_usage_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Usage context
    api_client_id uuid REFERENCES api_clients(id),
    api_key_id uuid REFERENCES api_keys(id),
    service_id uuid REFERENCES ciaf_services(id),
    usage_date date NOT NULL,
    
    -- Counters
    request_count int8 NOT NULL DEFAULT 0,
    success_count int8 NOT NULL DEFAULT 0,
    denied_count int8 NOT NULL DEFAULT 0,
    failure_count int8 NOT NULL DEFAULT 0,
    receipts_created int8 NOT NULL DEFAULT 0,
    vault_objects_created int8 NOT NULL DEFAULT 0,
    audit_packs_created int8 NOT NULL DEFAULT 0,
    verification_jobs_created int8 NOT NULL DEFAULT 0,
    
    -- Metrics
    total_duration_ms int8 NOT NULL DEFAULT 0,
    total_payload_bytes int8 NOT NULL DEFAULT 0,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT api_usage_daily_unique UNIQUE (organization_id, usage_date, api_client_id, api_key_id, service_id)
);

CREATE INDEX idx_api_usage_daily_org ON api_usage_daily(organization_id);
CREATE INDEX idx_api_usage_daily_date ON api_usage_daily(usage_date DESC);
CREATE INDEX idx_api_usage_daily_client ON api_usage_daily(api_client_id);
CREATE INDEX idx_api_usage_daily_key ON api_usage_daily(api_key_id);
CREATE INDEX idx_api_usage_daily_service ON api_usage_daily(service_id);

COMMENT ON TABLE api_usage_daily IS 'Daily API usage rollups for quotas, billing, reporting, and abuse detection';

-- ============================================================================
-- TABLE: service_output_links
-- ============================================================================
-- Purpose: Links service calls to evidence objects
-- Evidence: Service output tracking
-- ============================================================================

CREATE TABLE service_output_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request context
    api_request_log_id uuid REFERENCES api_request_logs(id),
    service_id uuid REFERENCES ciaf_services(id),
    
    -- Output reference
    output_type text NOT NULL,
    output_id uuid,
    output_ref text,
    
    -- Output hash
    output_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text DEFAULT 'agei-json-v1',
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT service_output_links_hash_format CHECK (
        output_hash IS NULL OR output_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_service_output_links_org ON service_output_links(organization_id);
CREATE INDEX idx_service_output_links_request ON service_output_links(api_request_log_id);
CREATE INDEX idx_service_output_links_service ON service_output_links(service_id);
CREATE INDEX idx_service_output_links_type ON service_output_links(output_type);

COMMENT ON TABLE service_output_links IS 'Links service/API calls to the evidence objects they created or returned';

-- ============================================================================
-- TABLE: webhook_endpoints
-- ============================================================================
-- Purpose: Outbound webhook endpoints for customer integrations
-- Evidence: Webhook configuration
-- ============================================================================

CREATE TABLE webhook_endpoints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    api_client_id uuid REFERENCES api_clients(id),
    
    -- Endpoint configuration
    endpoint_name text NOT NULL,
    endpoint_url text NOT NULL,
    secret_hash text,
    events jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Lifecycle
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    deleted_at timestamptz
);

CREATE INDEX idx_webhook_endpoints_org ON webhook_endpoints(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_webhook_endpoints_client ON webhook_endpoints(api_client_id);
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(is_active) WHERE is_active = true;

COMMENT ON TABLE webhook_endpoints IS 'Outbound webhook endpoints for customer integrations';

-- ============================================================================
-- TABLE: webhook_delivery_logs
-- ============================================================================
-- Purpose: Evidence log for outbound webhook deliveries
-- Evidence: Webhook delivery audit trail
-- ============================================================================

CREATE TABLE webhook_delivery_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    webhook_endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    
    -- Event details
    event_type text NOT NULL,
    event_id text,
    
    -- Payload hash
    payload_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text DEFAULT 'agei-json-v1',
    
    -- Delivery
    delivery_status text NOT NULL,
    response_status_code int4,
    response_body_hash text,
    attempt_count int4 NOT NULL DEFAULT 1,
    next_retry_at timestamptz,
    
    -- CIAF linkage
    receipt_id uuid,
    api_request_log_id uuid REFERENCES api_request_logs(id),
    
    -- Timing
    created_at timestamptz NOT NULL DEFAULT NOW(),
    delivered_at timestamptz,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    
    CONSTRAINT webhook_delivery_logs_hash_format CHECK (
        payload_hash IS NULL OR payload_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_webhook_delivery_logs_org ON webhook_delivery_logs(organization_id);
CREATE INDEX idx_webhook_delivery_logs_endpoint ON webhook_delivery_logs(webhook_endpoint_id);
CREATE INDEX idx_webhook_delivery_logs_event_type ON webhook_delivery_logs(event_type);
CREATE INDEX idx_webhook_delivery_logs_status ON webhook_delivery_logs(delivery_status);
CREATE INDEX idx_webhook_delivery_logs_created ON webhook_delivery_logs(created_at DESC);

COMMENT ON TABLE webhook_delivery_logs IS 'Evidence log for outbound webhook deliveries';

-- Update triggers
CREATE TRIGGER update_ciaf_services_updated_at BEFORE UPDATE ON ciaf_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_service_entitlements_updated_at BEFORE UPDATE ON organization_service_entitlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_clients_updated_at BEFORE UPDATE ON api_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_daily_updated_at BEFORE UPDATE ON api_usage_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
