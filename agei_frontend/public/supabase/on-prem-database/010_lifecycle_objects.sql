-- ============================================================================
-- AGEI Layer: Lifecycle Objects
-- ============================================================================
-- CIAF-LCM Concept:
--   AI lifecycle entity tracking. Makes CIAF-LCM feel like a lifecycle
--   system, not just an audit log. First-class objects bound to receipts,
--   evidence, and vault.
--
-- Tables:
--   ai_lifecycle_objects, ai_lifecycle_object_links
--
-- Depends on:
--   organizations, principals, receipts, evidence_objects, vault_objects
--
-- Evidence Role:
--   Makes CIAF-LCM feel like a lifecycle system, not just an audit log
--
-- Extension Pack:
--   AGEI Lifecycle Pack (Optional)
-- ============================================================================

-- ============================================================================
-- TABLE: ai_lifecycle_objects
-- ============================================================================
-- Purpose: First-class AI/model lifecycle object registry
-- Evidence: Lifecycle entities bound to CIAF receipts, evidence, and vault
-- ============================================================================

CREATE TABLE ai_lifecycle_objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Object classification
    object_type text NOT NULL,
    object_key text NOT NULL,
    display_name text,
    description text,
    
    -- Lifecycle tracking
    lifecycle_stage text NOT NULL,
    current_state text NOT NULL,
    
    -- Cryptographic integrity
    content_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    vault_object_id uuid,
    
    -- External storage
    storage_bucket text,
    storage_path text,
    storage_content_hash text,
    media_type text,
    size_bytes int8,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT ai_lifecycle_objects_unique_org_key UNIQUE (organization_id, object_key),
    CONSTRAINT ai_lifecycle_objects_hash_format CHECK (content_hash IS NULL OR content_hash ~ '^sha256:[a-f0-9]{64}$')
);

CREATE INDEX idx_ai_lifecycle_objects_org ON ai_lifecycle_objects(organization_id);
CREATE INDEX idx_ai_lifecycle_objects_type ON ai_lifecycle_objects(object_type);
CREATE INDEX idx_ai_lifecycle_objects_key ON ai_lifecycle_objects(object_key);
CREATE INDEX idx_ai_lifecycle_objects_stage ON ai_lifecycle_objects(lifecycle_stage);
CREATE INDEX idx_ai_lifecycle_objects_state ON ai_lifecycle_objects(current_state);
CREATE INDEX idx_ai_lifecycle_objects_receipt ON ai_lifecycle_objects(receipt_id);
CREATE INDEX idx_ai_lifecycle_objects_evidence ON ai_lifecycle_objects(evidence_object_id);
CREATE INDEX idx_ai_lifecycle_objects_vault ON ai_lifecycle_objects(vault_object_id);
CREATE INDEX idx_ai_lifecycle_objects_created ON ai_lifecycle_objects(created_at DESC);

COMMENT ON TABLE ai_lifecycle_objects IS 'First-class AI/model lifecycle object registry bound to CIAF receipts, evidence objects, and vault objects';
COMMENT ON COLUMN ai_lifecycle_objects.object_type IS 'Object type: dataset, model, training_run, deployment, inference_session, etc.';
COMMENT ON COLUMN ai_lifecycle_objects.object_key IS 'Unique key within organization';
COMMENT ON COLUMN ai_lifecycle_objects.lifecycle_stage IS 'Lifecycle stage: development, training, validation, deployment, inference, retired';
COMMENT ON COLUMN ai_lifecycle_objects.current_state IS 'Current state within lifecycle stage';
COMMENT ON COLUMN ai_lifecycle_objects.content_hash IS 'SHA-256 hash of object content. Format: sha256:<64 hex chars>';

-- ============================================================================
-- TABLE: ai_lifecycle_object_links
-- ============================================================================
-- Purpose: Lifecycle object graph complementing receipt_links
-- Evidence: Object-level model lifecycle lineage
-- ============================================================================

CREATE TABLE ai_lifecycle_object_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Link relationship
    source_object_id uuid NOT NULL REFERENCES ai_lifecycle_objects(id) ON DELETE CASCADE,
    target_object_id uuid NOT NULL REFERENCES ai_lifecycle_objects(id) ON DELETE CASCADE,
    link_type text NOT NULL,
    
    -- Receipt link reference
    receipt_link_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT ai_lifecycle_object_links_no_self_link CHECK (source_object_id != target_object_id)
);

CREATE INDEX idx_ai_lifecycle_links_org ON ai_lifecycle_object_links(organization_id);
CREATE INDEX idx_ai_lifecycle_links_source ON ai_lifecycle_object_links(source_object_id);
CREATE INDEX idx_ai_lifecycle_links_target ON ai_lifecycle_object_links(target_object_id);
CREATE INDEX idx_ai_lifecycle_links_type ON ai_lifecycle_object_links(link_type);
CREATE INDEX idx_ai_lifecycle_links_receipt_link ON ai_lifecycle_object_links(receipt_link_id);

COMMENT ON TABLE ai_lifecycle_object_links IS 'Lifecycle object graph that complements receipt_links for object-level model lifecycle lineage';
COMMENT ON COLUMN ai_lifecycle_object_links.link_type IS 'Link type: trains_on, validates_with, deploys, infers_with, derives_from, etc.';
COMMENT ON COLUMN ai_lifecycle_object_links.receipt_link_id IS 'Optional reference to corresponding receipt_link';
