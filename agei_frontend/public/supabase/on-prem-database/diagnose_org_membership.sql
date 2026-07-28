-- ============================================================================
-- Diagnose Organization Membership Issues
-- ============================================================================
-- Run these queries to understand current state of users and organizations
-- ============================================================================

-- 1. Show all organizations
SELECT 
  id,
  name,
  slug,
  created_at,
  deleted_at
FROM organizations
ORDER BY created_at;

-- 2. Show all principals with their auth users
SELECT 
  p.id as principal_id,
  p.email,
  p.display_name,
  p.principal_type,
  p.is_active,
  p.created_at,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM principals p
LEFT JOIN auth.users u ON u.id = p.auth_user_id
ORDER BY p.created_at DESC;

-- 3. Show organization memberships
SELECT 
  p.email,
  p.display_name,
  o.name as organization,
  om.role,
  om.is_active as member_active,
  om.joined_at
FROM organization_members om
JOIN principals p ON p.id = om.principal_id
JOIN organizations o ON o.id = om.organization_id
WHERE om.deleted_at IS NULL
ORDER BY p.email, o.name;

-- 4. Show founder@cognitiveinsight.ai specifically
SELECT 
  'Principal' as type,
  p.id::text as id,
  p.email,
  p.display_name,
  p.principal_type,
  p.is_active::text as active
FROM principals p
WHERE p.email LIKE '%founder%' OR p.email LIKE '%cognitive%'
UNION ALL
SELECT 
  'Organization' as type,
  o.id::text as id,
  o.name as email,
  o.slug as display_name,
  'org' as principal_type,
  (o.deleted_at IS NULL)::text as active
FROM organizations o
WHERE o.name LIKE '%Cognitive%' OR o.slug LIKE '%cognitive%';

-- 5. Show what organization founder would get by default
WITH founder_principal AS (
  SELECT id FROM principals 
  WHERE email = 'founder@cognitiveinsight.ai'
  LIMIT 1
)
SELECT 
  om.organization_id,
  o.name as organization_name,
  o.slug,
  om.role,
  om.is_active,
  om.joined_at,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY om.joined_at, om.created_at) = 1 
    THEN '← DEFAULT (first org)' 
    ELSE '' 
  END as default_indicator
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN founder_principal fp ON fp.id = om.principal_id
WHERE om.deleted_at IS NULL
ORDER BY om.joined_at, om.created_at;

-- 6. Check if UUID 00000000-0000-0000-0000-000000000001 (No Organization) exists
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid 
    THEN '← No Organization / Personal Sandbox' 
    ELSE '' 
  END as note
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 7. Show recent API clients created (to see which org they're using)
SELECT 
  ac.id,
  ac.client_name,
  o.name as organization,
  ac.organization_id,
  ac.environment,
  ac.created_at,
  CASE 
    WHEN ac.organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
    THEN '⚠️ Using No Organization sandbox' 
    ELSE '✓ Using real organization' 
  END as status
FROM api_clients ac
JOIN organizations o ON o.id = ac.organization_id
WHERE ac.deleted_at IS NULL
ORDER BY ac.created_at DESC
LIMIT 10;
