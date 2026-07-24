AGEI Working Document Set: Cryptographic AI Event Schemas and Payloads
A Production-Ready Specification for the AGEI Platform and AGEI Implementation

1. The Cryptographic Evidence Envelope Standard
In an AI Governance Evidence Infrastructure (AGEI) [92], every AI event is represented as an immutable Receipt backed by cryptographic proof [93, 169]. To satisfy the "Proof, Not Logs" standard, all event-type payloads documented here must be serialized using Canonical JSON (RFC 8785) [515] prior to hashing, signed using Ed25519 [515], and hashed using SHA-256 [515] as defined by the cross-cutting standards of the database contract [253].

The Enforcing Envelope Structure
Each of the payloads documented below is wrapped in the following standardized receipt_payload envelope [5, 6]:

```json
{
  "receipt_metadata": {
    "receipt_id": "rcpt:org-123:stage-code:uuid-string",
    "receipt_type": "type_of_receipt_event",
    "canonicalization_version": "agei-json-v1",
    "schema_version_id": "schema-uuid-from-registry",
    "hash_algorithm": "sha256",
    "signature_algorithm": "ED25519",
    "signing_key_id": "signing-key-uuid",
    "signed_by_principal_id": "principal-uuid",
    "signed_at": "2026-07-24T13:30:00Z"
  },
  "event_context": {
    "organization_id": "org-uuid",
    "lifecycle_stage": "governance_lifecycle_stage_code",
    "gate_evaluation_id": "gate-evaluation-uuid-or-null",
    "policy_version_id": "policy-version-uuid-or-null",
    "resource_type": "evaluated_resource_type",
    "resource_id": "evaluated_resource_id"
  },
  "payload": {
    "//... Specific Event-Type Payload Details ...//"
  },
  "cryptographic_proof": {
    "content_hash": "sha256:d8e8f8...",
    "signature": "eddsa-ed25519:signature-hash-string",
    "merkle_proof": {
      "batch_id": "batch-uuid",
      "index": 42,
      "proof_path": ["sha256:hash1", "sha256:hash2"]
    }
  }
}
```

2. The 10 Core AI Event Working Documents

Event 1: Dataset Registration & Onboarding (Provenance Gate)
Captures the onboarding, lineage, and compliance checks of training data before ingestion into the MLOps pipeline.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.ai_lifecycle_objects [266] (registers the dataset as a lifecycle object with object_type = 'dataset'), public.receipts [262], and public.lawful_basis_records [274].
Relational Linkages: receipts.gate_evaluation_id maps to the Provenance Gate evaluation record [322]; ai_lifecycle_objects.receipt_id links directly to this receipt [266].

3. Verification Invariants
payload.storage.storage_content_hash must match the actual storage Parquet file checksum.
The consent_records_linked count must correspond to valid references in public.consent_records [275].

Event 2: Model Training Completion & Lineage Binding
Binds the output model checkpoint to its exact dataset roots, code parameters, and environment state.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.ai_lifecycle_objects [266] (with object_type = 'training_run'), public.ai_lifecycle_object_links [267] (binding training run object to dataset object), and public.receipts [262].
Relational Linkages: ai_lifecycle_object_links.source_object_id points to the Dataset object, and target_object_id points to the Training Run object [267].

3. Verification Invariants
The router_loss_observed must match the training metrics written to public.evidence_objects [264] for validation audits.
The checkpoint model architecture hash must resolve to a valid architecture schema in public.schema_versions [265].

Event 3: Model Evaluation & Validation Gate Assessment
Records the technical testing, bias checking, and regression thresholds required before model promotion.

1. Payload Template (payload structure)
```json
{
  "evaluated_model_id": "ai-lifecycle-object-uuid-for-claims_model_v4.3.2",
  "evaluation_bundle_key": "claims_eval_bundle_2026_q2_a",
  "metrics_achieved": {
    "recall_at_5": 0.922,
    "qa_accuracy": 0.791,
    "neuro_symbolic_memory_recall": 1.0,
    "latency_p95_ms": 180.0
  },
  "validation_gates": [
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
}
```
2. Audit & Database Mappings
Target Tables: public.policy_evaluations [261] (recording individual checks) and public.gate_evaluations [262] (aggregating the validation status).
Relational Linkages: Maps to gate_evaluations where gate_outcome = 'approve' [262]. Each item in validation_gates yields an insert into public.policy_evaluations [261].

3. Verification Invariants
The values of metrics_achieved must correspond precisely to evaluation data logs in public.evidence_objects [264].
Any failed rule forces gate_evaluations.gate_outcome = 'deny' unless an override is recorded [120, 262].

Event 4: Model Deployment Promotion & Release Lock
Binds the release binary, deployment environment, and policy gates at the moment the model enters production.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.artifact_release_records [269], public.gate_evaluations [262], and public.receipts [262].
Relational Linkages: artifact_release_records.gate_evaluation_id maps to the Deployment Gate [42]; artifact_release_records.release_receipt_id points to the emitted deployment receipt [41].

