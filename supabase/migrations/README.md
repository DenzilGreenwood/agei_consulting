# AGEI Canonical Migrations

**Created:** May 17, 2026  
**Purpose:** Clean, consolidated migration chain for new deployments

---

## Overview

This folder contains the **canonical AGEI migration chain** - a consolidated, cleaned-up version of the schema designed for new deployments.

**Do NOT apply these to the existing development database!**

---

## Two Migration Paths

### Path 1: Patch Path (Existing Database)
**Location:** `supabase/migrations/` (parent folder)  
**Files:** 000-031 (excluding 030 duplicate)  
**Status:** ✅ Applied to development database  
**Use for:** Current active development

The patch path includes repair migrations (023, 024, 026, 027, 028, 029) that fix earlier schemas. While functional, it contains iterative development history.

### Path 2: Canonical Path (New Deployments)  
**Location:** `supabase/migrations/canonical/` (this folder)  
**Files:** 000-028  
**Status:** ✨ Clean consolidated schema  
**Use for:** New production deployments, clean installs

The canonical path consolidates all repairs into their base migrations, resulting in a cleaner, more maintainable schema.

---

## Key Differences

### Identity Pattern
**Patch Path:**
- Migration 001 creates principals without `auth_user_id`
- Migration 027 adds `auth_user_id` column later
- Uses `external_id` initially, fixes with auth_user_id later

**Canonical Path:**
- Migration 001 includes `auth_user_id` from start
- No repair migrations needed
- Clean pattern from beginning

### Auth Helpers
**Patch Path:**
- Migration 017 creates helpers with `external_id::uuid` (UNSAFE)
- Migration 023 fixes to use `auth.uid()::text`
- Migration 029 fixes again to use `auth_user_id`

**Canonical Path:**
- Migration 018 creates clean helpers using `auth_user_id` from start
- No unsafe casting
- No repair migrations

### Privacy & Encryption
**Patch Path:**
- Migration 025 creates incomplete schema
- Migration 026 adds missing envelope encryption columns
- Migration 028 fixes views to use `auth_user_id`

**Canonical Path:**
- Migration 025 creates complete schema from start
- Includes envelope encryption columns
- Uses `auth_user_id` from beginning

### Evidence Capsules
**Patch Path:**
- Migration 031 adds LCM layer as extension

**Canonical Path:**
- Migration 008 introduces evidence capsules early in chain
- Proper dependency order

---

## Migration Manifest

### Foundation (000-007)
```
000_extensions_and_enums.sql
001_identity_and_tenancy.sql (✨ includes auth_user_id, No Organization)
002_schema_registry.sql
003_hash_canonicalization_functions.sql
004_signing_keys_and_evidence_signatures.sql
005_policy_governance.sql
006_gate_evaluation.sql
007_receipts_and_lineage.sql (✨ includes LCM fields)
```

### Evidence Layer (008-011)
```
008_evidence_capsules_and_lcm.sql (✨ NEW - Lazy Capsule Materialization)
009_evidence_objects_and_vault.sql (includes custody fields)
010_lifecycle_objects.sql
011_audit_packs_and_verification.sql (✨ includes optional signatures)
```

### Integration Layer (012-017)
```
012_api_service_access.sql
013_hitl_governance.sql
014_agentic_runtime.sql (✨ includes authority scopes)
015_downstream_provenance_watermarking.sql
016_shadow_ai_governance.sql
017_privacy_governance.sql (✨ uses auth_user_id from start)
```

### Auth & Policies (018-020)
```
018_auth_helpers.sql (✨ CONSOLIDATED - clean helpers, no unsafe casts)
019_rls_policies.sql (uses clean helpers)
020_views_and_reporting.sql (✨ includes proof chain view)
```

### Seeds & Onboarding (021-024)
```
021_seed_service_catalog.sql
022_seed_policy_gate_receipt_registries.sql (✨ NEW - from 031)
023_seed_example_policies_gates.sql
024_public_onboarding_and_account_log.sql (✨ CONSOLIDATED - auto-provision)
```

### Advanced Features (025-029)
```
025_evidence_preserving_crypto_erasure.sql (✨ complete envelope encryption)
026_session_organization_context.sql
027_merkle_batching_and_anchoring.sql (✨ NEW - from 031)
028_materialization_requests_and_incidents.sql (✨ NEW - from 031)
029_grant_data_api_access.sql (✨ CRITICAL - Supabase May 30, 2026 requirement)
```

**Total:** 30 migrations (000-029)

---

## Removed Migrations

These repair migrations from the patch path are folded into canonical migrations:

| Removed | Folded Into | Reason |
|---------|-------------|--------|
| 022_signup_rls_policies.sql | 024 | Consolidated signup |
| 023_fix_rls_helpers_use_auth_uid.sql | 018 | Clean from start |
| 024_fix_audit_pack_items_signatures_optional.sql | 011 | Fix at source |
| 026_fix_encryption_keys_schema.sql | 025 | Complete from start |
| 027_refactor_principals_auth_user_id.sql | 001 | Include from start |
| 028_fix_privacy_views_auth_user_id.sql | 017, 020 | Use from start |
| 029_public_onboarding_auth_cleanup.sql | 001, 018, 019, 024 | Distributed |
| 030_session_organization_context.sql | 026 | Duplicate |
| 031_agei_lcm_full_alignment.sql | 008, 022, 027, 028 | Distributed |

---

## Installation

### New Database (Canonical Path)
```bash
cd supabase/migrations/canonical
for file in *.sql; do psql $DATABASE_URL -f "$file"; done
```

