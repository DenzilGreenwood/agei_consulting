-- Schema from form-1-asset-discovery
-- Supabase PostgreSQL Schema for Form 1: Asset Discovery
-- Includes Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS agei_asset_discovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- Ties to the tenant
    executive_sponsor TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    use_case TEXT NOT NULL,
    business_purpose TEXT NOT NULL,
    intended_outcome TEXT NOT NULL,
    risk_classification TEXT NOT NULL CHECK (risk_classification IN ('Low', 'Medium', 'High', 'Critical')),
    ai_system_name TEXT NOT NULL,
    owner TEXT NOT NULL,
    vendor TEXT,
    deployment_model TEXT NOT NULL CHECK (deployment_model IN ('Cloud', 'On-prem', 'Hybrid')),
    agent_type TEXT,
    llm_provider TEXT,
    model_version TEXT,
    data_sources TEXT[] DEFAULT '{}',
    tool_integrations TEXT[] DEFAULT '{}',
    external_apis TEXT[] DEFAULT '{}',
    authentication TEXT NOT NULL,
    "authorization" TEXT NOT NULL,
    sensitive_data TEXT[] DEFAULT '{}',
    jurisdictions TEXT[] DEFAULT '{}',
    retention_policy TEXT NOT NULL,
    incident_history TEXT,
    known_risks TEXT,
    existing_controls TEXT,
    current_audit_process TEXT,
    required_signatures TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agei_asset_discovery ENABLE ROW LEVEL SECURITY;

-- Policies for RLS based on organization_id
-- Assumes you have a way to extract the user's organization_id (e.g., from JWT or a user_organizations mapping table)

CREATE POLICY "Users can view their organization's asset discovery forms" 
ON agei_asset_discovery 
FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's asset discovery forms" 
ON agei_asset_discovery 
FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can update their organization's asset discovery forms" 
ON agei_asset_discovery 
FOR UPDATE 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

-- Indexes for performance
CREATE INDEX idx_asset_discovery_org_id ON agei_asset_discovery(organization_id);
CREATE INDEX idx_asset_discovery_system_name ON agei_asset_discovery(ai_system_name);


-- Schema from form-10-operational-readiness
-- Supabase PostgreSQL Schema for Form 10

CREATE TABLE IF NOT EXISTS agei_form_10 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    infrastructure TEXT,
    security TEXT,
    identity TEXT,
    policy TEXT,
    monitoring TEXT,
    alerting TEXT,
    incident_response TEXT,
    backup TEXT,
    recovery TEXT,
    legal_approval TEXT,
    executive_approval TEXT,
    go_live_authorization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_10 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 10" 
ON agei_form_10 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 10" 
ON agei_form_10 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-2-regulatory-compliance
-- Supabase PostgreSQL Schema for Form 2

CREATE TABLE IF NOT EXISTS agei_form_2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    applicable_regulations TEXT,
    applicable_standards TEXT,
    internal_policies TEXT,
    required_evidence TEXT,
    approval_authorities TEXT,
    risk_owners TEXT,
    mandatory_governance_gates TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 2" 
ON agei_form_2 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 2" 
ON agei_form_2 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-3-enterprise-schema
-- Supabase PostgreSQL Schema for Form 3

CREATE TABLE IF NOT EXISTS agei_form_3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    business_objects TEXT,
    custom_fields TEXT,
    evidence_payload TEXT,
    lifecycle_objects TEXT,
    decision_types TEXT,
    reason_codes TEXT,
    required_metadata TEXT,
    hash_strategy TEXT,
    signature_strategy TEXT,
    retention_policy TEXT,
    search_tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 3" 
ON agei_form_3 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 3" 
ON agei_form_3 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-4-data-classification
-- Supabase PostgreSQL Schema for Form 4

CREATE TABLE IF NOT EXISTS agei_form_4 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    data_types TEXT,
    countries TEXT,
    data_residency TEXT,
    encryption TEXT,
    key_management TEXT,
    data_sovereignty TEXT,
    third_party_processors TEXT,
    cross_border_transfers TEXT,
    retention TEXT,
    deletion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_4 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 4" 
ON agei_form_4 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 4" 
ON agei_form_4 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-5-workflow-inventory
-- Supabase PostgreSQL Schema for Form 5

CREATE TABLE IF NOT EXISTS agei_form_5 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    every_workflow TEXT,
    agent TEXT,
    human TEXT,
    decision_point TEXT,
    external_tool TEXT,
    approval TEXT,
    evidence_produced TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_5 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 5" 
ON agei_form_5 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 5" 
ON agei_form_5 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-6-policy-mapping
-- Supabase PostgreSQL Schema for Form 6

CREATE TABLE IF NOT EXISTS agei_form_6 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    policies TEXT,
    rules TEXT,
    conditions TEXT,
    exceptions TEXT,
    delegated_authority TEXT,
    risk_appetite TEXT,
    escalation_rules TEXT,
    default_deny_logic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_6 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 6" 
ON agei_form_6 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 6" 
ON agei_form_6 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-7-crypto-evidence
-- Supabase PostgreSQL Schema for Form 7

CREATE TABLE IF NOT EXISTS agei_form_7 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    receipt_strategy TEXT,
    signing_keys TEXT,
    hash_algorithm TEXT,
    merkle_batch TEXT,
    anchoring TEXT,
    evidence_storage TEXT,
    verification_endpoint TEXT,
    offline_verification TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_7 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 7" 
ON agei_form_7 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 7" 
ON agei_form_7 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-8-vault-integration
-- Supabase PostgreSQL Schema for Form 8

CREATE TABLE IF NOT EXISTS agei_form_8 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sdk TEXT,
    api_keys TEXT,
    authentication TEXT,
    webhook_urls TEXT,
    event_types TEXT,
    retry_policy TEXT,
    timeouts TEXT,
    queue_strategy TEXT,
    dead_letter_queue TEXT,
    versioning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_8 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 8" 
ON agei_form_8 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 8" 
ON agei_form_8 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


-- Schema from form-9-audit-readiness
-- Supabase PostgreSQL Schema for Form 9

CREATE TABLE IF NOT EXISTS agei_form_9 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    current_state TEXT,
    target_state TEXT,
    evidence_gaps TEXT,
    documentation_gaps TEXT,
    testing TEXT,
    mock_audit_results TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agei_form_9 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's form 9" 
ON agei_form_9 FOR SELECT 
USING (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Users can insert their organization's form 9" 
ON agei_form_9 FOR INSERT 
WITH CHECK (organization_id = (SELECT auth.jwt() ->> 'org_id')::UUID);


