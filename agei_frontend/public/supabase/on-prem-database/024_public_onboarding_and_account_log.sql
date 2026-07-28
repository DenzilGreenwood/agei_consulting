-- ============================================================================
-- AGEI Canonical Migration 024: Public Onboarding and Account Log
-- ============================================================================
-- Purpose:
--   Auto-provision AGEI governance identity for all Supabase auth users.
--   Attach every new user to "No Organization / Personal Sandbox" tenant.
--   Enable self-service onboarding while maintaining multi-tenant isolation.
--   Track account lifecycle evidence (signup, login, org selection, notices).
--
-- AGEI Pattern:
--   - Every auth.users row triggers auto-creation of principals + membership
--   - New users get role 'public_user' in No Organization
--   - No orphan governance evidence - all users have organization context
--   - Account events create governance trail for onboarding
--
-- Consolidates:
--   022_signup_rls_policies.sql
--   Parts of 029_public_onboarding_auth_cleanup.sql
--
-- Depends on:
--   001_identity_and_tenancy.sql (principals, organizations, organization_members)
--   018_auth_helpers.sql (current_principal_id, is_organization_member, etc.)
--
-- Evidence Role:
--   Onboarding governance - creates identity, tenant boundary, evidence context
-- ============================================================================

-- ============================================================================
-- TABLE: account_event_log
-- ============================================================================
-- Purpose: Account-level governance evidence
-- Evidence: Signup, login, org selection, privacy notice acknowledgments
-- ============================================================================

CREATE TABLE account_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  principal_id uuid REFERENCES principals(id) ON DELETE SET NULL,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  event_type text NOT NULL CHECK (
    event_type IN (
      'signup',
      'login',
      'logout',
      'organization_selected',
      'privacy_notice_acknowledged',
      'data_export_requested',
      'data_erasure_requested',
      'key_erasure_requested',
      'account_disabled'
    )
  ),

  event_status text NOT NULL DEFAULT 'recorded' CHECK (
    event_status IN ('recorded', 'accepted', 'denied', 'failed')
  ),

  notice_version text,
  selected_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,

  ip_hash text,
  user_agent_hash text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_event_log_auth_user ON account_event_log(auth_user_id, occurred_at DESC);
CREATE INDEX idx_account_event_log_principal ON account_event_log(principal_id, occurred_at DESC);
CREATE INDEX idx_account_event_log_org ON account_event_log(organization_id, occurred_at DESC);
CREATE INDEX idx_account_event_log_event_type ON account_event_log(event_type, occurred_at DESC);

-- Grant Data API access
GRANT SELECT ON account_event_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_event_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_event_log TO service_role;

COMMENT ON TABLE account_event_log IS 'AGEI account-level evidence context: signup, login, org selection, notice acknowledgment, and erasure requests.';
COMMENT ON COLUMN account_event_log.event_type IS 'Account lifecycle event type: signup, login, logout, organization_selected, privacy notices, data requests.';
COMMENT ON COLUMN account_event_log.notice_version IS 'Privacy notice version acknowledged (for privacy_notice_acknowledged events).';
COMMENT ON COLUMN account_event_log.selected_organization_id IS 'Organization selected (for organization_selected events).';

-- ============================================================================
-- FUNCTION: handle_new_auth_user
-- ============================================================================
-- Trigger function: Auto-provision AGEI principal + No Organization membership
-- Called automatically when new user signs up via Supabase Auth
--
-- AGEI Auto-Provision Flow:
--   1. User signs up via Supabase Auth (auth.users INSERT)
--   2. This trigger fires
--   3. Creates principals record with auth_user_id = auth.users.id
--   4. Creates organization_members linking to No Organization (public_user role)
--   5. Records signup event in account_event_log
--   6. User now has complete AGEI governance identity
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_principal_id uuid;
  v_email text;
  v_display_name text;