or with Supabase CLI:
```bash
supabase db reset
supabase migration up --path migrations/canonical
```

### Existing Database (Patch Path)
**Do NOT run canonical migrations!**  
Your database already has migrations 000-031 applied.

---

## ⚠️ Supabase Data API Requirement (May 30, 2026)

**CRITICAL:** Starting May 30, 2026, Supabase requires explicit GRANT statements for all tables to be accessible via the Data API (PostgREST).

### Background
- **Effective:** May 30, 2026 for new projects
- **Enforced:** October 30, 2026 for all projects
- **Impact:** Without explicit GRANTs, PostgREST returns "42501 insufficient_privilege" errors

### Solution
**Migration 029** (`029_grant_data_api_access.sql`) grants appropriate access to all tables:

```sql
-- Pattern used for all tables:
GRANT SELECT ON table_name TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO service_role;
```

### Access Roles
- **anon**: Read-only access (public/unauthenticated)
- **authenticated**: Full CRUD for logged-in users (controlled by RLS)
- **service_role**: Administrative access (bypasses RLS)

**Note:** RLS policies still enforce row-level security. GRANTs enable table-level API access.

---

## Validation

After installing canonical migrations, run these checks:

```sql
-- Test 1: Auto-onboarding
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
SELECT * FROM principals WHERE email = 'test@example.com';
SELECT * FROM organization_members WHERE principal_id = (SELECT id FROM principals WHERE email = 'test@example.com');

-- Test 2: No external_id::uuid casts
-- Grep for this pattern - should find ZERO results:
grep -r "external_id::uuid" .

-- Test 3: Organization context
SELECT set_organization_context(agei_no_organization_id());
SELECT current_organization_id();
SELECT * FROM organization_selector_options WHERE auth_user_id = auth.uid();

-- Test 4: Evidence capsules
SELECT COUNT(*) FROM evidence_capsules;

-- Test 5: Registries
SELECT COUNT(*) FROM receipt_type_registry;
SELECT COUNT(*) FROM governance_lifecycle_stages;
SELECT COUNT(*) FROM decision_reason_codes;

-- Test 6: Proof chain
SELECT * FROM agei_receipt_proof_chain LIMIT 1;
```

---

## Key Architectural Principles

### 1. No external_id::uuid Casts
```sql
-- ❌ NEVER do this:
WHERE external_id::uuid = auth.uid()

-- ✅ ALWAYS do this:
WHERE auth_user_id = auth.uid()
```

### 2. No Organization Pattern
```sql
-- Every user belongs to at least one organization
-- Public users → "No Organization / Personal Sandbox"
-- UUID: 00000000-0000-0000-0000-000000000001

SELECT agei_no_organization_id(); -- returns the well-known UUID
```

### 3. Evidence Capsules (LCM)
```sql
-- Receipts capture lightweight governance proof
-- Heavy evidence materialized only when needed:
-- - Audit request
-- - Incident review
-- - Regulator request
-- - Dispute resolution
-- - Forensic verification
```

### 4. Auth Helpers
```sql
-- All helpers use auth.uid() and principals.auth_user_id
current_principal_id()      -- Current user's principal
current_organization_id()   -- Active organization context
is_organization_member()    -- Check membership
set_organization_context()  -- Set active org
```

---

## Development Guidelines

### Adding New Migrations
1. Continue numbering from 029
2. Follow naming convention: `{number}_{description}.sql`
3. Include clear comments explaining AGEI concepts
4. Use auth_user_id, never external_id::uuid
5. Ensure RLS policies use auth helpers
6. Add appropriate indexes
7. Test on clean database install

### Modifying Existing Migrations
**Don't!** These are canonical migrations for new deployments.

If you need to change the schema:
- Create a new migration in the patch path (parent folder)
- Plan to fold it into canonical during next consolidation

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Test canonical migrations on isolated database
- [ ] Verify all 29 migrations install without errors
- [ ] Run validation queries
- [ ] Test auto-onboarding flow
- [ ] Test organization selector
- [ ] Test RLS isolation
- [ ] Test evidence capsule materialization
- [ ] Test crypto-erasure
- [ ] Load performance test with sample data
- [ ] Backup plan ready

### Deployment Steps
1. Backup existing database
2. Create new production database
3. Apply canonical migrations 000-028
4. Load seed data
5. Test auth flow end-to-end
6. Migrate data from old schema if needed
7. Update application connection strings
8. Monitor for RLS policy issues

---

## Troubleshooting

### Migration Fails at 001
- Check: Does auth.users table exist? (Supabase creates it automatically)
- Check: Are PostgreSQL extensions available? (uuid-ossp, pgcrypto)

### Migration Fails at 018 (Auth Helpers)
- Check: Does principals.auth_user_id column exist from migration 001?
- Check: Is agei_no_organization_id() function defined in migration 001?

### Migration Fails at 024 (Onboarding)
- Check: Do all helper functions exist from migration 018?
- Check: Does account_event_log table get created?
- Check: Does trigger attach to auth.users successfully?

### RLS Policies Block Access
- Check: Is user authenticated? (auth.uid() returns value)
- Check: Does user have principal? (current_principal_id() returns value)
- Check: Does user have org membership? (current_organization_id() returns value)

---

## Support

For questions or issues with canonical migrations:
- See: `AGEI_MIGRATION_CONSOLIDATION_PLAN.md`
- See: `AGEI_MIGRATION_DEPENDENCY_MAP.md`
- See: `AGEI_CANONICAL_MIGRATION_MAP.md`

**Last Updated:** May 17, 2026
