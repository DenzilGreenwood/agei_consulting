-- Migration 034: Authorization Audit Events
-- Purpose: Durable audit trail for authorization decisions
-- This is critical for AGEI governance: proving who tried to access what, and why it was allowed or denied

create table if not exists public.authorization_audit_events (
  id uuid primary key default gen_random_uuid(),

  -- Who attempted the action
  organization_id uuid references public.organizations(id),
  principal_id uuid references public.principals(id),
  platform_role text,
  organization_role text,

  -- What was attempted
  event_type text not null check (
    event_type in (
      -- General authorization events
      'authorization_allowed',
      'authorization_denied',
      'authorization_error',
      
      -- API access management
      'api_client_created',
      'api_client_revoked',
      'api_key_created',
      'api_key_revoked',
      'access_grant_created',
      'access_grant_revoked',
      'service_grant_created',
      'service_grant_revoked',
      
      -- Audit pack events
      'audit_pack_created',
      'audit_pack_updated',
      'audit_pack_item_added',
      'audit_pack_item_removed',
      'audit_pack_sealed',
      'audit_pack_export_requested',
      'audit_pack_export_allowed',
      'audit_pack_export_denied',
      'audit_pack_verified',
      
      -- Policy management
      'policy_created',
      'policy_updated',
      'policy_deleted',
      'policy_publish_allowed',
      'policy_publish_denied',
      
      -- Gate management
      'gate_created',
      'gate_updated',
      'gate_deleted',
      'gate_activation_allowed',
      'gate_activation_denied',
      
      -- HITL governance
      'hitl_request_created',
      'hitl_request_viewed',
      'hitl_queue_viewed',
      'hitl_request_denied',
      'hitl_decision_allowed',
      'hitl_decision_denied',
      'hitl_decision_recorded',
      'hitl_request_archived',
      'hitl_request_deleted',
      
      -- Agent/session/tool management
      'agent_session_created',
      'agent_session_viewed',
      'agent_tool_listed',
      'agent_tool_evaluation_allowed',
      'agent_tool_evaluation_denied',
      'agent_interaction_allowed',
      'agent_interaction_denied',
      
      -- Organization member management
      'member_added',
      'member_removed',
      'member_role_changed',
      'member_management_allowed',
      'member_management_denied',
      
      -- Privacy & data management
      'privacy_notice_acknowledged',
      'privacy_erasure_requested',
      'privacy_erasure_processed',
      'privacy_data_export_requested',
      
      -- Workflow management
      'workflow_sealed',
      'workflow_finalized',
      
      -- Settings & retention management
      'retention_policy_updated',
      'retention_archive_configured',
      'settings_updated',
      
      -- Team management (invitations)
      'team_member_invited',
      'team_invitation_revoked',
      
      -- Receipt/evidence management
      'receipt_created',
      'receipt_verified',
      'receipt_creation_allowed',
      'receipt_creation_denied'
    )
  ),

  action text not null,
  permission text,
  resource_type text,
  resource_id text,

  -- Decision and reasoning
  decision text not null check (decision in ('allow', 'deny', 'error')),
  reason_code text not null,
  reason text,

  -- Request context
  request_path text,
  request_method text,
  ip_address inet,
  user_agent text,

  -- Governance context
  context_source text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- Performance indexes
create index if not exists idx_authorization_audit_events_org_created
  on public.authorization_audit_events (organization_id, created_at desc);

create index if not exists idx_authorization_audit_events_principal_created
  on public.authorization_audit_events (principal_id, created_at desc);

create index if not exists idx_authorization_audit_events_resource
  on public.authorization_audit_events (resource_type, resource_id);

create index if not exists idx_authorization_audit_events_decision
  on public.authorization_audit_events (decision, created_at desc);

create index if not exists idx_authorization_audit_events_event_type
  on public.authorization_audit_events (event_type, created_at desc);

-- RLS: Authorization audit events are sensitive security data
alter table public.authorization_audit_events enable row level security;

-- Drop existing policies if they exist (for idempotent migrations)
drop policy if exists "Service role has full access to authorization audit events" on public.authorization_audit_events;
drop policy if exists "Organization owners and admins can view their org's authorization audit events" on public.authorization_audit_events;
drop policy if exists "Auditors can view authorization audit events for their organization" on public.authorization_audit_events;
drop policy if exists "Platform owners can view all authorization audit events" on public.authorization_audit_events;

-- Service role: Full access for system operations
create policy "Service role has full access to authorization audit events"
  on public.authorization_audit_events
  for all
  to service_role
  using (true)
  with check (true);

-- Organization owners and admins: Read events for their organization
create policy "Organization owners and admins can view their org's authorization audit events"
  on public.authorization_audit_events
  for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.principal_id = current_principal_id()
        and om.is_active = true
        and om.role in ('owner', 'admin')
    )
  );

-- Auditors: Read events for their organization (scoped evidence access)
create policy "Auditors can view authorization audit events for their organization"
  on public.authorization_audit_events
  for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.principal_id = current_principal_id()
        and om.is_active = true
        and om.role = 'auditor'
    )
  );

-- Platform owners: Read all authorization audit events (platform oversight)
create policy "Platform owners can view all authorization audit events"
  on public.authorization_audit_events
  for select
  using (
    has_platform_role('platform_owner')
  );

-- No direct inserts from client: Service client only
-- (Authorization audit events are created server-side only)

comment on table public.authorization_audit_events is 
  'Durable audit trail for authorization decisions. Records who attempted what action, under which organization and role, and whether it was allowed or denied. Critical for AGEI governance evidence.';

comment on column public.authorization_audit_events.event_type is 
  'Type of authorization event (e.g., authorization_allowed, audit_pack_export_denied, api_key_created)';

comment on column public.authorization_audit_events.decision is 
  'Authorization decision: allow, deny, or error';

comment on column public.authorization_audit_events.reason_code is 
  'Machine-readable reason code (e.g., INSUFFICIENT_PERMISSIONS, AUDIT_SCOPE_VIOLATION, AUTHORIZED)';

comment on column public.authorization_audit_events.context_source is 
  'Source of governance context (e.g., organization_membership, default_organization, platform_membership, public_sandbox)';
