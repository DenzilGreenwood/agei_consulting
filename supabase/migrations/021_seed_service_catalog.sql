-- ============================================================================
-- AGEI Layer: Seed Service Catalog
-- ============================================================================
-- CIAF-LCM Concept:
--   Initial service bundle definitions. Seeds for pre-configured API access
--   patterns. Service families: events, receipts, policies, gates, evidence,
--   vault, audit, privacy, agentic, lifecycle.
--
-- Data:
--   Seeds for service bundles and CIAF type registry
--
-- Depends on:
--   ciaf_services, ciaf_type_registry
--
-- Evidence Role:
--   Pre-configured API access patterns
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- SEED: CIAF Services
-- ============================================================================

INSERT INTO ciaf_services (service_key, service_name, service_family, description, default_scopes, requires_signature, requires_gate, is_active) VALUES
-- Event submission
('events.submit', 'Submit Evidence Event', 'events', 'Submit evidence events to AGEI', '["write:events"]'::jsonb, false, true, true),
('events.batch_submit', 'Batch Submit Events', 'events', 'Submit multiple evidence events in batch', '["write:events"]'::jsonb, false, true, true),

-- Receipt operations
('receipts.read', 'Read Receipt', 'receipts', 'Read individual receipt by ID', '["read:receipts"]'::jsonb, false, false, true),
('receipts.list', 'List Receipts', 'receipts', 'List receipts with filters', '["read:receipts"]'::jsonb, false, false, true),
('receipts.verify', 'Verify Receipt', 'receipts', 'Verify receipt cryptographic integrity', '["read:receipts"]'::jsonb, false, false, true),

-- Lineage operations
('lineage.trace', 'Trace Lineage', 'receipts', 'Trace lineage chain from receipt', '["read:receipts", "read:lineage"]'::jsonb, false, false, true),
('lineage.graph', 'Get Lineage Graph', 'receipts', 'Get full lineage graph for resource', '["read:receipts", "read:lineage"]'::jsonb, false, false, true),

-- Policy operations
('policies.read', 'Read Policy', 'policies', 'Read policy definition by ID', '["read:policies"]'::jsonb, false, false, true),
('policies.list', 'List Policies', 'policies', 'List policies with filters', '["read:policies"]'::jsonb, false, false, true),
('policies.create', 'Create Policy', 'policies', 'Create new policy definition', '["write:policies"]'::jsonb, true, true, true),
('policies.publish', 'Publish Policy', 'policies', 'Publish policy version', '["write:policies", "publish:policies"]'::jsonb, true, true, true),

-- Gate operations
('gates.evaluate', 'Evaluate Gate', 'gates', 'Evaluate gate for resource', '["write:gates"]'::jsonb, false, false, true),
('gates.read', 'Read Gate Evaluation', 'gates', 'Read gate evaluation results', '["read:gates"]'::jsonb, false, false, true),
('gates.list', 'List Gate Evaluations', 'gates', 'List gate evaluations with filters', '["read:gates"]'::jsonb, false, false, true),

-- Evidence operations
('evidence.read', 'Read Evidence Object', 'evidence', 'Read evidence object by ID', '["read:evidence"]'::jsonb, false, false, true),
('evidence.create', 'Create Evidence Object', 'evidence', 'Create evidence capsule', '["write:evidence"]'::jsonb, true, true, true),
('evidence.seal', 'Seal Evidence Object', 'evidence', 'Seal evidence object as immutable', '["write:evidence", "seal:evidence"]'::jsonb, true, true, true),

-- Vault operations
('vault.read', 'Read Vault Object', 'vault', 'Read sealed vault object', '["read:vault"]'::jsonb, true, false, true),
('vault.create', 'Create Vault Object', 'vault', 'Create sealed vault package', '["write:vault"]'::jsonb, true, true, true),
('vault.list', 'List Vault Objects', 'vault', 'List vault objects with filters', '["read:vault"]'::jsonb, false, false, true),

