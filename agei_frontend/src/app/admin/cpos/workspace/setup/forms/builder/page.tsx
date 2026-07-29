'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSetup } from '@/lib/setup/SetupContext';
import { DynamicForm, FormField, FieldType } from '@/lib/setup/types';
import { LayoutTemplate, Plus, Trash2, Save, Eye } from 'lucide-react';

function BuilderContent() {
  const { state, addForm, updateForm } = useSetup();
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = searchParams?.get('id');

  const existingForm = formId ? state.forms.find(f => f.id === formId) : null;

  const [title, setTitle] = useState(existingForm?.title || '');
  const [description, setDescription] = useState(existingForm?.description || '');
  const [slug, setSlug] = useState(existingForm?.slug || '');
  const [orgId, setOrgId] = useState(existingForm?.organization_id || '');
  const [fields, setFields] = useState<FormField[]>(existingForm?.form_schema || []);
  const [isPublished, setIsPublished] = useState(existingForm?.is_published || false);

  const handleAddField = () => {
    setFields([...fields, { id: `f-${Date.now()}`, type: 'text', label: 'New Field', required: false }]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleSave = () => {
    if (!title || !slug || !orgId) return alert('Title, Slug, and Organization are required.');
    
    if (existingForm) {
      updateForm({
        ...existingForm,
        title,
        description,
        slug,
        organization_id: orgId,
        form_schema: fields,
        is_published: isPublished,
        version: existingForm.version + 1,
        updated_at: new Date().toISOString()
      });
    } else {
      addForm({
        id: `form-${Date.now()}`,
        title,
        description,
        slug,
        organization_id: orgId,
        created_by_principal_id: state.principals[0]?.id || 'system', // naive fallback
        form_schema: fields,
        is_published: isPublished,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    router.push('/admin/cpos/workspace/setup/forms');
  };

  return (
    <div className="flex h-full divide-x divide-border">
      
      {/* LEFT PANEL: Builder Controls */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-muted/10">
        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
          <h2 className="font-semibold flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" /> Schema Builder
          </h2>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium text-sm hover:bg-primary/90"
          >
            <Save className="h-4 w-4" /> Save Form
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Metadata Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Form Metadata</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Form Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Slug</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. vendor-intake" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tenant Organization</label>
                <select value={orgId} onChange={e => setOrgId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">-- Select Org --</option>
                  {state.organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="pub" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                <label htmlFor="pub" className="text-sm font-medium">Publish form (makes it active)</label>
              </div>
            </div>
          </div>

          {/* Fields Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Form Schema Fields</h3>
              <button onClick={handleAddField} className="text-xs flex items-center gap-1 text-primary hover:underline font-medium">
                <Plus className="h-3 w-3" /> Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 border border-border rounded-lg bg-card shadow-sm space-y-3 relative group">
                  <button onClick={() => removeField(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-3 gap-3 pr-6">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1">Field Label</label>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={e => updateField(idx, { label: e.target.value })} 
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select 
                        value={field.type} 
                        onChange={e => updateField(idx, { type: e.target.value as FieldType })} 
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      >
                        <option value="text">Short Text</option>
                        <option value="long_text">Long Text</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })} className="rounded text-primary" />
                    <label className="text-xs font-medium">Required Field</label>
                  </div>

                  {field.type === 'select' && (
                    <div>
                      <label className="block text-xs font-medium mb-1">Options (comma separated)</label>
                      <input 
                        type="text" 
                        value={field.options?.join(', ') || ''} 
                        onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" 
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No fields added. Click "Add Field" to start building your schema.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div className="w-1/2 flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-2 bg-card">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-muted-foreground text-sm">Live Renderer Preview</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          
          {/* Mock Public Form Container */}
          <div className="w-full max-w-lg bg-card border border-border shadow-lg rounded-2xl p-8 h-fit">
            
            <div className="mb-8 border-b border-border pb-6">
              <h1 className="text-2xl font-extrabold mb-2 text-foreground">
                {title || 'Untitled Form'}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              )}
            </div>

            <div className="space-y-6">
              {fields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input type="text" disabled className="w-full rounded-lg border border-input bg-background/50 px-3 py-2.5 text-sm opacity-70 cursor-not-allowed placeholder:text-muted-foreground/50" placeholder="Short text response..." />
                  )}
                  {field.type === 'long_text' && (
                    <textarea disabled className="w-full rounded-lg border border-input bg-background/50 px-3 py-2.5 text-sm h-24 opacity-70 cursor-not-allowed placeholder:text-muted-foreground/50" placeholder="Long text response..." />
                  )}
                  {field.type === 'select' && (
                    <select disabled className="w-full rounded-lg border border-input bg-background/50 px-3 py-2.5 text-sm opacity-70 cursor-not-allowed text-muted-foreground">
                      <option>-- Select an option --</option>
                      {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-3">
                      <input type="checkbox" disabled className="h-4 w-4 rounded border-input opacity-70 cursor-not-allowed" />
                      <span className="text-sm text-muted-foreground">Yes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <button disabled className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold opacity-50 cursor-not-allowed">
                Submit Form
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}