3. Verification Invariants
The model artifact hash (pre_watermark_hash) must match the hash recorded in the training checkpoint and validation evaluations.
If no_active_blocking_incidents is false, gate_evaluations.gate_outcome must be deny or escalate [120].

Event 5: Agent Session & Delegated Authority Scope
Captures the session startup and boundary delegation proving an agent acts with scoped human authority, not ambient privilege.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.agent_sessions [267] and public.agent_delegations [268].
Relational Linkages: agent_delegations.agent_session_id points to the active agent_sessions.id [27]. agent_sessions.delegating_principal_id maintains human accountability [26].

3. Verification Invariants
The delegation_token_hash must represent a cryptographically signed human authorization token present in the active session context.
Any agent tool call during this session must be bounded by the allowed_actions array [32].

Event 6: Agent Pre-Action Proof-Carrying Bundle
The "Gate Before Action" invariant payload required before an agent executes any sensitive tool or state change.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.pre_action_proof_bundles [268] and public.gate_evaluations [262].
Relational Linkages: Linked directly via pre_action_proof_bundles.gate_evaluation_id [30] and pre_action_proof_bundles.delegation_id [30].

3. Verification Invariants
The tool_definition_id risk classification (checked in agent_tool_definitions) must match the risk_class of the bundle.
The adjusted value ($4,200.00) must be less than max_transaction_value ($5,000.00) specified in the associated agent_delegations record.

Event 7: Agent Tool Invocation & Action Receipt
Documents the actual invocation, parameters, and resulting state changes after execution of a mediated agent tool.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.agent_tool_invocations [269].
Relational Linkages: Connects to agent_sessions [31], pre_action_proof_bundles [32], and agent_tool_definitions [32].

3. Verification Invariants
pre_action_proof_id must resolve to an active, validly signed pre-action proof bundle [32].
The result_payload_hash must be verified against the checksum returned by the database target wrapper [31].

Event 8: Shadow AI Discovery & Proportional Response Routing
Documents the evidence-led detection of unmanaged AI use, risk classification, and formal migration routing.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.shadow_ai_discovery_records [272], public.shadow_ai_classifications [272], and public.shadow_ai_governance_responses [272].
Relational Linkages: shadow_ai_classifications.discovery_record_id links to the discovery event [46]; shadow_ai_governance_responses.classification_id tracks the routed resolution action [46].

3. Verification Invariants
Privacy Guard: content_retention_mode = 'hash_only' prevents raw PII payload storage in the discovery record [42, 537].
If risk_level is high or critical, an entry must be created in public.incidents [15, 542].

Event 9: Downstream Artifact Release & Forensic Fingerprint
Pairs explicit watermarking with fallback forensic fingerprinting to secure content integrity after document distribution.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.artifact_release_records [269], public.watermark_descriptors [270], and public.forensic_fingerprints [270].
Relational Linkages: watermark_descriptors.artifact_release_id and forensic_fingerprints.artifact_release_id point to the base release record [38, 39, 41].

3. Verification Invariants
A downstream verification record (public.provenance_verification_records) must use the exact post_watermark_hash for perfect matches, or fallback to the top_k_shingles with the matching_threshold for excerpt matches [39, 41, 160].

Event 10: Privacy Rights Enforcement & Cryptographic Erasure
Implements the Privacy-vs-Audit standard, destroying key material to erase PII while leaving the receipt chain mathematically intact.

1. Payload Template (payload structure)
```json
{
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
}
```
2. Audit & Database Mappings
Target Tables: public.privacy_erasure_requests [272], public.subject_encryption_keys [272], and public.receipt_encrypted_content [272].
Relational Linkages: Changes subject_encryption_keys.key_status to 'destroyed' [72], and updates receipt_encrypted_content.encryption_status to 'crypto_erased' [72].

3. Verification Invariants
Privacy Guard: Any attempt to decrypt raw payload content linked to the key-ref-aes-envelope-user-998 envelope must fail due to zeroed key material [72], while the top-level receipts.content_hash must remain fully validable under verification [13].

3. How to Deploy and Use These Payload Documents
In your client engagements, these templates serve as executable interface contracts [103]. They bridge standard systems (MLOps platforms, API gateways, agent frameworks, security loggers) and your database.

Integration Steps
Map telemetry: Configure MLOps or agent systems to map raw internal states to these schemas.
Canonicalize payloads: Ensure your runtime libraries apply RFC 8785 standard serialization [515].
Hash & Sign: Compute SHA-256 content hashes and generate Ed25519 signatures on the canonical strings [240].
Insert receipts: Call the AGEI Core database endpoints (or run SQL queries) to write these objects directly into the database families [103].
