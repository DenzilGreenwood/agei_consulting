import React from 'react';
import { Bot } from 'lucide-react';

interface SidebarProps {
  currentStepIndex: number;
  handleStepChange: (index: number) => void;
  assuranceProfile: string;
  setAssuranceProfile: (profile: 'profile-1' | 'profile-2' | 'profile-3') => void;
  activePolicySet: string;
  setActivePolicySet: (policy: string) => void;
}

export default function Sidebar({
  currentStepIndex,
  handleStepChange,
  assuranceProfile,
  setAssuranceProfile,
  activePolicySet,
  setActivePolicySet
}: SidebarProps) {
  return (
    <>
    {/* ==========================================
          SIDEBAR: Workspace Configuration
          ========================================== */}
      <div className="w-80 border-r border-border bg-card flex flex-col justify-between">
        <div className="p-4 flex flex-col gap-6">
          {/* Logo & Category Branding */}
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-lg shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-foreground">CognitiveInsight</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AGEI Governed Workspace
              </span>
            </div>
          </div>

          {/* Core Demo Navigation */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
              Interactive Scenarios
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleStepChange(0)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  currentStepIndex === 0
                    ? 'bg-primary text-primary-foreground shadow-md border-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  <span className="text-xs bg-muted text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                  Image & Privacy Bounds
                </div>
                <p className="text-[11px] mt-1 leading-relaxed pl-7">
                  PII Isolation & Envelope Encryption Key Shredding.
                </p>
              </button>

              <button
                onClick={() => handleStepChange(1)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  currentStepIndex === 1
                    ? 'bg-primary text-primary-foreground shadow-md border-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  <span className="text-xs bg-muted text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                  Multi-Agent Authority
                </div>
                <p className="text-[11px] mt-1 leading-relaxed pl-7">
                  Recursive delegation chain checks & scoped tools.
                </p>
              </button>

              <button
                onClick={() => handleStepChange(2)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  currentStepIndex === 2
                    ? 'bg-primary text-primary-foreground shadow-md border-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  <span className="text-xs bg-muted text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold">3</span>
                  Document Release
                </div>
                <p className="text-[11px] mt-1 leading-relaxed pl-7">
                  Watermarking, Dual-State hashing & Audit Packs.
                </p>
              </button>
            </div>
          </div>

          {/* GTM Alignment: Pricing / Assurance Profiles */}
          <div className="border-t border-border pt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Assurance Profile Strength
            </label>
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setAssuranceProfile('profile-1')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  assuranceProfile === 'profile-1'
                    ? 'bg-warning/90 text-warning-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Profile 1: Lightweight Operational Metadata Hashing"
              >
                Profile 1
              </button>
              <button
                onClick={() => setAssuranceProfile('profile-2')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  assuranceProfile === 'profile-2'
                    ? 'bg-primary/90 text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Profile 2: Ed25519-Signed Receipts & Gate Metrics"
              >
                Profile 2
              </button>
              <button
                onClick={() => setAssuranceProfile('profile-3')}
                className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                  assuranceProfile === 'profile-3'
                    ? 'bg-secondary/90 text-secondary-foreground shadow border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Profile 3: Merkle Batched, Envelope-Encrypted, HSM Sealed"
              >
                Profile 3
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed bg-muted p-2.5 rounded border border-border">
              {assuranceProfile === 'profile-1' && "💡 Profile 1: Basic validation metrics and SHA-256 event integrity logs. Retained in internal operational db."}
              {assuranceProfile === 'profile-2' && "🔒 Profile 2: B2B Audit Readiness. Complete Ed25519 payload signatures tied to your GRC compliance rules."}
              {assuranceProfile === 'profile-3' && "👑 Profile 3: Courtroom Defensible. Envelope encrypted (GDPR-safe), Merkle tree batched, locked in secure assertion vault."}
            </div>
          </div>

          {/* Active Regulatory Ruleset Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Active Policy ruleset
            </label>
            <select
              value={activePolicySet}
              onChange={(e) => setActivePolicySet(e.target.value)}
              className="w-full bg-muted border border-border text-xs rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="g1">EU AI Act (Article 12 Logging & Oversight)</option>
              <option value="g2">NIST AI Risk Management Framework (Govern)</option>
              <option value="g3">ISO/IEC 42001 (Continuous Technical Auditing)</option>
            </select>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border text-[10px] text-muted-foreground bg-muted flex flex-col gap-1">
          <p>© 2026 CognitiveInsight LLC.</p>
          <p>Licensed under BUSL-1.1.</p>
        </div>
      </div>
    </>
  );
}
