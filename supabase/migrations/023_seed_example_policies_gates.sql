-- ============================================================================
-- AGEI Example Policies, Rules, and Gates
-- ============================================================================
-- Purpose:
--   Seed example policies that demonstrate the correct AGEI pattern:
--
--   Policy Set -> Published Policy Version -> Extracted Policy Rules -> Linked Gate
--
-- Notes:
--   1. This script assumes at least one organization exists.
--   2. It uses agei_hash_jsonb(jsonb) if available in your database.
--   3. It avoids destructive deletes and uses generated slugs with agei-example-*.
--   4. Review gate_type values if your database has a strict CHECK constraint.
-- ============================================================================

DO $$
DECLARE
  v_org_id uuid;
  v_created_by uuid;
  v_signing_key_id uuid;

  v_policy_set_id uuid;
  v_policy_version_id uuid;

  v_payload jsonb;
  v_rules jsonb;
  v_hash text;

  v_gate_payload jsonb;
BEGIN
  SELECT id INTO v_org_id
  FROM organizations
  WHERE deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Create an organization before seeding AGEI example policies.';
  END IF;

  SELECT principal_id INTO v_created_by
  FROM organization_members
  WHERE organization_id = v_org_id
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_created_by IS NULL THEN
    SELECT id INTO v_created_by
    FROM principals
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- ==========================================================================
  -- Create or get default signing key for organization
  -- ==========================================================================
  
  SELECT id INTO v_signing_key_id
  FROM signing_keys
  WHERE organization_id = v_org_id
    AND is_active = true
    AND is_default = true
  LIMIT 1;

  IF v_signing_key_id IS NULL THEN
    INSERT INTO signing_keys (
      organization_id, key_name, key_purpose, key_storage_mode,
      signature_algorithm, public_key, public_key_fingerprint,
      encrypted_private_key, is_active, is_default, created_by
    )
    VALUES (
      v_org_id,
      'AGEI Demo Signing Key',
      'evidence_signing',
      'local_demo',
      'ED25519',
      'DEMO_PUBLIC_KEY_PLACEHOLDER',
      'sha256:' || encode(digest('DEMO_PUBLIC_KEY_PLACEHOLDER', 'sha256'), 'hex'),
      'DEMO_ENCRYPTED_PRIVATE_KEY_PLACEHOLDER',
      true,
      true,
      v_created_by
    )
    RETURNING id INTO v_signing_key_id;
  END IF;

  -- ==========================================================================
  -- 1. Model Deployment Readiness Policy
  -- ==========================================================================

  v_rules := jsonb_build_array(
    jsonb_build_object(
      'rule_key', 'DATASET_PROVENANCE_REQUIRED',
      'rule_name', 'Dataset provenance receipt is required',
      'description', 'A production model deployment must reference the dataset receipt used for training or validation.',
      'rule_type', 'provenance',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.evidence.dataset_receipt_id',
        'operator', 'exists',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'MISSING_DATASET_PROVENANCE',
        'message', 'Dataset provenance evidence is missing.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'VALIDATION_ACCURACY_MINIMUM',
      'rule_name', 'Validation accuracy must meet threshold',
      'description', 'Model validation accuracy must be at least 0.92 before production deployment.',
      'rule_type', 'quality',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.metrics.accuracy',
        'operator', 'gte',
        'expected_value', 0.92
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'ACCURACY_BELOW_THRESHOLD',
        'message', 'Model accuracy is below the required production threshold.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'HIGH_RISK_DEPLOYMENT_REQUIRES_HITL',
      'rule_name', 'High-risk deployment requires human review',
      'description', 'High and critical risk model deployments must be escalated to an authorized reviewer.',
      'rule_type', 'risk',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.risk_class',
        'operator', 'in',
        'expected_value', jsonb_build_array('high', 'critical')
      ),
      'action', jsonb_build_object(
        'on_fail', 'escalate',
        'reason_code', 'HUMAN_REVIEW_REQUIRED',
        'message', 'High-risk deployment requires human review before release.'
      )
    )
  );

  v_payload := jsonb_build_object(
    'policy_key', 'model_deployment_readiness',
    'policy_name', 'Model Deployment Readiness Policy',
    'policy_domain', 'model_governance',
    'lifecycle_stage', 'deployment',
    'description', 'Ensures production model deployments have provenance, validation metrics, and human review for high-risk deployment.',
    'default_failure_action', 'deny',
    'high_risk_action', 'escalate',
    'rules', v_rules
  );

  INSERT INTO policy_sets (
    organization_id, name, slug, description, is_active, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Model Deployment Readiness Policy',
    'agei-example-model-deployment-readiness',
    'Requires provenance, validation quality, and HITL review for high-risk deployments.',
    true,
    '["example", "model-governance", "deployment"]'::jsonb,
    '{"example": true, "agei_layer": "policy_governance"}'::jsonb,
    v_created_by
  )
  RETURNING id INTO v_policy_set_id;

  v_hash := agei_hash_jsonb(v_payload);

  INSERT INTO policy_versions (
    policy_set_id, organization_id, version, version_number, policy_payload,
    payload_hash, hash_algorithm, canonicalization_version,
    signature, signature_algorithm, signing_key_id, signed_by, signed_at,
    is_active, is_published, published_at, change_summary, metadata, created_by
  )
  VALUES (
    v_policy_set_id, v_org_id, '1.0.0', 1, v_payload,
    v_hash, 'sha256', 'agei-json-v1',
    'AGEI_DEMO_SIGNATURE_PLACEHOLDER_' || encode(digest(v_hash || v_org_id::text, 'sha256'), 'hex'),
    'ED25519', v_signing_key_id, v_created_by, now(),
    true, true, now(), 'Initial example policy for production model deployment readiness.',
    '{"example": true}'::jsonb, v_created_by
  )
  RETURNING id INTO v_policy_version_id;

  INSERT INTO policy_rules (
    policy_version_id, organization_id, rule_key, rule_name, description,
    rule_payload, rule_type, severity, rule_order, rule_group, is_enabled, metadata
  )
  SELECT
    v_policy_version_id,
    v_org_id,
    r->>'rule_key',
    r->>'rule_name',
    r->>'description',
    r,
    r->>'rule_type',
    r->>'severity',
    ordinality::int,
    'deployment_readiness',
    (r->>'is_enabled')::boolean,
    '{"example": true}'::jsonb
  FROM jsonb_array_elements(v_rules) WITH ORDINALITY AS t(r, ordinality);

  UPDATE policy_sets
  SET current_version_id = v_policy_version_id, updated_at = now()
  WHERE id = v_policy_set_id;

  v_gate_payload := jsonb_build_object(
    'trigger_event_types', jsonb_build_array('model_deployment_requested'),
    'required_event_fields', jsonb_build_array(
      '$.evidence.dataset_receipt_id',
      '$.metrics.accuracy',
      '$.risk_class'
    ),
    'outcome_strategy', jsonb_build_object(
      'pass', 'approve',
      'fail', 'deny',
      'warning', 'escalate',
      'error', 'deny'
    ),
    'test_events', jsonb_build_object(
      'approve', jsonb_build_object(
        'evidence', jsonb_build_object('dataset_receipt_id', 'receipt-example-dataset'),
        'metrics', jsonb_build_object('accuracy', 0.95),
        'risk_class', 'medium'
      ),
      'deny', jsonb_build_object(
        'evidence', jsonb_build_object('dataset_receipt_id', 'receipt-example-dataset'),
        'metrics', jsonb_build_object('accuracy', 0.84),
        'risk_class', 'medium'
      ),
      'inspect', jsonb_build_object(
        'metrics', jsonb_build_object('accuracy', 0.95),
        'risk_class', 'medium'
      ),
      'escalate', jsonb_build_object(
        'evidence', jsonb_build_object('dataset_receipt_id', 'receipt-example-dataset'),
        'metrics', jsonb_build_object('accuracy', 0.95),
        'risk_class', 'high'
      )
    )
  );

  INSERT INTO gate_definitions (
    organization_id, name, slug, gate_type, description, gate_payload,
    policy_set_id, policy_version_id, evaluation_mode, failure_action,
    is_active, is_required, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Production Deployment Readiness Gate',
    'agei-example-production-deployment-readiness-gate',
    'pre_deployment',
    'Evaluates whether a model is ready for production deployment.',
    v_gate_payload,
    v_policy_set_id,
    v_policy_version_id,
    'blocking',
    'deny',
    true,
    true,
    '["example", "deployment", "model-governance"]'::jsonb,
    '{"example": true}'::jsonb,
    v_created_by
  );

  -- ==========================================================================
  -- 2. Agent Pre-Action Tool Policy
  -- ==========================================================================

  v_rules := jsonb_build_array(
    jsonb_build_object(
      'rule_key', 'ACTIVE_AGENT_SESSION_REQUIRED',
      'rule_name', 'Agent session must be active',
      'description', 'An agent cannot invoke a governed tool unless the session is active.',
      'rule_type', 'identity',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.agent_session.status',
        'operator', 'equals',
        'expected_value', 'active'
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'AGENT_SESSION_NOT_ACTIVE',
        'message', 'Agent session is not active.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'PRE_ACTION_PROOF_REQUIRED',
      'rule_name', 'Pre-action proof is required',
      'description', 'Governed tool invocations must include a pre-action proof bundle.',
      'rule_type', 'evidence',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.pre_action_proof.proof_hash',
        'operator', 'exists',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'MISSING_PRE_ACTION_PROOF',
        'message', 'Pre-action proof is missing.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'TOOL_MUST_BE_ALLOWED',
      'rule_name', 'Tool must be allowed by permission boundary',
      'description', 'The requested tool must appear in the agent permission boundary allowed_tools list.',
      'rule_type', 'authorization',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.tool.tool_key',
        'operator', 'in',
        'expected_value_path', '$.permission_boundary.allowed_tools'
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'TOOL_NOT_ALLOWED',
        'message', 'The requested tool is outside the agent permission boundary.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'HIGH_RISK_TOOL_REQUIRES_HITL',
      'rule_name', 'High-risk tool requires human review',
      'description', 'Critical or high-risk tool actions must be escalated.',
      'rule_type', 'risk',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.tool.risk_class',
        'operator', 'in',
        'expected_value', jsonb_build_array('high', 'critical')
      ),
      'action', jsonb_build_object(
        'on_fail', 'escalate',
        'reason_code', 'HIGH_RISK_TOOL_REQUIRES_HITL',
        'message', 'High-risk tool action requires human review.'
      )
    )
  );

  v_payload := jsonb_build_object(
    'policy_key', 'agent_pre_action_tool_policy',
    'policy_name', 'Agent Pre-Action Tool Policy',
    'policy_domain', 'agentic_governance',
    'lifecycle_stage', 'runtime',
    'description', 'Requires active session, pre-action proof, permission boundary, and HITL for high-risk agent tools.',
    'default_failure_action', 'deny',
    'high_risk_action', 'escalate',
    'rules', v_rules
  );

  INSERT INTO policy_sets (
    organization_id, name, slug, description, is_active, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Agent Pre-Action Tool Policy',
    'agei-example-agent-pre-action-tool-policy',
    'Requires proof and permission checks before an agent can invoke a tool.',
    true,
    '["example", "agentic", "pre-action-proof"]'::jsonb,
    '{"example": true, "agei_layer": "agentic_runtime"}'::jsonb,
    v_created_by
  )
  RETURNING id INTO v_policy_set_id;

  v_hash := agei_hash_jsonb(v_payload);

  INSERT INTO policy_versions (
    policy_set_id, organization_id, version, version_number, policy_payload,
    payload_hash, hash_algorithm, canonicalization_version,
    signature, signature_algorithm, signing_key_id, signed_by, signed_at,
    is_active, is_published, published_at, change_summary, metadata, created_by
  )
  VALUES (
    v_policy_set_id, v_org_id, '1.0.0', 1, v_payload,
    v_hash, 'sha256', 'agei-json-v1',
    'AGEI_DEMO_SIGNATURE_PLACEHOLDER_' || encode(digest(v_hash || v_org_id::text, 'sha256'), 'hex'),
    'ED25519', v_signing_key_id, v_created_by, now(),
    true, true, now(), 'Initial example policy for agent pre-action tool governance.',
    '{"example": true}'::jsonb, v_created_by
  )
  RETURNING id INTO v_policy_version_id;

  INSERT INTO policy_rules (
    policy_version_id, organization_id, rule_key, rule_name, description,
    rule_payload, rule_type, severity, rule_order, rule_group, is_enabled, metadata
  )
  SELECT
    v_policy_version_id, v_org_id, r->>'rule_key', r->>'rule_name',
    r->>'description', r, r->>'rule_type', r->>'severity', ordinality::int,
    'agent_pre_action', (r->>'is_enabled')::boolean, '{"example": true}'::jsonb
  FROM jsonb_array_elements(v_rules) WITH ORDINALITY AS t(r, ordinality);

  UPDATE policy_sets
  SET current_version_id = v_policy_version_id, updated_at = now()
  WHERE id = v_policy_set_id;

  v_gate_payload := jsonb_build_object(
    'trigger_event_types', jsonb_build_array('agent_tool_invocation_requested'),
    'required_event_fields', jsonb_build_array(
      '$.agent_session.status',
      '$.pre_action_proof.proof_hash',
      '$.tool.tool_key',
      '$.permission_boundary.allowed_tools'
    ),
    'outcome_strategy', jsonb_build_object(
      'pass', 'approve',
      'fail', 'deny',
      'warning', 'escalate',
      'error', 'deny'
    )
  );

  INSERT INTO gate_definitions (
    organization_id, name, slug, gate_type, description, gate_payload,
    policy_set_id, policy_version_id, evaluation_mode, failure_action,
    is_active, is_required, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Agent Pre-Action Tool Gate',
    'agei-example-agent-pre-action-tool-gate',
    'custom',
    'Evaluates proof and permission boundary before a governed agent tool action.',
    v_gate_payload,
    v_policy_set_id,
    v_policy_version_id,
    'blocking',
    'deny',
    true,
    true,
    '["example", "agentic", "tool-governance"]'::jsonb,
    '{"example": true}'::jsonb,
    v_created_by
  );

  -- ==========================================================================
  -- 3. Customer Communication Safety Policy
  -- ==========================================================================

  v_rules := jsonb_build_array(
    jsonb_build_object(
      'rule_key', 'CUSTOMER_TEMPLATE_REQUIRED',
      'rule_name', 'Customer message must use an approved template',
      'description', 'Customer-facing responses for governed decisions must use an approved communication template.',
      'rule_type', 'communication',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.customer_message.template_id',
        'operator', 'exists',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'CUSTOMER_TEMPLATE_MISSING',
        'message', 'Customer response template is missing.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'INTERNAL_REASON_NOT_DISCLOSED',
      'rule_name', 'Internal reason code must not be disclosed',
      'description', 'Internal governance reason codes must not appear in customer-facing messages.',
      'rule_type', 'communication',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.customer_message.discloses_internal_reason',
        'operator', 'equals',
        'expected_value', false
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'INTERNAL_REASON_DISCLOSURE_BLOCKED',
        'message', 'Customer message discloses internal governance reason.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'ADVERSE_ACTION_REQUIRES_HITL',
      'rule_name', 'Adverse customer action requires human review',
      'description', 'Messages communicating denial, restriction, or adverse action must be reviewed.',
      'rule_type', 'risk',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.customer_message.action_type',
        'operator', 'in',
        'expected_value', jsonb_build_array('denial', 'restriction', 'adverse_action')
      ),
      'action', jsonb_build_object(
        'on_fail', 'escalate',
        'reason_code', 'CUSTOMER_ADVERSE_ACTION_REVIEW_REQUIRED',
        'message', 'Adverse customer action requires human review.'
      )
    )
  );

  v_payload := jsonb_build_object(
    'policy_key', 'customer_communication_safety',
    'policy_name', 'Customer Communication Safety Policy',
    'policy_domain', 'customer_communication',
    'lifecycle_stage', 'runtime',
    'description', 'Prevents unsafe or improper customer-facing AI messages and blocks internal reason disclosure.',
    'default_failure_action', 'inspect',
    'high_risk_action', 'escalate',
    'rules', v_rules
  );

  INSERT INTO policy_sets (
    organization_id, name, slug, description, is_active, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Customer Communication Safety Policy',
    'agei-example-customer-communication-safety-policy',
    'Ensures customer-facing AI messages use safe templates and do not disclose internal governance reasons.',
    true,
    '["example", "customer-communication", "safety"]'::jsonb,
    '{"example": true, "agei_layer": "runtime_governance"}'::jsonb,
    v_created_by
  )
  RETURNING id INTO v_policy_set_id;

  v_hash := agei_hash_jsonb(v_payload);

  INSERT INTO policy_versions (
    policy_set_id, organization_id, version, version_number, policy_payload,
    payload_hash, hash_algorithm, canonicalization_version,
    signature, signature_algorithm, signing_key_id, signed_by, signed_at,
    is_active, is_published, published_at, change_summary, metadata, created_by
  )
  VALUES (
    v_policy_set_id, v_org_id, '1.0.0', 1, v_payload,
    v_hash, 'sha256', 'agei-json-v1',
    'AGEI_DEMO_SIGNATURE_PLACEHOLDER_' || encode(digest(v_hash || v_org_id::text, 'sha256'), 'hex'),
    'ED25519', v_signing_key_id, v_created_by, now(),
    true, true, now(), 'Initial example policy for customer communication safety.',
    '{"example": true}'::jsonb, v_created_by
  )
  RETURNING id INTO v_policy_version_id;

  INSERT INTO policy_rules (
    policy_version_id, organization_id, rule_key, rule_name, description,
    rule_payload, rule_type, severity, rule_order, rule_group, is_enabled, metadata
  )
  SELECT
    v_policy_version_id, v_org_id, r->>'rule_key', r->>'rule_name',
    r->>'description', r, r->>'rule_type', r->>'severity', ordinality::int,
    'customer_communication', (r->>'is_enabled')::boolean, '{"example": true}'::jsonb
  FROM jsonb_array_elements(v_rules) WITH ORDINALITY AS t(r, ordinality);

  UPDATE policy_sets
  SET current_version_id = v_policy_version_id, updated_at = now()
  WHERE id = v_policy_set_id;

  v_gate_payload := jsonb_build_object(
    'trigger_event_types', jsonb_build_array('customer_message_generated'),
    'required_event_fields', jsonb_build_array(
      '$.customer_message.template_id',
      '$.customer_message.discloses_internal_reason',
      '$.customer_message.action_type'
    ),
    'outcome_strategy', jsonb_build_object(
      'pass', 'approve',
      'fail', 'deny',
      'warning', 'escalate',
      'error', 'deny'
    )
  );

  INSERT INTO gate_definitions (
    organization_id, name, slug, gate_type, description, gate_payload,
    policy_set_id, policy_version_id, evaluation_mode, failure_action,
    is_active, is_required, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Customer Communication Gate',
    'agei-example-customer-communication-gate',
    'inference',
    'Evaluates customer-facing AI messages before release.',
    v_gate_payload,
    v_policy_set_id,
    v_policy_version_id,
    'blocking',
    'inspect',
    true,
    true,
    '["example", "customer-communication", "runtime"]'::jsonb,
    '{"example": true}'::jsonb,
    v_created_by
  );

  -- ==========================================================================
  -- 4. Runtime Inference Evidence Policy
  -- ==========================================================================

  v_rules := jsonb_build_array(
    jsonb_build_object(
      'rule_key', 'MODEL_ID_REQUIRED',
      'rule_name', 'Model ID is required',
      'description', 'Runtime inference evidence must identify the model that produced the output.',
      'rule_type', 'evidence',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.model.model_id',
        'operator', 'exists',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'MODEL_ID_MISSING',
        'message', 'Model identifier is missing from inference evidence.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'CONFIDENCE_MINIMUM_REQUIRED',
      'rule_name', 'Inference confidence must meet threshold',
      'description', 'Runtime inference must meet minimum confidence for automated approval.',
      'rule_type', 'quality',
      'severity', 'medium',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.metrics.confidence',
        'operator', 'gte',
        'expected_value', 0.75
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'LOW_CONFIDENCE_REQUIRES_INSPECTION',
        'message', 'Inference confidence is below automated approval threshold.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'REGULATED_DECISION_REQUIRES_EXPLANATION',
      'rule_name', 'Regulated decisions require explanation',
      'description', 'Credit, medical, legal, employment, or insurance decisions require explanation evidence.',
      'rule_type', 'regulated_decision',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.decision.requires_explanation',
        'operator', 'equals',
        'expected_value', false
      ),
      'action', jsonb_build_object(
        'on_fail', 'escalate',
        'reason_code', 'EXPLANATION_REQUIRED_FOR_REGULATED_DECISION',
        'message', 'Regulated decision requires explanation and review.'
      )
    )
  );

  v_payload := jsonb_build_object(
    'policy_key', 'runtime_inference_evidence',
    'policy_name', 'Runtime Inference Evidence Policy',
    'policy_domain', 'runtime_governance',
    'lifecycle_stage', 'inference',
    'description', 'Ensures runtime inference events include model identity, confidence, and explanation evidence when required.',
    'default_failure_action', 'inspect',
    'high_risk_action', 'escalate',
    'rules', v_rules
  );

  INSERT INTO policy_sets (
    organization_id, name, slug, description, is_active, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Runtime Inference Evidence Policy',
    'agei-example-runtime-inference-evidence-policy',
    'Ensures runtime inference evidence is complete and reviewable.',
    true,
    '["example", "runtime", "inference"]'::jsonb,
    '{"example": true, "agei_layer": "runtime_governance"}'::jsonb,
    v_created_by
  )
  RETURNING id INTO v_policy_set_id;

  v_hash := agei_hash_jsonb(v_payload);

  INSERT INTO policy_versions (
    policy_set_id, organization_id, version, version_number, policy_payload,
    payload_hash, hash_algorithm, canonicalization_version,
    signature, signature_algorithm, signing_key_id, signed_by, signed_at,
    is_active, is_published, published_at, change_summary, metadata, created_by
  )
  VALUES (
    v_policy_set_id, v_org_id, '1.0.0', 1, v_payload,
    v_hash, 'sha256', 'agei-json-v1',
    'AGEI_DEMO_SIGNATURE_PLACEHOLDER_' || encode(digest(v_hash || v_org_id::text, 'sha256'), 'hex'),
    'ED25519', v_signing_key_id, v_created_by, now(),
    true, true, now(), 'Initial example policy for runtime inference evidence.',
    '{"example": true}'::jsonb, v_created_by
  )
  RETURNING id INTO v_policy_version_id;

  INSERT INTO policy_rules (
    policy_version_id, organization_id, rule_key, rule_name, description,
    rule_payload, rule_type, severity, rule_order, rule_group, is_enabled, metadata
  )
  SELECT
    v_policy_version_id, v_org_id, r->>'rule_key', r->>'rule_name',
    r->>'description', r, r->>'rule_type', r->>'severity', ordinality::int,
    'runtime_inference', (r->>'is_enabled')::boolean, '{"example": true}'::jsonb
  FROM jsonb_array_elements(v_rules) WITH ORDINALITY AS t(r, ordinality);

  UPDATE policy_sets
  SET current_version_id = v_policy_version_id, updated_at = now()
  WHERE id = v_policy_set_id;

  v_gate_payload := jsonb_build_object(
    'trigger_event_types', jsonb_build_array('inference_response_generated'),
    'required_event_fields', jsonb_build_array(
      '$.model.model_id',
      '$.metrics.confidence',
      '$.decision.requires_explanation'
    ),
    'outcome_strategy', jsonb_build_object(
      'pass', 'approve',
      'fail', 'inspect',
      'warning', 'escalate',
      'error', 'deny'
    )
  );

  INSERT INTO gate_definitions (
    organization_id, name, slug, gate_type, description, gate_payload,
    policy_set_id, policy_version_id, evaluation_mode, failure_action,
    is_active, is_required, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Runtime Inference Evidence Gate',
    'agei-example-runtime-inference-evidence-gate',
    'inference',
    'Evaluates runtime inference evidence before approval or release.',
    v_gate_payload,
    v_policy_set_id,
    v_policy_version_id,
    'blocking',
    'inspect',
    true,
    true,
    '["example", "runtime", "inference"]'::jsonb,
    '{"example": true}'::jsonb,
    v_created_by
  );

  -- ==========================================================================
  -- 5. Audit Pack Materialization Policy
  -- ==========================================================================

  v_rules := jsonb_build_array(
    jsonb_build_object(
      'rule_key', 'ALL_RECEIPTS_VERIFY',
      'rule_name', 'All receipts must verify',
      'description', 'Every receipt included in the audit pack must have a valid content hash.',
      'rule_type', 'verification',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.verification.receipts_verified',
        'operator', 'equals',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'AUDIT_PACK_RECEIPT_VERIFICATION_FAILED',
        'message', 'One or more receipts failed verification.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'LINEAGE_CHAIN_INTACT',
      'rule_name', 'Lineage chain must be intact',
      'description', 'Audit pack evidence must include an intact receipt lineage chain.',
      'rule_type', 'lineage',
      'severity', 'critical',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.verification.lineage_intact',
        'operator', 'equals',
        'expected_value', true
      ),
      'action', jsonb_build_object(
        'on_fail', 'deny',
        'reason_code', 'LINEAGE_CHAIN_BROKEN',
        'message', 'Receipt lineage chain verification failed.'
      )
    ),
    jsonb_build_object(
      'rule_key', 'PRIVACY_REDACTION_APPLIED',
      'rule_name', 'Privacy redaction must be applied when required',
      'description', 'If the audit pack contains personal data references, redaction evidence must be present.',
      'rule_type', 'privacy',
      'severity', 'high',
      'is_enabled', true,
      'condition', jsonb_build_object(
        'input_path', '$.privacy.redaction_required',
        'operator', 'equals',
        'expected_value', false
      ),
      'action', jsonb_build_object(
        'on_fail', 'inspect',
        'reason_code', 'PRIVACY_REDACTION_REVIEW_REQUIRED',
        'message', 'Privacy redaction must be reviewed before audit pack export.'
      )
    )
  );

  v_payload := jsonb_build_object(
    'policy_key', 'audit_pack_materialization',
    'policy_name', 'Audit Pack Materialization Policy',
    'policy_domain', 'audit',
    'lifecycle_stage', 'audit',
    'description', 'Requires verified receipts, intact lineage, and privacy redaction review before audit pack export.',
    'default_failure_action', 'deny',
    'high_risk_action', 'inspect',
    'rules', v_rules
  );

  INSERT INTO policy_sets (
    organization_id, name, slug, description, is_active, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Audit Pack Materialization Policy',
    'agei-example-audit-pack-materialization-policy',
    'Ensures audit packs contain verified receipts, intact lineage, and required privacy review.',
    true,
    '["example", "audit", "verification"]'::jsonb,
    '{"example": true, "agei_layer": "audit_verification"}'::jsonb,
    v_created_by
  )
  RETURNING id INTO v_policy_set_id;

  v_hash := agei_hash_jsonb(v_payload);

  INSERT INTO policy_versions (
    policy_set_id, organization_id, version, version_number, policy_payload,
    payload_hash, hash_algorithm, canonicalization_version,
    signature, signature_algorithm, signing_key_id, signed_by, signed_at,
    is_active, is_published, published_at, change_summary, metadata, created_by
  )
  VALUES (
    v_policy_set_id, v_org_id, '1.0.0', 1, v_payload,
    v_hash, 'sha256', 'agei-json-v1',
    'AGEI_DEMO_SIGNATURE_PLACEHOLDER_' || encode(digest(v_hash || v_org_id::text, 'sha256'), 'hex'),
    'ED25519', v_signing_key_id, v_created_by, now(),
    true, true, now(), 'Initial example policy for audit pack materialization.',
    '{"example": true}'::jsonb, v_created_by
  )
  RETURNING id INTO v_policy_version_id;

  INSERT INTO policy_rules (
    policy_version_id, organization_id, rule_key, rule_name, description,
    rule_payload, rule_type, severity, rule_order, rule_group, is_enabled, metadata
  )
  SELECT
    v_policy_version_id, v_org_id, r->>'rule_key', r->>'rule_name',
    r->>'description', r, r->>'rule_type', r->>'severity', ordinality::int,
    'audit_materialization', (r->>'is_enabled')::boolean, '{"example": true}'::jsonb
  FROM jsonb_array_elements(v_rules) WITH ORDINALITY AS t(r, ordinality);

  UPDATE policy_sets
  SET current_version_id = v_policy_version_id, updated_at = now()
  WHERE id = v_policy_set_id;

  v_gate_payload := jsonb_build_object(
    'trigger_event_types', jsonb_build_array('audit_pack_requested'),
    'required_event_fields', jsonb_build_array(
      '$.verification.receipts_verified',
      '$.verification.lineage_intact',
      '$.privacy.redaction_required'
    ),
    'outcome_strategy', jsonb_build_object(
      'pass', 'approve',
      'fail', 'deny',
      'warning', 'inspect',
      'error', 'deny'
    )
  );

  INSERT INTO gate_definitions (
    organization_id, name, slug, gate_type, description, gate_payload,
    policy_set_id, policy_version_id, evaluation_mode, failure_action,
    is_active, is_required, tags, metadata, created_by
  )
  VALUES (
    v_org_id,
    'Audit Pack Materialization Gate',
    'agei-example-audit-pack-materialization-gate',
    'custom',
    'Evaluates whether an audit pack is ready for materialization and export.',
    v_gate_payload,
    v_policy_set_id,
    v_policy_version_id,
    'blocking',
    'deny',
    true,
    true,
    '["example", "audit", "verification"]'::jsonb,
    '{"example": true}'::jsonb,
    v_created_by
  );

  RAISE NOTICE 'AGEI example policies, rules, and gates seeded successfully for organization %', v_org_id;
END $$;

