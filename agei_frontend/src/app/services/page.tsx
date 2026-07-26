import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function Services() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">Engineering-Led Advisory & Systems Integration</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We do not just analyze risk; we design and implement the cryptographic infrastructure that helps demonstrate compliance, support auditability, and make AI governance operational.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Practice 1: Cryptographic AI Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We design and deploy AI Governance Evidence Infrastructure (AGEI) natively within your MLOps pipelines and cloud infrastructure.</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Lazy Capsule Materialization (LCM):</strong> Integrate out-of-band sidecars to record lightweight metadata event receipts continuously.</li>
              <li><strong>Tamper-Evident Evidence Vault:</strong> Design write-once, read-many (WORM) storage structures utilizing Merkle tree batching.</li>
              <li><strong>Offline Verification Engines:</strong> Provide standalone verification scripts and CLI tools for offline audits.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Practice 2: Autonomous Agent Governance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We audit and restructure multi-agent, tool-using workflows to isolate "action risk" and enforce strict authority boundaries.</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Five Governance Planes:</strong> Model agent behavior across Identity, Policy, Privilege, Execution, and Evidence.</li>
              <li><strong>Pre-Action Proofs:</strong> Implement secure tool wrappers that inspect authorization tokens before executing actions.</li>
              <li><strong>Agent Classification:</strong> Classify agents by authority level and operational risk to establish just-in-time privilege elevation gates.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Practice 3: Shadow AI Discovery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We expand your governance perimeter to capture, classify, and remediate unmanaged AI usage across the enterprise.</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Evidence-Led Discovery:</strong> Integrate purpose-limited telemetry to identify unsanctioned model access.</li>
              <li><strong>Policy-Driven Response Routing:</strong> Build automated state machines to route discovery records based on risk.</li>
              <li><strong>Sanctioned Migration Pipelines:</strong> Establish clear pathways to transition workers to sanctioned internal channels.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Practice 4: Downstream Provenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We implement dual-layer cryptographic watermarking and forensic fingerprinting to protect and trace distributed digital assets.</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Dual-State Hashing Pipelines:</strong> Compute distinct hashes for pristine internal content versus public distributed files, preserving provenance even through benign format changes.</li>
              <li><strong>Explicit Watermark Descriptors:</strong> Embed visible overlays, steganographic payloads, and metadata markers.</li>
              <li><strong>Forensic Fingerprinting:</strong> Generate zone-based content fingerprints as robust fallback evidence.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
