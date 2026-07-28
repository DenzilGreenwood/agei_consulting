'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkspaceState, Journal, Capsule, Deliverable, Objective, Stakeholder, Outcome } from './types';
import { initialMockData } from './mockData';

interface WorkspaceContextProps {
  state: WorkspaceState;
  addJournal: (journal: Journal) => void;
  updateJournal: (journal: Journal) => void;
  deleteJournal: (id: string) => void;
  addCapsule: (capsule: Capsule) => void;
  updateCapsule: (capsule: Capsule) => void;
  deleteCapsule: (id: string) => void;
  updateDeliverable: (deliverable: Deliverable) => void;
  updateObjective: (objective: Objective) => void;
  addOutcome: (outcome: Outcome) => void;
  updateOutcome: (outcome: Outcome) => void;
  deleteOutcome: (id: string) => void;
  addStakeholder: (stakeholder: Stakeholder) => void;
  updateStakeholder: (stakeholder: Stakeholder) => void;
  deleteStakeholder: (id: string) => void;
  addOrgDocument: (doc: OrganizationDocument) => void;
  updateOrgDocument: (doc: OrganizationDocument) => void;
  deleteOrgDocument: (id: string) => void;
  resetState: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WorkspaceState>(initialMockData);
  const [isLoaded, setIsLoaded] = useState(false);

  const [storageKey, setStorageKey] = useState('cpos_workspace_state');

  // Determine active org and load from local storage
  useEffect(() => {
    const activeOrgId = localStorage.getItem('cpos_active_org_id');
    const key = activeOrgId ? `cpos_workspace_state_${activeOrgId}` : 'cpos_workspace_state';
    setStorageKey(key);

    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored workspace state', e);
      }
    } else {
      // If no stored state for this org, reset to initial mock data
      setState(initialMockData);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, isLoaded, storageKey]);

  const addJournal = useCallback((journal: Journal) => {
    setState(prev => ({ ...prev, journals: [journal, ...prev.journals] }));
  }, []);

  const updateJournal = useCallback((journal: Journal) => {
    setState(prev => ({
      ...prev,
      journals: prev.journals.map(j => (j.id === journal.id ? journal : j))
    }));
  }, []);

  const deleteJournal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      journals: prev.journals.filter(j => j.id !== id),
      // Cascading delete: remove all capsules associated with this journal
      capsules: prev.capsules.filter(c => c.source_journal_id !== id)
    }));
  }, []);

  const addCapsule = useCallback((capsule: Capsule) => {
    setState(prev => ({ ...prev, capsules: [capsule, ...prev.capsules] }));
  }, []);

  const updateCapsule = useCallback((capsule: Capsule) => {
    setState(prev => ({
      ...prev,
      capsules: prev.capsules.map(c => (c.id === capsule.id ? capsule : c))
    }));
  }, []);

  const deleteCapsule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      capsules: prev.capsules.filter(c => c.id !== id)
    }));
  }, []);

  const updateDeliverable = useCallback((deliverable: Deliverable) => {
    setState(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(d => (d.id === deliverable.id ? deliverable : d))
    }));
  }, []);

  const updateObjective = useCallback((objective: Objective) => {
    setState(prev => ({
      ...prev,
      objectives: prev.objectives.map(o => (o.id === objective.id ? objective : o))
    }));
  }, []);

  const addOutcome = useCallback((outcome: Outcome) => {
    setState(prev => ({ ...prev, outcomes: [outcome, ...prev.outcomes] }));
  }, []);

  const updateOutcome = useCallback((outcome: Outcome) => {
    setState(prev => ({
      ...prev,
      outcomes: prev.outcomes.map(o => (o.id === outcome.id ? outcome : o))
    }));
  }, []);

  const deleteOutcome = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(o => o.id !== id)
    }));
  }, []);

  const addStakeholder = useCallback((stakeholder: Stakeholder) => {
    setState(prev => ({ ...prev, stakeholders: [stakeholder, ...prev.stakeholders] }));
  }, []);

  const updateStakeholder = useCallback((stakeholder: Stakeholder) => {
    setState(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.map(s => (s.id === stakeholder.id ? stakeholder : s))
    }));
  }, []);

  const deleteStakeholder = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s.id !== id)
    }));
  }, []);

  const addOrgDocument = useCallback((doc: OrganizationDocument) => {
    setState(prev => ({ ...prev, org_documents: [doc, ...prev.org_documents] }));
  }, []);

  const updateOrgDocument = useCallback((doc: OrganizationDocument) => {
    setState(prev => ({
      ...prev,
      org_documents: prev.org_documents.map(d => (d.id === doc.id ? doc : d))
    }));
  }, []);

  const deleteOrgDocument = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      org_documents: prev.org_documents.filter(d => d.id !== id)
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialMockData);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  if (!isLoaded) return null;

  return (
    <WorkspaceContext.Provider
      value={{
        state,
        addJournal,
        updateJournal,
        deleteJournal,
        addCapsule,
        updateCapsule,
        deleteCapsule,
        updateDeliverable,
        updateObjective,
        addOutcome,
        updateOutcome,
        deleteOutcome,
        addStakeholder,
        updateStakeholder,
        deleteStakeholder,
        addOrgDocument,
        updateOrgDocument,
        deleteOrgDocument,
        resetState,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
