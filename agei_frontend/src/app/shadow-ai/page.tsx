"use client";

import React, { useState } from 'react';
import TelemetryIngestion from '@/components/shadow-ai/TelemetryIngestion';
import DecisionEngine from '@/components/shadow-ai/DecisionEngine';
import GovernanceResponse from '@/components/shadow-ai/GovernanceResponse';

export default function ShadowAIPage() {
  const [isSanitized, setIsSanitized] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);

  const handleToggleSanitization = () => {
    if (isSanitized) {
      setIsSanitized(false);
      return;
    }
    
    setIsSanitizing(true);
    // Simulate the engine processing delay
    setTimeout(() => {
      setIsSanitized(true);
      setIsSanitizing(false);
    }, 1200);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-full min-h-[calc(100vh-4rem)]">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Privacy-Preserving Telemetry Console</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Observe how the Shadow AI Discovery Engine intercepts unmanaged AI usage, instantly sanitizes sensitive payloads into non-reversible hashes, and triggers proportionate, policy-driven remediation workflows.
        </p>
      </div>

      {/* 3-Column Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        <TelemetryIngestion 
          isSanitized={isSanitized} 
          isSanitizing={isSanitizing} 
          onToggleSanitization={handleToggleSanitization} 
        />
        <DecisionEngine 
          isSanitized={isSanitized} 
          isSanitizing={isSanitizing} 
        />
        <GovernanceResponse 
          isSanitized={isSanitized} 
          isSanitizing={isSanitizing} 
        />
      </div>

    </div>
  );
}