-- Audit pack operations
('audit.pack.create', 'Create Audit Pack', 'audit', 'Create new audit pack', '["write:audit"]'::jsonb, false, false, true),
('audit.pack.add_items', 'Add Audit Pack Items', 'audit', 'Add items to audit pack', '["write:audit"]'::jsonb, false, false, true),
('audit.pack.seal', 'Seal Audit Pack', 'audit', 'Seal audit pack as immutable', '["write:audit", "seal:audit"]'::jsonb, true, true, true),
('audit.pack.export', 'Export Audit Pack', 'audit', 'Export sealed audit pack', '["read:audit", "export:audit"]'::jsonb, true, false, true),
('audit.pack.read', 'Read Audit Pack', 'audit', 'Read audit pack by ID', '["read:audit"]'::jsonb, false, false, true),

-- Verification operations
('verify.hash', 'Verify Hash', 'verification', 'Verify hash integrity', '["verify"]'::jsonb, false, false, true),
('verify.signature', 'Verify Signature', 'verification', 'Verify cryptographic signature', '["verify"]'::jsonb, false, false, true),
('verify.lineage', 'Verify Lineage Chain', 'verification', 'Verify lineage chain integrity', '["verify", "read:receipts"]'::jsonb, false, false, true),

-- Privacy operations
('privacy.request.create', 'Create Privacy Request', 'privacy', 'Create data subject request', '["write:privacy"]'::jsonb, false, true, true),
('privacy.request.read', 'Read Privacy Request', 'privacy', 'Read privacy request by ID', '["read:privacy"]'::jsonb, false, false, true),
('privacy.request.action', 'Execute Privacy Action', 'privacy', 'Execute privacy request action', '["write:privacy", "execute:privacy"]'::jsonb, true, true, true),
('privacy.export', 'Export Privacy Data', 'privacy', 'Export privacy data package', '["read:privacy", "export:privacy"]'::jsonb, true, true, true),

-- Lifecycle operations
('lifecycle.object.create', 'Create Lifecycle Object', 'lifecycle', 'Create AI lifecycle object', '["write:lifecycle"]'::jsonb, false, false, true),
('lifecycle.object.read', 'Read Lifecycle Object', 'lifecycle', 'Read lifecycle object by ID', '["read:lifecycle"]'::jsonb, false, false, true),
('lifecycle.object.link', 'Link Lifecycle Objects', 'lifecycle', 'Create lifecycle object links', '["write:lifecycle"]'::jsonb, false, false, true),
('lifecycle.lineage', 'Trace Lifecycle Lineage', 'lifecycle', 'Trace lifecycle object lineage', '["read:lifecycle"]'::jsonb, false, false, true),

-- Agentic operations
('agent.session.start', 'Start Agent Session', 'agentic', 'Start governed agent session', '["write:agentic"]'::jsonb, true, true, true),
('agent.session.end', 'End Agent Session', 'agentic', 'End agent session', '["write:agentic"]'::jsonb, false, false, true),
('agent.tool.invoke', 'Invoke Agent Tool', 'agentic', 'Invoke governed agent tool', '["write:agentic", "execute:tools"]'::jsonb, true, true, true),
('agent.proof.create', 'Create Pre-Action Proof', 'agentic', 'Create pre-action proof bundle', '["write:agentic"]'::jsonb, true, true, true),

-- HITL operations
('hitl.request.create', 'Create HITL Request', 'hitl', 'Create human review request', '["write:hitl"]'::jsonb, false, false, true),
('hitl.request.read', 'Read HITL Request', 'hitl', 'Read HITL request by ID', '["read:hitl"]'::jsonb, false, false, true),
('hitl.decision.record', 'Record HITL Decision', 'hitl', 'Record human decision', '["write:hitl", "decide:hitl"]'::jsonb, true, true, true),

-- Shadow AI operations
('shadow_ai.discovery.report', 'Report Shadow AI Discovery', 'shadow_ai', 'Report shadow AI discovery', '["write:shadow_ai"]'::jsonb, false, false, true),
('shadow_ai.classification.create', 'Classify Shadow AI', 'shadow_ai', 'Create shadow AI classification', '["write:shadow_ai"]'::jsonb, false, true, true),
('shadow_ai.response.create', 'Create Shadow AI Response', 'shadow_ai', 'Create governance response', '["write:shadow_ai"]'::jsonb, false, false, true)

ON CONFLICT (service_key) DO NOTHING;

-- ============================================================================
-- SEED: CIAF Type Registry
-- ============================================================================

