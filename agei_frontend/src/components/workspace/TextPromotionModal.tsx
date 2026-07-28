'use client';

import React, { useState } from 'react';
import { CapsuleType } from '@/lib/workspace/types';
import { X } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';

interface TextPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  sourceJournalId: string;
}

export function TextPromotionModal({ isOpen, onClose, selectedText, sourceJournalId }: TextPromotionModalProps) {
  const { addCapsule, state } = useWorkspace();
  
  const [capsuleType, setCapsuleType] = useState<CapsuleType>('Finding');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState(selectedText);
  const [mappedObjectiveId, setMappedObjectiveId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCapsule({
      id: `cap-${Date.now()}`,
      capsule_type: capsuleType,
      title: title || 'Untitled Capsule',
      summary,
      supporting_context: selectedText,
      source_journal_id: sourceJournalId,
      mapped_objective_id: mappedObjectiveId || null,
      created_at: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Promote to Knowledge Capsule</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
            <p className="text-xs text-primary font-semibold uppercase mb-1">Source Text Highlight</p>
            <p className="text-sm italic border-l-2 border-primary pl-2">{selectedText}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Capsule Type</label>
              <select 
                value={capsuleType}
                onChange={(e) => setCapsuleType(e.target.value as CapsuleType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Finding">Finding</option>
                <option value="Recommendation">Recommendation</option>
                <option value="Decision">Decision</option>
                <option value="Risk">Risk</option>
                <option value="Issue">Issue</option>
                <option value="Evidence">Evidence</option>
                <option value="Observation">Observation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Map to Objective (Optional)</label>
              <select 
                value={mappedObjectiveId}
                onChange={(e) => setMappedObjectiveId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- None --</option>
                {state.objectives.map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capsule Title</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hardcoded API Keys Identified"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Summary / Distillation</label>
            <textarea 
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This summary is what will be injected into deliverables. The source text remains attached for evidentiary lineage.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              Create Capsule
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
