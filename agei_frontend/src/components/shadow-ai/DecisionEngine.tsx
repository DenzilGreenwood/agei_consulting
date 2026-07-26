import React from 'react';
import { Database, AlertTriangle, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

interface DecisionEngineProps {
  isSanitized: boolean;
  isSanitizing: boolean;
}

export default function DecisionEngine({ isSanitized, isSanitizing }: DecisionEngineProps) {
  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-opacity duration-300">
      <div className="h-14 border-b border-border bg-muted px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm text-foreground">Step 2: Risk Classification</h2>
        </div>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Decision Engine
        </span>
      </div>

      <div className={`flex-1 p-4 flex flex-col gap-4 bg-background ${!isSanitized && !isSanitizing ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        
        {/* Evaluation Logic Cards */}
        <div className="space-y-3">
          <div className="p-3 bg-muted border border-border rounded-lg flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">Target Domain</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-foreground bg-card px-2 py-1 border border-border rounded">api.prohibited-translation-bot.net</span>
              <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">PROHIBITED</span>
            </div>
          </div>
          
          <div className="p-3 bg-muted border border-border rounded-lg flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">Data Sensitivity Hint</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> CONFIDENTIAL_SOURCE_CODE
              </span>
            </div>
          </div>
        </div>

        {/* Computed Risk */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-destructive font-semibold uppercase tracking-widest">Calculated Risk Level</p>
            <h3 className="text-2xl font-bold text-destructive flex items-center gap-2 mt-1">
              <ShieldAlert className="h-6 w-6" /> HIGH RISK
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Policy Action Triggered</p>
            <p className="text-xs font-bold text-foreground">IMMEDIATE BLOCK</p>
          </div>
        </div>

        {/* Database Mapping */}
        <div className="mt-auto">
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
            <Database className="h-3.5 w-3.5" /> Database Table Mapping
          </h4>
          <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="text-primary font-bold">INSERT INTO</span> public.shadow_ai_discovery_records
            </div>
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="text-primary font-bold">INSERT INTO</span> public.shadow_ai_classifications
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
