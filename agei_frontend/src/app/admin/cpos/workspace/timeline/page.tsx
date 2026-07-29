'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { useSetup } from '@/lib/setup/SetupContext';
import { Clock, FileText, Database, FileDown, Search, Target, ClipboardList, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type EventType = 'Journal' | 'Capsule' | 'Deliverable' | 'Outcome' | 'Form' | 'Document';

export default function TimelineWorkspace() {
  const { state } = useWorkspace();
  const { state: setupState } = useSetup();
  
  const [filterType, setFilterType] = useState<EventType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Unify and sort events
  const events = [
    ...state.journals
      .filter(j => !j.is_private)
      .map(j => ({ 
        id: j.id, 
        type: 'Journal' as EventType, 
        title: j.title, 
        content: j.content, 
        date: new Date(j.created_at),
        metadata: j.tags.join(', '),
        stakeholder_ids: j.participant_ids || []
      })),
    ...state.capsules.map(c => ({ 
      id: c.id, 
      type: 'Capsule' as EventType, 
      title: `Capsule Promoted: ${c.title}`, 
      content: c.summary, 
      date: new Date(c.created_at),
      metadata: `Type: ${c.capsule_type} | Source: ${c.source_journal_id}`
    })),
    // For deliverables, we use the fact that they exist in state. In a real app we'd track status change events.
    ...state.deliverables.map(d => ({
      id: d.id,
      type: 'Deliverable' as EventType,
      title: `Deliverable Created: ${d.title}`,
      content: `Status: ${d.status} | Included Capsules: ${d.included_capsule_ids.length}`,
      date: new Date(Date.now() - 100000), // mock date just slightly in the past
      metadata: d.type,
      stakeholder_ids: d.sponsor_id ? [d.sponsor_id, ...(d.reviewer_ids || [])] : d.reviewer_ids || []
    })),
    ...state.outcomes.map(o => ({
      id: o.id,
      type: 'Outcome' as EventType,
      title: `Outcome Logged: ${o.title}`,
      content: o.description,
      date: new Date(o.created_at),
      metadata: `Category: ${o.type} | Metrics: ${o.metrics.join(', ')}`,
      stakeholder_ids: o.owner_id ? [o.owner_id, ...(o.impacted_stakeholder_ids || [])] : o.impacted_stakeholder_ids || []
    })),
    ...setupState.forms.map(f => ({
      id: f.id,
      type: 'Form' as EventType,
      title: `Form Generated: ${f.title}`,
      content: f.description || '',
      date: new Date(f.created_at),
      metadata: `Fields: ${f.form_schema ? f.form_schema.length : 0}`
    })),
    ...(state.org_documents || []).map(d => ({
      id: d.id,
      type: 'Document' as EventType,
      title: `Document Created: ${d.title}`,
      content: `Type: ${d.type} | Status: ${d.status}`,
      date: new Date(d.created_at),
      metadata: d.cryptographic_metadata ? `Sealed: ${d.cryptographic_metadata.content_hash.substring(0, 8)}...` : 'Unsealed',
      stakeholder_ids: d.stakeholder_ids || []
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredEvents = events.filter(e => {
    if (filterType !== 'All' && e.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.content.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Event Timeline
        </h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search timeline..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm w-64"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventType | 'All')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="All">All Events</option>
            <option value="Journal">Journals Only</option>
            <option value="Capsule">Capsules Only</option>
            <option value="Deliverable">Deliverables</option>
            <option value="Outcome">Outcomes</option>
            <option value="Document">Standard Documents</option>
            <option value="Form">Forms</option>
          </select>
        </div>
      </div>

      <div className="relative border-l-2 border-border ml-4 space-y-8">
        {filteredEvents.map(event => {
          const isExpanded = expandedId === event.id;
          
          let Icon = FileText;
          let iconColor = 'text-blue-500';
          let bgColor = 'bg-blue-500/10';
          
          if (event.type === 'Capsule') {
            Icon = Database;
            iconColor = 'text-purple-500';
            bgColor = 'bg-purple-500/10';
          } else if (event.type === 'Deliverable') {
            Icon = FileDown;
            iconColor = 'text-emerald-500';
            bgColor = 'bg-emerald-500/10';
          } else if (event.type === 'Outcome') {
            Icon = Target;
            iconColor = 'text-amber-500';
            bgColor = 'bg-amber-500/10';
          } else if (event.type === 'Form') {
            Icon = ClipboardList;
            iconColor = 'text-rose-500';
            bgColor = 'bg-rose-500/10';
          } else if (event.type === 'Document') {
            Icon = Shield;
            iconColor = 'text-indigo-500';
            bgColor = 'bg-indigo-500/10';
          }

          return (
            <div key={event.id} className="relative pl-8 pr-4">
              {/* Timeline dot */}
              <div className={`absolute w-8 h-8 rounded-full -left-[17px] top-0 flex items-center justify-center border-4 border-background ${bgColor}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>

              <div 
                className="bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/10">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">{event.date.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md shrink-0">
                    {event.type}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t border-border">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {event.content}
                      </ReactMarkdown>
                    </div>
                    {event.metadata && (
                      <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground font-mono">
                        {event.metadata}
                      </div>
                    )}
                    {(event as any).stakeholder_ids && (event as any).stakeholder_ids.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/20 flex flex-wrap gap-2">
                        {Array.from(new Set((event as any).stakeholder_ids as string[])).map(sid => {
                          const s = state.stakeholders.find(x => x.id === sid);
                          if (!s) return null;
                          const isChampion = s.champion_status === 'Strong Champion' || s.champion_status === 'Supportive';
                          const isSkeptic = s.champion_status === 'Skeptical' || s.champion_status === 'Opposed';
                          
                          let badgeColor = 'bg-muted text-muted-foreground';
                          if (isChampion) badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                          if (isSkeptic) badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                          
                          return (
                            <span key={sid} className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {s.name} ({s.role_type})
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="pl-8 text-muted-foreground py-8">
            No events match your current filters.
          </div>
        )}
      </div>
    </div>
  );
}
