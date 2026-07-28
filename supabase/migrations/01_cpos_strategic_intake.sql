-- Schema for High-Assurance Strategic Intake
CREATE TABLE public.cpos_strategic_surveys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    submitted_by uuid NOT NULL REFERENCES public.principals(id),
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),

    -- High-Assurance Lobe Responses (Scores: 1 = Low, 2 = Mid, 3 = High Assurance)
    privilege_model_score integer NOT NULL CHECK (privilege_model_score BETWEEN 1 AND 3),
    privilege_model_notes text,

    enforcement_fidelity_score integer NOT NULL CHECK (enforcement_fidelity_score BETWEEN 1 AND 3),
    enforcement_fidelity_notes text,

    evidentiary_integrity_score integer NOT NULL CHECK (evidentiary_integrity_score BETWEEN 1 AND 3),
    evidentiary_integrity_notes text,

    downstream_provenance_score integer NOT NULL CHECK (downstream_provenance_score BETWEEN 1 AND 3),
    downstream_provenance_notes text,

    perimeter_privacy_score integer NOT NULL CHECK (perimeter_privacy_score BETWEEN 1 AND 3),
    perimeter_privacy_notes text,

    -- Calculated Metrics
    aggregate_maturity_score numeric NOT NULL GENERATED ALWAYS AS (
        (privilege_model_score + enforcement_fidelity_score + evidentiary_integrity_score + downstream_provenance_score + perimeter_privacy_score)::numeric / 5.0
    ) STORED,

    CONSTRAINT cpos_strategic_surveys_pkey PRIMARY KEY (id)
);

-- Enable RLS for Strict Multi-Tenant Isolation
ALTER TABLE public.cpos_strategic_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_surveys ON public.cpos_strategic_surveys
    FOR ALL USING (public.is_org_member(organization_id));

-- Trigger to make submissions strictly WORM (No edits or deletes allowed)
CREATE TRIGGER lock_survey_submissions
    BEFORE UPDATE OR DELETE ON public.cpos_strategic_surveys
    FOR EACH ROW EXECUTE FUNCTION public.enforce_worm_invariant();
