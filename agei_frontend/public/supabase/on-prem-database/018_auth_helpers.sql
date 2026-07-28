-- ============================================================================
-- AGEI Canonical Migration 018: Auth Helpers
-- ============================================================================
-- Purpose:
--   Clean, consolidated authentication and authorization helper functions
--   for AGEI RLS policies and application queries.
--
-- Key Principle:
--   ALWAYS use principals.auth_user_id = auth.uid()
--   NEVER use principals.external_id::uuid
--
-- Why external_id cannot be cast to UUID:
--   - Contains "pending-{uuid}" for pending principals
--   - Contains "session_{id}" for agent sessions
--   - Contains service IDs, agent IDs, provider IDs
--   - Contains other non-UUID external identifiers
--
-- Functions:
--   agei_no_organization_id() - Well-known No Organization UUID
--   current_principal_id() - Current user's principal
--   current_organization_id() - Active organization context
--   current_organization_ids() - All user's organizations
--   is_organization_member() - Check membership
--   has_role() - Check specific role
--   has_any_role() - Check any of multiple roles
--   is_organization_owner() - Check owner role
--   get_user_org_role() - Get user's role
--   set_organization_context() - Set active organization
--
-- Depends on:
--   001_identity_and_tenancy.sql (organizations, principals, organization_members)
--
-- Used by:
--   019_rls_policies.sql - All RLS policies
--   Application queries - Organization context
-- ============================================================================

-- ============================================================================
-- WELL-KNOWN CONSTANT: No Organization UUID
-- ============================================================================
-- Note: This function is already defined in 001_identity_and_tenancy.sql
-- We verify it exists here for documentation purposes
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'agei_no_organization_id'
  ) THEN
    RAISE EXCEPTION 'agei_no_organization_id() function not found. Ensure migration 001 has been applied.';
  END IF;
END $$;

COMMENT ON FUNCTION agei_no_organization_id()
IS 'AGEI constant: UUID 00000000-0000-0000-0000-000000000001 for "No Organization / Personal Sandbox"';

-- ============================================================================
-- FUNCTION: current_principal_id
-- ============================================================================
-- Returns the principal ID for the current authenticated Supabase auth user
--
-- AGEI PATTERN:
--   Uses principals.auth_user_id = auth.uid()
--   NOT external_id::uuid (unsafe for non-UUID values)
-- ============================================================================

CREATE OR REPLACE FUNCTION current_principal_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM principals
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

COMMENT ON FUNCTION current_principal_id()
IS 'Current AGEI principal ID for authenticated user. Uses principals.auth_user_id = auth.uid() pattern (NOT external_id::uuid).';

GRANT EXECUTE ON FUNCTION current_principal_id() TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: current_organization_id
-- ============================================================================
-- Returns the active organization context for the current user
--
-- Logic:
--   1. Check app.current_organization_id session variable (UI-selected org)
--   2. If set and user is member, use that organization
--   3. Otherwise, return first active membership (prefer real orgs over No Organization)
--   4. Never returns NULL - always falls back to No Organization
--
-- AGEI PATTERN:
--   - Every query has organization context
--   - Public users → No Organization (00000000-0000-0000-0000-000000000001)
--   - Real users → Selected org or first real org
--   - No orphan data - all evidence has tenant boundary
-- ============================================================================

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested_org text;
  v_requested_org_id uuid;
  v_principal_id uuid;
BEGIN
  v_principal_id := current_principal_id();

  IF v_principal_id IS NULL THEN
    -- Not authenticated - return No Organization
    RETURN agei_no_organization_id();
  END IF;

  -- Check if UI has set a preferred organization context
  v_requested_org := NULLIF(current_setting('app.current_organization_id', true), '');

  IF v_requested_org IS NOT NULL
     AND v_requested_org ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  THEN
    v_requested_org_id := v_requested_org::uuid;

    -- Verify user is actually a member of the requested organization
    IF EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.principal_id = v_principal_id
        AND om.organization_id = v_requested_org_id
        AND om.is_active = true
        AND om.deleted_at IS NULL
    ) THEN
      RETURN v_requested_org_id;
    END IF;
  END IF;

  -- No valid session context - return first active membership
  -- Prefer real organizations over No Organization sandbox
  -- Always fall back to No Organization if user has no memberships
  RETURN COALESCE(
    (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.principal_id = v_principal_id
        AND om.is_active = true
        AND om.deleted_at IS NULL
      ORDER BY
        CASE WHEN om.organization_id = agei_no_organization_id() THEN 1 ELSE 0 END,
        om.joined_at ASC
      LIMIT 1
    ),
    agei_no_organization_id()
  );
END;
$$;

COMMENT ON FUNCTION current_organization_id()
IS 'Current AGEI organization context. Uses app.current_organization_id session variable if set and valid; otherwise first active membership, preferring real organizations over No Organization. Never returns NULL.';

