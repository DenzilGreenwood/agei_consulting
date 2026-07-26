import Link from 'next/link';
import React from 'react';
import { Database, ShieldCheck, Zap, Lock, Code, ChevronDown, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Database Security & Schema | AGEI',
  description: 'Detailed breakdown of database indices, schema structure, and Row-Level Security (RLS) policies.',
};

export default function DatabaseSchemaPage() {
  const sections = [
    {
      id: 1,
      title: "Security Definer Helper Functions",
      icon: <Lock className="h-6 w-6 text-primary" />,
      description: "Custom PostgreSQL functions integrating with Supabase's auth.uid() to enforce robust tenant boundaries by verifying organization membership and active role assignments.",
      code: `-- =====================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Supabase auth.uid() integration)
-- =====================================================================

-- Helper to check if the current authenticated user is an active member of an organization
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.principals p ON p.id = om.principal_id
        WHERE om.organization_id = target_org_id
          AND p.auth_user_id = auth.uid()
          AND om.is_active = TRUE
          AND p.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Helper to check if the current user has a specific role inside the organization
CREATE OR REPLACE FUNCTION public.has_org_role(target_org_id UUID, allowed_roles text[])
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.principals p ON p.id = om.principal_id
        WHERE om.organization_id = target_org_id
          AND p.auth_user_id = auth.uid()
          AND om.role = ANY(allowed_roles)
          AND om.is_active = TRUE
          AND p.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;`
    },
    {
      id: 2,
      title: "Performance Optimized Indices",
      icon: <Zap className="h-6 w-6 text-primary" />,
      description: "Crucial indices designed to avoid full table scans on heavily audited tables (e.g., receipts) and ensure sub-second RLS policy evaluation and delegation chain traversal.",
      code: `-- =====================================================================
-- 2. PERFORMANCE OPTIMIZED INDICES (Preventing scans on joins & RLS)
-- =====================================================================

-- Tenant & Identity Family Indices
CREATE INDEX IF NOT EXISTS idx_org_members_lookup 
ON public.organization_members (organization_id, principal_id) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_principals_auth_uid 
ON public.principals (auth_user_id) 
WHERE is_active = TRUE;

-- Policy & Gate Enforcement Family Indices
CREATE INDEX IF NOT EXISTS idx_policy_versions_payload_hash 
ON public.policy_versions (payload_hash);

CREATE INDEX IF NOT EXISTS idx_policy_rules_version 
ON public.policy_rules (policy_version_id);

CREATE INDEX IF NOT EXISTS idx_policy_evaluations_gate_res 
ON public.policy_evaluations (gate_evaluation_id, evaluated_resource_type, evaluated_resource_id);

CREATE INDEX IF NOT EXISTS idx_gate_evaluations_perf 
ON public.gate_evaluations (organization_id, gate_definition_id, gate_outcome);

-- Receipts & Evidence Vault Indices (Crucial for high-frequency auditing)
CREATE INDEX IF NOT EXISTS idx_receipts_hash_search 
ON public.receipts (content_hash);

CREATE INDEX IF NOT EXISTS idx_receipts_verification_audit 
ON public.receipts (organization_id, is_verified, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_receipt_links_graph 
ON public.receipt_links (source_receipt_id, target_receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_batch_items_search 
ON public.receipt_batch_items (batch_id, receipt_id);

-- Agentic Governance Indices (Sub-second delegation traversal)
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active 
ON public.agent_sessions (organization_id, agent_principal_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_agent_delegations_chain 
ON public.agent_delegations (agent_session_id, delegating_principal_id, agent_principal_id);

CREATE INDEX IF NOT EXISTS idx_pre_action_proofs_lookup 
ON public.pre_action_proof_bundles (agent_session_id, tool_definition_id, proof_hash);

CREATE INDEX IF NOT EXISTS idx_agent_tool_invocations_audit 
ON public.agent_tool_invocations (agent_session_id, execution_status);

-- Shadow AI Indices
CREATE INDEX IF NOT EXISTS idx_shadow_ai_discovery_status 
ON public.shadow_ai_discovery_records (organization_id, status, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_shadow_ai_classifications_record 
ON public.shadow_ai_classifications (discovery_record_id, risk_level);

-- Cryptographic Erasure & Personal Data Indices
CREATE INDEX IF NOT EXISTS idx_subject_keys_ref 
ON public.subject_encryption_keys (organization_id, key_ref) 
WHERE key_status = 'active';

CREATE INDEX IF NOT EXISTS idx_receipt_encrypted_subject 
ON public.receipt_encrypted_content (organization_id, subject_id, encryption_status);`
    },
    {
      id: 3,
      title: "Row-Level Security (RLS) Policies",
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      description: "Strict isolation rules mapping Supabase identities to multi-tenant structures. Critically, this enforces the Append-Only constraint on the evidence vault, completely denying UPDATE and DELETE operations on receipts.",
      code: `-- =====================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS across target tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_action_proof_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_ai_discovery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_encrypted_content ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- A. Organization & Membership Policies
-- ---------------------------------------------------------------------

CREATE POLICY org_select_policy ON public.organizations
    FOR SELECT
    USING (public.is_org_member(id));

CREATE POLICY org_members_select_policy ON public.organization_members
    FOR SELECT
    USING (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- B. Policy & Gate Enforcement Policies
-- ---------------------------------------------------------------------

-- All organization members can view published policies and configured gates
CREATE POLICY policy_sets_select_policy ON public.policy_sets
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY policy_versions_select_policy ON public.policy_versions
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY policy_rules_select_policy ON public.policy_rules
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY gate_definitions_select_policy ON public.gate_definitions
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY gate_evaluations_select_policy ON public.gate_evaluations
    FOR SELECT
    USING (public.is_org_member(organization_id));

-- Write access to policy configuration is restricted to Policy Authors, Admins, and Owners
CREATE POLICY policy_sets_write_policy ON public.policy_sets
    FOR ALL
    USING (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'policy_author']))
    WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'policy_author']));

CREATE POLICY policy_versions_write_policy ON public.policy_versions
    FOR ALL
    USING (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'policy_author']))
    WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'policy_author']));

-- ---------------------------------------------------------------------
-- C. Receipts & Evidence Vault Policies
-- ---------------------------------------------------------------------

-- Organization members can view atomic, immutable receipts
CREATE POLICY receipts_select_policy ON public.receipts
    FOR SELECT
    USING (public.is_org_member(organization_id));

-- Only authorized backend service clients, operators, or admins can append receipts (INSERT ONLY)
CREATE POLICY receipts_insert_policy ON public.receipts
    FOR INSERT
    WITH CHECK (
        public.is_org_member(organization_id) AND 
        public.has_org_role(organization_id, ARRAY['owner', 'admin', 'operator'])
    );

-- Receipts are cryptographically sealed and append-only: Deny all UPDATE & DELETE
CREATE POLICY receipts_deny_update ON public.receipts FOR UPDATE USING (FALSE);
CREATE POLICY receipts_deny_delete ON public.receipts FOR DELETE USING (FALSE);

-- ---------------------------------------------------------------------
-- D. Agentic Runtime Governance Policies
-- ---------------------------------------------------------------------

CREATE POLICY agent_sessions_select_policy ON public.agent_sessions
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY agent_delegations_select_policy ON public.agent_delegations
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY pre_action_proofs_select_policy ON public.pre_action_proof_bundles
    FOR SELECT
    USING (public.is_org_member(organization_id));

CREATE POLICY tool_invocations_select_policy ON public.agent_tool_invocations
    FOR SELECT
    USING (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- E. Shadow AI Discovery & Perimeter Governance Policies
-- ---------------------------------------------------------------------

-- View access to unmanaged use telemetry is restricted to security personnel and auditors
CREATE POLICY shadow_ai_discovery_select_policy ON public.shadow_ai_discovery_records
    FOR SELECT
    USING (
        public.is_org_member(organization_id) AND 
        public.has_org_role(organization_id, ARRAY['owner', 'admin', 'auditor', 'operator'])
    );

-- Telemetry collectors can insert discovery records
CREATE POLICY shadow_ai_discovery_insert_policy ON public.shadow_ai_discovery_records
    FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- F. GDPR Cryptographic Erasure & Privacy Vault Policies
-- ---------------------------------------------------------------------

-- Subject keys and encrypted payload content are restricted
CREATE POLICY subject_keys_select_policy ON public.subject_encryption_keys
    FOR SELECT
    USING (
        public.is_org_member(organization_id) AND 
        public.has_org_role(organization_id, ARRAY['owner', 'admin', 'auditor', 'operator'])
    );

-- Only dedicated compliance workflows/roles can trigger cryptographic shredding (UPDATE status to 'destroyed')
CREATE POLICY subject_keys_shred_policy ON public.subject_encryption_keys
    FOR UPDATE
    USING (
        public.is_org_member(organization_id) AND 
        public.has_org_role(organization_id, ARRAY['owner', 'admin', 'operator'])
    )
    WITH CHECK (
        public.is_org_member(organization_id) AND 
        public.has_org_role(organization_id, ARRAY['owner', 'admin', 'operator'])
    );

CREATE POLICY encrypted_content_select_policy ON public.receipt_encrypted_content
    FOR SELECT
    USING (public.is_org_member(organization_id));`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>
      
      {/* Header */}
      <div className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Database Security & Schema
        </h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-3xl leading-relaxed">
          AI Governance Evidence Infrastructure (AGEI) relies on PostgreSQL (via Supabase) to enforce robust multi-tenant isolation. The SQL blueprints below define the <strong>Row-Level Security (RLS)</strong> policies and <strong>Performance Indices</strong> necessary to securely scale cryptographic auditing.
        </p>
      </div>

      {/* Core Patterns Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h3 className="font-bold">Total Tenant Isolation</h3>
          </div>
          <p className="text-sm text-muted-foreground">Every read and write is strictly scoped to verified organization members using custom Security Definer functions.</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-6 w-6 text-primary" />
            <h3 className="font-bold">Append-Only Vault</h3>
          </div>
          <p className="text-sm text-muted-foreground">The <code>receipts</code> table enforces strict append-only constraints, explicitly denying any UPDATE or DELETE operations via RLS.</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="font-bold">Optimized Auditing</h3>
          </div>
          <p className="text-sm text-muted-foreground">Strategic indices avoid expensive sequential scans during hash verification and agent delegation checks.</p>
        </div>
      </div>

      {/* SQL Snippets Catalog */}
      <section>
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden group/card hover:border-primary/40 transition-colors">
              <div className="p-6 md:p-8 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  {section.icon}
                  <h3 className="text-2xl font-bold text-foreground">
                    {section.id}. {section.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </div>
              
              <div className="p-6 md:p-8 bg-muted/10">
                <details className="group border border-border rounded-xl bg-card overflow-hidden shadow-sm open:shadow-md transition-all" open>
                  <summary className="flex items-center justify-between p-4 cursor-pointer bg-muted/40 hover:bg-muted/80 transition-colors font-mono text-sm font-semibold select-none border-b border-transparent group-open:border-border">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      <span>SQL Blueprint</span>
                    </div>
                    <span className="flex items-center text-xs font-sans text-muted-foreground gap-2">
                      <span className="group-open:hidden">Click to expand</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="p-4 bg-black/5 dark:bg-black/40 overflow-x-auto text-xs text-foreground font-mono leading-relaxed">
                    <pre><code>{section.code}</code></pre>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
