-- ============================================================================
-- AGEI Canonical Migration 001: Identity and Tenancy
-- ============================================================================
-- CIAF-LCM Concept:
--   Multi-tenant identity system. Organizations are the root tenant isolation
--   boundary. Principals represent identities (users, services, API keys).
--   Organization members connect principals to organizations with roles.
--
-- Key Features:
--   - Supabase auth integration via principals.auth_user_id
--   - No Organization / Personal Sandbox for public users
--   - Support for human users, services, agents, API keys
--   - Role-based access control
--   - Soft delete support
--
-- Tables:
--   organizations, principals, organization_members
--
-- Functions:
--   agei_no_organization_id(), update_updated_at_column()
--
-- Depends on:
--   000_extensions_and_enums.sql
--
-- Evidence Role:
--   Attribution - who acted, for which organization, under what identity
-- ============================================================================

-- ============================================================================
-- CONSTANTS
-- ============================================================================

CREATE OR REPLACE FUNCTION agei_no_organization_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$;

COMMENT ON FUNCTION agei_no_organization_id()
IS 'Well-known UUID for "No Organization / Personal Sandbox" - the default organization for public users without a real organization.';

-- ============================================================================
-- TABLE: organizations
-- ============================================================================
-- Purpose: Root tenant isolation table
-- Evidence: Multi-tenant boundary for all evidence records
-- ============================================================================

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    
    -- Configuration
    settings jsonb DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    
    -- Soft delete
    deleted_at timestamptz,
    
    CONSTRAINT organizations_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Grant Data API access
GRANT SELECT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO service_role;

COMMENT ON TABLE organizations IS 'Tenant isolation root - each organization has isolated data in AGEI governance system';
COMMENT ON COLUMN organizations.name IS 'Organization display name';
COMMENT ON COLUMN organizations.slug IS 'URL-safe organization identifier';
COMMENT ON COLUMN organizations.settings IS 'Organization-level configuration and preferences';

-- ============================================================================
-- SEED: No Organization / Personal Sandbox
-- ============================================================================
-- Every AGEI user must have an organization context for governance evidence.
-- Public users without a real organization use this well-known organization.
-- ============================================================================

INSERT INTO organizations (
  id,
  name,
  slug,
  settings,
  created_at,
  updated_at
)
VALUES (
  agei_no_organization_id(),
  'No Organization / Personal Sandbox',
  'no-organization',
  jsonb_build_object(
    'system_managed', true,
    'public_signup_default', true,
    'description', 'AGEI tenant boundary for public users, demos, and users not yet attached to a customer organization. Ensures no orphan governance evidence.'
  ),
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  settings = organizations.settings || EXCLUDED.settings,
  updated_at = now();

-- Prevent deletion or duplicate slug conflicts
UPDATE organizations
SET
  deleted_at = COALESCE(deleted_at, now()),
  updated_at = now()
WHERE slug = 'no-organization'
  AND id <> agei_no_organization_id()
  AND deleted_at IS NULL;

COMMENT ON TABLE organizations IS 'AGEI tenant isolation. Note: UUID 00000000-0000-0000-0000-000000000001 is reserved for "No Organization / Personal Sandbox".';

-- ============================================================================
-- TABLE: principals
-- ============================================================================
-- Purpose: Identity and authentication records
-- Evidence: Who performed actions, signed receipts, made decisions
--
-- IMPORTANT AGEI PATTERN:
--   - principals.auth_user_id = auth.uid() for Supabase Auth users
--   - principals.external_id remains flexible text for:
--       * pending-{uuid} (pending principals)
--       * session_{id} (agent sessions)
--       * agent IDs, service IDs, provider IDs
--       * Other non-UUID external identifiers
--
-- DO NOT CAST external_id::uuid for Supabase auth!
-- USE auth_user_id column instead.
-- ============================================================================

CREATE TABLE principals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Supabase auth integration
    -- AGEI PATTERN: Use auth_user_id, NOT external_id::uuid
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    principal_type text NOT NULL CHECK (principal_type IN ('user', 'service', 'system', 'api_key', 'agent')),
    external_id text,  -- Flexible text: pending-*, session_*, agent_*, service_*, provider IDs
    email text,
    display_name text,
    
    -- Onboarding classification
    onboarding_group text NOT NULL DEFAULT 'managed' CHECK (
        onboarding_group IN ('anyone', 'managed', 'service', 'system')
    ),
    
    -- Cryptographic identity (optional)
    public_key_fingerprint text,
    public_key_pem text,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_verified boolean NOT NULL DEFAULT false,
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz,
    
    -- Soft delete
    deleted_at timestamptz,
    
    CONSTRAINT principals_email_format CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),
    
    -- AGEI IDENTITY CONSTRAINT:
    -- At least one identity anchor must exist
    CONSTRAINT principals_identity_required CHECK (
        auth_user_id IS NOT NULL
        OR external_id IS NOT NULL
        OR public_key_fingerprint IS NOT NULL
    )
);

