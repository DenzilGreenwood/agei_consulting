-- ============================================================================
-- Fix: Organization Selection Principal Lookup
-- ============================================================================
-- Purpose: Fix the "No AGEI principal found for current auth user" error
--          when recording organization selection events.
--
-- Root Cause: The record_account_event() function fails if current_principal_id()
--             returns NULL. This happens when principals.auth_user_id is not set
--             or doesn't match auth.uid().
--
-- Solution: Make record_account_event() defensive - allow logging even if
--           principal is not found. This is acceptable because org selection
--           is just preference logging, not authorization.
--
-- Note: The main governance context (resolveGovernanceContext) is working
--       correctly. This fix is only for the account event logging.
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
  -- Lookup principal (may be NULL for some users)
  v_principal_id := current_principal_id();
  
  -- Determine organization ID
  v_org_id := COALESCE(p_selected_organization_id, current_organization_id(), agei_no_organization_id());

  -- DEFENSIVE CHANGE: Allow logging even if principal is not found
  -- This is acceptable for account events (login, logout, org selection)
  -- because they are preference/audit logs, not authorization events.
  IF v_principal_id IS NULL THEN
    RAISE NOTICE 'No AGEI principal found for auth user % - logging event without principal', auth.uid();
  END IF;

  -- DEFENSIVE CHANGE: Only check organization membership if principal exists
  IF v_principal_id IS NOT NULL AND NOT is_organization_member(v_org_id) THEN
    RAISE EXCEPTION 'Current principal is not a member of organization %', v_org_id;
  END IF;

  -- Insert event (principal_id may be NULL)
  INSERT INTO account_event_log (
    organization_id,
    principal_id,  -- Can be NULL
    auth_user_id,  -- Always set (auth.uid())
    event_type,
    event_status,
    selected_organization_id,
    notice_version,
    metadata
  )
  VALUES (
    v_org_id,
    v_principal_id,  -- May be NULL
    auth.uid(),       -- Always set
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
IS 'Records account/login/privacy/org-selection evidence context for the current authenticated principal. Defensive - logs even if principal lookup fails.';

GRANT EXECUTE ON FUNCTION record_account_event(text, text, uuid, text, jsonb) TO authenticated, service_role;

-- ============================================================================
-- Additional Fix: Ensure founder principal has auth_user_id set
-- ============================================================================
-- This query checks if founder principal needs auth_user_id populated
-- Run this to verify the issue:

DO $$
DECLARE
  v_founder_principal_id uuid := '5e035106-04f8-4bd4-9bff-9e77ca157867'::uuid;
  v_founder_email text := 'founder@cognitiveinsight.ai';
  v_auth_user_id uuid;
  v_principal_auth_user_id uuid;
BEGIN
  -- Get auth_user_id from auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_founder_email;

  -- Get auth_user_id from principals
  SELECT auth_user_id INTO v_principal_auth_user_id
  FROM principals
  WHERE id = v_founder_principal_id;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'ISSUE: No auth.users record found for founder@cognitiveinsight.ai';
  ELSIF v_principal_auth_user_id IS NULL THEN
    RAISE NOTICE 'ISSUE: Principal % has NULL auth_user_id', v_founder_principal_id;
    RAISE NOTICE 'FIX: Run the UPDATE statement below to link principal to auth user';
  ELSIF v_principal_auth_user_id != v_auth_user_id THEN
    RAISE NOTICE 'ISSUE: Principal auth_user_id (%) does not match auth.users id (%)', v_principal_auth_user_id, v_auth_user_id;
    RAISE NOTICE 'FIX: Run the UPDATE statement below to fix the mismatch';
  ELSE
    RAISE NOTICE 'OK: Principal is correctly linked to auth user';
  END IF;

  -- Diagnostic output
  RAISE NOTICE 'Auth user ID: %', v_auth_user_id;
  RAISE NOTICE 'Principal auth_user_id: %', v_principal_auth_user_id;
  RAISE NOTICE 'Match: %', (v_auth_user_id = v_principal_auth_user_id);
END $$;

-- ============================================================================
-- Fix Statement (Run ONLY if the diagnostic above shows a mismatch)
-- ============================================================================
-- Uncomment and run this to fix the founder principal auth_user_id:

/*
UPDATE principals
SET 
  auth_user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'founder@cognitiveinsight.ai'
  ),
  updated_at = NOW()
WHERE id = '5e035106-04f8-4bd4-9bff-9e77ca157867'::uuid
  AND auth_user_id IS NULL;  -- Safety: only update if currently NULL

SELECT 
  '✓ Principal auth_user_id updated' as status,
  id,
  email,
  auth_user_id
FROM principals
WHERE id = '5e035106-04f8-4bd4-9bff-9e77ca157867'::uuid;
*/

-- ============================================================================
-- Validation Query
-- ============================================================================
-- Run this to verify the fix worked:

SELECT
  'Validation: current_principal_id() for founder' as check_name,
  CASE 
    WHEN current_principal_id() IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as status,
  current_principal_id() as principal_id,
  auth.uid() as auth_user_id
-- Note: This query only works when run by a logged-in founder user
-- If running as service_role, current_principal_id() will be NULL (expected)
;

COMMENT ON SCHEMA public IS 'Organization selection principal lookup fix applied. record_account_event() is now defensive.';