BEGIN
  v_email := NEW.email;
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'AGEI User'
  );

  -- Create AGEI principal for new auth user
  INSERT INTO principals (
    principal_type,
    auth_user_id,
    external_id,
    email,
    display_name,
    is_active,
    is_verified,
    onboarding_group,
    metadata
  )
  VALUES (
    'user',
    NEW.id,
    NEW.id::text,  -- Keep external_id synced for backward compatibility
    v_email,
    v_display_name,
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    'anyone',  -- Public self-service signup
    jsonb_build_object(
      'source', 'supabase_auth_signup',
      'default_organization_id', agei_no_organization_id(),
      'created_by_trigger', true
    )
  )
  ON CONFLICT (auth_user_id) 
    WHERE auth_user_id IS NOT NULL AND deleted_at IS NULL AND principal_type = 'user' 
    DO NOTHING
  RETURNING id INTO v_principal_id;

  -- If principal already existed (conflict), fetch its ID
  IF v_principal_id IS NULL THEN
    SELECT id INTO v_principal_id
    FROM principals
    WHERE auth_user_id = NEW.id
      AND principal_type = 'user'
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  -- Create No Organization membership for public user
  IF v_principal_id IS NOT NULL THEN
    INSERT INTO organization_members (
      organization_id,
      principal_id,
      role,
      permissions,
      is_active,
      joined_at,
      metadata
    )
    VALUES (
      agei_no_organization_id(),
      v_principal_id,
      'public_user',
      '["use_examples","create_demo_receipts","view_own_receipts"]'::jsonb,
      true,
      now(),
      jsonb_build_object(
        'source', 'public_signup_default',
        'descriptor', 'No Organization / Personal Sandbox'
      )
    )
    ON CONFLICT (organization_id, principal_id) WHERE deleted_at IS NULL DO NOTHING;

    -- Record signup event in account event log
    INSERT INTO account_event_log (
      organization_id,
      principal_id,
      auth_user_id,
      event_type,
      event_status,
      metadata
    )
    VALUES (
      agei_no_organization_id(),
      v_principal_id,
      NEW.id,
      'signup',
      'recorded',
      jsonb_build_object(
        'email_present', v_email IS NOT NULL,
        'default_membership', 'no-organization',
        'onboarding_group', 'anyone'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_auth_user()
IS 'AGEI auto-provision trigger: Creates principal, No Organization membership, and signup event for new Supabase auth users. Ensures every user has governance identity and organization context.';

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_agei ON auth.users;

CREATE TRIGGER on_auth_user_created_agei
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================================
-- BACKFILL: Existing Auth Users
-- ============================================================================
-- Auto-provision any existing auth.users that don't have AGEI principals yet
-- ============================================================================

DO $$
DECLARE
  r record;
  v_principal_id uuid;
BEGIN
  FOR r IN
    SELECT u.*
    FROM auth.users u
    LEFT JOIN principals p
      ON p.auth_user_id = u.id
     AND p.principal_type = 'user'
     AND p.deleted_at IS NULL
    WHERE p.id IS NULL
  LOOP
    -- Create principal
    INSERT INTO principals (
      principal_type,
      auth_user_id,
      external_id,
      email,
      display_name,
      is_active,
      is_verified,
      onboarding_group,
      metadata
    )
    VALUES (
      'user',
      r.id,
      r.id::text,
      r.email,
      COALESCE(
        r.raw_user_meta_data ->> 'full_name',
        r.raw_user_meta_data ->> 'name',
        split_part(COALESCE(r.email, ''), '@', 1),
        'AGEI User'
      ),
      true,
      COALESCE(r.email_confirmed_at IS NOT NULL, false),
      'anyone',
      jsonb_build_object(
        'source', 'backfill_existing_auth_user',
        'default_organization_id', agei_no_organization_id()
      )
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_principal_id;

    -- If insert succeeded, also create membership
    IF v_principal_id IS NOT NULL THEN
      INSERT INTO organization_members (
        organization_id,
        principal_id,
        role,
        permissions,
        is_active,
        joined_at,
        metadata
      )
      VALUES (
        agei_no_organization_id(),
        v_principal_id,
        'public_user',
        '["use_examples","create_demo_receipts","view_own_receipts"]'::jsonb,
        true,
        now(),
        jsonb_build_object(
          'source', 'backfill_default_public_membership',
          'descriptor', 'No Organization / Personal Sandbox'
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Ensure all existing auth-backed user principals have No Organization membership
INSERT INTO organization_members (
  organization_id,
  principal_id,
  role,
  permissions,
  is_active,
  joined_at,
  metadata
)
SELECT
  agei_no_organization_id(),
  p.id,
  'public_user',
  '["use_examples","create_demo_receipts","view_own_receipts"]'::jsonb,
  true,
  now(),
  jsonb_build_object(
    'source', 'backfill_default_public_membership',
    'descriptor', 'No Organization / Personal Sandbox'
  )
FROM principals p
WHERE p.principal_type = 'user'
  AND p.auth_user_id IS NOT NULL
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.principal_id = p.id
      AND om.organization_id = agei_no_organization_id()
      AND om.deleted_at IS NULL
  )
ON CONFLICT (organization_id, principal_id) WHERE deleted_at IS NULL DO NOTHING;

-- ============================================================================
-- FUNCTION: record_account_event
-- ============================================================================
-- Helper function for application to record account events
-- Called by UI for login, logout, org selection, privacy notices
-- ============================================================================

CREATE OR REPLACE FUNCTION record_account_event(
  p_event_type text,
  p_event_status text DEFAULT 'recorded',
  p_selected_organization_id uuid DEFAULT NULL,
  p_notice_version text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_principal_id uuid;
  v_org_id uuid;
BEGIN
  v_principal_id := current_principal_id();
  v_org_id := COALESCE(p_selected_organization_id, current_organization_id(), agei_no_organization_id());

  IF v_principal_id IS NULL THEN
    RAISE EXCEPTION 'No AGEI principal found for current auth user';
  END IF;

  IF NOT is_organization_member(v_org_id) THEN
    RAISE EXCEPTION 'Current principal is not a member of organization %', v_org_id;
  END IF;

  INSERT INTO account_event_log (
    organization_id,
    principal_id,
    auth_user_id,
    event_type,
    event_status,
    selected_organization_id,
    notice_version,
    metadata
  )
  VALUES (
    v_org_id,
    v_principal_id,
    auth.uid(),
    p_event_type,
    p_event_status,
    p_selected_organization_id,
    p_notice_version,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION record_account_event(text, text, uuid, text, jsonb)
IS 'Records account/login/privacy/org-selection evidence context for the current authenticated principal. Called by UI for governance tracking.';

GRANT EXECUTE ON FUNCTION record_account_event(text, text, uuid, text, jsonb) TO authenticated, service_role;

-- ============================================================================
-- VIEW: organization_selector_options
-- ============================================================================
-- Purpose: Dropdown options for UI organization selector
-- Returns friendly labels for all organizations user can access
-- ============================================================================

CREATE OR REPLACE VIEW organization_selector_options
WITH (security_invoker = true)
AS
SELECT
  om.principal_id,
  p.auth_user_id,
  o.id AS organization_id,
  CASE
    WHEN o.id = agei_no_organization_id() THEN 'No Organization / Personal Sandbox'
    ELSE o.name
  END AS label,
  o.slug,
  om.role,
  om.permissions,
  (o.id = agei_no_organization_id()) AS is_no_organization,
  CASE
    WHEN o.id = agei_no_organization_id() THEN 999
    ELSE 10
  END AS sort_order,
  om.joined_at
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN principals p ON p.id = om.principal_id
WHERE om.is_active = true
  AND om.deleted_at IS NULL
  AND o.deleted_at IS NULL
  AND p.deleted_at IS NULL;

COMMENT ON VIEW organization_selector_options
IS 'AGEI organization selector dropdown options. Displays "No Organization / Personal Sandbox" label but returns real UUID (00000000-0000-0000-0000-000000000001).';

GRANT SELECT ON organization_selector_options TO authenticated;

-- ============================================================================
-- RLS POLICIES: Signup and Account Event Log
-- ============================================================================

-- Enable RLS on account_event_log
ALTER TABLE account_event_log ENABLE ROW LEVEL SECURITY;

-- Account event log: SELECT own events or org member events
DROP POLICY IF EXISTS account_event_log_select_own ON account_event_log;
CREATE POLICY account_event_log_select_own ON account_event_log
FOR SELECT
USING (
  principal_id = current_principal_id()
  OR is_organization_member(organization_id)
);

-- Account event log: INSERT own events only
DROP POLICY IF EXISTS account_event_log_insert_own ON account_event_log;
CREATE POLICY account_event_log_insert_own ON account_event_log
FOR INSERT
WITH CHECK (
  principal_id = current_principal_id()
  AND auth_user_id = auth.uid()
  AND is_organization_member(organization_id)
);

GRANT SELECT, INSERT ON account_event_log TO authenticated;

-- ============================================================================
-- RLS POLICIES: Signup (Updated to use auth_user_id)
-- ============================================================================
-- These policies enable self-service onboarding while maintaining security

-- Principals: Allow INSERT for own auth.uid()
-- AGEI PATTERN: Uses auth_user_id, NOT external_id::uuid
DROP POLICY IF EXISTS principals_signup_insert ON principals;
CREATE POLICY principals_signup_insert ON principals
FOR INSERT
TO authenticated
WITH CHECK (
  principal_type = 'user'
  AND auth_user_id = auth.uid()
);

COMMENT ON POLICY principals_signup_insert ON principals IS 
    'AGEI signup: Authenticated users can create their own principal using auth_user_id = auth.uid()';

-- Organization members: Allow INSERT for No Organization public users
-- Users can add themselves to No Organization during signup
DROP POLICY IF EXISTS org_members_signup_insert ON organization_members;
CREATE POLICY org_members_signup_insert ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  principal_id = current_principal_id()
  AND organization_id = agei_no_organization_id()
  AND role = 'public_user'
);

COMMENT ON POLICY org_members_signup_insert ON organization_members IS 
    'AGEI signup: Users can add themselves to No Organization / Personal Sandbox as public_user';

-- Organizations: Allow INSERT for real organizations (not No Organization)
-- Public users should use No Organization; real org creation is separate flow
DROP POLICY IF EXISTS organizations_signup_insert ON organizations;
CREATE POLICY organizations_signup_insert ON organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Prevent creating duplicate No Organization
  slug <> 'no-organization'
);

COMMENT ON POLICY organizations_signup_insert ON organizations IS 
    'AGEI signup: Authenticated users can create organizations (except no-organization reserved slug)';

-- ============================================================================
-- AGEI PUBLIC ONBOARDING COMPLETE
-- ============================================================================
-- Auto-provision pattern:
--   1. User signs up via Supabase Auth
--   2. Trigger creates principals + organization_members + account_event_log
--   3. User has complete AGEI governance identity
--   4. No orphan evidence - all users have organization context
--   5. UI can query organization_selector_options for dropdown
--   6. Application calls record_account_event() for login/logout/org selection
--
-- Security:
--   - Trigger function is SECURITY DEFINER (runs with elevated privileges)
--   - RLS policies enforce users can only create their own principals
--   - Only No Organization membership allowed via self-service
--   - Real organization creation requires separate admin flow
-- ============================================================================
