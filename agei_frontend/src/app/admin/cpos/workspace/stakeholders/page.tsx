'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { Users, Filter, Plus, ShieldAlert, BadgeCheck, X, Briefcase, Activity } from 'lucide-react';
import { Stakeholder, RoleType, InfluenceLevel, InterestLevel, ChampionStatus, DecisionRights } from '@/lib/workspace/types';

export default function StakeholdersPage() {
  const { state, addStakeholder, deleteStakeholder } = useWorkspace();
  const [filterRole, setFilterRole] = useState<RoleType | 'All'>('All');
  const [filterChampion, setFilterChampion] = useState<ChampionStatus | 'All'>('All');
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [dept, setDept] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [roleType, setRoleType] = useState<RoleType>('Business Owner');
  const [influence, setInfluence] = useState<InfluenceLevel>('Medium');
  const [interest, setInterest] = useState<InterestLevel>('Medium');
  const [champion, setChampion] = useState<ChampionStatus>('Neutral');
  const [accountability, setAccountability] = useState('');
  const [decision, setDecision] = useState<DecisionRights>('Advisory Only');
  const [concerns, setConcerns] = useState('');
  const [engagement, setEngagement] = useState('');

  const filteredStakeholders = state.stakeholders.filter(s => {
    if (filterRole !== 'All' && s.role_type !== filterRole) return false;
    if (filterChampion !== 'All' && s.champion_status !== filterChampion) return false;
    return true;
  });

  const selectedStakeholder = state.stakeholders.find(s => s.id === selectedStakeholderId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    addStakeholder({
      id: `sh-${Date.now()}`,
      name,
      organization: org,
      department: dept,
      role_title: roleTitle,
      role_type: roleType,
      influence,
      interest,
      champion_status: champion,
      accountability_domain: accountability,
      decision_rights: decision,
      primary_concerns: concerns.split(',').map(c => c.trim()).filter(Boolean),
      engagement_plan: engagement
    });
    
    setIsCreating(false);
  };

  const getChampionColor = (status: string) => {
    switch (status) {
      case 'Strong Champion': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Supportive': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Skeptical': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Opposed': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden relative">
      <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Stakeholders & Governance Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Map power, interest, and accountability for AI initiatives.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
            className="text-sm rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="All">All Roles</option>
            <option value="Executive Sponsor">Executive Sponsor</option>
            <option value="Governance">Governance</option>
            <option value="Risk/Compliance">Risk/Compliance</option>
            <option value="IT Implementation">IT Implementation</option>
            <option value="Business Owner">Business Owner</option>
          </select>
          <select 
            value={filterChampion} onChange={e => setFilterChampion(e.target.value as any)}
            className="text-sm rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="All">All Attitudes</option>
            <option value="Strong Champion">Strong Champion</option>
            <option value="Skeptical">Skeptical</option>
            <option value="Opposed">Opposed</option>
          </select>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Stakeholder
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Directory Table */}
        <div className={`flex-1 overflow-y-auto p-6 ${selectedStakeholderId ? 'border-r border-border hidden md:block' : ''}`}>
          
          {isCreating && (
            <div className="bg-card border border-primary/20 rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">New Stakeholder Profile</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Organization</label>
                    <input type="text" value={org} onChange={e => setOrg(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role Title</label>
                    <input type="text" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Governance Role Type</label>
                    <select value={roleType} onChange={e => setRoleType(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="Executive Sponsor">Executive Sponsor</option>
                      <option value="Governance">Governance</option>
                      <option value="Risk/Compliance">Risk/Compliance</option>
                      <option value="IT Implementation">IT Implementation</option>
                      <option value="Data/ML">Data/ML</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="End User">End User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Influence / Power</label>
                    <select value={influence} onChange={e => setInfluence(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Attitude / Champion Status</label>
                    <select value={champion} onChange={e => setChampion(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="Strong Champion">Strong Champion</option>
                      <option value="Supportive">Supportive</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Skeptical">Skeptical</option>
                      <option value="Opposed">Opposed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Accountability Domain</label>
                  <input type="text" value={accountability} onChange={e => setAccountability(e.target.value)} placeholder="e.g. Budget, Model Performance, Compliance" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary Concerns (comma separated)</label>
                  <input type="text" value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="e.g. Latency, UX, PII Leakage" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-md border border-border">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium">Save Stakeholder</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStakeholders.map(stakeholder => (
              <div 
                key={stakeholder.id} 
                onClick={() => setSelectedStakeholderId(stakeholder.id)}
                className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${selectedStakeholderId === stakeholder.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-foreground">{stakeholder.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getChampionColor(stakeholder.champion_status)}`}>
                    {stakeholder.champion_status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">{stakeholder.role_title} • {stakeholder.department}</div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">{stakeholder.role_type}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Power: {stakeholder.influence}
                  </span>
                </div>
              </div>
            ))}
            
            {filteredStakeholders.length === 0 && !isCreating && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                No stakeholders match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* Role Profile Panel */}
        {selectedStakeholder && (
          <div className="w-full md:w-[450px] bg-card overflow-y-auto shrink-0 animate-in slide-in-from-right-8 border-l border-border relative">
            <div className="sticky top-0 bg-card/80 backdrop-blur p-4 border-b border-border flex justify-between items-center z-10">
              <h3 className="font-bold text-lg">Stakeholder Profile</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { if(confirm('Delete?')) { deleteStakeholder(selectedStakeholder.id); setSelectedStakeholderId(null); } }}
                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded"
                >
                  Delete
                </button>
                <button onClick={() => setSelectedStakeholderId(null)} className="p-1 hover:bg-muted rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedStakeholder.name}</h2>
                <p className="text-muted-foreground">{selectedStakeholder.role_title} at {selectedStakeholder.organization}</p>
                <div className={`mt-3 inline-block text-xs px-3 py-1 rounded-full border font-semibold ${getChampionColor(selectedStakeholder.champion_status)}`}>
                  {selectedStakeholder.champion_status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Governance Role</p>
                  <p className="font-medium text-sm flex items-center gap-1"><Briefcase className="h-4 w-4" /> {selectedStakeholder.role_type}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Decision Rights</p>
                  <p className="font-medium text-sm flex items-center gap-1"><BadgeCheck className="h-4 w-4" /> {selectedStakeholder.decision_rights}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Accountability Domain</h4>
                <p className="text-sm text-muted-foreground">{selectedStakeholder.accountability_domain}</p>
              </div>

              {selectedStakeholder.primary_concerns?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Primary Concerns</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStakeholder.primary_concerns.map((c, i) => (
                      <span key={i} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md border border-destructive/20">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Engagement Plan</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md italic">
                  "{selectedStakeholder.engagement_plan}"
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4" /> Traceability
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Journals & Meetings</p>
                    {state.journals.filter(j => j.participant_ids?.includes(selectedStakeholder.id)).map(j => (
                      <div key={j.id} className="text-sm py-1 border-l-2 border-primary pl-3 ml-1 mb-2 text-foreground/80">{j.title}</div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Deliverable Reviews</p>
                    {state.deliverables.filter(d => d.reviewer_ids?.includes(selectedStakeholder.id) || d.sponsor_id === selectedStakeholder.id).map(d => (
                      <div key={d.id} className="text-sm py-1 border-l-2 border-emerald-500 pl-3 ml-1 mb-2 text-foreground/80">{d.title}</div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
