-- ============================================================================
-- AGEI Layer: Views and Reporting
-- ============================================================================
-- CIAF-LCM Concept:
--   Convenience views for common queries. Query optimization for dashboards
--   and reports. Materialized views for complex analytics.
--
-- Views:
--   evidence_timeline_view, gate_evaluation_summary_view,
--   agent_activity_summary_view, audit_pack_contents_view,
--   privacy_request_status_view, hitl_request_queue_view
--
-- Depends on:
--   All tables
--
-- Evidence Role:
--   Query optimization for dashboards and reports
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- VIEW: gate_evaluation_summary_view
-- ============================================================================
-- Purpose: Summary view of gate evaluations with aggregated metrics
-- ============================================================================

CREATE OR REPLACE VIEW gate_evaluation_summary_view AS
SELECT
    ge.id AS evaluation_id,
    ge.organization_id,
    gd.name AS gate_name,
    gd.gate_type,
    ge.evaluated_resource_type,
    ge.evaluated_resource_id,
    ge.evaluation_status,
    ge.gate_outcome,
    ge.decision_reason_code,
    ge.rules_evaluated,
    ge.rules_passed,
    ge.rules_failed,
    ge.rules_warnings,
    ge.is_overridden,
    ge.started_at,
    ge.completed_at,
    ge.duration_ms,
    pv.version AS policy_version,
    ps.name AS policy_set_name
FROM gate_evaluations ge
LEFT JOIN gate_definitions gd ON ge.gate_definition_id = gd.id
LEFT JOIN policy_versions pv ON ge.policy_version_id = pv.id
LEFT JOIN policy_sets ps ON pv.policy_set_id = ps.id;

COMMENT ON VIEW gate_evaluation_summary_view IS 'Summary view of gate evaluations with policy context';

-- ============================================================================
-- VIEW: agent_activity_summary_view
-- ============================================================================
-- Purpose: Summary view of agent sessions and tool invocations
-- ============================================================================

CREATE OR REPLACE VIEW agent_activity_summary_view AS
SELECT
    ases.id AS session_id,
    ases.organization_id,
    p.display_name AS agent_name,
    ases.workflow_name,
    ases.status AS session_status,
    ases.started_at,
    ases.ended_at,
    COUNT(ati.id) AS total_invocations,
    COUNT(CASE WHEN ati.execution_status = 'success' THEN 1 END) AS successful_invocations,
    COUNT(CASE WHEN ati.execution_status = 'failed' THEN 1 END) AS failed_invocations,
    COUNT(DISTINCT atd.tool_key) AS unique_tools_used
FROM agent_sessions ases
JOIN principals p ON ases.agent_principal_id = p.id
LEFT JOIN agent_tool_invocations ati ON ases.id = ati.agent_session_id
LEFT JOIN agent_tool_definitions atd ON ati.tool_definition_id = atd.id
GROUP BY ases.id, ases.organization_id, p.display_name, ases.workflow_name, 
         ases.status, ases.started_at, ases.ended_at;

COMMENT ON VIEW agent_activity_summary_view IS 'Summary view of agent sessions and tool invocations';

-- ============================================================================
-- VIEW: audit_pack_contents_view
-- ============================================================================
-- Purpose: Audit pack contents with item details
-- ============================================================================

CREATE OR REPLACE VIEW audit_pack_contents_view AS
SELECT
    ap.id AS audit_pack_id,
    ap.organization_id,
    ap.pack_name,
    ap.pack_type,
    ap.status AS pack_status,
    ap.is_sealed,
    ap.sealed_at,
    api.id AS item_id,
    api.item_type,
    api.item_id AS referenced_item_id,
    api.item_order,
    api.item_section,
    api.added_at
FROM audit_packs ap
LEFT JOIN audit_pack_items api ON ap.id = api.audit_pack_id;

COMMENT ON VIEW audit_pack_contents_view IS 'Audit pack contents with item details';

-- ============================================================================
-- VIEW: privacy_request_status_view
-- ============================================================================
-- Purpose: Data subject request status with timeline
-- ============================================================================

CREATE OR REPLACE VIEW privacy_request_status_view AS
SELECT
    dsr.id AS request_id,
    dsr.organization_id,
    dsr.request_number,
    dsr.request_type,
    dsr.status,
    dsr.received_at,
    dsr.due_at,
    dsr.completed_at,
    dsr.assigned_to,
    ds.subject_type,
    ds.jurisdiction,
    COUNT(dsra.id) AS action_count,
    COUNT(CASE WHEN dsra.action_status = 'completed' THEN 1 END) AS completed_actions,
    CASE
        WHEN dsr.completed_at IS NOT NULL THEN 'Completed'
        WHEN dsr.due_at < NOW() THEN 'Overdue'
        WHEN dsr.due_at < NOW() + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'On Track'
    END AS timeline_status
