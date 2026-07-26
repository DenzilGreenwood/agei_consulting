import React from 'react';
import { Terminal, Shield, Lock, Activity } from 'lucide-react';

interface TelemetryIngestionProps {
  isSanitized: boolean;
  isSanitizing: boolean;
  onToggleSanitization: () => void;
}

export default function TelemetryIngestion({
  isSanitized,
  isSanitizing,
  onToggleSanitization
}: TelemetryIngestionProps) {
  const rawJson = `{
  "timestamp": "2026-07-25T14:02:11Z",
  "employee_id": "EMP-DESK-998",
  "source": "browser_extension",
  "target_domain": "api.prohibited-translation-bot.net",
  "raw_prompt": "REDACTED_PRIVACY_BOUNDARY: CONFIDENTIAL: Patient John Doe, DOB 1982-11-20, diagnosed with Stage II Lymphoma, prescribed chemotherapy..."
}`;

  const sanitizedJson = `{
  "timestamp": "2026-07-25T14:02:11Z",
  "employee_id": "EMP-DESK-998",
  "source": "browser_extension",
  "target_domain": "api.prohibited-translation-bot.net",
  "discovery_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}`;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="h-14 border-b border-border bg-muted px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm text-foreground">Step 1: Telemetry Signal</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Ingestion Pane
          </span>
          <Activity className="h-4 w-4 text-warning animate-pulse" />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 bg-background">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground font-semibold">Live Intercepted Payload</p>
          <button
            onClick={onToggleSanitization}
            disabled={isSanitizing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              isSanitized
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-primary text-primary-foreground shadow-md hover:opacity-90'
            }`}
          >
            {isSanitized ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            {isSanitized ? 'Sanitization Active' : 'Run Privacy Sanitizer'}
          </button>
        </div>

        <div className="relative flex-1 bg-muted rounded-lg border border-border p-4 font-mono text-xs overflow-hidden">
          {isSanitizing && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <div className="w-full h-1 bg-primary animate-pulse shadow-[0_0_15px_rgba(2,132,199,0.8)] absolute top-1/2 transform -translate-y-1/2 rounded-full overflow-hidden">
                <div className="h-full bg-white w-1/3 animate-[translateX_1s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          
          <pre className={`text-muted-foreground whitespace-pre-wrap transition-opacity duration-300 ${isSanitizing ? 'opacity-30' : 'opacity-100'}`}>
            {isSanitized ? sanitizedJson : rawJson}
          </pre>
        </div>

        <div className="bg-info/10 border border-info/20 p-3 rounded-lg flex items-start gap-2">
          <Shield className="h-4 w-4 text-info mt-0.5 shrink-0" />
          <p className="text-[11px] text-foreground leading-relaxed">
            <strong className="text-info">Hash-Only Retention Mode:</strong> The raw prompt is never stored in the database. It is instantly replaced with a SHA-256 cryptographic hash, completely removing GDPR secondary liability.
          </p>
        </div>
      </div>
    </div>
  );
}
