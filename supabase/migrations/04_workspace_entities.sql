-- 1. Stakeholders
CREATE TABLE public.stakeholders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    organization text,
    department text,
    role_title text,
    role_type text,
    influence text,
    interest text,
    champion_status text,
    accountability_domain text,
    decision_rights text,
    primary_concerns text[],
    engagement_plan text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT stakeholders_pkey PRIMARY KEY (id)
);

-- 2. Objectives
CREATE TABLE public.objectives (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    success_criteria jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT objectives_pkey PRIMARY KEY (id)
);

-- 3. Journals
CREATE TABLE public.journals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    tags text[],
    is_private boolean DEFAULT false,
    participant_ids text[],
    decision_owner_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT journals_pkey PRIMARY KEY (id)
);

-- 4. Capsules
CREATE TABLE public.capsules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    capsule_type text NOT NULL,
    title text NOT NULL,
    summary text,
    supporting_context text,
    source_journal_id text,
    mapped_objective_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT capsules_pkey PRIMARY KEY (id)
);

-- 5. Deliverables
CREATE TABLE public.deliverables (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text,
    status text,
    included_objective_ids text[],
    included_capsule_ids text[],
    sponsor_id text,
    reviewer_ids text[],
    signoff_id text,
    compiled_markdown text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT deliverables_pkey PRIMARY KEY (id)
);

-- 6. Outcomes
CREATE TABLE public.outcomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text,
    metrics text[],
    owner_id text,
    impacted_stakeholder_ids text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT outcomes_pkey PRIMARY KEY (id)
);

-- 7. Org Documents
CREATE TABLE public.org_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    status text,
    stakeholder_ids text[],
    linked_capsule_ids text[],
    template_variables jsonb DEFAULT '{}'::jsonb,
    cryptographic_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT org_documents_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_documents ENABLE ROW LEVEL SECURITY;
