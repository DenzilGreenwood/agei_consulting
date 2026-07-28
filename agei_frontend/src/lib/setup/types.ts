export type Role = 'admin' | 'consultant' | 'client_executive' | 'client_engineer';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
}

export interface Principal {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

// Form Field Types
export type FieldType = 'text' | 'long_text' | 'select' | 'checkbox';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // Used for select dropdowns
}

export interface DynamicForm {
  id: string;
  organization_id: string;
  created_by_principal_id: string;
  title: string;
  slug: string;
  description?: string;
  version: number;
  is_published: boolean;
  form_schema: FormField[];
  created_at: string;
  updated_at: string;
}

export interface DynamicFormSubmission {
  id: string;
  form_id: string;
  submitted_by_principal_id?: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface SetupState {
  organizations: Organization[];
  principals: Principal[];
  forms: DynamicForm[];
  submissions: DynamicFormSubmission[];
}