FROM data_subject_requests dsr
LEFT JOIN data_subjects ds ON dsr.data_subject_id = ds.id
LEFT JOIN data_subject_request_actions dsra ON dsr.id = dsra.request_id
GROUP BY dsr.id, dsr.organization_id, dsr.request_number, dsr.request_type,
         dsr.status, dsr.received_at, dsr.due_at, dsr.completed_at,
         dsr.assigned_to, ds.subject_type, ds.jurisdiction;

COMMENT ON VIEW privacy_request_status_view IS 'Data subject request status with timeline and action counts';

-- ============================================================================
-- VIEW: hitl_request_queue_view
-- ============================================================================
-- Purpose: HITL request queue with priority and SLA status
-- ============================================================================

CREATE OR REPLACE VIEW hitl_request_queue_view AS
SELECT
    hr.hitl_request_id,
    hr.organization_id,
    hr.request_number,
    hr.request_type,
    hr.risk_classification,
    hr.required_reviewer_role,
    hr.assigned_reviewer_id,
    p.display_name AS assigned_reviewer_name,
    hr.status,
    hr.requested_at,
    hr.expires_at,
    CASE
        WHEN hr.expires_at < NOW() THEN 'Expired'
        WHEN hr.expires_at < NOW() + INTERVAL '1 hour' THEN 'Critical'
        WHEN hr.expires_at < NOW() + INTERVAL '4 hours' THEN 'High'
        ELSE 'Normal'
    END AS sla_priority,
    EXTRACT(EPOCH FROM (hr.expires_at - NOW())) / 60 AS minutes_until_expiry,
    hr.customer_facing
FROM hitl_requests hr
LEFT JOIN principals p ON hr.assigned_reviewer_id = p.id
WHERE hr.status IN ('pending', 'opened');

COMMENT ON VIEW hitl_request_queue_view IS 'HITL request queue with priority and SLA status';

-- ============================================================================
-- VIEW: api_usage_summary_view
-- ============================================================================
-- Purpose: API usage summary with client and service details
-- ============================================================================

CREATE OR REPLACE VIEW api_usage_summary_view AS
SELECT
    aud.organization_id,
    aud.usage_date,
    ac.client_name,
    cs.service_name,
    cs.service_family,
    aud.request_count,
    aud.success_count,
    aud.denied_count,
    aud.failure_count,
    aud.receipts_created,
    ROUND(aud.success_count::numeric / NULLIF(aud.request_count, 0) * 100, 2) AS success_rate,
    aud.total_duration_ms,
    CASE 
        WHEN aud.request_count > 0 
        THEN ROUND(aud.total_duration_ms::numeric / aud.request_count, 2)
        ELSE 0 
    END AS avg_duration_ms
FROM api_usage_daily aud
LEFT JOIN api_clients ac ON aud.api_client_id = ac.id
LEFT JOIN ciaf_services cs ON aud.service_id = cs.id;

COMMENT ON VIEW api_usage_summary_view IS 'API usage summary with client and service details';

-- ============================================================================
-- VIEW: lifecycle_object_lineage_view
-- ============================================================================
-- Purpose: AI lifecycle object lineage with links
-- ============================================================================

CREATE OR REPLACE VIEW lifecycle_object_lineage_view AS
SELECT
    lo.id AS object_id,
    lo.organization_id,
    lo.object_type,
    lo.object_key,
    lo.display_name,
    lo.lifecycle_stage,
    lo.current_state,
    lol.link_type,
    lol.id AS link_id,
    source.object_key AS source_object_key,
    source.object_type AS source_object_type,
    target.object_key AS target_object_key,
    target.object_type AS target_object_type,
    lo.created_at
FROM ai_lifecycle_objects lo
LEFT JOIN ai_lifecycle_object_links lol ON lo.id = lol.target_object_id
LEFT JOIN ai_lifecycle_objects source ON lol.source_object_id = source.id
LEFT JOIN ai_lifecycle_objects target ON lol.target_object_id = target.id;

COMMENT ON VIEW lifecycle_object_lineage_view IS 'AI lifecycle object lineage with source and target objects';

-- ============================================================================
-- VIEW: shadow_ai_discovery_summary_view
-- ============================================================================
-- Purpose: Shadow AI discovery summary with classification
-- ============================================================================

CREATE OR REPLACE VIEW shadow_ai_discovery_summary_view AS
SELECT
    sd.id AS discovery_id,
    sd.organization_id,
    sd.discovery_id AS discovery_reference,
    sd.signal_source,
    sd.observed_tool_name,
    sd.actor_principal_id,
    p.display_name AS actor_name,
    sd.observed_at,
    sc.classification,
    sc.risk_level,
    sgr.response_action,
    sgr.response_status,
    sd.confidence_score
FROM shadow_ai_discovery_records sd
LEFT JOIN principals p ON sd.actor_principal_id = p.id
LEFT JOIN shadow_ai_classifications sc ON sd.id = sc.discovery_record_id
LEFT JOIN shadow_ai_governance_responses sgr ON sd.id = sgr.discovery_record_id;

COMMENT ON VIEW shadow_ai_discovery_summary_view IS 'Shadow AI discovery summary with classification and response status';
