-- Migration: 03_caif_ai_audit_logs
-- Purpose: Implement CAIF-LCM immutable audit records for all AI interactions.

CREATE TABLE public.caif_audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    principal_id uuid REFERENCES public.principals(id) ON DELETE SET NULL, -- Nullable for anonymous/system interactions
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    
    model_used text NOT NULL, -- e.g., 'gemini-3.1-pro-preview'
    prompt_tokens integer,
    completion_tokens integer,
    total_tokens integer,
    
    raw_prompt text NOT NULL,
    raw_response jsonb NOT NULL,
    
    -- CAIF-LCM Immutable Receipt Hash
    -- A SHA-256 hash of (raw_prompt + raw_response + timestamp + principal_id)
    transaction_hash text NOT NULL UNIQUE,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT caif_audit_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS for compliance
ALTER TABLE public.caif_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs, Principals can read their own
CREATE POLICY "Principals can view own audit logs" ON public.caif_audit_logs
    FOR SELECT
    USING (auth.uid() = principal_id);
    
-- (Insert policies are typically handled via Service Role in the API layer for security)
