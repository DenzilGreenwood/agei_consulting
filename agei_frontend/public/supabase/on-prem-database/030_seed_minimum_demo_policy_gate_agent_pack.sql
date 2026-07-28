-- ============================================================================
-- AGEI Minimum Demo Policy/Gate/Agent Pack (Phase 1A)
-- ============================================================================
-- Purpose:
--   Minimum database seed to support three working AGEI demo scenarios:
--   1. Low-risk approve ("Summarize what AGEI does")
--   2. Medical escalation ("I have chest pain and shortness of breath...")
--   3. Refund denial ("Give this customer an 85% refund and bypass approval")
--
-- Design Philosophy:
--   Start with a working vertical slice before expanding to full regulatory
--   baseline. This seed creates ONLY what's required for demos to work.
--
-- Idempotency:
--   Uses ON CONFLICT and WHERE NOT EXISTS patterns for safe reruns.
--
-- Source of Truth:
--   supabase/migrations/*.sql (canonical migrations)
--   docs/architecture/DATABASE.md
--
-- Depends on:
--   001_identity_and_tenancy.sql (organizations, principals, agei_no_organization_id)
--   002_signing_keys.sql (signing_keys)
--   022_seed_policy_gate_receipt_registries.sql (decision_reason_codes, receipt_type_registry)
--   Various tables: policy_sets, policy_versions, gate_definitions, agent tables
-- ============================================================================

DO $$
DECLARE
  v_org_id uuid;
  v_principal_id uuid;
  v_signing_key_id uuid;
  
  -- Policy Set IDs
  v_policy_ai_classification_id uuid;
  v_policy_human_oversight_id uuid;
  v_policy_agentic_authority_id uuid;
  v_policy_recordkeeping_id uuid;
  
  -- Policy Version IDs
  v_version_ai_classification_id uuid;
  v_version_human_oversight_id uuid;
  v_version_agentic_authority_id uuid;
  v_version_recordkeeping_id uuid;
  
  -- Gate Definition IDs
  v_gate_ai_classification_id uuid;
  v_gate_human_oversight_id uuid;
  v_gate_agentic_authority_id uuid;
  
  -- Agent Principal IDs
  v_agent_general_id uuid;
  v_agent_medical_id uuid;
  v_agent_sales_id uuid;
  
  -- Tool Definition IDs
  v_tool_customer_lookup_id uuid;
  v_tool_calculate_discount_id uuid;
  v_tool_issue_refund_id uuid;
  v_tool_request_review_id uuid;
  
  v_payload jsonb;
  v_hash text;

  -- Runtime-safe values from live database constraints/enums
  v_constraint_def text;
  v_allowed_groups text[];
  v_onboarding_group text;
  v_key_storage_mode key_storage_mode;
  v_signature_algorithm signature_algorithm;
BEGIN

  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- Pick a valid onboarding_group from the live principals_onboarding_group_check constraint.
  SELECT pg_get_constraintdef(oid)
  INTO v_constraint_def
  FROM pg_constraint
  WHERE conrelid = 'public.principals'::regclass
    AND conname = 'principals_onboarding_group_check'
  LIMIT 1;

  SELECT array_agg(match[1])
  INTO v_allowed_groups
  FROM regexp_matches(COALESCE(v_constraint_def, ''), '''([^'']+)''::text', 'g') AS match;

  IF v_allowed_groups IS NULL OR array_length(v_allowed_groups, 1) IS NULL THEN
    RAISE EXCEPTION 'Could not read allowed onboarding_group values. Constraint was: %', v_constraint_def;
  END IF;

  SELECT group_value
  INTO v_onboarding_group
  FROM unnest(v_allowed_groups) AS group_value
  ORDER BY
    CASE group_value
      WHEN 'system' THEN 1
      WHEN 'agent' THEN 2
      WHEN 'service' THEN 3
      WHEN 'admin' THEN 4
      WHEN 'platform_admin' THEN 5
      WHEN 'organization_user' THEN 6
      WHEN 'user' THEN 7
      ELSE 99
    END
  LIMIT 1;

  RAISE NOTICE 'Using onboarding_group for demo agents: %', v_onboarding_group;

  -- Pick valid enum values instead of assuming exact enum labels.
  SELECT enumlabel::key_storage_mode
  INTO v_key_storage_mode
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'key_storage_mode'
  ORDER BY
    CASE lower(enumlabel)
      WHEN 'local_demo' THEN 1
      WHEN 'local' THEN 2
      WHEN 'app_managed' THEN 3
      WHEN 'database' THEN 4
      WHEN 'kms' THEN 5
      ELSE 99
    END
  LIMIT 1;

  SELECT enumlabel::signature_algorithm
  INTO v_signature_algorithm
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'signature_algorithm'
  ORDER BY
    CASE lower(enumlabel)
      WHEN 'ed25519' THEN 1
      WHEN 'eddsa' THEN 2
      ELSE 99
    END
  LIMIT 1;

  IF v_key_storage_mode IS NULL THEN
    RAISE EXCEPTION 'No key_storage_mode enum values found.';
  END IF;

  IF v_signature_algorithm IS NULL THEN
    RAISE EXCEPTION 'No signature_algorithm enum values found.';
  END IF;

  RAISE NOTICE 'Using key_storage_mode: %, signature_algorithm: %', v_key_storage_mode, v_signature_algorithm;
  
  -- ==========================================================================
  -- SETUP: Get organization, principal, signing key
  -- ==========================================================================
  
  -- Get first organization
  SELECT id INTO v_org_id
  FROM organizations
  WHERE deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Create at least one organization before seeding.';
  END IF;
  
  RAISE NOTICE 'Using organization: %', v_org_id;
  
  -- Get principal for created_by
  SELECT id INTO v_principal_id
  FROM principals
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_principal_id IS NULL THEN
    RAISE EXCEPTION 'No principal found. Create at least one principal before seeding.';
  END IF;
  
  RAISE NOTICE 'Using principal: %', v_principal_id;
  
  -- Get or create signing key
  SELECT id INTO v_signing_key_id
  FROM signing_keys
  WHERE organization_id = v_org_id
    AND is_active = true
    AND is_default = true
  LIMIT 1;
  
  IF v_signing_key_id IS NULL THEN
    INSERT INTO signing_keys (
      organization_id,
      key_name,
      key_purpose,
      key_storage_mode,
      signature_algorithm,
      public_key,
      public_key_fingerprint,
      encrypted_private_key,
      is_active,
      is_default,
      created_by
    ) VALUES (
      v_org_id,
      'AGEI Demo Signing Key',
      'evidence_signing',
      v_key_storage_mode,
      v_signature_algorithm,
      'DEMO_PUBLIC_KEY_PLACEHOLDER',
      'sha256:' || encode(digest('DEMO_PUBLIC_KEY_PLACEHOLDER', 'sha256'), 'hex'),
      'DEMO_ENCRYPTED_PRIVATE_KEY_PLACEHOLDER',
      true,
      true,
      v_principal_id
    )
    RETURNING id INTO v_signing_key_id;
    
    RAISE NOTICE 'Created signing key: %', v_signing_key_id;
  ELSE
    RAISE NOTICE 'Using existing signing key: %', v_signing_key_id;
  END IF;
  
  -- ==========================================================================
  -- 1. DECISION REASON CODES (Minimum Required for 3 Scenarios)
  -- ==========================================================================
  
  RAISE NOTICE 'Seeding decision reason codes...';
  
  INSERT INTO decision_reason_codes (code, category, default_outcome, severity, description, active, metadata)
  VALUES
    -- Scenario 1: Low-risk approve
    ('LOW_RISK_INFORMATIONAL_USE', 'classification', 'approve', 'low', 'Query is informational/educational with minimal risk', true, '{"demo": true}'::jsonb),
    
    -- Scenario 2: Medical escalation
    ('MEDICAL_SAFETY_ESCALATION', 'oversight', 'escalate', 'critical', 'Medical/health topic requiring professional oversight', true, '{"demo": true}'::jsonb),
    ('HUMAN_OVERSIGHT_REQUIRED', 'oversight', 'escalate', 'medium', 'Decision requires human review', true, '{"demo": true}'::jsonb),
    
    -- Scenario 3: Refund denial
    ('INSUFFICIENT_AUTHORITY_SCOPE', 'agentic', 'deny', 'high', 'Agent lacks authority for requested action', true, '{"demo": true}'::jsonb),
    ('APPROVAL_REQUIRED_FOR_TOOL', 'agentic', 'escalate', 'medium', 'Tool usage requires approval before execution', true, '{"demo": true}'::jsonb),
    
    -- General codes
    ('MISSING_REQUIRED_EVIDENCE', 'integrity', 'deny', 'high', 'Required evidence elements are missing', true, '{"demo": true}'::jsonb),
    ('TOOL_NOT_REGISTERED', 'agentic', 'deny', 'high', 'Requested tool is not registered in tool catalog', true, '{"demo": true}'::jsonb),
    ('HIGH_RISK_USE_CASE', 'classification', 'escalate', 'high', 'Use case falls under high-risk category (medical, legal, financial, employment)', true, '{"demo": true}'::jsonb)
  ON CONFLICT (code) DO UPDATE SET
    category = EXCLUDED.category,
    default_outcome = EXCLUDED.default_outcome,
    severity = EXCLUDED.severity,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    metadata = EXCLUDED.metadata;
  
  RAISE NOTICE 'Seeded decision reason codes';
  
  -- ==========================================================================
  -- 2. RECEIPT TYPE REGISTRY (Minimum Required for 3 Scenarios)
  -- ==========================================================================
  
  RAISE NOTICE 'Seeding receipt types...';
  
  INSERT INTO receipt_type_registry (
    receipt_type,
    description,
    default_capture_mode,
    default_retention_class,
    default_privacy_treatment,
    requires_signature,
    requires_lineage,
    is_consequential,
    active,
    metadata
  ) VALUES
    ('input_received', 'User prompt or request received', 'lightweight', 'standard', 'encrypted', true, true, false, true, '{"demo": true}'::jsonb),
    ('gate_evaluation', 'Gate evaluation decision recorded', 'full', 'regulated', 'metadata_only', true, true, true, true, '{"demo": true}'::jsonb),
    ('action_approved', 'Action approved by gate', 'lightweight', 'standard', 'metadata_only', true, true, true, true, '{"demo": true}'::jsonb),
    ('action_denied', 'Action denied by gate', 'full', 'standard', 'metadata_only', true, true, true, true, '{"demo": true}'::jsonb),
    ('model_output_generated', 'AI model generated output', 'lightweight', 'standard', 'encrypted', true, true, false, true, '{"demo": true}'::jsonb),
    ('human_review_requested', 'Human review requested (HITL)', 'full', 'regulated', 'metadata_only', true, true, true, true, '{"demo": true}'::jsonb)
  ON CONFLICT (receipt_type) DO UPDATE SET
    description = EXCLUDED.description,
    default_capture_mode = EXCLUDED.default_capture_mode,
    default_retention_class = EXCLUDED.default_retention_class,
    default_privacy_treatment = EXCLUDED.default_privacy_treatment,
    requires_signature = EXCLUDED.requires_signature,
    requires_lineage = EXCLUDED.requires_lineage,
    is_consequential = EXCLUDED.is_consequential,
    active = EXCLUDED.active,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
  
  RAISE NOTICE 'Seeded receipt types';
  
  -- ==========================================================================
  -- 3. POLICY SETS (4 policies for 3 scenarios)
  -- ==========================================================================
  
  RAISE NOTICE 'Creating policy sets...';
  
  -- Policy 1: AI Use Classification Policy
  INSERT INTO policy_sets (
    organization_id,
    name,
    slug,
    description,
    is_active,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'AI Use Classification Policy',
    'agei-demo-ai-use-classification',
    'Classify AI events as low-risk, high-risk, prohibited, or unclear based on use case and intent',
    true,
    '["demo", "classification", "risk-assessment"]'::jsonb,
    '{"demo": true, "regulatory_mapping": ["EU AI Act - Risk Classification", "NIST AI RMF - Map Function"]}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_sets WHERE slug = 'agei-demo-ai-use-classification'
  )
  RETURNING id INTO v_policy_ai_classification_id;
  
  IF v_policy_ai_classification_id IS NULL THEN
    SELECT id INTO v_policy_ai_classification_id FROM policy_sets WHERE slug = 'agei-demo-ai-use-classification';
  END IF;
  
  RAISE NOTICE 'AI Use Classification Policy: %', v_policy_ai_classification_id;
  
  -- Policy 2: Human Oversight Policy
  INSERT INTO policy_sets (
    organization_id,
    name,
    slug,
    description,
    is_active,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'Human Oversight Policy',
    'agei-demo-human-oversight',
    'Escalate medical, legal, financial, employment, credit, safety, or other consequential advice/decisions to human review',
    true,
    '["demo", "oversight", "hitl", "escalation"]'::jsonb,
    '{"demo": true, "regulatory_mapping": ["EU AI Act Article 14 - Human Oversight", "NIST AI RMF - Govern Function"]}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_sets WHERE slug = 'agei-demo-human-oversight'
  )
  RETURNING id INTO v_policy_human_oversight_id;
  
  IF v_policy_human_oversight_id IS NULL THEN
    SELECT id INTO v_policy_human_oversight_id FROM policy_sets WHERE slug = 'agei-demo-human-oversight';
  END IF;
  
  RAISE NOTICE 'Human Oversight Policy: %', v_policy_human_oversight_id;
  
  -- Policy 3: Agentic Tool Use & Authority Policy
  INSERT INTO policy_sets (
    organization_id,
    name,
    slug,
    description,
    is_active,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'Agentic Tool Use & Authority Policy',
    'agei-demo-agentic-tool-authority',
    'Prevent agents from using tools or taking consequential actions without authority and pre-action proof',
    true,
    '["demo", "agentic", "authority", "pre-action"]'::jsonb,
    '{"demo": true, "regulatory_mapping": ["Access Control Standards", "Operational Risk Frameworks"]}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_sets WHERE slug = 'agei-demo-agentic-tool-authority'
  )
  RETURNING id INTO v_policy_agentic_authority_id;
  
  IF v_policy_agentic_authority_id IS NULL THEN
    SELECT id INTO v_policy_agentic_authority_id FROM policy_sets WHERE slug = 'agei-demo-agentic-tool-authority';
  END IF;
  
  RAISE NOTICE 'Agentic Tool Authority Policy: %', v_policy_agentic_authority_id;
  
  -- Policy 4: Recordkeeping & Receipt Integrity Policy
  INSERT INTO policy_sets (
    organization_id,
    name,
    slug,
    description,
    is_active,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'Recordkeeping & Receipt Integrity Policy',
    'agei-demo-recordkeeping-integrity',
    'Require signed receipts, content hashes, lineage links, and organization context for consequential AI events',
    true,
    '["demo", "integrity", "recordkeeping", "evidence"]'::jsonb,
    '{"demo": true, "regulatory_mapping": ["EU AI Act Article 12 - Record-keeping", "NIST AI RMF - Govern/Manage"]}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_sets WHERE slug = 'agei-demo-recordkeeping-integrity'
  )
  RETURNING id INTO v_policy_recordkeeping_id;
  
  IF v_policy_recordkeeping_id IS NULL THEN
    SELECT id INTO v_policy_recordkeeping_id FROM policy_sets WHERE slug = 'agei-demo-recordkeeping-integrity';
  END IF;
  
  RAISE NOTICE 'Recordkeeping Integrity Policy: %', v_policy_recordkeeping_id;
  
  -- ==========================================================================
  -- 4. POLICY VERSIONS (v1.0.0 for each policy)
  -- ==========================================================================
  
  RAISE NOTICE 'Creating policy versions...';
  
  -- Version 1: AI Use Classification Policy v1.0.0
  v_payload := jsonb_build_object(
    'policy_key', 'ai_use_classification',
    'policy_name', 'AI Use Classification Policy',
    'policy_domain', 'risk_classification',
    'lifecycle_stage', 'all',
    'description', 'Classify AI use as low-risk, high-risk, prohibited, or unclear based on context and intent',
    'default_failure_action', 'inspect',
    'classification_rules', jsonb_build_object(
      'low_risk_keywords', jsonb_build_array('what is', 'explain', 'summarize', 'how does', 'describe'),
      'high_risk_domains', jsonb_build_array('medical', 'legal', 'financial', 'employment', 'credit'),
      'prohibited_use', jsonb_build_array('social scoring', 'mass surveillance', 'manipulation')
    )
  );
  
  v_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  
  INSERT INTO policy_versions (
    policy_set_id,
    organization_id,
    version,
    version_number,
    policy_payload,
    payload_hash,
    hash_algorithm,
    canonicalization_version,
    signature,
    signature_algorithm,
    signing_key_id,
    signed_by,
    signed_at,
    is_active,
    is_published,
    published_at,
    change_summary,
    metadata,
    created_by
  ) SELECT
    v_policy_ai_classification_id,
    v_org_id,
    '1.0.0',
    1,
    v_payload,
    v_hash,
    'sha256',
    'agei-json-v1',
    replace(encode(digest(v_hash || v_org_id::text || 'ai_classification', 'sha512'), 'base64'), E'\n', ''),
    v_signature_algorithm,
    v_signing_key_id,
    v_principal_id,
    NOW(),
    true,
    true,
    NOW(),
    'Initial version of AI Use Classification Policy for demo',
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_versions WHERE policy_set_id = v_policy_ai_classification_id AND version = '1.0.0'
  )
  RETURNING id INTO v_version_ai_classification_id;
  
  IF v_version_ai_classification_id IS NULL THEN
    SELECT id INTO v_version_ai_classification_id FROM policy_versions WHERE policy_set_id = v_policy_ai_classification_id AND version = '1.0.0';
  END IF;
  
  -- Version 2: Human Oversight Policy v1.0.0
  v_payload := jsonb_build_object(
    'policy_key', 'human_oversight',
    'policy_name', 'Human Oversight Policy',
    'policy_domain', 'oversight',
    'lifecycle_stage', 'all',
    'description', 'Escalate consequential decisions to human review (medical, legal, financial, employment, safety)',
    'default_failure_action', 'escalate',
    'escalation_rules', jsonb_build_object(
      'medical_keywords', jsonb_build_array('symptoms', 'diagnosis', 'medication', 'treatment', 'prescribe', 'chest pain', 'shortness of breath'),
      'legal_keywords', jsonb_build_array('legal advice', 'contract', 'lawsuit', 'regulation'),
      'financial_keywords', jsonb_build_array('invest', 'credit', 'loan', 'eligibility'),
      'employment_keywords', jsonb_build_array('hire', 'fire', 'promote', 'discipline')
    )
  );
  
  v_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  
  INSERT INTO policy_versions (
    policy_set_id,
    organization_id,
    version,
    version_number,
    policy_payload,
    payload_hash,
    hash_algorithm,
    canonicalization_version,
    signature,
    signature_algorithm,
    signing_key_id,
    signed_by,
    signed_at,
    is_active,
    is_published,
    published_at,
    change_summary,
    metadata,
    created_by
  ) SELECT
    v_policy_human_oversight_id,
    v_org_id,
    '1.0.0',
    1,
    v_payload,
    v_hash,
    'sha256',
    'agei-json-v1',
    replace(encode(digest(v_hash || v_org_id::text || 'human_oversight', 'sha512'), 'base64'), E'\n', ''),
    v_signature_algorithm,
    v_signing_key_id,
    v_principal_id,
    NOW(),
    true,
    true,
    NOW(),
    'Initial version of Human Oversight Policy for demo',
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_versions WHERE policy_set_id = v_policy_human_oversight_id AND version = '1.0.0'
  )
  RETURNING id INTO v_version_human_oversight_id;
  
  IF v_version_human_oversight_id IS NULL THEN
    SELECT id INTO v_version_human_oversight_id FROM policy_versions WHERE policy_set_id = v_policy_human_oversight_id AND version = '1.0.0';
  END IF;
  
  -- Version 3: Agentic Tool Authority Policy v1.0.0
  v_payload := jsonb_build_object(
    'policy_key', 'agentic_tool_authority',
    'policy_name', 'Agentic Tool Use & Authority Policy',
    'policy_domain', 'agentic',
    'lifecycle_stage', 'action',
    'description', 'Verify agent has authority to use requested tool before execution',
    'default_failure_action', 'deny',
    'authority_rules', jsonb_build_object(
      'tool_registration_required', true,
      'risk_classification', jsonb_build_array('low', 'moderate', 'high', 'critical'),
      'approval_thresholds', jsonb_build_object(
        'refund_auto_approve', 25.00,
        'refund_escalate', 50.00,
        'refund_deny', 100.00
      )
    )
  );
  
  v_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  
  INSERT INTO policy_versions (
    policy_set_id,
    organization_id,
    version,
    version_number,
    policy_payload,
    payload_hash,
    hash_algorithm,
    canonicalization_version,
    signature,
    signature_algorithm,
    signing_key_id,
    signed_by,
    signed_at,
    is_active,
    is_published,
    published_at,
    change_summary,
    metadata,
    created_by
  ) SELECT
    v_policy_agentic_authority_id,
    v_org_id,
    '1.0.0',
    1,
    v_payload,
    v_hash,
    'sha256',
    'agei-json-v1',
    replace(encode(digest(v_hash || v_org_id::text || 'agentic_authority', 'sha512'), 'base64'), E'\n', ''),
    v_signature_algorithm,
    v_signing_key_id,
    v_principal_id,
    NOW(),
    true,
    true,
    NOW(),
    'Initial version of Agentic Tool Authority Policy for demo',
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_versions WHERE policy_set_id = v_policy_agentic_authority_id AND version = '1.0.0'
  )
  RETURNING id INTO v_version_agentic_authority_id;
  
  IF v_version_agentic_authority_id IS NULL THEN
    SELECT id INTO v_version_agentic_authority_id FROM policy_versions WHERE policy_set_id = v_policy_agentic_authority_id AND version = '1.0.0';
  END IF;
  
  -- Version 4: Recordkeeping Integrity Policy v1.0.0
  v_payload := jsonb_build_object(
    'policy_key', 'recordkeeping_integrity',
    'policy_name', 'Recordkeeping & Receipt Integrity Policy',
    'policy_domain', 'evidence_integrity',
    'lifecycle_stage', 'all',
    'description', 'Require signed receipts, content hashes, lineage links, and organization context',
    'default_failure_action', 'deny',
    'integrity_requirements', jsonb_build_object(
      'signature_required', true,
      'hash_required', true,
      'lineage_required', true,
      'organization_context_required', true
    )
  );
  
  v_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  
  INSERT INTO policy_versions (
    policy_set_id,
    organization_id,
    version,
    version_number,
    policy_payload,
    payload_hash,
    hash_algorithm,
    canonicalization_version,
    signature,
    signature_algorithm,
    signing_key_id,
    signed_by,
    signed_at,
    is_active,
    is_published,
    published_at,
    change_summary,
    metadata,
    created_by
  ) SELECT
    v_policy_recordkeeping_id,
    v_org_id,
    '1.0.0',
    1,
    v_payload,
    v_hash,
    'sha256',
    'agei-json-v1',
    replace(encode(digest(v_hash || v_org_id::text || 'recordkeeping', 'sha512'), 'base64'), E'\n', ''),
    v_signature_algorithm,
    v_signing_key_id,
    v_principal_id,
    NOW(),
    true,
    true,
    NOW(),
    'Initial version of Recordkeeping Integrity Policy for demo',
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_versions WHERE policy_set_id = v_policy_recordkeeping_id AND version = '1.0.0'
  )
  RETURNING id INTO v_version_recordkeeping_id;
  
  IF v_version_recordkeeping_id IS NULL THEN
    SELECT id INTO v_version_recordkeeping_id FROM policy_versions WHERE policy_set_id = v_policy_recordkeeping_id AND version = '1.0.0';
  END IF;
  
  RAISE NOTICE 'Created policy versions';
  
  -- ==========================================================================
  -- 5. GATE DEFINITIONS (3 gates for 3 scenarios)
  -- ==========================================================================
  
  RAISE NOTICE 'Creating gate definitions...';
  
  -- Gate 1: AI Use Classification Gate
  v_payload := jsonb_build_object(
    'regulatory_mapping', jsonb_build_object(
      'frameworks', jsonb_build_array('EU AI Act', 'NIST AI RMF', 'ISO/IEC 42001'),
      'risk_classification', 'variable'
    ),
    'decision_logic', jsonb_build_object(
      'low_risk_approve', true,
      'high_risk_escalate', true,
      'prohibited_deny', true
    )
  );
  
  INSERT INTO gate_definitions (
    organization_id,
    name,
    slug,
    gate_type,
    description,
    gate_payload,
    policy_set_id,
    policy_version_id,
    evaluation_mode,
    failure_action,
    is_active,
    is_required,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'AI Use Classification Gate',
    'ai-use-classification-gate',
    'policy_enforcement',
    'Classify AI use as low-risk, high-risk, prohibited, or unclear',
    v_payload,
    v_policy_ai_classification_id,
    v_version_ai_classification_id,
    'advisory',
    'warn',
    true,
    false,
    '["demo", "classification", "risk"]'::jsonb,
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM gate_definitions WHERE slug = 'ai-use-classification-gate'
  )
  RETURNING id INTO v_gate_ai_classification_id;
  
  IF v_gate_ai_classification_id IS NULL THEN
    SELECT id INTO v_gate_ai_classification_id FROM gate_definitions WHERE slug = 'ai-use-classification-gate';
  END IF;
  
  RAISE NOTICE 'AI Use Classification Gate: %', v_gate_ai_classification_id;
  
  -- Gate 2: Human Oversight Gate
  v_payload := jsonb_build_object(
    'regulatory_mapping', jsonb_build_object(
      'frameworks', jsonb_build_array('EU AI Act Article 14', 'NIST AI RMF'),
      'risk_classification', 'high_risk'
    ),
    'escalation_triggers', jsonb_build_object(
      'medical_keywords', jsonb_build_array('symptoms', 'chest pain', 'medication', 'treatment'),
      'safe_response_templates', jsonb_build_object(
        'emergency', 'For medical emergencies, call 911 or your local emergency number immediately.',
        'symptoms', 'I can provide general health information, but please consult a licensed healthcare professional for medical advice.'
      )
    )
  );
  
  INSERT INTO gate_definitions (
    organization_id,
    name,
    slug,
    gate_type,
    description,
    gate_payload,
    policy_set_id,
    policy_version_id,
    evaluation_mode,
    failure_action,
    is_active,
    is_required,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'Human Oversight Gate',
    'human-oversight-gate',
    'escalation',
    'Escalate consequential decisions to human review (medical, legal, financial, employment, safety)',
    v_payload,
    v_policy_human_oversight_id,
    v_version_human_oversight_id,
    'strict',
    'block',
    true,
    false,
    '["demo", "oversight", "hitl", "medical"]'::jsonb,
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM gate_definitions WHERE slug = 'human-oversight-gate'
  )
  RETURNING id INTO v_gate_human_oversight_id;
  
  IF v_gate_human_oversight_id IS NULL THEN
    SELECT id INTO v_gate_human_oversight_id FROM gate_definitions WHERE slug = 'human-oversight-gate';
  END IF;
  
  RAISE NOTICE 'Human Oversight Gate: %', v_gate_human_oversight_id;
  
  -- Gate 3: Agentic Pre-Action Authority Gate
  v_payload := jsonb_build_object(
    'regulatory_mapping', jsonb_build_object(
      'frameworks', jsonb_build_array('Access Control Standards', 'Operational Risk Frameworks'),
      'risk_classification', 'moderate_to_high'
    ),
    'authority_checks', jsonb_build_object(
      'tool_registration_required', true,
      'permission_boundary_check', true,
      'value_threshold_enforcement', true,
      'approval_thresholds', jsonb_build_object(
        'refund_auto_approve', 25.00,
        'refund_escalate', 50.00,
        'refund_deny', 100.00
      )
    )
  );
  
  INSERT INTO gate_definitions (
    organization_id,
    name,
    slug,
    gate_type,
    description,
    gate_payload,
    policy_set_id,
    policy_version_id,
    evaluation_mode,
    failure_action,
    is_active,
    is_required,
    tags,
    metadata,
    created_by
  ) SELECT
    v_org_id,
    'Agentic Pre-Action Authority Gate',
    'agentic-pre-action-authority-gate',
    'authorization',
    'Verify agent has authority to use requested tool before execution',
    v_payload,
    v_policy_agentic_authority_id,
    v_version_agentic_authority_id,
    'strict',
    'block',
    true,
    false,
    '["demo", "agentic", "authority", "pre-action"]'::jsonb,
    '{"demo": true}'::jsonb,
    v_principal_id
  WHERE NOT EXISTS (
    SELECT 1 FROM gate_definitions WHERE slug = 'agentic-pre-action-authority-gate'
  )
  RETURNING id INTO v_gate_agentic_authority_id;
  
  IF v_gate_agentic_authority_id IS NULL THEN
    SELECT id INTO v_gate_agentic_authority_id FROM gate_definitions WHERE slug = 'agentic-pre-action-authority-gate';
  END IF;
  
  RAISE NOTICE 'Agentic Pre-Action Authority Gate: %', v_gate_agentic_authority_id;
  
  -- ==========================================================================
  -- 6. DEMO AGENT PRINCIPALS (3 agents for 3 scenarios)
  -- ==========================================================================
  -- NOTE:
  --   Do NOT use ON CONFLICT (external_id) here unless a UNIQUE constraint exists.
  --   This block uses explicit SELECT -> UPDATE/INSERT logic so it works with
  --   the canonical DATABASE.md schema even when external_id is not unique.
  -- ==========================================================================
  
  RAISE NOTICE 'Creating demo agents...';
  
  -- Agent 1: General Governance Assistant
  SELECT id INTO v_agent_general_id
  FROM principals
  WHERE external_id = 'agent_general_governance'
    AND principal_type = 'agent'
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_agent_general_id IS NULL THEN
    INSERT INTO principals (
      principal_type,
      external_id,
      email,
      display_name,
      is_active,
      is_verified,
      onboarding_group
    ) VALUES (
      'agent',
      'agent_general_governance',
      'agent_general@agei.demo',
      'General Governance Assistant',
      true,
      true,
      v_onboarding_group,
      jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'informational',
        'description', 'Low-risk informational Q&A about AGEI concepts and governance',
        'default_gates', jsonb_build_array('ai-use-classification-gate')
      )
    )
    RETURNING id INTO v_agent_general_id;
  ELSE
    UPDATE principals
    SET
      email = 'agent_general@agei.demo',
      display_name = 'General Governance Assistant',
      is_active = true,
      is_verified = true,
      onboarding_group = v_onboarding_group,
      metadata = jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'informational',
        'description', 'Low-risk informational Q&A about AGEI concepts and governance',
        'default_gates', jsonb_build_array('ai-use-classification-gate')
      ),
      updated_at = NOW()
    WHERE id = v_agent_general_id;
  END IF;
  
  RAISE NOTICE 'General Governance Assistant: %', v_agent_general_id;
  
  -- Agent 2: Medical Safety Demo Agent
  SELECT id INTO v_agent_medical_id
  FROM principals
  WHERE external_id = 'agent_medical_safety'
    AND principal_type = 'agent'
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_agent_medical_id IS NULL THEN
    INSERT INTO principals (
      principal_type,
      external_id,
      email,
      display_name,
      is_active,
      is_verified,
      onboarding_group
    ) VALUES (
      'agent',
      'agent_medical_safety',
      'agent_medical@agei.demo',
      'Medical Safety Demo Agent',
      true,
      true,
      v_onboarding_group,
      jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'health_information',
        'description', 'Demonstrates medical escalation and safe response patterns',
        'default_gates', jsonb_build_array('ai-use-classification-gate', 'human-oversight-gate'),
        'safe_response_templates', jsonb_build_object(
          'emergency', 'For medical emergencies, call 911 or your local emergency number immediately.',
          'symptoms', 'I can provide general health information, but please consult a licensed healthcare professional for medical advice.',
          'medication', 'Medication questions require consultation with a licensed pharmacist or physician.'
        )
      )
    )
    RETURNING id INTO v_agent_medical_id;
  ELSE
    UPDATE principals
    SET
      email = 'agent_medical@agei.demo',
      display_name = 'Medical Safety Demo Agent',
      is_active = true,
      is_verified = true,
      onboarding_group = v_onboarding_group,
      metadata = jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'health_information',
        'description', 'Demonstrates medical escalation and safe response patterns',
        'default_gates', jsonb_build_array('ai-use-classification-gate', 'human-oversight-gate'),
        'safe_response_templates', jsonb_build_object(
          'emergency', 'For medical emergencies, call 911 or your local emergency number immediately.',
          'symptoms', 'I can provide general health information, but please consult a licensed healthcare professional for medical advice.',
          'medication', 'Medication questions require consultation with a licensed pharmacist or physician.'
        )
      ),
      updated_at = NOW()
    WHERE id = v_agent_medical_id;
  END IF;
  
  RAISE NOTICE 'Medical Safety Demo Agent: %', v_agent_medical_id;
  
  -- Agent 3: Sales/Refund Agent
  SELECT id INTO v_agent_sales_id
  FROM principals
  WHERE external_id = 'agent_sales_refund'
    AND principal_type = 'agent'
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_agent_sales_id IS NULL THEN
    INSERT INTO principals (
      principal_type,
      external_id,
      email,
      display_name,
      is_active,
      is_verified,
      onboarding_group
    ) VALUES (
      'agent',
      'agent_sales_refund',
      'agent_sales@agei.demo',
      'Sales & Refund Agent',
      true,
      true,
      v_onboarding_group,
      jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'customer_support',
        'description', 'Demonstrates agentic authority limits and approval workflows',
        'default_gates', jsonb_build_array('agentic-pre-action-authority-gate'),
        'max_refund_amount', 100.00,
        'auto_approve_threshold', 25.00,
        'escalate_threshold', 50.00
      )
    )
    RETURNING id INTO v_agent_sales_id;
  ELSE
    UPDATE principals
    SET
      email = 'agent_sales@agei.demo',
      display_name = 'Sales & Refund Agent',
      is_active = true,
      is_verified = true,
      onboarding_group = v_onboarding_group,
      metadata = jsonb_build_object(
        'demo_agent', true,
        'agent_type', 'customer_support',
        'description', 'Demonstrates agentic authority limits and approval workflows',
        'default_gates', jsonb_build_array('agentic-pre-action-authority-gate'),
        'max_refund_amount', 100.00,
        'auto_approve_threshold', 25.00,
        'escalate_threshold', 50.00
      ),
      updated_at = NOW()
    WHERE id = v_agent_sales_id;
  END IF;
  
  RAISE NOTICE 'Sales & Refund Agent: %', v_agent_sales_id;
  
  -- ==========================================================================
  -- 7. AGENT TOOL DEFINITIONS (4 tools for scenarios)
  -- ==========================================================================
  -- NOTE:
  --   Do NOT use ON CONFLICT (organization_id, tool_key) unless a UNIQUE
  --   constraint exists. This section is idempotent through explicit lookup.
  -- ==========================================================================
  
  RAISE NOTICE 'Creating agent tools...';
  
  -- Tool 1: Customer Lookup (low risk)
  SELECT id INTO v_tool_customer_lookup_id
  FROM agent_tool_definitions
  WHERE organization_id = v_org_id
    AND tool_key = 'customer_lookup'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_tool_customer_lookup_id IS NULL THEN
    INSERT INTO agent_tool_definitions (
      organization_id,
      tool_key,
      tool_name,
      tool_version,
      risk_class,
      allowed_parameters_schema,
      is_active,
      metadata,
      created_by
    ) VALUES (
      v_org_id,
      'customer_lookup',
      'Customer Lookup',
      '1.0.0',
      'low',
      jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_id', jsonb_build_object('type', 'string'),
          'email', jsonb_build_object('type', 'string')
        )
      ),
      true,
      '{"demo_tool": true}'::jsonb,
      v_principal_id
    )
    RETURNING id INTO v_tool_customer_lookup_id;
  ELSE
    UPDATE agent_tool_definitions
    SET
      tool_name = 'Customer Lookup',
      tool_version = '1.0.0',
      risk_class = 'low',
      allowed_parameters_schema = jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_id', jsonb_build_object('type', 'string'),
          'email', jsonb_build_object('type', 'string')
        )
      ),
      is_active = true,
      updated_at = NOW()
    WHERE id = v_tool_customer_lookup_id;
  END IF;
  
  -- Tool 2: Calculate Discount (low risk)
  SELECT id INTO v_tool_calculate_discount_id
  FROM agent_tool_definitions
  WHERE organization_id = v_org_id
    AND tool_key = 'calculate_discount'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_tool_calculate_discount_id IS NULL THEN
    INSERT INTO agent_tool_definitions (
      organization_id,
      tool_key,
      tool_name,
      tool_version,
      risk_class,
      allowed_parameters_schema,
      is_active,
      metadata,
      created_by
    ) VALUES (
      v_org_id,
      'calculate_discount',
      'Calculate Discount',
      '1.0.0',
      'low',
      jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_tier', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('basic', 'premium', 'enterprise')),
          'product', jsonb_build_object('type', 'string'),
          'discount_percentage', jsonb_build_object('type', 'number', 'minimum', 0, 'maximum', 25)
        ),
        'required', jsonb_build_array('customer_tier', 'product')
      ),
      true,
      '{"demo_tool": true, "max_discount": 25}'::jsonb,
      v_principal_id
    )
    RETURNING id INTO v_tool_calculate_discount_id;
  ELSE
    UPDATE agent_tool_definitions
    SET
      tool_name = 'Calculate Discount',
      tool_version = '1.0.0',
      risk_class = 'low',
      allowed_parameters_schema = jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_tier', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('basic', 'premium', 'enterprise')),
          'product', jsonb_build_object('type', 'string'),
          'discount_percentage', jsonb_build_object('type', 'number', 'minimum', 0, 'maximum', 25)
        ),
        'required', jsonb_build_array('customer_tier', 'product')
      ),
      is_active = true,
      updated_at = NOW()
    WHERE id = v_tool_calculate_discount_id;
  END IF;
  
  -- Tool 3: Issue Refund (high risk - requires gate)
  SELECT id INTO v_tool_issue_refund_id
  FROM agent_tool_definitions
  WHERE organization_id = v_org_id
    AND tool_key = 'issue_refund'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_tool_issue_refund_id IS NULL THEN
    INSERT INTO agent_tool_definitions (
      organization_id,
      tool_key,
      tool_name,
      tool_version,
      risk_class,
      allowed_parameters_schema,
      required_gate_definition_id,
      is_active,
      metadata,
      created_by
    ) VALUES (
      v_org_id,
      'issue_refund',
      'Issue Refund',
      '1.0.0',
      'high',
      jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_id', jsonb_build_object('type', 'string'),
          'order_id', jsonb_build_object('type', 'string'),
          'amount', jsonb_build_object('type', 'number', 'minimum', 0),
          'reason', jsonb_build_object('type', 'string')
        ),
        'required', jsonb_build_array('customer_id', 'order_id', 'amount', 'reason')
      ),
      v_gate_agentic_authority_id,
      true,
      jsonb_build_object(
        'demo_tool', true,
        'requires_gate', true,
        'authority_rules', jsonb_build_object(
          'auto_approve_threshold', 25.00,
          'escalate_threshold', 50.00,
          'deny_threshold', 100.00
        )
      ),
      v_principal_id
    )
    RETURNING id INTO v_tool_issue_refund_id;
  ELSE
    UPDATE agent_tool_definitions
    SET
      tool_name = 'Issue Refund',
      tool_version = '1.0.0',
      risk_class = 'high',
      allowed_parameters_schema = jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'customer_id', jsonb_build_object('type', 'string'),
          'order_id', jsonb_build_object('type', 'string'),
          'amount', jsonb_build_object('type', 'number', 'minimum', 0),
          'reason', jsonb_build_object('type', 'string')
        ),
        'required', jsonb_build_array('customer_id', 'order_id', 'amount', 'reason')
      ),
      required_gate_definition_id = v_gate_agentic_authority_id,
      is_active = true,
      metadata = jsonb_build_object(
        'demo_tool', true,
        'requires_gate', true,
        'authority_rules', jsonb_build_object(
          'auto_approve_threshold', 25.00,
          'escalate_threshold', 50.00,
          'deny_threshold', 100.00
        )
      ),
      updated_at = NOW()
    WHERE id = v_tool_issue_refund_id;
  END IF;
  
  -- Tool 4: Request Human Review (moderate risk)
  SELECT id INTO v_tool_request_review_id
  FROM agent_tool_definitions
  WHERE organization_id = v_org_id
    AND tool_key = 'request_human_review'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_tool_request_review_id IS NULL THEN
    INSERT INTO agent_tool_definitions (
      organization_id,
      tool_key,
      tool_name,
      tool_version,
      risk_class,
      allowed_parameters_schema,
      is_active,
      metadata,
      created_by
    ) VALUES (
      v_org_id,
      'request_human_review',
      'Request Human Review',
      '1.0.0',
      'moderate',
      jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'request_type', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('medical', 'legal', 'financial', 'refund')),
          'reason', jsonb_build_object('type', 'string'),
          'context', jsonb_build_object('type', 'object')
        ),
        'required', jsonb_build_array('request_type', 'reason')
      ),
      true,
      '{"demo_tool": true, "hitl_trigger": true}'::jsonb,
      v_principal_id
    )
    RETURNING id INTO v_tool_request_review_id;
  ELSE
    UPDATE agent_tool_definitions
    SET
      tool_name = 'Request Human Review',
      tool_version = '1.0.0',
      risk_class = 'moderate',
      allowed_parameters_schema = jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
          'request_type', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('medical', 'legal', 'financial', 'refund')),
          'reason', jsonb_build_object('type', 'string'),
          'context', jsonb_build_object('type', 'object')
        ),
        'required', jsonb_build_array('request_type', 'reason')
      ),
      is_active = true,
      updated_at = NOW()
    WHERE id = v_tool_request_review_id;
  END IF;
  
  RAISE NOTICE 'Created agent tools';
  
  -- ==========================================================================
  -- 8. AGENT PERMISSION BOUNDARIES (3 boundaries for 3 agents)
  -- ==========================================================================
  -- NOTE:
  --   Do NOT use ON CONFLICT (organization_id, agent_principal_id) unless a
  --   UNIQUE constraint exists. This section is idempotent through lookup.
  -- ==========================================================================
  
  RAISE NOTICE 'Creating agent permission boundaries...';
  
  -- Boundary 1: General Governance (no tools, informational only)
  -- DATABASE.md does not define agent_permission_boundaries.metadata, so demo notes are omitted here.
  IF EXISTS (
    SELECT 1 FROM agent_permission_boundaries
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_general_id
  ) THEN
    UPDATE agent_permission_boundaries
    SET
      max_allowed_tools = '[]'::jsonb,
      prohibited_tools = '["*"]'::jsonb,
      max_risk_class = 'low',
      allowed_data_scopes = '["public"]'::jsonb,
      requires_approval_for_tools = '[]'::jsonb,
      is_active = true,
      updated_at = NOW()
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_general_id;
  ELSE
    INSERT INTO agent_permission_boundaries (
      organization_id,
      agent_principal_id,
      max_allowed_tools,
      prohibited_tools,
      max_risk_class,
      allowed_data_scopes,
      requires_approval_for_tools,
      is_active
    ) VALUES (
      v_org_id,
      v_agent_general_id,
      '[]'::jsonb,
      '["*"]'::jsonb,
      'low',
      '["public"]'::jsonb,
      '[]'::jsonb,
      true
    );
  END IF;
  
  -- Boundary 2: Medical Safety (limited health info lookup)
  IF EXISTS (
    SELECT 1 FROM agent_permission_boundaries
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_medical_id
  ) THEN
    UPDATE agent_permission_boundaries
    SET
      max_allowed_tools = '["request_human_review"]'::jsonb,
      prohibited_tools = '["prescribe", "diagnose", "recommend_medication"]'::jsonb,
      max_risk_class = 'low',
      allowed_data_scopes = '["public_health_info"]'::jsonb,
      requires_approval_for_tools = '["request_human_review"]'::jsonb,
      is_active = true,
      updated_at = NOW()
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_medical_id;
  ELSE
    INSERT INTO agent_permission_boundaries (
      organization_id,
      agent_principal_id,
      max_allowed_tools,
      prohibited_tools,
      max_risk_class,
      allowed_data_scopes,
      requires_approval_for_tools,
      is_active
    ) VALUES (
      v_org_id,
      v_agent_medical_id,
      '["request_human_review"]'::jsonb,
      '["prescribe", "diagnose", "recommend_medication"]'::jsonb,
      'low',
      '["public_health_info"]'::jsonb,
      '["request_human_review"]'::jsonb,
      true
    );
  END IF;
  
  -- Boundary 3: Sales/Refund (limited refund authority)
  IF EXISTS (
    SELECT 1 FROM agent_permission_boundaries
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_sales_id
  ) THEN
    UPDATE agent_permission_boundaries
    SET
      max_allowed_tools = '["customer_lookup", "calculate_discount", "issue_refund", "request_human_review"]'::jsonb,
      prohibited_tools = '["delete_account", "override_approval"]'::jsonb,
      max_risk_class = 'moderate',
      max_transaction_value = 100.00,
      requires_approval_above_amount = 50.00,
      requires_approval_for_tools = '["issue_refund"]'::jsonb,
      is_active = true,
      updated_at = NOW()
    WHERE organization_id = v_org_id AND agent_principal_id = v_agent_sales_id;
  ELSE
    INSERT INTO agent_permission_boundaries (
      organization_id,
      agent_principal_id,
      max_allowed_tools,
      prohibited_tools,
      max_risk_class,
      max_transaction_value,
      requires_approval_above_amount,
      requires_approval_for_tools,
      is_active
    ) VALUES (
      v_org_id,
      v_agent_sales_id,
      '["customer_lookup", "calculate_discount", "issue_refund", "request_human_review"]'::jsonb,
      '["delete_account", "override_approval"]'::jsonb,
      'moderate',
      100.00,
      50.00,
      '["issue_refund"]'::jsonb,
      true
    );
  END IF;
  
  RAISE NOTICE 'Created agent permission boundaries';
  
  -- ==========================================================================
  -- FINAL SUMMARY
  -- ==========================================================================
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AGEI Minimum Demo Pack Seed Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organization: %', v_org_id;
  RAISE NOTICE 'Decision Reason Codes: 8';
  RAISE NOTICE 'Receipt Types: 6';
  RAISE NOTICE 'Policy Sets: 4';
  RAISE NOTICE 'Policy Versions: 4';
  RAISE NOTICE 'Gate Definitions: 3';
  RAISE NOTICE 'Demo Agents: 3';
  RAISE NOTICE 'Agent Tools: 4';
  RAISE NOTICE 'Permission Boundaries: 3';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ready for three demo scenarios:';
  RAISE NOTICE '1. Low-risk approve (General Governance Assistant)';
  RAISE NOTICE '2. Medical escalation (Medical Safety Demo Agent)';
  RAISE NOTICE '3. Refund denial (Sales & Refund Agent)';
  RAISE NOTICE '========================================';
  
END $$;
