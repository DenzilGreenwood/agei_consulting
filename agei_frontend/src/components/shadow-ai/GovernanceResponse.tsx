import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Key, Eye } from 'lucide-react';

interface GovernanceResponseProps {
  isSanitized: boolean;
  isSanitizing: boolean;
}

export default function GovernanceResponse({ isSanitized, isSanitizing }: GovernanceResponseProps) {
  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-opacity duration-300">
      <div className="h-14 border-b border-border bg-muted px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm text-foreground">Step 3: Governance Response</h2>
        </div>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Remediation
        </span>
      </div>

      <div className={`flex-1 p-4 flex flex-col gap-4 bg-background ${!isSanitized && !isSanitizing ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        
        {/* User Screen Mock */}
        <div>
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">User's Screen (Intercepted)</h4>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono ml-2">api.prohibited-translation-bot.net</span>
            </div>
            <div className="bg-background p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Action Paused</h3>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">This public AI tool is unapproved for confidential code. Please use the secure enterprise portal.</p>
              </div>
              <button className="mt-2 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1.5 rounded shadow">
                Migrate to Secure Chat
              </button>
            </div>
          </div>
        </div>

        {/* Cryptographic Receipt */}
        <div className="mt-auto">
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Non-Repudiable Evidence</h4>
          <div className="bg-muted border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" /> Generated Discovery Receipt
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">public.receipts</span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Receipt UUID</span>
                <span className="text-[10px] text-primary font-mono">rcpt_74fa293c...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Lock className="h-2.5 w-2.5"/> Canonicalization</span>
                <span className="text-[10px] text-foreground font-mono">RFC 8785 JSON</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Key className="h-2.5 w-2.5"/> Ed25519 System Key</span>
                <span className="text-[10px] text-foreground font-mono">kms-key-us-east...</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