INSERT INTO ciaf_type_registry (type_family, type_key, display_name, description, extension_pack, is_active) VALUES
-- Receipt types (Core)
('receipt_type', 'model_training', 'Model Training', 'Model training event receipt', 'Core', true),
('receipt_type', 'model_validation', 'Model Validation', 'Model validation event receipt', 'Core', true),
('receipt_type', 'model_deployment', 'Model Deployment', 'Model deployment event receipt', 'Core', true),
('receipt_type', 'inference', 'Inference', 'Model inference event receipt', 'Core', true),
('receipt_type', 'gate_evaluation', 'Gate Evaluation', 'Gate evaluation result receipt', 'Core', true),
('receipt_type', 'policy_evaluation', 'Policy Evaluation', 'Policy evaluation result receipt', 'Core', true),

-- Event types (Core)
('event_type', 'dataset_created', 'Dataset Created', 'Dataset creation event', 'Core', true),
('event_type', 'model_trained', 'Model Trained', 'Model training completion event', 'Core', true),
('event_type', 'model_validated', 'Model Validated', 'Model validation completion event', 'Core', true),
('event_type', 'model_deployed', 'Model Deployed', 'Model deployment event', 'Core', true),
('event_type', 'inference_executed', 'Inference Executed', 'Inference execution event', 'Core', true),

-- Lifecycle types (Lifecycle Pack)
('lifecycle_stage', 'development', 'Development', 'Development stage', 'Lifecycle', true),
('lifecycle_stage', 'training', 'Training', 'Training stage', 'Lifecycle', true),
('lifecycle_stage', 'validation', 'Validation', 'Validation stage', 'Lifecycle', true),
('lifecycle_stage', 'deployment', 'Deployment', 'Deployment stage', 'Lifecycle', true),
('lifecycle_stage', 'inference', 'Inference', 'Inference stage', 'Lifecycle', true),
('lifecycle_stage', 'retired', 'Retired', 'Retired stage', 'Lifecycle', true),

-- Object types (Lifecycle Pack)
('object_type', 'dataset', 'Dataset', 'Training or validation dataset', 'Lifecycle', true),
('object_type', 'model', 'Model', 'AI/ML model', 'Lifecycle', true),
('object_type', 'training_run', 'Training Run', 'Model training execution', 'Lifecycle', true),
('object_type', 'deployment', 'Deployment', 'Model deployment instance', 'Lifecycle', true),
('object_type', 'inference_session', 'Inference Session', 'Inference execution session', 'Lifecycle', true),

-- Link types (Lifecycle Pack)
('link_type', 'trains_on', 'Trains On', 'Model trains on dataset', 'Lifecycle', true),
('link_type', 'validates_with', 'Validates With', 'Model validates with dataset', 'Lifecycle', true),
('link_type', 'deploys', 'Deploys', 'Deployment deploys model', 'Lifecycle', true),
('link_type', 'infers_with', 'Infers With', 'Inference uses model', 'Lifecycle', true),
('link_type', 'derives_from', 'Derives From', 'Object derives from another', 'Lifecycle', true),

-- Agentic types (Agentic Pack)
('agent_action', 'data_access', 'Data Access', 'Agent data access action', 'Agentic', true),
('agent_action', 'model_inference', 'Model Inference', 'Agent model inference action', 'Agentic', true),
('agent_action', 'customer_communication', 'Customer Communication', 'Agent customer communication action', 'Agentic', true),
('agent_action', 'transaction_execution', 'Transaction Execution', 'Agent transaction execution', 'Agentic', true),

-- Privacy types (Privacy Pack)
('privacy_request_type', 'access', 'Access Request', 'Data subject access request', 'Privacy', true),
('privacy_request_type', 'rectification', 'Rectification Request', 'Data rectification request', 'Privacy', true),
('privacy_request_type', 'erasure', 'Erasure Request', 'Right to be forgotten request', 'Privacy', true),
('privacy_request_type', 'portability', 'Portability Request', 'Data portability request', 'Privacy', true),
('privacy_request_type', 'restriction', 'Restriction Request', 'Processing restriction request', 'Privacy', true),
('privacy_request_type', 'objection', 'Objection Request', 'Processing objection request', 'Privacy', true)

ON CONFLICT (type_family, type_key) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================

COMMENT ON TABLE ciaf_services IS 'Service catalog seeded with core CIAF-LCM services';
COMMENT ON TABLE ciaf_type_registry IS 'CIAF type registry seeded with core types for all extension packs';
