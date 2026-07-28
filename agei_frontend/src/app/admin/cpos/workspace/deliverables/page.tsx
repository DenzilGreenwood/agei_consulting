'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { compileDeliverableMarkdown } from '@/lib/workspace/compiler';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileDown, Printer, Play, Trash2 } from 'lucide-react';

export default function DeliverablesComposer() {
  const { state, deleteCapsule } = useWorkspace();
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(state.deliverables[0]?.id || null);
  
  const [selectedCapsules, setSelectedCapsules] = useState<Set<string>>(new Set());
  const [selectedObjectives, setSelectedObjectives] = useState<Set<string>>(new Set());
  
  const [sponsorId, setSponsorId] = useState<string>('');
  const [reviewerIds, setReviewerIds] = useState<Set<string>>(new Set());
  
  const [compiledPreview, setCompiledPreview] = useState<string>('');

  const activeDeliverable = state.deliverables.find(d => d.id === selectedDeliverableId);

  // Initialize selection from active deliverable
  useEffect(() => {
    if (activeDeliverable) {
      setSelectedCapsules(new Set(activeDeliverable.included_capsule_ids));
      setSelectedObjectives(new Set(activeDeliverable.included_objective_ids));
      setSponsorId(activeDeliverable.sponsor_id || '');
      setReviewerIds(new Set(activeDeliverable.reviewer_ids || []));
    }
  }, [activeDeliverable]);

  const handleCompile = () => {
    if (!activeDeliverable) return;
    
    const capsules = state.capsules.filter(c => selectedCapsules.has(c.id));
    const objectives = state.objectives.filter(o => selectedObjectives.has(o.id));
    const sponsor = state.stakeholders.find(s => s.id === sponsorId);
    const reviewers = state.stakeholders.filter(s => reviewerIds.has(s.id));
    
    const md = compileDeliverableMarkdown(
      activeDeliverable.title,
      capsules,
      objectives,
      state.journals,
      sponsor,
      reviewers
    );
    
    setCompiledPreview(md);
  };

  const toggleCapsule = (id: string) => {
    const next = new Set(selectedCapsules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCapsules(next);
  };

  const toggleObjective = (id: string) => {
    const next = new Set(selectedObjectives);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedObjectives(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!compiledPreview) return;
    const blob = new Blob([compiledPreview], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDeliverable?.title || 'deliverable'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 print:block print:h-auto print:m-0 print:p-0">
      
      {/* Left Sidebar: Selector Panel */}
      <div className="w-1/3 bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden print:hidden">
        <div className="p-4 border-b border-border">
          <label className="block text-sm font-medium mb-1">Active Deliverable</label>
          <select 
            value={selectedDeliverableId || ''}
            onChange={(e) => setSelectedDeliverableId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {state.deliverables.map(d => (
              <option key={d.id} value={d.id}>{d.title} ({d.status})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Include Objectives</h3>
            <div className="space-y-2">
              {state.objectives.map(obj => (
                <label key={obj.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedObjectives.has(obj.id)}
                    onChange={() => toggleObjective(obj.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{obj.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{obj.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Include Knowledge Capsules</h3>
            <div className="space-y-2">
              {state.capsules.map(cap => (
                <div key={cap.id} className="group flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                  <label className="flex flex-1 items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedCapsules.has(cap.id)}
                      onChange={() => toggleCapsule(cap.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium truncate pr-2">{cap.title}</p>
                        <span className="text-[10px] uppercase font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {cap.capsule_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{cap.summary}</p>
                    </div>
                  </label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this knowledge capsule permanently?')) {
                        deleteCapsule(cap.id);
                        if (selectedCapsules.has(cap.id)) toggleCapsule(cap.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all mt-0.5"
                    title="Delete Capsule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Stakeholders</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1">Executive Sponsor</label>
              <select 
                value={sponsorId} onChange={e => setSponsorId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="">-- Select Sponsor --</option>
                {state.stakeholders.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role_type})</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Reviewers</label>
              <div className="max-h-32 overflow-y-auto border border-input rounded-md bg-background p-2 space-y-1">
                {state.stakeholders.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={reviewerIds.has(s.id)}
                      onChange={e => {
                        const next = new Set(reviewerIds);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setReviewerIds(next);
                      }}
                    />
                    <span className="truncate">{s.name} <span className="text-[10px] text-muted-foreground">({s.role_type})</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-muted/10">
          <button 
            onClick={handleCompile}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-md font-medium shadow-sm hover:bg-primary/90"
          >
            <Play className="h-4 w-4" /> Run Deterministic Compiler
          </button>
        </div>
      </div>

      {/* Right Content Area: Live Rendered Markdown Preview */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden print:border-none print:shadow-none print:bg-transparent print:m-0 print:p-0">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10 print:hidden">
          <h2 className="font-semibold">Live Render Preview</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              disabled={!compiledPreview}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print PDF
            </button>
            <button 
              onClick={handleDownload}
              disabled={!compiledPreview}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" /> Export .md
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:block">
          {compiledPreview ? (
            <div className="prose prose-slate dark:prose-invert max-w-none print:max-w-full">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {compiledPreview}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
              <FileDown className="h-12 w-12 mb-4 opacity-20" />
              <p>Select components and run the compiler to preview.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
