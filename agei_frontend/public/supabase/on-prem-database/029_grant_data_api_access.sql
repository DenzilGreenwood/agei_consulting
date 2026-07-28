-- ============================================================================
-- AGEI Canonical Migration 029: Grant Data API Access to All Tables
-- ============================================================================
-- Purpose:
--   Supabase Data API requirement effective May 30, 2026:
--   All tables require explicit GRANT statements for Data API access.
--   This migration grants appropriate access to all existing tables.
--
-- Background:
--   Starting May 30, 2026, Supabase projects no longer expose tables in the
--   "public" schema to the Data API by default. Without explicit GRANTs,
--   PostgREST returns "42501" errors.
--
-- Access Patterns:
--   - anon: SELECT only (public read access)
--   - authenticated: SELECT, INSERT, UPDATE, DELETE (user operations)
--   - service_role: SELECT, INSERT, UPDATE, DELETE (admin/service access)
--
-- Depends on:
--   All previous migrations (000-028)
--
-- Evidence Role:
--   Enables Data API access for AGEI governance system
-- ============================================================================

-- ============================================================================
-- FOUNDATION & IDENTITY (migrations 003-007)
-- ============================================================================

-- Migration 004: Signing and Evidence Signatures
GRANT SELECT ON signing_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing_keys TO service_role;

GRANT SELECT ON evidence_signatures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_signatures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_signatures TO service_role;

-- Migration 005: Policy Governance
GRANT SELECT ON policy_sets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_sets TO service_role;

GRANT SELECT ON policy_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_versions TO service_role;

GRANT SELECT ON policy_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON policy_rules TO service_role;

-- Migration 006: Gate Evaluation
GRANT SELECT ON gate_definitions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_definitions TO service_role;

GRANT SELECT ON gate_evaluations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gate_evaluations TO service_role;

-- Migration 007: Receipts and Lineage
GRANT SELECT ON receipts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO service_role;

GRANT SELECT ON receipt_lineage TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_lineage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_lineage TO service_role;

GRANT SELECT ON receipt_batches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batches TO service_role;

GRANT SELECT ON receipt_batch_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batch_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batch_items TO service_role;

-- ============================================================================
-- EVIDENCE & LIFECYCLE (migrations 009-011)
-- ============================================================================

-- Migration 009: Evidence Objects and Vault
GRANT SELECT ON evidence_objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_objects TO service_role;

GRANT SELECT ON vault_objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vault_objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vault_objects TO service_role;

-- Migration 010: Lifecycle Objects
GRANT SELECT ON lifecycle_objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON lifecycle_objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lifecycle_objects TO service_role;

-- Migration 011: Audit Packs and Verification
GRANT SELECT ON audit_packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_packs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_packs TO service_role;

GRANT SELECT ON audit_pack_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_pack_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_pack_items TO service_role;

-- ============================================================================
-- API & GOVERNANCE (migrations 012-017)
-- ============================================================================

-- Migration 012: API Service Access
GRANT SELECT ON api_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO service_role;

GRANT SELECT ON api_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_requests TO service_role;

GRANT SELECT ON incidents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO service_role;

-- Migration 013: HITL Governance
GRANT SELECT ON hitl_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_requests TO service_role;

GRANT SELECT ON hitl_decisions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_decisions TO service_role;

GRANT SELECT ON hitl_reviewers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_reviewers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hitl_reviewers TO service_role;

-- Migration 014: Agentic Runtime
GRANT SELECT ON agent_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_sessions TO service_role;

GRANT SELECT ON agent_delegations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_delegations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_delegations TO service_role;

GRANT SELECT ON agent_tool_invocations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_tool_invocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_tool_invocations TO service_role;

-- Migration 015: Downstream Provenance Watermarking
GRANT SELECT ON watermarks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON watermarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON watermarks TO service_role;

GRANT SELECT ON provenance_claims TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON provenance_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON provenance_claims TO service_role;

-- Migration 016: Shadow AI Governance
GRANT SELECT ON shadow_ai_detections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_detections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_detections TO service_role;

-- Migration 017: Privacy Governance
GRANT SELECT ON data_subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_subjects TO service_role;

GRANT SELECT ON legal_holds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON legal_holds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON legal_holds TO service_role;

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All tables now have explicit Data API grants.
-- Ready for Supabase projects created after May 30, 2026.
-- ============================================================================

COMMENT ON SCHEMA public IS 'AGEI canonical schema with explicit Data API grants (Supabase May 30, 2026 requirement)';
