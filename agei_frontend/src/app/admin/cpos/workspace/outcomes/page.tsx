'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { Target, Plus, Trash2, TrendingUp, Code, CheckCircle2 } from 'lucide-react';
import { OutcomeType } from '@/lib/workspace/types';

export default function OutcomesDashboard() {
  const { state, addOutcome, deleteOutcome } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<OutcomeType>('Work Delivered');
  const [newMetric, setNewMetric] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [impactedIds, setImpactedIds] = useState<string[]>([]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    addOutcome({
      id: `out-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      type: newType,
      metrics: newMetric ? [newMetric] : [],
      owner_id: ownerId || undefined,
      impacted_stakeholder_ids: impactedIds,
      created_at: new Date().toISOString()
    });

    setNewTitle('');
    setNewDesc('');
    setNewMetric('');
    setOwnerId('');
    setImpactedIds([]);
    setIsCreating(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Software Implemented': return <Code className="h-5 w-5 text-blue-500" />;
      case 'Value Realized': return <TrendingUp className="h-5 w-5 text-green-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Outcomes & Value Delivery
          </h1>
          <p className="text-muted-foreground mt-1">Track work provided, software implemented, and client value realized.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Log Outcome
        </button>
      </div>

      {isCreating && (
        <div className="bg-card border border-primary/20 bg-primary/5 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="font-semibold mb-4">Log New Outcome</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Outcome Title</label>
                <input 
                  required autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Deployed Policy Gateway"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  value={newType} onChange={e => setNewType(e.target.value as OutcomeType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Work Delivered">Work Delivered</option>
                  <option value="Software Implemented">Software Implemented</option>
                  <option value="Value Realized">Value Realized</option>
                  <option value="Strategic Shift">Strategic Shift</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description (What was provided?)</label>
              <textarea 
                value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe the implementation or work done..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Key Metric / ROI (Optional)</label>
              <input 
                type="text" value={newMetric} onChange={e => setNewMetric(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Reduced inference latency by 40ms"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Outcome Owner</label>
                <select 
                  value={ownerId} onChange={e => setOwnerId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Select Owner --</option>
                  {state.stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Impacted Stakeholders</label>
                <div className="max-h-32 overflow-y-auto border border-input rounded-md bg-background p-2 space-y-1">
                  {state.stakeholders.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={impactedIds.includes(s.id)}
                        onChange={e => {
                          if (e.target.checked) setImpactedIds(prev => [...prev, s.id]);
                          else setImpactedIds(prev => prev.filter(id => id !== s.id));
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-md border border-border">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium">Save Outcome</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.outcomes.map(outcome => (
          <div key={outcome.id} className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-muted rounded-lg">
                  {getTypeIcon(outcome.type)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{outcome.type}</span>
                  <h3 className="font-semibold text-foreground leading-tight mt-0.5">{outcome.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => { if(confirm('Delete this outcome?')) deleteOutcome(outcome.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground flex-1 mt-2">{outcome.description}</p>
            
            {outcome.metrics.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Metrics / ROI</p>
                {outcome.metrics.map((m, i) => (
                  <div key={i} className="text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-md inline-block">
                    {m}
                  </div>
                ))}
              </div>
            )}
            
            {(outcome.owner_id || outcome.impacted_stakeholder_ids?.length > 0) && (
              <div className="mt-4 pt-4 border-t border-border text-xs">
                {outcome.owner_id && (
                  <div className="flex gap-2 mb-1">
                    <span className="font-semibold text-muted-foreground">Owner:</span>
                    <span>{state.stakeholders.find(s => s.id === outcome.owner_id)?.name || 'Unknown'}</span>
                  </div>
                )}
                {outcome.impacted_stakeholder_ids?.length > 0 && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-muted-foreground">Impacted:</span>
                    <span className="truncate">{outcome.impacted_stakeholder_ids.map(id => state.stakeholders.find(s => s.id === id)?.name).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 text-[10px] text-muted-foreground text-right">
              Logged {new Date(outcome.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

        {state.outcomes.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted/5">
            <Target className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p>No outcomes tracked for this organization yet.</p>
            <p className="text-sm mt-1">Log work delivered or software implemented to build the client value report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
