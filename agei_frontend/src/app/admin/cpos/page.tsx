'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardMetrics } from '@/app/actions/cpos-enterprise-actions';
import { Target, Activity, ShieldCheck, Database, Calendar, Users, Briefcase, CheckCircle2, CircleDashed } from 'lucide-react';

export default function CPOSEnterpriseDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Dummy org ID for now
      const result = await getDashboardMetrics('00000000-0000-0000-0000-000000000000');
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading CPOS Enterprise Data...</div>;
  }

  // Fallback data for the mockup UI
  const health = data?.engagement?.health || 'Green';
  const phase = data?.engagement?.phase || 'Design_Align';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">CPOS Enterprise Delivery Cockpit</h1>
            <p className="text-muted-foreground mt-1">Multi-Tenant Advisory & Software Implementation Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/cpos/intake" className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">
            Start New Intake
          </Link>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Engagement Health</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`h-3 w-3 rounded-full ${health === 'Green' ? 'bg-emerald-500' : health === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              <span className="font-semibold">{health}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Objectives Widget */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Active Objectives</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Current Phase</span>
              <span className="font-medium px-2 py-1 bg-primary/10 text-primary rounded">{phase.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className="font-medium">45% ($42.5k / $95k)</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Next Milestone</span>
              <span className="font-medium text-emerald-600">GOM_Signoff</span>
            </div>
          </div>
        </div>

        {/* Adoption & Perimeter Gauge */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Adoption & Perimeter</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Governed API Throughput</span>
              <span className="font-bold text-emerald-500">92.4%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92.4%' }}></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted/30 p-3 rounded-md text-center">
                <p className="text-2xl font-bold">14</p>
                <p className="text-xs text-muted-foreground">Governed Models</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-md text-center">
                <p className="text-2xl font-bold text-amber-500">3</p>
                <p className="text-xs text-muted-foreground">Shadow Tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Plan */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Stakeholder Comm Plan</h2>
          </div>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-3">
              <p className="text-sm font-semibold flex items-center justify-between">
                Marcus Vance (CISO)
                <span className="text-xs bg-muted px-2 py-1 rounded">Weekly</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Slack Webhook: Shadow AI Alert</p>
            </div>
            <div className="border border-border rounded-lg p-3">
              <p className="text-sm font-semibold flex items-center justify-between">
                Sarah Jenkins (GC)
                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">Phase</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sign-off: Magic Link Pending</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deployment Status Timeline */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">On-Prem Deployment Pipeline</h2>
          </div>
          <div className="relative border-l border-muted ml-3 space-y-6">
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-card"></div>
              <p className="font-semibold text-sm">Development Env</p>
              <p className="text-xs text-muted-foreground mt-1">Schema v1.4.2 Installed • Sidecar Active</p>
            </div>
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-card"></div>
              <p className="font-semibold text-sm">Staging Env</p>
              <p className="text-xs text-muted-foreground mt-1">Schema v1.4.2 Installed • Gate Definitions Synced</p>
            </div>
            <div className="pl-6 relative">
              <div className="absolute w-3 h-3 bg-muted rounded-full -left-[6.5px] top-1.5 ring-4 ring-card"></div>
              <p className="font-semibold text-sm text-muted-foreground">Production Env</p>
              <p className="text-xs text-muted-foreground mt-1">Pending UAT Sign-off</p>
            </div>
          </div>
        </div>

        {/* UAT Cycle Tracker */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">UAT Cycle Tracker</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 border border-border rounded-lg bg-muted/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Verify GDPR Crypto-Shredding Trigger</p>
                  <p className="text-xs text-muted-foreground mt-1">Tested by: Aris Thorne • Target Gate: prod_promotion_1</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">Approved</span>
            </div>
            <div className="flex items-start justify-between p-3 border border-border rounded-lg bg-muted/20">
              <div className="flex items-start gap-3">
                <CircleDashed className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Agent Tool Bounding Check CLM-5000</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending Client Execution in Staging</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded">Pending</span>
            </div>
            <div className="flex items-start justify-between p-3 border border-border rounded-lg bg-muted/20 opacity-60">
              <div className="flex items-start gap-3">
                <CircleDashed className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">External Cloud Attestation Sink Validation</p>
                  <p className="text-xs text-muted-foreground mt-1">Blocked by firewall exceptions</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">Blocked</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
