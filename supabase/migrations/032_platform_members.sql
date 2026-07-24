-- ============================================================================
-- AGEI Migration 032: Platform Members
-- ============================================================================
-- Purpose:
--   Separate platform-level roles from organization-scoped roles.
--   Platform owners/admins manage the AGEI platform infrastructure.
--   Organization owners/admins manage specific customer/tenant organizations.
--
-- Design Principle:
--   Platform access does NOT automatically grant organization access.
--   Founders and AGEI operators need platform access, not auto-admin in every customer org.
--
-- Platform Roles:
--   platform_owner - Full platform administration (founders)
--   platform_admin - Platform administration (core team)
--   platform_operator - Platform operations, monitoring
--   platform_support - Customer support, read-only access with audit trail
--
-- Dependencies:
--   001_identity_and_tenancy.sql (principals table)
--
-- Changes:
--   - CREATE TABLE platform_members (additive, no schema changes to existing tables)
--   - CREATE INDEX for lookups
--   - GRANT permissions
-- ============================================================================

-- ============================================================================
-- TABLE: platform_members
-- ============================================================================
-- Tracks which principals have platform-level administrative access
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES principals(id) ON DELETE CASCADE,
  
  -- Platform role
  platform_role text NOT NULL CHECK (
    platform_role IN (
      'platform_owner',
      'platform_admin',
      'platform_operator',
      'platform_support'
    )
  ),
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  
  -- Metadata and scope
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Grant tracking
  granted_by uuid REFERENCES principals(id),
  granted_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- Revocation
  revoked_at timestamptz,
  revoked_by uuid REFERENCES principals(id),
  revocation_reason text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (principal_id, platform_role)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_platform_members_principal ON platform_members(principal_id) WHERE is_active = true;
CREATE INDEX idx_platform_members_role ON platform_members(platform_role) WHERE is_active = true;
CREATE INDEX idx_platform_members_granted ON platform_members(granted_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE platform_members IS 'Platform-level administrative roles, separate from organization-scoped roles';
COMMENT ON COLUMN platform_members.platform_role IS 'Platform role: platform_owner, platform_admin, platform_operator, platform_support';
COMMENT ON COLUMN platform_members.metadata IS 'Additional context: support_access_scope, audit_trail, temporary_grant, etc.';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE platform_members ENABLE ROW LEVEL SECURITY;

-- Platform members can view their own platform membership
CREATE POLICY platform_members_select_own ON platform_members
  FOR SELECT
  USING (principal_id = current_principal_id());

-- Platform owners can view all platform memberships
CREATE POLICY platform_members_select_platform_owner ON platform_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_members pm
      WHERE pm.principal_id = current_principal_id()
        AND pm.platform_role = 'platform_owner'
        AND pm.is_active = true
    )
  );

-- Platform owners can insert new platform members
CREATE POLICY platform_members_insert_platform_owner ON platform_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_members pm
      WHERE pm.principal_id = current_principal_id()
        AND pm.platform_role = 'platform_owner'
        AND pm.is_active = true
    )
  );

-- Platform owners can update platform memberships
CREATE POLICY platform_members_update_platform_owner ON platform_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_members pm
      WHERE pm.principal_id = current_principal_id()
        AND pm.platform_role = 'platform_owner'
        AND pm.is_active = true
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON platform_members TO authenticated;
GRANT SELECT ON platform_members TO service_role;

-- ============================================================================
-- HELPER FUNCTION: current_platform_role
-- ============================================================================
-- Returns the current principal's platform role, if any
-- ============================================================================

CREATE OR REPLACE FUNCTION current_platform_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT platform_role
  FROM platform_members
  WHERE principal_id = current_principal_id()
    AND is_active = true
    AND revoked_at IS NULL
  ORDER BY 
    CASE platform_role
      WHEN 'platform_owner' THEN 1
      WHEN 'platform_admin' THEN 2
      WHEN 'platform_operator' THEN 3
      WHEN 'platform_support' THEN 4
    END
  LIMIT 1;
$$;

COMMENT ON FUNCTION current_platform_role() 
IS 'Returns current principal platform role (platform_owner, platform_admin, platform_operator, platform_support) if active, NULL otherwise';

GRANT EXECUTE ON FUNCTION current_platform_role() TO authenticated, service_role;

-- ============================================================================
-- HELPER FUNCTION: has_platform_role
-- ============================================================================
-- Checks if current principal has a specific platform role
-- ============================================================================

CREATE OR REPLACE FUNCTION has_platform_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_members
    WHERE principal_id = current_principal_id()
      AND platform_role = required_role
      AND is_active = true
      AND revoked_at IS NULL
  );
$$;

COMMENT ON FUNCTION has_platform_role(text)
IS 'Checks if current principal has the specified active platform role';

GRANT EXECUTE ON FUNCTION has_platform_role(text) TO authenticated, service_role;

-- ============================================================================
-- HELPER FUNCTION: is_platform_owner
-- ============================================================================
-- Checks if current principal is a platform owner
-- ============================================================================

CREATE OR REPLACE FUNCTION is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_platform_role('platform_owner');
$$;

COMMENT ON FUNCTION is_platform_owner()
IS 'Returns true if current principal is an active platform owner';

GRANT EXECUTE ON FUNCTION is_platform_owner() TO authenticated, service_role;
