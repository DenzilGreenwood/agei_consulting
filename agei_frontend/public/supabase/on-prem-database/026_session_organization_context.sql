-- ============================================================================
-- AGEI Layer: Session Organization Context
-- ============================================================================
-- Purpose: Allow UI to set app.current_organization_id session variable
-- for RLS policy context
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
IS 'Sets the current organization context for RLS policies. Validates membership first.';

GRANT EXECUTE ON FUNCTION set_organization_context(uuid) TO authenticated;

-- ============================================================================
-- End session context function
-- ============================================================================
