'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SetupState, Organization, Principal, DynamicForm, DynamicFormSubmission } from './types';
import { initialSetupState } from './mockData';
import { supabase } from '../supabaseClient';

interface SetupContextProps {
  state: SetupState;
  addOrganization: (org: Organization) => void;
  addPrincipal: (prin: Principal) => void;
  addForm: (form: DynamicForm) => void;
  updateForm: (form: DynamicForm) => void;
  addSubmission: (sub: DynamicFormSubmission) => void;
  updateSettings: (settings: { sla_hours: number }) => void;
  resetState: () => void;
}

const SetupContext = createContext<SetupContextProps | undefined>(undefined);

export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SetupState>({
    organizations: [],
    principals: [],
    forms: [],
    submissions: [],
    settings: { sla_hours: 1 }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchInitialData = async () => {
    try {
      const { data: orgs } = await supabase.from('organizations').select('*');
      const { data: principals } = await supabase.from('principals').select('*');

      setState(prev => ({
        ...prev,
        organizations: orgs || [],
        principals: principals || []
      }));
    } catch (e) {
      console.error('Failed to fetch setup state from Supabase', e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const addOrganization = useCallback(async (org: Organization) => {
    const { error } = await supabase.from('organizations').insert({
      id: org.id,
      name: org.name,
      domain: org.domain
    });
    if (!error) {
      setState(prev => ({ ...prev, organizations: [org, ...prev.organizations] }));
    } else {
      console.error(error);
    }
  }, []);

  const addPrincipal = useCallback(async (prin: Principal) => {
    const { error } = await supabase.from('principals').insert({
      id: prin.id,
      organization_id: prin.organization_id,
      name: prin.name,
      email: prin.email,
      role: prin.role
    });
    if (!error) {
      setState(prev => ({ ...prev, principals: [prin, ...prev.principals] }));
    } else {
      console.error(error);
    }
  }, []);

  const addForm = useCallback((form: DynamicForm) => {
    setState(prev => ({ ...prev, forms: [form, ...prev.forms] }));
  }, []);

  const updateForm = useCallback((form: DynamicForm) => {
    setState(prev => ({
      ...prev,
      forms: prev.forms.map(f => (f.id === form.id ? form : f))
    }));
  }, []);

  const addSubmission = useCallback((sub: DynamicFormSubmission) => {
    setState(prev => ({ ...prev, submissions: [sub, ...prev.submissions] }));
  }, []);

  const updateSettings = useCallback((settings: { sla_hours: number }) => {
    setState(prev => ({ ...prev, settings }));
  }, []);

  const resetState = useCallback(() => {
    fetchInitialData();
  }, []);

  if (!isLoaded) return null;

  return (
    <SetupContext.Provider
      value={{
        state,
        addOrganization,
        addPrincipal,
        addForm,
        updateForm,
        addSubmission,
        updateSettings,
        resetState,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
};

export const useSetup = () => {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
};
