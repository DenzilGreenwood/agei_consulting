"use client";

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, FileJson, Clock, Link as LinkIcon, Database } from 'lucide-react';

interface Receipt {
  id: string;
  gate_id: string;
  decision: string;
  timestamp: string;
  hash: string;
  parentHash: string;
  verified: boolean;
  type: string;
}

const mockReceipts: Receipt[] = [
  {
    id: "rcpt_1",
    gate_id: "gate_deployment_approval",
    decision: "Approve",
    timestamp: "2026-07-24T10:00:00Z",
    hash: "sha256:a1b2c3d4...",
    parentHash: "sha256:00000000...",
    verified: true,
    type: "Deployment"
  },
  {
    id: "rcpt_2",
    gate_id: "gate_runtime_anomaly",
    decision: "Approve",
    timestamp: "2026-07-24T10:05:00Z",
    hash: "sha256:e5f6g7h8...",
    parentHash: "sha256:a1b2c3d4...",
    verified: true,
    type: "Runtime Eval"
  },
  {
    id: "rcpt_3",
    gate_id: "gate_shadow_ai_detect",
    decision: "Deny",
    timestamp: "2026-07-24T10:15:00Z",
    hash: "sha256:x9y8z7w6...",
    parentHash: "sha256:e5f6g7h8...",
    verified: false,
    type: "Shadow AI"
  }
];

export default function VerifiableTimeline() {
  const [receipts] = useState<Receipt[]>(mockReceipts);

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-white w-full max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            Verifiable Timeline
          </h2>
          <p className="text-gray-400 mt-1">Chronological visualization of the Merkle receipt chain.</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 text-sm flex items-center gap-2">
          <Database size={16} /> Merkle Root: sha256:root99x...
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
        {receipts.map((receipt, index) => (
          <div key={receipt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-gray-900 text-gray-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#111827] z-10">
              {receipt.verified ? (
                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              ) : (
                <AlertTriangle className="text-amber-500 w-5 h-5" />
              )}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  {receipt.type}
                </span>
                <time className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(receipt.timestamp).toLocaleTimeString()}
                </time>
              </div>
              <div className="text-lg font-medium text-gray-100 mb-2">
                Gate: {receipt.gate_id}
              </div>
              
              <div className="space-y-2 mt-4 text-xs font-mono">
                <div className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                  <span className="text-gray-500 flex items-center gap-1"><LinkIcon size={12} /> Parent:</span>
                  <span className="text-gray-400 truncate w-32">{receipt.parentHash}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                  <span className="text-gray-500 flex items-center gap-1"><FileJson size={12} /> Hash:</span>
                  <span className="text-emerald-400/80 truncate w-32">{receipt.hash}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
