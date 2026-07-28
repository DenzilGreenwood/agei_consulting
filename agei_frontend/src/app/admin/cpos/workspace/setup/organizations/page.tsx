'use client';

import React, { useState } from 'react';
import { useSetup } from '@/lib/setup/SetupContext';
import { Building2, Plus, Globe } from 'lucide-react';

export default function OrganizationsPage() {
  const { state, addOrganization } = useSetup();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    addOrganization({
      id: `org-${Date.now()}`,
      name,
      domain,
      created_at: new Date().toISOString()
    });
    
    setName('');
    setDomain('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Tenant Organizations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage client workspaces and environments.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Organization
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {isCreating && (
          <div className="mb-6 p-4 border border-primary/20 bg-primary/5 rounded-xl">
            <h3 className="font-semibold mb-4">Register New Organization</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain (Optional)</label>
                  <input 
                    type="text" 
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g. acme.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium">Create Tenant</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.organizations.map(org => (
            <div key={org.id} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{org.name}</h3>
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-mono">{org.id}</span>
              </div>
              {org.domain && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Globe className="h-4 w-4 mr-2" /> {org.domain}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span>Registered: {new Date(org.created_at).toLocaleDateString()}</span>
                <span>{state.principals.filter(p => p.organization_id === org.id).length} Users</span>
              </div>
            </div>
          ))}
          {state.organizations.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              No organizations found. Register a new tenant to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
