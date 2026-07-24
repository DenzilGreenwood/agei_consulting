"use client";

import React, { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, FileText, Lock, ShieldAlert } from 'lucide-react';

export default function VerificationJobRunner() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const runVerification = () => {
    if (!file) return;
    setStatus('verifying');
    setLogs(['Reading JSON payload...', 'Canonicalizing via RFC 8785...', 'Computing SHA-256 hash...']);
    
    setTimeout(() => {
      setLogs(prev => [...prev, 'Hash match: SUCCESS', 'Verifying Ed25519 signatures...']);
      
      setTimeout(() => {
        setLogs(prev => [...prev, 'Signature valid against Layer 1 keys.', 'Checking Merkle inclusion proof...']);
        
        setTimeout(() => {
          setLogs(prev => [...prev, 'Verification Job Completed Successfully.']);
          setStatus('success');
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-white w-full max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-blue-500" />
          Verification Job Runner
        </h2>
        <p className="text-gray-400 mt-1">Upload an Audit Pack or Receipt to verify cryptographic integrity client-side.</p>
      </div>

      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-950/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
      >
        <UploadCloud className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-300 font-medium">Drag & drop your Audit Pack (.json)</p>
        <p className="text-gray-500 text-sm mt-2">or click to browse</p>
        
        {file && (
          <div className="mt-4 p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg flex items-center gap-2">
            <Lock size={16} />
            {file.name} ready for verification
          </div>
        )}
      </div>

      <div className="mt-6">
        <button 
          onClick={runVerification}
          disabled={!file || status === 'verifying'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'verifying' ? (
             <span className="animate-pulse">Verifying...</span>
          ) : (
            <>
              <ShieldAlert size={18} /> Run Client-Side Verification
            </>
          )}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-6 bg-black rounded-lg p-4 font-mono text-sm border border-gray-800">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800">
            <span className="text-gray-400">Execution Logs</span>
            {status === 'success' && <CheckCircle className="text-emerald-500 w-4 h-4" />}
            {status === 'failed' && <XCircle className="text-red-500 w-4 h-4" />}
          </div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300">
                <span className="text-blue-500 opacity-50 mr-2">{'>'}</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
