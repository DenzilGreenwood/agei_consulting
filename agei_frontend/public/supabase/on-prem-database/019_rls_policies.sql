-- ============================================================================
-- AGEI Layer: RLS Policies
-- ============================================================================
-- CIAF-LCM Concept:
--   Row-Level Security policies for all tables. Organization-level isolation
--   for all evidence tables. Enforces multi-tenant data isolation at
--   database level.
--
-- Policies:
--   Organization-level isolation for all evidence tables
--
-- Depends on:
--   All tables, RLS auth helper functions
--
-- Evidence Role:
--   Enforces multi-tenant data isolation at database level
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

-- Core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciaf_type_registry ENABLE ROW LEVEL SECURITY;

-- Policy tables
ALTER TABLE policy_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;

-- Gate tables
ALTER TABLE gate_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_evaluations ENABLE ROW LEVEL SECURITY;

-- Receipt tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_batch_items ENABLE ROW LEVEL SECURITY;

-- Evidence tables
ALTER TABLE evidence_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_objects ENABLE ROW LEVEL SECURITY;

-- Lifecycle tables
ALTER TABLE ai_lifecycle_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_lifecycle_object_links ENABLE ROW LEVEL SECURITY;

-- Audit tables
ALTER TABLE audit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- API tables
ALTER TABLE ciaf_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_service_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_service_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_output_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- HITL tables
ALTER TABLE hitl_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_role_grants ENABLE ROW LEVEL SECURITY;

-- Agentic tables
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_action_proof_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_permission_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_privilege_elevations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_behavior_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_authentication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_access_reviews ENABLE ROW LEVEL SECURITY;

-- Provenance tables
ALTER TABLE watermark_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE provenance_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_release_records ENABLE ROW LEVEL SECURITY;

-- Shadow AI tables
ALTER TABLE shadow_ai_discovery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_ai_tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_ai_governance_responses ENABLE ROW LEVEL SECURITY;

-- Privacy tables
ALTER TABLE data_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawful_basis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_transfer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_data_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_request_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_redaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_exports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Organization-level isolation policies
-- ============================================================================
-- Policy pattern: Users can only access records in their organizations
-- ============================================================================

-- Policy macro to create standard organization isolation policy
CREATE OR REPLACE FUNCTION create_org_isolation_policy(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        CREATE POLICY org_isolation_policy ON %I
        FOR ALL
        USING (is_organization_member(organization_id))
    ', table_name);
END;
$$;

-- Apply organization isolation to all tables with organization_id column
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'organization_id'
          AND table_name NOT IN ('organizations', 'schema_versions', 'ciaf_type_registry', 'ciaf_services')
    LOOP
        PERFORM create_org_isolation_policy(table_record.table_name);
    END LOOP;
END;
$$;

-- ============================================================================
-- Special policies for shared tables
-- ============================================================================

-- Organizations: Users can see organizations they're members of
CREATE POLICY org_member_access ON organizations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM organization_members
            WHERE organization_members.organization_id = organizations.id
              AND organization_members.principal_id = current_principal_id()
              AND organization_members.is_active = true
              AND organization_members.deleted_at IS NULL
        )
    );

-- Principals: Users can see their own principal and principals in their organizations
CREATE POLICY principal_access ON principals
    FOR ALL
    USING (
        id = current_principal_id()
        OR EXISTS (
            SELECT 1
            FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.principal_id = principals.id
              AND om2.principal_id = current_principal_id()
              AND om1.is_active = true
              AND om2.is_active = true
              AND om1.deleted_at IS NULL
              AND om2.deleted_at IS NULL
        )
    );

-- Organization members: Users can see members of their organizations
CREATE POLICY org_member_visibility ON organization_members
    FOR ALL
    USING (is_organization_member(organization_id));

-- Schema versions: Read-only access for all authenticated users
CREATE POLICY schema_versions_read ON schema_versions
    FOR SELECT
    USING (true);

-- CIAF type registry: Read-only access for all authenticated users
CREATE POLICY ciaf_type_registry_read ON ciaf_type_registry
    FOR SELECT
    USING (true);

-- CIAF services: Read-only access for all authenticated users
CREATE POLICY ciaf_services_read ON ciaf_services
    FOR SELECT
    USING (true);

COMMENT ON POLICY org_member_access ON organizations IS 'Users can see organizations they are members of';
COMMENT ON POLICY principal_access ON principals IS 'Users can see their own principal and principals in their organizations';
COMMENT ON POLICY org_member_visibility ON organization_members IS 'Users can see members of their organizations';
COMMENT ON POLICY schema_versions_read ON schema_versions IS 'Read-only access to schema versions for all authenticated users';
COMMENT ON POLICY ciaf_type_registry_read ON ciaf_type_registry IS 'Read-only access to CIAF type registry for all authenticated users';
COMMENT ON POLICY ciaf_services_read ON ciaf_services IS 'Read-only access to CIAF services for all authenticated users';
