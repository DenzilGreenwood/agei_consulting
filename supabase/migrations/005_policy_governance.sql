-- ============================================================================
-- AGEI Layer: Policy Governance
-- ============================================================================
-- CIAF-LCM Concept:
--   Immutable policy definitions with version tracking. Policies define
--   **what should happen** (rules). Gates enforce **when it should happen**
--   (enforcement points). Evaluations record **what actually happened**.
--
-- Tables:
--   policy_sets, policy_versions, policy_rules
--
-- Depends on:
--   organizations, principals, schema_versions
--
-- Evidence Role:
--   Immutable policy definitions with version tracking
--
-- Extension Pack:
--   Core (Required)
--
-- Critical Distinction:
--   - Policies define what should happen
--   - Gates enforce when it should happen
--   - Evaluations record what actually happened
-- ============================================================================

-- ============================================================================
-- TABLE: policy_sets
-- ============================================================================
-- Purpose: Collections of related policies
-- Evidence: Policy grouping and organization
-- ============================================================================

CREATE TABLE policy_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Identity
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    
    -- Versioning (FK added after policy_versions table)
    current_version_id uuid,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    -- Soft delete
    deleted_at timestamptz,
    
    CONSTRAINT policy_sets_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_policy_sets_org ON policy_sets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_policy_sets_slug ON policy_sets(organization_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_policy_sets_active ON policy_sets(organization_id, is_active) WHERE is_active = true;
CREATE UNIQUE INDEX policy_sets_unique_org_slug ON policy_sets(organization_id, slug) WHERE deleted_at IS NULL;

COMMENT ON TABLE policy_sets IS 'Collections of related policies (e.g., "ML Training Policies", "Deployment Policies")';
COMMENT ON COLUMN policy_sets.current_version_id IS 'Points to the active policy version';
COMMENT ON COLUMN policy_sets.slug IS 'URL-safe policy set identifier';

-- ============================================================================
-- TABLE: policy_versions
-- ============================================================================
-- Purpose: Immutable versioned policy definitions with JSONB payloads
-- Evidence: Version-controlled policy rules with cryptographic integrity
-- ============================================================================

CREATE TABLE policy_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_set_id uuid NOT NULL REFERENCES policy_sets(id) ON DELETE RESTRICT,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Version identity
    version text NOT NULL,
    version_number int4 NOT NULL DEFAULT 1,
    
    -- Policy definition (versioned JSONB payload)
    policy_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Cryptographic integrity
    payload_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Digital Signature (REQUIRED for all policy versions)
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signing_key_id uuid NOT NULL REFERENCES signing_keys(id),
    signed_by uuid NOT NULL REFERENCES principals(id),
    signed_at timestamptz NOT NULL DEFAULT NOW(),
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    
    -- Change tracking
    change_summary text,
    previous_version_id uuid REFERENCES policy_versions(id),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT policy_versions_unique_set_version UNIQUE (policy_set_id, version),
    CONSTRAINT policy_versions_unique_set_number UNIQUE (policy_set_id, version_number),
    CONSTRAINT policy_versions_hash_format CHECK (payload_hash ~ '^sha256:[a-f0-9]{64}$'),
    CONSTRAINT policy_versions_signature_format CHECK (
        agei_validate_signature_format(signature, signature_algorithm::text)
    )
);

CREATE INDEX idx_policy_versions_set ON policy_versions(policy_set_id);
CREATE INDEX idx_policy_versions_org ON policy_versions(organization_id);
CREATE INDEX idx_policy_versions_active ON policy_versions(policy_set_id, is_active) WHERE is_active = true;
CREATE INDEX idx_policy_versions_published ON policy_versions(policy_set_id, is_published) WHERE is_published = true;
CREATE INDEX idx_policy_versions_hash ON policy_versions(payload_hash);
CREATE INDEX idx_policy_versions_schema ON policy_versions(schema_version_id);
CREATE INDEX idx_policy_versions_signing_key ON policy_versions(signing_key_id);
CREATE INDEX idx_policy_versions_signed_by ON policy_versions(signed_by);

COMMENT ON TABLE policy_versions IS 'Immutable versioned policy definitions with JSONB payloads. All versions cryptographically signed.';
COMMENT ON COLUMN policy_versions.policy_payload IS 'Full policy definition matching policy.schema.json';
COMMENT ON COLUMN policy_versions.payload_hash IS 'SHA-256 hash of canonicalized policy_payload. Format: sha256:<64 hex chars>';
COMMENT ON COLUMN policy_versions.canonicalization_version IS 'Canonicalization standard used (agei-json-v1)';
COMMENT ON COLUMN policy_versions.signature IS 'REQUIRED digital signature over payload_hash. Ed25519 default.';
COMMENT ON COLUMN policy_versions.signing_key_id IS 'Reference to signing key used. Enables key rotation tracking.';

-- Add foreign key from policy_sets to policy_versions
ALTER TABLE policy_sets 
    ADD CONSTRAINT fk_policy_sets_current_version 
    FOREIGN KEY (current_version_id) 
    REFERENCES policy_versions(id);

-- ============================================================================
-- TABLE: policy_rules
-- ============================================================================
-- Purpose: Individual policy rules within a policy version
-- Evidence: Granular rule-level tracking and evaluation
-- ============================================================================

CREATE TABLE policy_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version_id uuid NOT NULL REFERENCES policy_versions(id) ON DELETE RESTRICT,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Rule identity
    rule_key text NOT NULL,
    rule_name text NOT NULL,
    description text,
    
    -- Rule definition (JSONB payload)
    rule_payload jsonb NOT NULL,
    schema_version_id uuid REFERENCES schema_versions(id),
    
    -- Rule evaluation
    rule_type text NOT NULL CHECK (rule_type IN ('threshold', 'requirement', 'prohibition', 'obligation', 'custom')),
    severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    
    -- Ordering and grouping
    rule_order int4 NOT NULL DEFAULT 0,
    rule_group text,
    
    -- Status
    is_enabled boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT policy_rules_unique_version_key UNIQUE (policy_version_id, rule_key)
);

CREATE INDEX idx_policy_rules_version ON policy_rules(policy_version_id);
CREATE INDEX idx_policy_rules_org ON policy_rules(organization_id);
CREATE INDEX idx_policy_rules_type ON policy_rules(rule_type);
CREATE INDEX idx_policy_rules_enabled ON policy_rules(policy_version_id, is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_policy_rules_order ON policy_rules(policy_version_id, rule_order);

COMMENT ON TABLE policy_rules IS 'Individual policy rules extracted/indexed from policy versions';
COMMENT ON COLUMN policy_rules.rule_payload IS 'Full rule definition matching policy-rule.schema.json';
COMMENT ON COLUMN policy_rules.rule_type IS 'Type of rule: threshold, requirement, prohibition, obligation, custom';
COMMENT ON COLUMN policy_rules.severity IS 'Rule severity level for prioritization';

-- Update trigger
CREATE TRIGGER update_policy_sets_updated_at BEFORE UPDATE ON policy_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
