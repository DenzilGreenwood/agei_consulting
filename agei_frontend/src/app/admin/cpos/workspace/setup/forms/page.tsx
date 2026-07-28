'use client';

import React from 'react';
import Link from 'next/link';
import { useSetup } from '@/lib/setup/SetupContext';
import { LayoutTemplate, Plus, ExternalLink, Edit } from 'lucide-react';

export default function FormsListPage() {
  const { state } = useSetup();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" /> Dynamic Form Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Design and manage schema-driven data capture pages.</p>
        </div>
        <Link 
          href="/admin/cpos/workspace/setup/forms/builder"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create New Form
        </Link>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.forms.map(form => {
            const org = state.organizations.find(o => o.id === form.organization_id);
            return (
              <div key={form.id} className="border border-border rounded-xl p-5 shadow-sm bg-card hover:border-primary/50 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{form.title}</h3>
                  {form.is_published ? (
                    <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Published</span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Draft</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{form.description}</p>
                
                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <p><strong>Tenant:</strong> {org?.name || 'Unknown'}</p>
                  <p><strong>Fields:</strong> {form.form_schema.length}</p>
                  <p><strong>URL Slug:</strong> /{form.slug}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Link 
                    href={`/admin/cpos/workspace/setup/forms/builder?id=${form.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium bg-muted text-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Edit className="h-4 w-4" /> Edit Schema
                  </Link>
                  <Link 
                    href={`/f/${form.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> View Live Form
                  </Link>
                </div>
              </div>
            );
          })}
          {state.forms.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              No forms created yet. Build your first schema to generate a capture page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
