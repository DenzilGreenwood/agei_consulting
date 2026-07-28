'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { useSetup } from '@/lib/setup/SetupContext';
import { Users, Target, Activity, FileDown, AlertTriangle, Clock } from 'lucide-react';

export default function WorkspaceDashboard() {
  const { state } = useWorkspace();
  const { state: setupState } = useSetup();
  const [activeOrgName, setActiveOrgName] = useState("Client X");

  useEffect(() => {
    const activeOrgId = localStorage.getItem('cpos_active_org_id');
    if (activeOrgId) {
      const org = setupState.organizations.find(o => o.id === activeOrgId);
      if (org) setActiveOrgName(org.name);
    }
  }, [setupState.organizations]);

  // 1. Metrics Strip Calculations
  const totalStakeholders = state.stakeholders.length;
  const totalCapsules = state.capsules.length;
  
  const totalCriteria = state.objectives.reduce((sum, obj) => sum + obj.success_criteria.length, 0);
  const completedCriteria = state.objectives.reduce((sum, obj) => sum + obj.success_criteria.filter(sc => sc.is_completed).length, 0);
  const objectiveCompletionPercent = totalCriteria === 0 ? 0 : Math.round((completedCriteria / totalCriteria) * 100);

  const deliverablesDraft = state.deliverables.filter(d => d.status === 'Draft').length;
  const deliverablesReview = state.deliverables.filter(d => d.status === 'Review').length;
  const deliverablesDelivered = state.deliverables.filter(d => d.status === 'Delivered').length;

  // 2. Incident/Risk Monitor
  const highPriorityCapsules = state.capsules
    .filter(c => c.capsule_type === 'Risk' || c.capsule_type === 'Issue')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 3. Recent Activity Ticker
  const recentActivity = [
    ...state.journals.map(j => ({ ...j, type: 'Journal', date: new Date(j.created_at) })),
    ...state.capsules.map(c => ({ ...c, type: 'Capsule', date: new Date(c.created_at) }))
  ]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 5);

  // 4. Stakeholder Quick Stats
  const highPowerChampions = state.stakeholders.filter(s => s.influence === 'High' && (s.champion_status === 'Strong Champion' || s.champion_status === 'Supportive'));
  const highPowerSkeptics = state.stakeholders.filter(s => s.influence === 'High' && (s.champion_status === 'Skeptical' || s.champion_status === 'Opposed'));

  // 5. Organization Info
  const activeIntake = (state.org_documents || []).find(d => d.type === 'Intake Submission');
  const orgName = activeIntake?.template_variables?.organization_name || activeOrgName;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Engagement Dashboard</h1>
        <p className="text-sm text-muted-foreground">Claims Triage AI {orgName} Engagement</p>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-primary/10 p-3 rounded-lg"><Users className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Stakeholders</p>
            <p className="text-2xl font-bold">{totalStakeholders}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-primary/10 p-3 rounded-lg"><Activity className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Capsules</p>
            <p className="text-2xl font-bold">{totalCapsules}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-500/10 p-3 rounded-lg"><Target className="h-6 w-6 text-emerald-500" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Objective Progress</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{objectiveCompletionPercent}%</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-primary/10 p-3 rounded-lg"><FileDown className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Deliverables</p>
            <p className="text-sm font-semibold">
              <span className="text-muted-foreground">{deliverablesDraft} Draft</span> •{' '}
              <span className="text-amber-500">{deliverablesReview} Review</span> •{' '}
              <span className="text-emerald-500">{deliverablesDelivered} Final</span>
            </p>
          </div>
        </div>
      </div>

      {/* Top 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stakeholder Matrix Overview */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" /> Engagement Matrix
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3">
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">High Power Champions</p>
              <div className="text-2xl font-bold">{highPowerChampions.length}</div>
            </div>
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-600 uppercase mb-1">High Power Skeptics</p>
              <div className="text-2xl font-bold">{highPowerSkeptics.length}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Key Executive Sponsors</p>
            {state.stakeholders.filter(s => s.role_type === 'Executive Sponsor').map(s => (
              <div key={s.id} className="flex justify-between items-center bg-muted/30 p-2 rounded-md border border-border">
                <span className="text-sm font-medium">{s.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  s.champion_status.includes('Champion') || s.champion_status === 'Supportive' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : s.champion_status.includes('Skeptical') || s.champion_status === 'Opposed'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {s.champion_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Gauge & Objectives */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Active Objectives
          </h2>
          <div className="flex justify-center mb-6">
            <div className="relative h-32 w-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-muted" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="56" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  strokeDasharray={351.8} 
                  strokeDashoffset={351.8 - (351.8 * objectiveCompletionPercent) / 100}
                  className="text-emerald-500 transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{objectiveCompletionPercent}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {state.objectives.map(obj => {
              const comp = obj.success_criteria.filter(sc => sc.is_completed).length;
              const tot = obj.success_criteria.length;
              const pct = tot === 0 ? 0 : Math.round((comp/tot)*100);
              return (
                <div key={obj.id} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="truncate font-medium pr-2">{obj.title}</span>
                    <span className="text-muted-foreground">{comp}/{tot}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Incident/Risk Monitor */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" /> Risk & Issue Monitor
          </h2>
          {highPriorityCapsules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active risks or issues.</p>
          ) : (
            <div className="space-y-3">
              {highPriorityCapsules.map(cap => (
                <div key={cap.id} className="border border-border rounded-lg p-3 bg-muted/20">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm truncate pr-2">{cap.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cap.capsule_type === 'Risk' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {cap.capsule_type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{cap.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity Ticker */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Recent Activity
          </h2>
          <div className="relative border-l border-muted ml-3 space-y-6">
            {recentActivity.map((act, i) => (
              <div key={i} className="pl-6 relative">
                <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ring-4 ring-card ${
                  act.type === 'Journal' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <p className="font-semibold text-sm">
                  {act.type === 'Journal' ? 'New Journal Entry' : `Capsule Promoted: ${(act as any).capsule_type}`}
                </p>
                <p className="text-sm mt-1">{act.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {act.date.toLocaleDateString()} {act.date.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
