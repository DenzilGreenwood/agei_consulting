'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export default function CPOSIntakeForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    organizationId: '00000000-0000-0000-0000-000000000000', // Mock org
    submittedBy: '11111111-1111-1111-1111-111111111111', // Mock user
    privilegeModelScore: 1,
    privilegeModelNotes: '',
    enforcementFidelityScore: 1,
    enforcementFidelityNotes: '',
    evidentiaryIntegrityScore: 1,
    evidentiaryIntegrityNotes: '',
    downstreamProvenanceScore: 1,
    downstreamProvenanceNotes: '',
    perimeterPrivacyScore: 1,
    perimeterPrivacyNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Score') ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/cpos/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/cpos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CPOS Dashboard
        </Link>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-full mt-1 flex-shrink-0">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Phase 1: High-Assurance Strategic GRC Intake Form
          </h1>
          <p className="text-muted-foreground text-sm">
            Evaluate client maturity across 5 operational and cryptographic lobes.
          </p>
        </div>
      </div>

      {result ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Intake Submitted Successfully</h2>
          <p className="text-muted-foreground mb-6">Maturity Benchmarking Complete.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Aggregate Score</p>
              <p className="text-2xl font-bold">{result.aggregateScore.toFixed(1)} / 3.0</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Assurance Profile</p>
              <p className="text-lg font-bold text-primary">{result.resolvedProfile}</p>
            </div>
          </div>
          
          <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-6">{result.recommendedAction}</p>
          
          <button onClick={() => setResult(null)} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">
            Start New Assessment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Lobe 1 */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Lobe 1: Identity & Ambient Privilege boundaries</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">
              "Does your AI system operate under broad, static ambient system privileges, or do you enforce just-in-time, scoped cryptographic delegations?"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">Assurance Score</label>
                <select 
                  name="privilegeModelScore"
                  value={formData.privilegeModelScore}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Low (Ambient Privileges)</option>
                  <option value={2}>2 - Mid (Some Delegation)</option>
                  <option value={3}>3 - High (Cryptographic Delegation)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Consultant Notes</label>
                <textarea 
                  name="privilegeModelNotes"
                  value={formData.privilegeModelNotes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Document current state..."
                />
              </div>
            </div>
          </div>

          {/* Lobe 2 */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Lobe 2: Policy Enforcement Fidelity</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">
              "Are your AI risk boundaries defined as un-evaluable human prose, or programmatically hardcoded as database-enforced runtime policy gates?"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">Assurance Score</label>
                <select 
                  name="enforcementFidelityScore"
                  value={formData.enforcementFidelityScore}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Low (PDF Policies)</option>
                  <option value={2}>2 - Mid (Some Software Gates)</option>
                  <option value={3}>3 - High (Runtime Gates)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Consultant Notes</label>
                <textarea 
                  name="enforcementFidelityNotes"
                  value={formData.enforcementFidelityNotes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Lobe 3 */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Lobe 3: Evidentiary Integrity</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">
              "Do your compliance verification systems rely on mutable database logs, or do they generate cryptographically signed receipts?"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">Assurance Score</label>
                <select 
                  name="evidentiaryIntegrityScore"
                  value={formData.evidentiaryIntegrityScore}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Low (Mutable Logs)</option>
                  <option value={2}>2 - Mid (WORM Storage)</option>
                  <option value={3}>3 - High (Merkle Anchored Receipts)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Consultant Notes</label>
                <textarea 
                  name="evidentiaryIntegrityNotes"
                  value={formData.evidentiaryIntegrityNotes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Lobe 4 */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Lobe 4: Downstream Provenance & Asset Custody</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">
              "When AI outputs leave your environment, do they rely on strip-prone metadata tags, or dual-state cryptographic content hashes?"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">Assurance Score</label>
                <select 
                  name="downstreamProvenanceScore"
                  value={formData.downstreamProvenanceScore}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Low (Watermarks/Tags)</option>
                  <option value={2}>2 - Mid (Hash Tracking)</option>
                  <option value={3}>3 - High (Dual-State Hashing)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Consultant Notes</label>
                <textarea 
                  name="downstreamProvenanceNotes"
                  value={formData.downstreamProvenanceNotes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Lobe 5 */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Lobe 5: Perimeter Discovery and Privacy Posture</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">
              "Does your discovery system hoard plaintext prompts, or does it enforce a privacy-preserving 'Hash-Only' content retention model?"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2">Assurance Score</label>
                <select 
                  name="perimeterPrivacyScore"
                  value={formData.perimeterPrivacyScore}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Low (Hoards Plaintext)</option>
                  <option value={2}>2 - Mid (Blocks, No Telemetry)</option>
                  <option value={3}>3 - High (Hash-Only Ingest)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2">Consultant Notes</label>
                <textarea 
                  name="perimeterPrivacyNotes"
                  value={formData.perimeterPrivacyNotes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Submitting & Profiling...' : 'Submit Phase 1 Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
