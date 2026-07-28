-- Extended Schema for CPOS Enterprise Advisory Engine
CREATE TYPE public.engagement_phase AS ENUM ('Discover_Assess', 'Design_Align', 'Govern_Adopt', 'Measure_Improve');
CREATE TYPE public.deployment_status AS ENUM ('Not_Started', 'In_Progress', 'UAT_Pending', 'Active_Prod', 'Failed');
CREATE TYPE public.uat_status AS ENUM ('Pending', 'In_Testing', 'Blocked', 'Approved_Signed');
CREATE TYPE public.milestone_type AS ENUM ('Phase_Kickoff', 'Discovery_Delivered', 'GOM_Signoff', 'UAT_Pass_Off', 'Production_Go_Live');

-- 1. Core Engagement Tracking
CREATE TABLE public.engagements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL, -- Links to public.organizations(id)
    current_phase public.engagement_phase NOT NULL DEFAULT 'Discover_Assess',
    lead_consultant_id uuid NOT NULL, -- Links to public.principals(id)
    total_budget numeric(12, 2) NOT NULL,
    start_date date NOT NULL,
    target_end_date date,
    actual_end_date date,
    health_status text NOT NULL DEFAULT 'Green' CHECK (health_status = ANY (ARRAY['Green', 'Yellow', 'Red'])),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT engagements_pkey PRIMARY KEY (id),
    CONSTRAINT engagements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- 2. Resource Allocation
CREATE TABLE public.consulting_resources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    principal_id uuid NOT NULL, -- References public.principals(id)
    role text NOT NULL CHECK (role = ANY (ARRAY['lead_partner', 'systems_architect', 'grc_consultant', 'implementation_engineer'])),
    allocation_percentage numeric(5, 2) NOT NULL DEFAULT 100.00,
    active_from date NOT NULL,
    active_until date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT consulting_resources_pkey PRIMARY KEY (id)
);

-- 3. Software & Database Implementation Registry
CREATE TABLE public.software_deployments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    environment text NOT NULL CHECK (environment = ANY (ARRAY['development', 'staging', 'production'])),
    on_prem_supabase_endpoint text NOT NULL,
    schema_version_installed text NOT NULL, -- e.g., 'agei-schema-v1.4.2'
    sdk_sidecar_deployed boolean NOT NULL DEFAULT false,
    deployment_status public.deployment_status NOT NULL DEFAULT 'Not_Started',
    verified_at timestamp with time zone,
    verified_by uuid, -- References public.principals(id)
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT software_deployments_pkey PRIMARY KEY (id)
);

-- 4. User Testing, Acceptance (UAT), & Verification Logs
CREATE TABLE public.uat_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    scenario_name text NOT NULL, -- e.g., 'Agent Tool Bounding Check CLM-5000'
    target_gate_id uuid NOT NULL, -- References public.gate_definitions(id)
    tested_by_client_principal_id uuid NOT NULL, -- Tester
    status public.uat_status NOT NULL DEFAULT 'Pending',
    test_logs jsonb NOT NULL DEFAULT '{}'::jsonb,
    blocking_notes text,
    run_receipt_id uuid, -- Linkage to physical CIAF-LCM verification receipt
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT uat_sessions_pkey PRIMARY KEY (id)
);

-- 5. Enterprise AI Adoption & Posture Metrics (Updated weekly)
CREATE TABLE public.adoption_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    reporting_week date NOT NULL,
    total_active_models integer NOT NULL DEFAULT 0,
    governed_models_count integer NOT NULL DEFAULT 0, -- Models bound to active gate_definitions
    active_agent_sessions_count bigint NOT NULL DEFAULT 0,
    unmanaged_tool_discovery_count bigint NOT NULL DEFAULT 0, -- Extracted from shadow_ai_discovery_records
    governed_api_throughput_pct numeric(5, 2) NOT NULL DEFAULT 0.00, -- % of raw API calls writing receipts
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT adoption_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT adoption_metrics_org_week_key UNIQUE (organization_id, reporting_week)
);

-- 6. Structured Stakeholder Communication Plans
CREATE TABLE public.communication_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    stakeholder_principal_id uuid NOT NULL, -- e.g., Elena, Marcus, Sarah
    communication_cadence text NOT NULL CHECK (communication_cadence = ANY (ARRAY['weekly_status', 'monthly_steering', 'phase_signoff', 'emergency_escalation'])),
    channel text NOT NULL DEFAULT 'email_and_portal' CHECK (channel = ANY (ARRAY['email_and_portal', 'slack_webhook', 'executive_briefing'])),
    last_contact_at timestamp with time zone,
    next_scheduled_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT communication_plans_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_plans ENABLE ROW LEVEL SECURITY;

-- Note: Policies will require joining on engagements or organizations for proper multi-tenant separation.