-- AGEI AUTH PATTERN: Index and unique constraint on auth_user_id
CREATE INDEX idx_principals_auth_user_id ON principals(auth_user_id)
    WHERE auth_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX idx_principals_auth_user_id_unique ON principals(auth_user_id)
    WHERE auth_user_id IS NOT NULL AND deleted_at IS NULL AND principal_type = 'user';

-- Flexible external_id remains for non-auth identifiers
CREATE UNIQUE INDEX idx_principals_external_id ON principals(external_id) 
    WHERE external_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX idx_principals_email ON principals(email) 
    WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_principals_type ON principals(principal_type);
CREATE INDEX idx_principals_onboarding_group ON principals(onboarding_group);
CREATE INDEX idx_principals_fingerprint ON principals(public_key_fingerprint) 
    WHERE public_key_fingerprint IS NOT NULL;
CREATE INDEX idx_principals_active ON principals(is_active) WHERE is_active = true;

-- Grant Data API access
GRANT SELECT ON principals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON principals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON principals TO service_role;

COMMENT ON TABLE principals IS 'AGEI identity records for users, services, systems, agents. Use auth_user_id for Supabase auth, external_id for other identifiers.';
COMMENT ON COLUMN principals.auth_user_id IS 'Supabase auth.users.id for authenticated human users. Use this for auth.uid() queries, NOT external_id::uuid.';
COMMENT ON COLUMN principals.external_id IS 'Flexible text identifier for non-auth identities: pending-*, session_*, agent_*, service_*, provider IDs. May contain non-UUID values.';
COMMENT ON COLUMN principals.principal_type IS 'Type: user (human), service (application), system (internal), api_key (programmatic), agent (autonomous)';
COMMENT ON COLUMN principals.onboarding_group IS 'AGEI onboarding classification: anyone (public self-service), managed (tenant/admin created), service, system';
COMMENT ON COLUMN principals.public_key_fingerprint IS 'SHA256 fingerprint of public key for cryptographic verification';

-- ============================================================================
-- TABLE: organization_members
-- ============================================================================
-- Purpose: User access and roles within organizations
-- Evidence: Authorization context for actions
--
-- AGEI PUBLIC USER PATTERN:
--   - Public signup users get role 'public_user'
--   - Auto-assigned to No Organization / Personal Sandbox
--   - Permissions: use_examples, create_demo_receipts, view_own_receipts
-- ============================================================================

CREATE TABLE organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    principal_id uuid NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
    
    -- Role and permissions
    -- AGEI: 'public_user' role for No Organization members
    role text NOT NULL DEFAULT 'member' CHECK (
        role IN ('owner', 'admin', 'policy_author', 'auditor', 'operator', 'member', 'viewer', 'public_user')
    ),
    permissions jsonb DEFAULT '[]'::jsonb,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    invited_at timestamptz,
    joined_at timestamptz NOT NULL DEFAULT now(),
    invited_by uuid REFERENCES principals(id),
    
    -- Metadata
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Soft delete
    deleted_at timestamptz
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_principal ON organization_members(principal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_active ON organization_members(organization_id, is_active) 
    WHERE is_active = true AND deleted_at IS NULL;

-- Partial unique index for soft-delete uniqueness
CREATE UNIQUE INDEX organization_members_unique_active 
    ON organization_members(organization_id, principal_id) 
    WHERE deleted_at IS NULL;

-- Grant Data API access
GRANT SELECT ON organization_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO service_role;

COMMENT ON TABLE organization_members IS 'AGEI user membership and roles within organizations';
COMMENT ON COLUMN organization_members.role IS 'Built-in roles: owner, admin, policy_author, auditor, operator, member, viewer, public_user (for No Organization)';
COMMENT ON COLUMN organization_members.permissions IS 'Additional granular permissions beyond role. For public_user: ["use_examples","create_demo_receipts","view_own_receipts"]';

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at timestamp on row modification. Used by all AGEI tables with updated_at columns.';

-- Apply to identity tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_principals_updated_at BEFORE UPDATE ON principals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AGEI IDENTITY & TENANCY COMPLETE
-- ============================================================================
-- Every AGEI user has:
--   1. A principal record (with auth_user_id if Supabase Auth user)
--   2. At least one organization membership (No Organization if public user)
--   3. A role defining permissions (public_user, member, admin, owner, etc.)
--
-- No orphan evidence: All governance events have organization context.
-- No UUID casting: Use auth_user_id for auth.uid() queries.
-- No NULL tenants: Even public users belong to No Organization.
-- ============================================================================
