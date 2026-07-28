'use client';

import React, { useState } from 'react';
import { useSetup } from '@/lib/setup/SetupContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Settings, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { state, updateSettings } = useSetup();
  const [slaHours, setSlaHours] = useState(state.settings?.sla_hours || 1);

  const handleSave = () => {
    updateSettings({ sla_hours: slaHours });
    alert('Global settings saved successfully!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Global Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage platform-wide configurations and thresholds.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Pipeline SLA (Service Level Agreement)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Configure how long an Intake Submission can sit in the "New" state before triggering a breach warning in the Discovery Console.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">SLA Threshold (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="bg-background border border-input rounded-md px-3 py-2 w-full max-w-[200px] text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>
              <button 
                onClick={handleSave}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
