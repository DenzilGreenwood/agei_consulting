const fs = require('fs');

const eventsData = fs.readFileSync('scratch/events_data.tsx', 'utf-8');

const finalFileContent = `import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { FileText, ChevronRight, ChevronDown, Code, Database, ShieldCheck, FileJson, Server, Info } from 'lucide-react';

export const metadata = {
  title: 'Documentation Hub | AGEI',
  description: 'Technical blueprints and design specifications.',
};

${eventsData}

export default function DocsIndexPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Developer Reference: AGEI AI Event Payload Specification
        </h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-3xl">
          <strong>AI Governance Evidence Infrastructure (AGEI) — API & Schema Contract Guide</strong><br />
          <strong>Author:</strong> Denzil Greenwood, Founder & Principal Researcher<br />
          <strong>Date:</strong> July 2026
        </p>
      </div>

      {/* Intro Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 border-b border-border pb-2">
              <Server className="h-6 w-6 text-primary" />
              1. Architectural Overview & The "Proof, Not Logs" Invariant
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              This document serves as the canonical Developer Reference Page for implementing event logging and cryptographic receipt generation within the AI Governance Evidence Infrastructure (AGEI) [92].
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Traditional enterprise setups rely on flat, mutable text logs (e.g., SIEM, APM, or syslog) that are vulnerable to administrative tampering, database overrides, and retrospective alteration [93, 163, 478]. Under the <strong>"Proof, Not Logs"</strong> paradigm, every critical AI lifecycle transition and autonomous agent interaction is captured as a cryptographically signed, immutable Receipt [165, 314, 338].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 border-b border-border pb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              2. The Cryptographic Evidence Envelope Standard
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Every API transaction submitted to the AI Governance Evidence Portal backend must wrap the domain-specific data in a standard cryptographic envelope [251, 260]. This ensures that verification utilities can programmatically unpack, re-hash, and verify the signatures of any receipt without knowledge of the underlying database schema [481, 484].
            </p>
            
            <details className="group border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              <summary className="flex items-center justify-between p-4 cursor-pointer bg-muted/40 hover:bg-muted/80 transition-colors font-mono text-sm font-semibold select-none">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <span>View Base Envelope Schema</span>
                </div>
                <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180 text-muted-foreground" />
              </summary>
              <div className="p-4 bg-black/5 dark:bg-black/40 overflow-x-auto text-xs text-foreground">
<pre><code>{\`{
  "receipt_metadata": {
    "receipt_id": "rcpt:org-123:stage-code:uuid-string",
    "receipt_type": "type_of_receipt_event",
    "canonicalization_version": "agei-json-v1",
    "schema_version_id": "schema-uuid-from-registry",
    "hash_algorithm": "sha256",
    "signature_algorithm": "ED25519",
    "signing_key_id": "signing-key-uuid",
    "signed_by_principal_id": "principal-uuid",
    "signed_at": "2026-07-24T13:30:00Z"
  },
  "event_context": {
    "organization_id": "org-uuid",
    "lifecycle_stage": "governance_lifecycle_stage_code",
    "gate_evaluation_id": "gate-evaluation-uuid-or-null",
    "policy_version_id": "policy-version-uuid-or-null",
    "resource_type": "evaluated_resource_type",
    "resource_id": "evaluated_resource_id"
  },
  "payload": {
    "//... Specific Event-Type Payload Details (Mapped Below) ...//"
  },
  "cryptographic_proof": {
    "content_hash": "sha256:d8e8f8...",
    "signature": "eddsa-ed25519:signature-hash-string",
    "merkle_proof": {
      "batch_id": "batch-uuid",
      "index": 42,
      "proof_path": ["sha256:hash1", "sha256:hash2"]
    }
  }
}\`}</code></pre>
              </div>
            </details>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              The Core Cryptographic Sequence
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              To satisfy rigorous regulatory and courtroom-ready standards (Assurance Profile 3) [132, 135], every event-type payload follows an out-of-band cryptographic pipeline [522]:
            </p>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
              <li><strong>Extraction:</strong> The active system state is compiled into a raw JSON object.</li>
              <li><strong>Canonicalization:</strong> The JSON payload is serialized according to RFC 8785 (Canonical JSON) to enforce deterministic key ordering, line-ending treatment, and spacing [517].</li>
              <li><strong>Hashing:</strong> A SHA-256 checksum is calculated over the canonical UTF-8 string to generate a tamper-evident content hash [242, 489].</li>
              <li><strong>Attestation & Signing:</strong> The content hash is signed using an Ed25519 private key (local container key or HSM/KMS provider key) to guarantee non-repudiation [242, 489].</li>
              <li><strong>Batching:</strong> The signed receipt is committed to the relational schema, hashed into a Merkle Tree, and periodically anchored to long-term storage [490].</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Events Catalog */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold flex items-center gap-2 mb-4">
            <Database className="h-8 w-8 text-primary" />
            3. Core Event Payload Catalog
          </h2>
          <p className="text-muted-foreground text-lg">
            This section details the specific payload structures, target relational tables, and validation invariants for the 10 core AI events that define the Cognitive Insight Audit Framework (CIAF-LCM) [167, 254].
          </p>
        </div>

        <div className="space-y-8">
          {eventsData.map((event) => (
            <div key={event.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden group/card hover:border-primary/40 transition-colors">
              <div className="p-6 md:p-8 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-full w-8 h-8 text-sm">
                    {event.id}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">{event.title}</h3>
                </div>
                <p className="text-muted-foreground mt-3 pl-11"><strong>Purpose:</strong> {event.purpose}</p>
              </div>
              
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Database Insertion Targets
                    </h4>
                    <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert">
                      {event.targets}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Verification Invariants
                    </h4>
                    <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert">
                      {event.invariants}
                    </div>
                  </div>
                </div>
                
                <div>
                  <details className="group border border-border rounded-xl bg-card overflow-hidden shadow-sm h-full max-h-min open:shadow-md transition-all">
                    <summary className="flex items-center justify-between p-4 cursor-pointer bg-muted/40 hover:bg-muted/80 transition-colors font-mono text-sm font-semibold select-none border-b border-transparent group-open:border-border">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-primary" />
                        <span>Payload Template</span>
                      </div>
                      <span className="flex items-center text-xs font-sans text-muted-foreground gap-2">
                        <span className="group-open:hidden">Click to expand</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="p-4 bg-black/5 dark:bg-black/40 overflow-x-auto text-xs text-foreground font-mono leading-relaxed">
                      <pre><code>{event.payload}</code></pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer Guidelines */}
      <section className="mt-16 pt-8 border-t border-border">
        <h2 className="text-2xl font-bold mb-6">4. Operational Ingestion Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <h4 className="font-bold mb-2">Deterministic Input Format</h4>
            <p className="text-sm text-muted-foreground">Before hashing or generating digital signatures, the payload must be run through an RFC 8785 canonicalization engine [517].</p>
          </div>
          <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <h4 className="font-bold mb-2">Out-of-Band Signature</h4>
            <p className="text-sm text-muted-foreground">The local service container or sidecar executes signature generation. The raw private keys must never touch the API layer [522].</p>
          </div>
          <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <h4 className="font-bold mb-2">Constraints Enforcement</h4>
            <p className="text-sm text-muted-foreground">Ensure all relational foreign-key references are mapped prior to database commit to guarantee referential integrity of the evidence graph [255].</p>
          </div>
        </div>
      </section>

    </div>
  );
}
`;

fs.writeFileSync('src/app/docs/page.tsx', finalFileContent);
console.log('Success, wrote to src/app/docs/page.tsx');
