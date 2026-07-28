import { SetupState } from './types';

export const initialSetupState: SetupState = {
  organizations: [
    {
      id: 'org-1',
      name: 'AGEI Consulting',
      domain: 'agei.com',
      created_at: new Date().toISOString()
    },
    {
      id: 'org-2',
      name: 'Claims Triage AI Client X',
      domain: 'clientx.com',
      created_at: new Date().toISOString()
    }
  ],
  principals: [
    {
      id: 'prin-1',
      organization_id: 'org-1',
      name: 'Elena',
      email: 'elena@agei.com',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'prin-2',
      organization_id: 'org-2',
      name: 'Sarah',
      email: 'sarah@clientx.com',
      role: 'client_executive',
      created_at: new Date().toISOString()
    }
  ],
  forms: [
    {
      id: 'form-1',
      organization_id: 'org-2',
      created_by_principal_id: 'prin-1',
      title: 'Shadow AI Discovery Questionnaire',
      slug: 'shadow-ai-discovery',
      description: 'Initial intake form to identify unmanaged LLM usage.',
      version: 1,
      is_published: true,
      form_schema: [
        { id: 'f1', type: 'text', label: 'Department Name', required: true },
        { id: 'f2', type: 'long_text', label: 'Describe current AI usage', required: true },
        { id: 'f3', type: 'select', label: 'Primary LLM Vendor', required: true, options: ['OpenAI', 'Anthropic', 'Google', 'Other'] },
        { id: 'f4', type: 'checkbox', label: 'I acknowledge the PII policy', required: true }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  submissions: []
};
