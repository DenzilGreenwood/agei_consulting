'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { TextPromotionModal } from '@/components/workspace/TextPromotionModal';
import { FileText, Plus, Hash, Sparkles, Loader2, Trash2, Shield, Lock, Globe, FileDown } from 'lucide-react';
import { CapsuleType, StandardDocType, OrganizationDocument } from '@/lib/workspace/types';

export default function JournalsWorkspace() {
  const { state, addJournal, deleteJournal, addCapsule, addOrgDocument, updateOrgDocument, deleteOrgDocument } = useWorkspace();
  
  // View Selection
  type ViewType = 'journal' | 'org_doc';
  const [activeViewType, setActiveViewType] = useState<ViewType>('journal');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(state.journals[0]?.id || null);
  
  // Selection Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // New Journal/Doc State
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<ViewType>('journal');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Journal specific
  const [newParticipants, setNewParticipants] = useState<string[]>([]);
  const [newDecisionOwner, setNewDecisionOwner] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(true);

  // Org Doc specific
  const [newDocType, setNewDocType] = useState<StandardDocType>('Engagement Letter');

  // Smart Import State
  const [isSmartImport, setIsSmartImport] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const activeJournal = state.journals.find(j => j.id === selectedItemId);
  const activeOrgDoc = (state.org_documents || []).find(d => d.id === selectedItemId);

  // Lineage Tracking for Active Journal
  const decisionOwner = activeJournal?.decision_owner_id 
    ? state.stakeholders.find(s => s.id === activeJournal.decision_owner_id) 
    : null;
    
  const linkedCapsules = activeJournal 
    ? state.capsules.filter(c => c.source_journal_id === activeJournal.id) 
    : [];
    
  const linkedDeliverables = linkedCapsules.length > 0 
    ? state.deliverables.filter(d => 
        d.included_capsule_ids.some(cid => linkedCapsules.map(lc => lc.id).includes(cid))
      )
    : [];

  const handleSelection = () => {
    const text = window.getSelection()?.toString().trim();
    if (text && text.length > 5) {
      setSelectedText(text);
      setIsModalOpen(true);
    }
  };

  const handlePrivacyToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (!checked) {
      const confirmPublic = window.confirm(`Warning: This journal will be made public and visible to clients if you continue.`);
      if (confirmPublic) {
        setIsPrivate(false);
      } else {
        // revert check
        e.preventDefault();
      }
    } else {
      setIsPrivate(true);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    
    if (createType === 'journal') {
      const newId = `j-${Date.now()}`;
      addJournal({
        id: newId,
        title: newTitle,
        content: newContent,
        created_at: new Date().toISOString(),
        tags: [],
        is_private: isPrivate,
        participant_ids: newParticipants,
        decision_owner_id: newDecisionOwner || undefined
      });
      setActiveViewType('journal');
      setSelectedItemId(newId);
    } else {
      const newId = `doc-${Date.now()}`;
      addOrgDocument({
        id: newId,
        type: newDocType,
        title: newTitle,
        content: newContent,
        status: 'Draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stakeholder_ids: newParticipants,
        linked_capsule_ids: [],
        template_variables: {}
      });
      setActiveViewType('org_doc');
      setSelectedItemId(newId);
    }

    setNewTitle('');
    setNewContent('');
    setNewParticipants([]);
    setNewDecisionOwner('');
    setIsPrivate(true);
    setIsCreating(false);
  };

  const handleSmartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    
    setIsExtracting(true);
    try {
      const response = await fetch('/api/journals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newContent, principalId: 'prin-1' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Extraction failed');
      }

      const data = await response.json();
      const newJId = `j-${Date.now()}`;
      
      addJournal({
        id: newJId,
        title: newTitle,
        content: data.clean_transcript || newContent,
        created_at: new Date().toISOString(),
        tags: ['Smart-Import'],
        is_private: isPrivate
      });

      if (data.extracted_capsules && Array.isArray(data.extracted_capsules)) {
        data.extracted_capsules.forEach((cap: any, index: number) => {
          const isDuplicate = state.capsules.some(c => c.title === cap.title);
          if (!isDuplicate) {
            addCapsule({
              id: `cap-${Date.now()}-${index}`,
              source_journal_id: newJId,
              capsule_type: cap.capsule_type as CapsuleType,
              title: cap.title,
              summary: cap.summary,
              supporting_context: cap.supporting_context,
              created_at: new Date().toISOString(),
              mapped_objective_id: null
            });
          }
        });
      }

      setActiveViewType('journal');
      setSelectedItemId(newJId);
      setIsCreating(false);
      setIsSmartImport(false);
      setNewTitle('');
      setNewContent('');
      
    } catch (error: any) {
      console.error(error);
      alert(`Smart Import Failed: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const startCreating = (type: ViewType, isSmart: boolean = false) => {
    setIsCreating(true);
    setCreateType(type);
    setIsSmartImport(isSmart);
    setNewTitle('');
    setNewContent('');
    if (type === 'org_doc') {
      setNewDocType('Engagement Letter');
      setNewTitle('Draft Engagement Letter');
      setNewContent('# Engagement Letter\n\nThis letter defines the scope, timeline, and fees...');
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Left Sidebar */}
      <div className="w-1/3 flex flex-col gap-4">
        
        {/* Standard Documents Section */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm flex-1 min-h-[30vh]">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
            <h2 className="font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Shield className="h-4 w-4" /> Standard Documents
            </h2>
            <button 
              onClick={() => startCreating('org_doc')}
              className="p-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 rounded-md transition-colors"
              title="New Standard Document"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {(state.org_documents || []).map(d => (
              <div
                key={d.id}
                className={`group flex items-center justify-between w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  selectedItemId === d.id && !isCreating && activeViewType === 'org_doc'
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
                    : 'hover:bg-muted border-l-4 border-transparent'
                }`}
              >
                <button
                  onClick={() => { setActiveViewType('org_doc'); setSelectedItemId(d.id); setIsCreating(false); }}
                  className="flex-1 text-left overflow-hidden"
                >
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase bg-background px-1.5 py-0.5 rounded border border-border">
                      {d.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.status}</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this standard document?')) {
                      deleteOrgDocument(d.id);
                      if (selectedItemId === d.id) setSelectedItemId(null);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(state.org_documents || []).length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center">No standard documents yet.</p>
            )}
          </div>
        </div>

        {/* Meeting Journals Section */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm flex-1 min-h-[30vh]">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Meeting Journals
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => startCreating('journal', true)}
                className="p-1.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-md transition-colors"
                title="Smart Import (Gemini)"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button 
                onClick={() => startCreating('journal', false)}
                className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                title="New Manual Journal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {state.journals.map(j => (
              <div
                key={j.id}
                className={`group flex items-center justify-between w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  selectedItemId === j.id && !isCreating && activeViewType === 'journal'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                    : 'hover:bg-muted border-l-4 border-transparent'
                }`}
              >
                <button
                  onClick={() => { setActiveViewType('journal'); setSelectedItemId(j.id); setIsCreating(false); }}
                  className="flex-1 text-left overflow-hidden"
                >
                  <div className="flex justify-between">
                    <p className="font-medium text-sm truncate pr-2">{j.title}</p>
                    {j.is_private ? <Lock className="h-3 w-3 text-amber-500" /> : <Globe className="h-3 w-3 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(j.created_at).toLocaleDateString()}</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this journal and all its capsules?')) {
                      deleteJournal(j.id);
                      if (selectedItemId === j.id) setSelectedItemId(null);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all"
                  title="Delete Journal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {state.journals.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center">No journals created.</p>
            )}
          </div>
        </div>

      </div>

      {/* Right Content Area: Editor / Viewer */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
        {isCreating ? (
          <div className="p-6 flex flex-col h-full relative">
            
            {isExtracting && (
              <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-bold">Extracting Insights...</h3>
                <p className="text-sm text-muted-foreground">Gemini is structuring your notes and logging the CAIF-LCM audit receipt.</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              {createType === 'org_doc' ? <Shield className="h-5 w-5 text-indigo-500" /> : isSmartImport ? <Sparkles className="h-5 w-5 text-indigo-500" /> : <FileText className="h-5 w-5 text-primary" />}
              <h2 className="text-xl font-bold">
                {createType === 'org_doc' ? 'New Standard Document' : isSmartImport ? 'Smart Import via Gemini' : 'New Journal Entry'}
              </h2>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 gap-4">
              
              {createType === 'org_doc' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Document Type</label>
                    <select 
                      value={newDocType}
                      onChange={e => setNewDocType(e.target.value as StandardDocType)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Engagement Letter">Engagement Letter</option>
                      <option value="Deliverables List">Deliverables List</option>
                      <option value="Work Document">Work Document</option>
                      <option value="Outcome Form">Outcome Form</option>
                      <option value="Intake Submission">Intake Submission</option>
                    </select>
                  </div>
                </div>
              )}

              <input 
                autoFocus
                required
                placeholder={createType === 'org_doc' ? "Document Title..." : "Entry Title..."}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-border pb-2 focus:outline-none focus:border-primary"
              />
              
              <textarea
                required
                placeholder={createType === 'org_doc' ? "Markdown content..." : "Start typing... Highlight text later to promote it to a Capsule."}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1 bg-transparent resize-none focus:outline-none text-sm leading-relaxed border border-border/50 rounded-lg p-4 font-mono"
              />
              
              <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-lg border border-border/50">
                <div>
                  <label className="block text-sm font-medium mb-1">Stakeholders / Participants</label>
                  <div className="max-h-24 overflow-y-auto border border-input rounded-md bg-background p-2 space-y-1">
                    {state.stakeholders.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={newParticipants.includes(s.id)}
                          onChange={e => {
                            if (e.target.checked) setNewParticipants(prev => [...prev, s.id]);
                            else setNewParticipants(prev => prev.filter(id => id !== s.id));
                          }}
                        />
                        {s.name} <span className="text-muted-foreground text-[10px]">({s.role_type})</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {createType === 'journal' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Decision Owner (Optional)</label>
                      <select 
                        value={newDecisionOwner} onChange={e => setNewDecisionOwner(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- None --</option>
                        {state.stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                      <label className="flex items-start gap-2 text-sm font-medium text-amber-700 dark:text-amber-500 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isPrivate}
                          onChange={handlePrivacyToggle}
                          className="mt-0.5"
                        />
                        <div>
                          <span>Keep Journal Private</span>
                          <p className="text-xs font-normal opacity-80 mt-0.5">
                            Private journals are omitted from client exports and cryptographic sealing. Uncheck to make public.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors"
                  disabled={isExtracting}
                >
                  {createType === 'org_doc' ? 'Create Document' : (isSmartImport ? 'Extract & Save' : 'Save Entry')}
                </button>
              </div>
            </form>
          </div>
        ) : (activeViewType === 'journal' && activeJournal) || (activeViewType === 'org_doc' && activeOrgDoc) ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{activeViewType === 'journal' ? activeJournal?.title : activeOrgDoc?.title}</h2>
                  {activeViewType === 'journal' && (
                    <span title={activeJournal?.is_private ? "Private Journal" : "Public Journal"}>
                      {activeJournal?.is_private ? <Lock className="h-4 w-4 text-amber-500" /> : <Globe className="h-4 w-4 text-emerald-500" />}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  <span>{new Date(activeViewType === 'journal' ? activeJournal!.created_at : activeOrgDoc!.created_at).toLocaleString()}</span>
                  {activeViewType === 'org_doc' && (
                    <span className="font-semibold text-indigo-500 uppercase tracking-wider">{activeOrgDoc?.status}</span>
                  )}
                </div>
              </div>
              
              {activeViewType === 'org_doc' && activeOrgDoc?.cryptographic_metadata && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-2 rounded-md text-xs font-mono text-right max-w-[200px] truncate">
                  <span className="font-bold block mb-1">CRYPTOGRAPHIC SEAL</span>
                  {activeOrgDoc.cryptographic_metadata.canonicalization_version}<br/>
                  {activeOrgDoc.cryptographic_metadata.content_hash}
                </div>
              )}
            </div>
            
            <div 
              className="p-6 flex-1 overflow-y-auto whitespace-pre-wrap leading-relaxed prose dark:prose-invert max-w-none"
              onMouseUp={activeViewType === 'journal' ? handleSelection : undefined}
            >
              {activeViewType === 'journal' ? activeJournal?.content : activeOrgDoc?.content}
            </div>

            {activeViewType === 'journal' && activeJournal && (
              <div className="p-4 border-t border-border bg-muted/10 flex flex-col gap-4">
                
                {/* Decision Owner & Tags */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {activeJournal.tags?.map(t => (
                      <span key={t} className="flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                        <Hash className="h-3 w-3" /> {t}
                      </span>
                    ))}
                  </div>
                  {decisionOwner && (
                    <div className="text-sm">
                      <span className="text-muted-foreground mr-2">Decision Owner:</span>
                      <span className="font-semibold text-primary">{decisionOwner.name}</span>
                    </div>
                  )}
                </div>

                {/* Forward Lineage: Deliverables */}
                {linkedDeliverables.length > 0 && (
                  <div className="mt-2 border border-border rounded-lg bg-background p-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forward Lineage</h4>
                    <div className="space-y-2">
                      {linkedDeliverables.map(del => {
                        const sponsor = state.stakeholders.find(s => s.id === del.sponsor_id);
                        return (
                          <div key={del.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <FileDown className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">{del.title}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{del.status}</span>
                            </div>
                            {sponsor && (
                              <span className="text-xs text-muted-foreground">
                                Assigned to Sponsor: <span className="font-medium text-foreground">{sponsor.name}</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Select a document or journal from the sidebar.</p>
          </div>
        )}
      </div>

      <TextPromotionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedText={selectedText}
        sourceJournalId={activeViewType === 'journal' ? selectedItemId || '' : ''}
      />

    </div>
  );
}
