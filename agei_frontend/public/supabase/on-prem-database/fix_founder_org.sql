-- ============================================================================
-- Fix Founder Organization Membership
-- ============================================================================
-- Purpose: Ensure founder@cognitiveinsight.ai is properly assigned to
--          the CognitiveInsight organization instead of No Organization
-- 
-- This script:
-- 1. Finds or creates the CognitiveInsight organization (by slug)
-- 2. Finds the founder principal by email
-- 3. Adds/updates organization membership for founder with owner role
-- ============================================================================

-- First, check what we have
DO $$
DECLARE
  v_founder_email text := 'founder@cognitiveinsight.ai';
  v_org_id uuid;
  v_principal_id uuid;
  v_principal_exists boolean;
  v_membership_exists boolean;
BEGIN
  -- Find organization by slug (it may already exist with different ID)
  SELECT id INTO v_org_id
  FROM organizations 
  WHERE slug = 'cognitiveinsight' 
    AND deleted_at IS NULL;
  
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Creating CognitiveInsight organization...';
    INSERT INTO organizations (
      name,
      slug,
      created_at,
      updated_at
    ) VALUES (
      'CognitiveInsight',
      'cognitiveinsight',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Organization created: % (%)', 'CognitiveInsight', v_org_id;
  ELSE
    RAISE NOTICE 'Organization already exists: % (slug: cognitiveinsight)', v_org_id;
  END IF;
  
  -- Check if principal exists
  SELECT id INTO v_principal_id
  FROM principals 
  WHERE email = v_founder_email 
    AND deleted_at IS NULL
  LIMIT 1;
  
  IF v_principal_id IS NULL THEN
    RAISE WARNING 'Founder principal not found! You need to sign up with founder@cognitiveinsight.ai first';
    RAISE WARNING 'Expected email: %', v_founder_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found founder principal: %', v_principal_id;
  
  -- Check if membership exists
  SELECT EXISTS(
    SELECT 1 FROM organization_members 
    WHERE principal_id = v_principal_id 
      AND organization_id = v_org_id
      AND deleted_at IS NULL
  ) INTO v_membership_exists;
  
  IF v_membership_exists THEN
    RAISE NOTICE 'Founder already has membership in CognitiveInsight org';
    
    -- Update to ensure they have owner role
    UPDATE organization_members
    SET role = 'owner',
        is_active = true,
        updated_at = NOW()
    WHERE principal_id = v_principal_id
      AND organization_id = v_org_id
      AND deleted_at IS NULL;
    
    RAISE NOTICE 'Updated founder role to owner';
  ELSE
    RAISE NOTICE 'Creating organization membership for founder...';
    
    INSERT INTO organization_members (
      organization_id,
      principal_id,
      role,
      is_active,
      joined_at,
      created_at,
      updated_at
    ) VALUES (
      v_org_id,
      v_principal_id,
      'owner',
      true,
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Founder membership created with owner role';
  END IF;
END $$;

-- Verify the result
SELECT 
  p.id as principal_id,
  p.email,
  p.display_name,
  o.id as org_id,
  o.name as org_name,
  om.role,
  om.is_active
FROM principals p
LEFT JOIN organization_members om ON om.principal_id = p.id AND om.deleted_at IS NULL
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'founder@cognitiveinsight.ai'
ORDER BY o.name;