GRANT EXECUTE ON FUNCTION current_organization_id() TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: current_organization_ids
-- ============================================================================
-- Returns all organization IDs the current user is a member of
-- ============================================================================

CREATE OR REPLACE FUNCTION current_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.principal_id = current_principal_id()
    AND om.is_active = true
    AND om.deleted_at IS NULL;
$$;

COMMENT ON FUNCTION current_organization_ids()
IS 'All organization IDs the current AGEI principal has active membership in.';

GRANT EXECUTE ON FUNCTION current_organization_ids() TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: is_organization_member
-- ============================================================================
-- Checks if current user is a member of the specified organization
-- ============================================================================

CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.principal_id = current_principal_id()
      AND om.is_active = true
      AND om.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION is_organization_member(uuid)
IS 'Check if current AGEI principal is an active member of the specified organization.';

GRANT EXECUTE ON FUNCTION is_organization_member(uuid) TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: has_role
-- ============================================================================
-- Checks if current user has a specific role in the specified organization
-- ============================================================================

CREATE OR REPLACE FUNCTION has_role(org_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.principal_id = current_principal_id()
      AND om.role = required_role
      AND om.is_active = true
      AND om.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION has_role(uuid, text)
IS 'Check if current AGEI principal has a specific role in the specified organization.';

GRANT EXECUTE ON FUNCTION has_role(uuid, text) TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: has_any_role
-- ============================================================================
-- Checks if current user has any of the specified roles in the organization
-- ============================================================================

CREATE OR REPLACE FUNCTION has_any_role(org_id uuid, required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.principal_id = current_principal_id()
      AND om.role = ANY(required_roles)
      AND om.is_active = true
      AND om.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION has_any_role(uuid, text[])
IS 'Check if current AGEI principal has any of the specified roles in the organization.';

GRANT EXECUTE ON FUNCTION has_any_role(uuid, text[]) TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: is_organization_owner
-- ============================================================================
-- Checks if current user is an owner of the specified organization
-- ============================================================================

CREATE OR REPLACE FUNCTION is_organization_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(org_id, 'owner');
$$;

COMMENT ON FUNCTION is_organization_owner(uuid)
IS 'Check if current AGEI principal is an owner of the specified organization.';

GRANT EXECUTE ON FUNCTION is_organization_owner(uuid) TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: get_user_org_role
-- ============================================================================
-- Returns the current user's role in the specified organization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_org_role(org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.role
  FROM organization_members om
  WHERE om.organization_id = org_id
    AND om.principal_id = current_principal_id()
    AND om.is_active = true
    AND om.deleted_at IS NULL
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_user_org_role(uuid)
IS 'Get current AGEI principal role in the specified organization (owner, admin, member, viewer, public_user, etc.).';

GRANT EXECUTE ON FUNCTION get_user_org_role(uuid) TO authenticated, service_role;

-- ============================================================================
-- FUNCTION: set_organization_context
-- ============================================================================
-- Sets the active organization context for the current session
--
-- Usage:
--   SELECT set_organization_context('<org_uuid>');
--
-- Validates:
--   - User is authenticated
--   - User is a member of the requested organization
--
-- Sets:
--   app.current_organization_id session variable
--   (used by current_organization_id() function)
--
-- Called by:
--   UI organization selector dropdown
--   Application organization switching logic
-- ============================================================================

CREATE OR REPLACE FUNCTION set_organization_context(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has access to this organization
  IF NOT is_organization_member(org_id) THEN
    RAISE EXCEPTION 'User is not a member of organization %', org_id;
  END IF;

  -- Set session variable for RLS context
  PERFORM set_config('app.current_organization_id', org_id::text, false);
END;
$$;

COMMENT ON FUNCTION set_organization_context(uuid)
IS 'Sets the current organization context for RLS policies and current_organization_id(). Validates membership first. Called by UI organization selector.';

GRANT EXECUTE ON FUNCTION set_organization_context(uuid) TO authenticated, service_role;

-- ============================================================================
-- AGEI AUTH HELPERS COMPLETE
-- ============================================================================
-- All RLS policies and application queries should use these helpers:
--
-- Authentication:
--   current_principal_id() - Who is the current user?
--
-- Organization Context:
--   current_organization_id() - What organization am I working in?
--   set_organization_context() - Switch to a different organization
--
-- Authorization:
--   is_organization_member() - Can I access this organization's data?
--   has_role() - Do I have this specific role?
--   has_any_role() - Do I have any of these roles?
--
-- IMPORTANT:
--   These functions use principals.auth_user_id = auth.uid()
--   They DO NOT use external_id::uuid (unsafe for non-UUID values)
-- ============================================================================
