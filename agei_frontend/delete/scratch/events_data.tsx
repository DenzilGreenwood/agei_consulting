const eventsData = [
  {
    id: 1,
    title: "Dataset Registration & Onboarding (Provenance Gate)",
    purpose: "Captures the onboarding, lineage, and privacy/consent compliance checks of raw training datasets before ingestion into the MLOps pipeline [109, 125].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Table:</strong> <code>public.ai_lifecycle_objects</code> [268] (Registers entity with object_type = 'dataset').</li>
            <li><strong>Governance Tables:</strong> <code>public.receipts</code> [264] and <code>public.lawful_basis_records</code> [276].</li>
            <li><strong>Relationship Mapping:</strong> Connects to <code>public.gate_evaluations</code> via <code>gate_evaluation_id</code> (representing the completed Provenance Gate check) [264].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Storage Verification:</strong> <code>payload.storage.storage_content_hash</code> must match the SHA-256 checksum of the physical object inside the storage bucket [268].</li>
            <li><strong>Consent Reference Check:</strong> The <code>consent_records_linked</code> integer count must correspond precisely to valid, non-expired reference identifiers stored in <code>public.consent_records</code> [277].</li>
      </ul>
    ),
    payload: `{
            "dataset_key": "claims_training_dataset_2026q2",
            "source_type": "s3_bucket_claims_archive",
            "license_class": "proprietary_enterprise_restricted",
            "lineage": {
              "raw_sources_fingerprints": [
            "sha256:a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef01"
            ],
            "extraction_pipeline_run": "run_extract_claims_v12"
  },
            "compliance_attestation": {
              "contains_personal_data": true,
            "pii_redacted": true,
            "consent_records_linked": 15420,
            "lawful_basis_declared": "contractual_necessity_and_consent"
  },
            "storage": {
              "storage_bucket": "enterprise-ml-data",
            "storage_path": "raw/2026-q2/claims_anonymized.parquet",
            "storage_content_hash": "sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e"
  }
}`
  },
  {
    id: 2,
    title: "Model Training Completion & Lineage Binding",
    purpose: "Binds the compiled model checkpoints, training metrics, hyperparameters, and environment software dependencies to their exact dataset lineage [110, 235].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Table:</strong> <code>public.ai_lifecycle_objects</code> [268] (Registers entity with object_type = 'training_run').</li>
            <li><strong>Lineage Table:</strong> <code>public.ai_lifecycle_object_links</code> [269] (Enforces parent-child directed relationship).</li>
            <li><strong>Relationship Mapping:</strong> Inserts a directed link record where <code>source_object_id</code> points to the Dataset, and <code>target_object_id</code> points to the Training Run [110, 269].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Architecture Validation:</strong> The <code>model_architecture_hash</code> must match a registered and approved schema template stored in <code>public.schema_versions</code> [267].</li>
            <li><strong>Telemetry Invariant:</strong> The <code>router_loss_observed</code> reported in this receipt must correspond exactly to the telemetry output stored within the broader <code>public.evidence_objects</code> table [266].</li>
      </ul>
    ),
    payload: `{
            "training_run_id": "run_2026_07_24_claims_triage_001",
            "algorithm": "neuro_symbolic_concept_router",
            "base_model": "llama-3-8b-instruct-base",
            "lineage_inputs": {
              "dataset_lifecycle_object_id": "ai-lifecycle-object-uuid-for-claims_training_dataset_2026q2",
            "code_repository_commit": "github.com/cognitiveinsight/router-pretrain@8a7b6c5"
  },
            "hyperparameters": {
              "epochs": 10,
            "learning_rate": 0.0001,
            "concept_router_lobes": 8,
            "target_router_loss": 0.10
  },
            "environment": {
              "execution_platform": "azure_ai_foundry_node_v120",
            "package_manifest_sbom_hash": "sha256:cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce"
  },
            "output_checkpoints": [
            {
              "checkpoint_index": 5,
            "epoch": 10,
            "model_architecture_hash": "sha256:90e5f22cbfde812ac11f1816f1a8c634d0b1351515286c4a8bdf12349e1e2cfc",
            "weights_content_hash": "sha256:88ee9d4fbcda712ac11f1816f1a8c634d0b1351515286c4a8bdf58149e1e2cfd",
            "router_loss_observed": 0.10
    }
            ]
}`
  },
  {
    id: 3,
    title: "Model Evaluation & Validation Gate Assessment",
    purpose: "Registers performance metrics, safety thresholds, and demographic bias ratios evaluated before promotion to production [110, 125].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Tables:</strong> <code>public.policy_evaluations</code> [263] and <code>public.gate_evaluations</code> [264].</li>
            <li><strong>Relationship Mapping:</strong> Each rule in <code>validation_rules_evaluated</code> maps to a distinct row in <code>policy_evaluations</code> linked to <code>gate_evaluation_id</code> [263, 264].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Gate-Evaluation Linkage:</strong> The top-level <code>gate_evaluations.gate_outcome</code> must remain 'deny' or 'escalate' if any rule has an <code>observed_value</code> that fails expected thresholds, unless an administrative override is recorded [120, 264].</li>
            <li><strong>Signature Binding:</strong> If <code>reviewer_attestation_required</code> is true, the outer cryptographic receipt must carry a valid signature (<code>evidence_signatures</code>) from <code>reviewer_principal_id</code> [3, 263].</li>
      </ul>
    ),
    payload: `{
            "evaluated_model_id": "ai-lifecycle-object-uuid-for-claims_model_v4.3.2",
            "evaluation_bundle_key": "claims_eval_bundle_2026_q2_a",
            "metrics_achieved": {
              "recall_at_5": 0.922,
            "qa_accuracy": 0.791,
            "neuro_symbolic_memory_recall": 1.0,
            "latency_p95_ms": 180.0
  },
            "validation_rules_evaluated": [
            {
              "rule_key": "rule_recall_at_5_min_threshold",
            "description": "Recall@5 must meet or exceed 0.90",
            "threshold_expected": 0.90,
            "observed_value": 0.922,
            "status": "pass"
    },
            {
              "rule_key": "rule_bias_disparate_impact_ratio",
            "description": "Disparate impact ratio across demographic subgroups must fall between 0.80 and 1.25",
            "threshold_expected": "0.80 - 1.25",
            "observed_value": 0.98,
            "status": "pass"
    }
            ],
            "validation_summary_status": "pass",
            "reviewer_attestation_required": true,
            "reviewer_principal_id": "reviewer-principal-uuid"
}`
  },
  {
    id: 4,
    title: "Model Deployment Promotion & Release Lock",
    purpose: "Registers the deployment target, release artifact details, and validates all compliance dependencies before the model registers as \"production active\" [110, 125].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Table:</strong> <code>public.artifact_release_records</code> [271].</li>
            <li><strong>Governance Tables:</strong> <code>public.gate_evaluations</code> [264] and <code>public.receipts</code> [264].</li>
            <li><strong>Relationship Mapping:</strong> Maps to <code>artifact_release_records</code> [271] where <code>gate_evaluation_id</code> links directly to the Deployment Gate [42].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Lineage Integrity:</strong> <code>pre_watermark_hash</code> must resolve back to the identical hash evaluated in training completion (Event 2) and validation gates (Event 3) [41, 158].</li>
            <li><strong>Incident Status Constraint:</strong> The system must run a check ensuring there are no unresolved entries in <code>public.incidents</code> where severity = 'critical' before outputting an 'approve' outcome [15].</li>
      </ul>
    ),
    payload: `{
            "deployment_target_environment": "production-claims-us-east",
            "model_lifecycle_object_id": "ai-lifecycle-object-uuid-for-claims_model_v4.3.2",
            "approved_release_artifact": {
              "release_id": "release_claims_triage_v4_3_2",
            "pre_watermark_hash": "sha256:d8e8f8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff8877",
            "distribution_context": "Production Claims Auto-Triage Container",
            "released_to": "k8s-cluster-east-pod-4"
  },
            "controls_verified": {
              "validation_gate_evaluation_id": "gate-evaluation-uuid-for-validation-gate",
            "no_active_blocking_incidents": true,
            "approving_authority_role": "policy_author"
  },
            "release_gate_outcome": "approve",
            "deployment_orchestrator_ref": "spinnaker-pipeline-run-9983"
}`
  },
  {
    id: 5,
    title: "Agent Session & Delegated Authority Scope",
    purpose: "Verifies the initialization of a runtime agent and establishes the precise delegation parameters inherited from a human principal [148, 269].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Tables:</strong> <code>public.agent_sessions</code> [269] and <code>public.agent_delegations</code> [270].</li>
            <li><strong>Relationship Mapping:</strong> Creates a record in <code>agent_delegations</code> [270] linked to <code>agent_session_id</code> [26].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Authority Attenuation Invariant:</strong> The <code>allowed_actions</code> array must represent a subset (or equal set) of permissions registered under the delegating human's credentials in <code>public.organization_members</code> [2, 26].</li>
            <li><strong>Token Verification:</strong> <code>delegation_token_hash</code> must map to a cryptographically validated, non-expired token created during the user login sequence [17].</li>
      </ul>
    ),
    payload: `{
            "session_key": "sess_agent_claims_triage_2026_07_24_0009",
            "agent_principal_id": "agent-principal-uuid",
            "delegating_principal_id": "human-claims-handler-principal-uuid",
            "workflow_context": {
              "workflow_name": "claims_auto_triage_processing",
            "workflow_role": "claims_adjuster_level_2"
  },
            "delegated_authority": {
              "authority_scope": {
              "allowed_actions": ["read_claim_files", "evaluate_policy_terms", "draft_recommendation"],
            "prohibited_actions": ["execute_payment_transfer", "bypass_human_review"],
            "max_transaction_value": 5000.00,
            "allowed_data_scopes": ["claims:auto:us-southwest"]
    },
            "purpose": "Automated evaluation of auto insurance claims under $5k threshold",
            "delegation_token_hash": "sha256:ef89d8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff4455"
  },
            "session_constraints": {
              "max_duration_minutes": 60,
            "idle_timeout_minutes": 15
  }
}`
  },
  {
    id: 6,
    title: "Agent Pre-Action Proof-Carrying Bundle",
    purpose: "Generates the out-of-band \"Gate Before Action\" proof required to unblock execution of sensitive tools [121, 149].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Table:</strong> <code>public.pre_action_proof_bundles</code> [270].</li>
            <li><strong>Governance Table:</strong> <code>public.gate_evaluations</code> [264].</li>
            <li><strong>Relationship Mapping:</strong> Maps to <code>pre_action_proof_bundles</code> [270] where <code>delegation_id</code> links directly to the authorized token context [30].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Budget Constraint:</strong> If <code>parameter_check_hashes.adjusted_value</code> ($4,200.00) exceeds the active session's <code>max_transaction_value</code> ($5,000.00), the gate outcome must automatically flag as 'deny' or 'escalate' [32, 270].</li>
            <li><strong>Lineage Constraint:</strong> The <code>session_context_hash</code> must match the current state hash of the running LLM memory execution chain [25, 121].</li>
      </ul>
    ),
    payload: `{
            "agent_session_id": "agent-session-uuid-for-active-session",
            "tool_definition_id": "tool-definition-uuid-for-draft_recommendation_tool",
            "context_verification": {
              "session_context_hash": "sha256:00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
            "policy_check_receipt_id": "rcpt-uuid-for-pre-tool-policy-evaluation"
  },
            "delegated_privilege_binding": {
              "delegation_id": "agent-delegation-uuid",
            "authorization_token_hash": "sha256:ef89d8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff4455"
  },
            "execution_boundary": {
              "risk_class": "moderate",
            "parameter_check_hashes": {
              "claim_id": "CLM-99812",
            "adjusted_value": 4200.00
    }
  },
            "gate_outcome": "approve",
            "gate_evaluation_id": "gate-evaluation-uuid-confirming-approval"
}`
  },
  {
    id: 7,
    title: "Agent Tool Invocation & Action Receipt",
    purpose: "Registers tool invocation telemetry, output state changes, and links execution back to its unblocking pre-action proof [150, 270].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Table:</strong> <code>public.agent_tool_invocations</code> [271].</li>
            <li><strong>Relationship Mapping:</strong> Binds directly to <code>pre_action_proof_id</code> [32] and the tool definitions registry [31].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Envelope Validity:</strong> <code>pre_action_proof_id</code> must resolve to an active, validated record inside <code>public.pre_action_proof_bundles</code> [32].</li>
            <li><strong>Output Checksum Verification:</strong> The <code>state_change_hash</code> must correspond to a verified, transaction-level state-change snapshot emitted by the database backend [31].</li>
      </ul>
    ),
    payload: `{
            "pre_action_proof_id": "pre-action-proof-bundle-uuid",
            "invocation_key": "inv_triage_claims_recommend_0009",
            "tool_metadata": {
              "tool_key": "claims_recommender",
            "action_category": "claims_drafting",
            "target_resource_type": "database_row",
            "target_resource_id": "claims_db.claims.id=CLM-99812"
  },
            "execution_payloads": {
              "request_payload_hash": "sha256:3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
            "result_payload_hash": "sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e"
  },
            "state_change_verification": {
              "state_change_hash": "sha256:7766554433221100abcdef00112233445566778899aabbccddeeff0011223344",
            "execution_status": "success"
  },
            "system_telemetry_links": {
              "request_receipt_id": "rcpt-uuid-for-tool-request-event",
            "execution_receipt_id": "rcpt-uuid-for-tool-execution-event"
  }
}`
  },
  {
    id: 8,
    title: "Shadow AI Discovery & Proportional Response Routing",
    purpose: "Captures network-level or browser-level signals of unmanaged AI use, hashes prompts to protect employee privacy, and tracks remediation [155, 156].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Tables:</strong> <code>public.shadow_ai_discovery_records</code> [274], <code>public.shadow_ai_classifications</code> [274], and <code>public.shadow_ai_governance_responses</code> [274].</li>
            <li><strong>Relationship Mapping:</strong> Links through <code>discovery_record_id</code> and tracks progress through <code>shadow_ai_governance_responses</code> [45, 46].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Data Protection Boundary:</strong> In <code>hash_only</code> mode, the raw contents of the employee prompt must never be written to any table. Only the SHA-256 <code>raw_discovery_payload_hash</code> is recorded [42, 539].</li>
            <li><strong>Incident Linkage:</strong> If <code>risk_level</code> resolves to 'critical' or 'high', a background process must generate an associated entry inside <code>public.incidents</code> [15, 545].</li>
      </ul>
    ),
    payload: `{
            "discovery_id": "disc_shadow_2026_07_24_8812",
            "discovery_signal": {
              "signal_source": "enterprise_next_generation_firewall",
            "signal_type": "network_post_request",
            "observed_tool_name": "Prohibited Chatbot Assistant XYZ",
            "observed_at": "2026-07-24T13:15:00Z"
  },
            "actor_context": {
              "actor_principal_id": "human-claims-handler-principal-uuid",
            "device_or_session_ref": "endpoint_mac_00_1a_2b_3c_4d_5e"
  },
            "risk_assessment": {
              "confidence_score": 0.95,
            "data_sensitivity_hint": "contains_confidential_customer_data",
            "content_retention_mode": "hash_only",
            "raw_discovery_payload_hash": "sha256:77889900aabbccddeeff00112233445566778899aabbccddeeff0011223344"
  },
            "governance_routing": {
              "classification": "unmanaged_data_exposure",
            "risk_level": "high",
            "governance_response_action": "migrate_to_sanctioned_channel",
            "response_status": "pending",
            "migration_target": "https://copilot.enterprise-cognitiveinsight.ai"
  }
}`
  },
  {
    id: 9,
    title: "Downstream Artifact Release & Forensic Fingerprint",
    purpose: "Registers exported reports, binds pre/post-watermarked state hashes, and generates robust text forensic shingles for offline validation [158, 159].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Tables:</strong> <code>public.artifact_release_records</code> [271], <code>public.watermark_descriptors</code> [272], and <code>public.forensic_fingerprints</code> [272].</li>
            <li><strong>Relationship Mapping:</strong> Associates the watermark metadata and fingerprint templates directly to <code>artifact_release_id</code> [38, 39, 41].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Dual-State Equivalence:</strong> For pristine documents, the verification job must check against <code>pre_watermark_hash</code> [158]. For distributed files, it must check against <code>post_watermark_hash</code> [158].</li>
            <li><strong>Fallback Forensic Rule:</strong> If visual watermark tags are stripped or missing, subsequent forensic verification matches must achieve a confidence level matching or exceeding the defined <code>matching_threshold</code> [39, 41, 160].</li>
      </ul>
    ),
    payload: `{
            "release_id": "rel_doc_claims_summary_CLM-99812",
            "artifact_type": "pdf_report",
            "artifact_id": "doc_uuid_for_exported_pdf",
            "dual_state_hashing": {
              "pre_watermark_hash": "sha256:bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa",
            "post_watermark_hash": "sha256:ffeeddccbbaa00112233445566778899aabbccddeeff00112233445566778899"
  },
            "explicit_watermarking": {
              "watermark_type": "metadata_and_qr_overlay",
            "marker_id": "qr_rcpt_id_rcpt:deploy:2026-07-24-0012",
            "location_descriptor": {
              "page": "first_and_last",
            "coordinates_box": {
              "x": 480,
            "y": 720,
            "width": 100,
            "height": 100
      }
    }
  },
            "forensic_fingerprinting": {
              "fingerprint_method": "distinctive_anchor_shingling",
            "fingerprint_version": "v1.2",
            "zone_count": 3,
            "zone_size": 256,
            "top_k_shingles": [
            {"zone": 1, "shingle_hash": "sha256:a1b2c3d4..."},
            {"zone": 2, "shingle_hash": "sha256:e5f6a7b8..."}
            ],
            "matching_threshold": 0.85
  }
}`
  },
  {
    id: 10,
    title: "Privacy Rights Enforcement & Cryptographic Erasure",
    purpose: "Erases personal data on demand by shredding subject-specific symmetric keys without breaking chronological Merkle roots [11, 72].",
    targets: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>Primary Tables:</strong> <code>public.privacy_erasure_requests</code> [72, 73], <code>public.subject_encryption_keys</code> [72], and <code>public.receipt_encrypted_content</code> [72].</li>
            <li><strong>Relationship Mapping:</strong> Triggers key status mutation [72].</li>
      </ul>
    ),
    invariants: (
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li><strong>State Shredding:</strong> Upon execution, <code>subject_encryption_keys.key_status</code> must transition to 'destroyed' and <code>receipt_encrypted_content.encryption_status</code> must be mutated to 'crypto_erased' [72].</li>
            <li><strong>Verification Survival:</strong> The outer content hashes (<code>receipts.content_hash</code>) must remain perfectly validable under verification, while attempts to decrypt the encrypted payloads in <code>receipt_encrypted_content</code> must fail [11, 72].</li>
      </ul>
    ),
    payload: `{
            "erasure_request_id": "req_erase_subject_user-998",
            "data_subject": {
              "subject_id": "data-subject-uuid-for-erased-user",
            "subject_type": "customer",
            "jurisdiction": "EU_GDPR_Spain"
  },
            "execution_actions": [
            {
              "action_type": "cryptographic_erasure_key_destruction",
            "target_key_ref": "key-ref-aes-envelope-user-998",
            "destruction_status": "destroyed",
            "destruction_reason": "Right to be Forgotten Request"
    }
            ],
            "audit_chain_impact": {
              "affected_receipt_count": 124,
            "affected_keys_count": 1,
            "evidence_hash_retained_intact": true,
            "verification_limitation_notice_given": true
  },
            "erasure_status": "completed",
            "erasure_receipt_id": "rcpt_uuid_for_erasure_completion"
}`
  },
];
