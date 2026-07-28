'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SetupProvider, useSetup } from '@/lib/setup/SetupContext';

function FormRenderer() {
  const params = useParams();
  const formId = params.formId as string;
  const { state, addSubmission } = useSetup();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Prevent hydration mismatch

  const form = state.forms.find(f => f.id === formId || f.slug === formId);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-bold mb-2">Form Not Found</h2>
          <p className="text-muted-foreground text-sm">The form you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (!form.is_published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-bold mb-2">Form is Draft</h2>
          <p className="text-muted-foreground text-sm">This form is not yet published.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const missing = form.form_schema.filter(f => f.required && !formData[f.id]);
    if (missing.length > 0) {
      alert(`Please fill out required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    addSubmission({
      id: `sub-${Date.now()}`,
      form_id: form.id,
      payload: formData,
      created_at: new Date().toISOString()
    });

    setIsSubmitted(true);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-card p-10 rounded-2xl shadow-lg text-center max-w-md w-full border border-border">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Submission Received</h1>
          <p className="text-muted-foreground text-sm">Thank you. Your response has been securely recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-2xl bg-card border border-border shadow-lg rounded-2xl p-8 sm:p-12 h-fit">
        
        <div className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl font-extrabold mb-3 text-foreground tracking-tight">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-muted-foreground text-base leading-relaxed">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {form.form_schema.map(field => (
            <div key={field.id} className="group">
              <label className="block text-sm font-semibold mb-2 text-foreground">
                {field.label} {field.required && <span className="text-red-500 ml-1" title="Required">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input 
                  type="text" 
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" 
                  placeholder="Your answer" 
                />
              )}
              
              {field.type === 'long_text' && (
                <textarea 
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm h-32 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow resize-y" 
                  placeholder="Provide detailed information..." 
                />
              )}
              
              {field.type === 'select' && (
                <select 
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                >
                  <option value="">-- Select an option --</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
              
              {field.type === 'checkbox' && (
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    required={field.required}
                    checked={!!formData[field.id]}
                    onChange={e => handleInputChange(field.id, e.target.checked)}
                    className="h-5 w-5 rounded border-input text-primary focus:ring-primary" 
                  />
                  <span className="text-sm font-medium">{field.label}</span>
                </label>
              )}
            </div>
          ))}
          
          <div className="mt-10 pt-8 border-t border-border">
            <button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              Submit Response
            </button>
            <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
              Secured by CognitiveInsight Cryptographic Anchoring
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function PublicFormPage() {
  return (
    <SetupProvider>
      <FormRenderer />
    </SetupProvider>
  );
}
