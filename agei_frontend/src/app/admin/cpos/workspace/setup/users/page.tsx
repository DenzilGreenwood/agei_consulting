'use client';

import React, { useState } from 'react';
import { useSetup } from '@/lib/setup/SetupContext';
import { Users, Plus, Shield, Mail, Building } from 'lucide-react';
import { Role } from '@/lib/setup/types';

export default function UsersPage() {
  const { state, addPrincipal } = useSetup();
  const [isCreating, setIsCreating] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('client_engineer');
  const [orgId, setOrgId] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !orgId) return;
    
    addPrincipal({
      id: `prin-${Date.now()}`,
      organization_id: orgId,
      name,
      email,
      role,
      created_at: new Date().toISOString()
    });
    
    setName('');
    setEmail('');
    setRole('client_engineer');
    setOrgId('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Principal Users
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage identities and roles across organizations.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {isCreating && (
          <div className="mb-6 p-4 border border-primary/20 bg-primary/5 rounded-xl">
            <h3 className="font-semibold mb-4">Provision New User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Organization</label>
                  <select 
                    required
                    value={orgId}
                    onChange={e => setOrgId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Select Organization --</option>
                    {state.organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">System Role</label>
                  <select 
                    required
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="admin">System Admin</option>
                    <option value="consultant">CPOS Consultant</option>
                    <option value="client_executive">Client Executive</option>
                    <option value="client_engineer">Client Engineer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium">Provision User</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.principals.map(p => {
                const org = state.organizations.find(o => o.id === p.organization_id);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground"><Building className="h-3 w-3" /> {org?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="text-xs uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{p.role.replace('_', ' ')}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {state.principals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
