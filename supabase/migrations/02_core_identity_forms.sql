-- 1. Organizations
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- 2. Principals (Users)
CREATE TABLE public.principals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL CHECK (role = ANY (ARRAY['admin', 'consultant', 'client_executive', 'client_engineer'])),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT principals_pkey PRIMARY KEY (id)
);

-- 3. Dynamic Forms (Schema-Driven)
CREATE TABLE public.dynamic_forms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_principal_id uuid NOT NULL REFERENCES public.principals(id),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    version integer NOT NULL DEFAULT 1,
    is_published boolean NOT NULL DEFAULT false,
    
    -- Using JSONB to store the schema (array of field definitions)
    -- In a strict environment, we could use pg_jsonschema here for strong validation.
    -- e.g., CHECK (jsonb_matches_schema('{"type": "array"}', form_schema))
    form_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT dynamic_forms_pkey PRIMARY KEY (id)
);

-- 4. Dynamic Form Submissions
CREATE TABLE public.dynamic_form_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL REFERENCES public.dynamic_forms(id) ON DELETE CASCADE,
    submitted_by_principal_id uuid REFERENCES public.principals(id), -- Nullable for public/anonymous forms
    
    -- The actual captured data payload
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Additional metadata like IP, user agent, or cryptographic signatures can go here
    metadata jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT dynamic_form_submissions_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_form_submissions ENABLE ROW LEVEL SECURITY;
