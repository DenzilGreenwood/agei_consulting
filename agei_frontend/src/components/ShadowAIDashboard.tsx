"use client";

import React, { useState } from 'react';
import { Activity, ShieldOff, ArrowRight, Server, Globe, Search, BookOpen, Ban } from 'lucide-react';

interface DiscoverySignal {
  id: string;
  source: string;
  endpoint: string;
  user: string;
  toolName: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

const mockSignals: DiscoverySignal[] = [
  { id: 'sig_1', source: 'Network Proxy', endpoint: 'api.openai.com', user: 'jdoe@org.com', toolName: 'ChatGPT Web', riskLevel: 'High', timestamp: '10 mins ago' },
  { id: 'sig_2', source: 'Endpoint Agent', endpoint: 'claude.ai', user: 'msmith@org.com', toolName: 'Claude 3', riskLevel: 'Medium', timestamp: '1 hour ago' },
  { id: 'sig_3', source: 'Browser Extension', endpoint: 'github.com/copilot', user: 'dev_team', toolName: 'GitHub Copilot', riskLevel: 'Low', timestamp: '2 hours ago' },
];

export default function ShadowAIDashboard() {
  const [signals, setSignals] = useState<DiscoverySignal[]>(mockSignals);

  const handleAction = (id: string, action: string) => {
    setSignals(signals.filter(s => s.id !== id));
    // In a real app, this would dispatch an action to the backend
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-white w-full max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-purple-500" />
            Shadow AI Routing Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Visualize discovery signals and route unsanctioned AI tools to governance workflows.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-gray-950 px-4 py-2 rounded-lg border border-gray-800 flex flex-col items-center">
            <span className="text-2xl font-bold text-red-400">12</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">High Risk</span>
          </div>
          <div className="bg-gray-950 px-4 py-2 rounded-lg border border-gray-800 flex flex-col items-center">
            <span className="text-2xl font-bold text-amber-400">45</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Active Signals</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {signals.map(signal => (
          <div key={signal.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-700 transition-colors">
            
            {/* Signal Details */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                signal.riskLevel === 'High' ? 'bg-red-500/10 text-red-500' :
                signal.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                <ShieldOff size={24} />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{signal.toolName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Server size={14}/> {signal.source}</span>
                  <span className="flex items-center gap-1"><Globe size={14}/> {signal.endpoint}</span>
                  <span>{signal.user}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t md:border-t-0 border-gray-800 pt-4 md:pt-0">
              <button 
                onClick={() => handleAction(signal.id, 'Educate')}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-sm flex items-center gap-1 transition-colors"
              >
                <BookOpen size={14} /> Educate
              </button>
              <button 
                onClick={() => handleAction(signal.id, 'Investigate')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-sm flex items-center gap-1 transition-colors"
              >
                <Search size={14} /> Investigate
              </button>
              <button 
                onClick={() => handleAction(signal.id, 'Restrict')}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm flex items-center gap-1 transition-colors"
              >
                <Ban size={14} /> Restrict
              </button>
            </div>

          </div>
        ))}

        {signals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No new discovery signals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
