'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SetupState, Organization, Principal, DynamicForm, DynamicFormSubmission } from './types';
import { initialSetupState } from './mockData';

interface SetupContextProps {
  state: SetupState;
  addOrganization: (org: Organization) => void;
  addPrincipal: (prin: Principal) => void;
  addForm: (form: DynamicForm) => void;
  updateForm: (form: DynamicForm) => void;
  addSubmission: (sub: DynamicFormSubmission) => void;
  resetState: () => void;
}

const SetupContext = createContext<SetupContextProps | undefined>(undefined);

export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SetupState>(initialSetupState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cpos_setup_state');
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored setup state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cpos_setup_state', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addOrganization = useCallback((org: Organization) => {
    setState(prev => ({ ...prev, organizations: [org, ...prev.organizations] }));
  }, []);

  const addPrincipal = useCallback((prin: Principal) => {
    setState(prev => ({ ...prev, principals: [prin, ...prev.principals] }));
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

  const resetState = useCallback(() => {
    setState(initialSetupState);
    localStorage.removeItem('cpos_setup_state');
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
