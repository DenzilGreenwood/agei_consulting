'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkspaceState, Journal, Capsule, Deliverable, Objective, Stakeholder, Outcome, OrganizationDocument } from './types';
import { supabase } from '../supabaseClient';

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
  const [state, setState] = useState<WorkspaceState>({
    stakeholders: [],
    objectives: [],
    journals: [],
    capsules: [],
    deliverables: [],
    outcomes: [],
    org_documents: []
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const fetchWorkspaceData = async (orgId: string) => {
    try {
      const [
        { data: stakeholders },
        { data: objectives },
        { data: journals },
        { data: capsules },
        { data: deliverables },
        { data: outcomes },
        { data: org_documents }
      ] = await Promise.all([
        supabase.from('stakeholders').select('*').eq('organization_id', orgId),
        supabase.from('objectives').select('*').eq('organization_id', orgId),
        supabase.from('journals').select('*').eq('organization_id', orgId),
        supabase.from('capsules').select('*').eq('organization_id', orgId),
        supabase.from('deliverables').select('*').eq('organization_id', orgId),
        supabase.from('outcomes').select('*').eq('organization_id', orgId),
        supabase.from('org_documents').select('*').eq('organization_id', orgId)
      ]);

      setState({
        stakeholders: stakeholders || [],
        objectives: objectives || [],
        journals: journals || [],
        capsules: capsules || [],
        deliverables: deliverables || [],
        outcomes: outcomes || [],
        org_documents: org_documents || []
      });
    } catch (e) {
      console.error('Failed to load workspace from Supabase', e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    const orgId = localStorage.getItem('cpos_active_org_id');
    if (orgId) {
      setActiveOrgId(orgId);
      fetchWorkspaceData(orgId);
    } else {
      setIsLoaded(true);
    }
  }, []);

  const addEntity = async (table: string, payload: any, stateKey: keyof WorkspaceState) => {
    if (!activeOrgId) return;
    const { error } = await supabase.from(table).insert({ ...payload, organization_id: activeOrgId });
    if (!error) {
      setState(prev => ({ ...prev, [stateKey]: [payload, ...prev[stateKey] as any[]] }));
    } else {
      console.error(error);
    }
  };

  const updateEntity = async (table: string, payload: any, stateKey: keyof WorkspaceState) => {
    const { error } = await supabase.from(table).update(payload).eq('id', payload.id);
    if (!error) {
      setState(prev => ({
        ...prev,
        [stateKey]: (prev[stateKey] as any[]).map((item: any) => item.id === payload.id ? payload : item)
      }));
    } else {
      console.error(error);
    }
  };

  const deleteEntity = async (table: string, id: string, stateKey: keyof WorkspaceState) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      setState(prev => ({
        ...prev,
        [stateKey]: (prev[stateKey] as any[]).filter((item: any) => item.id !== id)
      }));
    } else {
      console.error(error);
    }
  };

  const addJournal = useCallback((journal: Journal) => addEntity('journals', journal, 'journals'), [activeOrgId]);
  const updateJournal = useCallback((journal: Journal) => updateEntity('journals', journal, 'journals'), []);
  const deleteJournal = useCallback((id: string) => deleteEntity('journals', id, 'journals'), []);

  const addCapsule = useCallback((capsule: Capsule) => addEntity('capsules', capsule, 'capsules'), [activeOrgId]);
  const updateCapsule = useCallback((capsule: Capsule) => updateEntity('capsules', capsule, 'capsules'), []);
  const deleteCapsule = useCallback((id: string) => deleteEntity('capsules', id, 'capsules'), []);

  const updateDeliverable = useCallback((deliverable: Deliverable) => updateEntity('deliverables', deliverable, 'deliverables'), []);
  const updateObjective = useCallback((objective: Objective) => updateEntity('objectives', objective, 'objectives'), []);

  const addOutcome = useCallback((outcome: Outcome) => addEntity('outcomes', outcome, 'outcomes'), [activeOrgId]);
  const updateOutcome = useCallback((outcome: Outcome) => updateEntity('outcomes', outcome, 'outcomes'), []);
  const deleteOutcome = useCallback((id: string) => deleteEntity('outcomes', id, 'outcomes'), []);

  const addStakeholder = useCallback((stakeholder: Stakeholder) => addEntity('stakeholders', stakeholder, 'stakeholders'), [activeOrgId]);
  const updateStakeholder = useCallback((stakeholder: Stakeholder) => updateEntity('stakeholders', stakeholder, 'stakeholders'), []);
  const deleteStakeholder = useCallback((id: string) => deleteEntity('stakeholders', id, 'stakeholders'), []);

  const addOrgDocument = useCallback((doc: OrganizationDocument) => addEntity('org_documents', doc, 'org_documents'), [activeOrgId]);
  const updateOrgDocument = useCallback((doc: OrganizationDocument) => updateEntity('org_documents', doc, 'org_documents'), []);
  const deleteOrgDocument = useCallback((id: string) => deleteEntity('org_documents', id, 'org_documents'), []);

  const resetState = useCallback(() => {
    if (activeOrgId) fetchWorkspaceData(activeOrgId);
  }, [activeOrgId]);

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
