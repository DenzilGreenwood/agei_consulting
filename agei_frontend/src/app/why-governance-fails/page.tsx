import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function WhyGovernanceFails() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--foreground)]">The Four Fatal Flaws of Modern AI Governance</h1>
        <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
          Binders of PDF policies are disconnected from actual data pipelines. This is "Governance Theater", and it leaves your enterprise exposed.
        </p>
      </div>

      <div className="space-y-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--accent)]">Flaw 1: Governance Theater (PDF Binders & Static Checklists)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Most organizations manage AI risk by writing standard operating procedures, filling out risk registers, and saving approval emails. These manual artifacts represent "intent," not "execution." They are instantly outdated, expensive to audit, and completely invisible to your runtime applications.</p>
            <div className="bg-[var(--muted)] p-4 rounded-md border border-[var(--border)]">
              <strong className="text-[var(--foreground)]">The CognitiveInsight Solution:</strong> We turn human-authored policies into machine-evaluable rules stored directly in your database, enforcing compliance at the code level before code execution.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--accent)]">Flaw 2: Shadow AI (The Unmanaged Perimeter)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Banning AI tools does not work. Employees facing tight deadlines routinely paste sensitive financial, legal, or health records into consumer-grade, unapproved models. Standard firewalls or blunt blocklists frustrate teams and drive AI usage further underground.</p>
            <div className="bg-[var(--muted)] p-4 rounded-md border border-[var(--border)]">
              <strong className="text-[var(--foreground)]">The CognitiveInsight Solution:</strong> We deploy purpose-limited signal collection to convert unmanaged usage into structured Discovery Records. We classify risk based on data sensitivity and route users into sanctioned enterprise alternatives.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--accent)]">Flaw 3: Policy Without Plumbing (No Runtime Gate Enforcement)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Security guardrails usually filter inputs and outputs after the model has processed them. For autonomous, tool-using agents, this post hoc monitoring is a catastrophic failure. Once an agent has direct database access or execution authority, it can change external state before an input filter fires.</p>
            <div className="bg-[var(--muted)] p-4 rounded-md border border-[var(--border)]">
              <strong className="text-[var(--foreground)]">The CognitiveInsight Solution:</strong> We enforce Pre-Action Proofs. No autonomous agent can execute a sensitive tool wrapper without carrying a cryptographically signed proof bundle that matches active privilege policies.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--accent)]">Flaw 4: The Log Myth (Mutable & Unstructured Telemetry)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Standard logging libraries are designed for developers, not forensic auditors. They generate millions of unstructured, unsigned log lines that roll over, are easily modified by system administrators, and do not carry cryptographic signatures or lineage links.</p>
            <div className="bg-[var(--muted)] p-4 rounded-md border border-[var(--border)]">
              <strong className="text-[var(--foreground)]">The CognitiveInsight Solution:</strong> We implement a dedicated Tamper-Evident Evidence Vault. Every governed lifecycle transition produces an immutable, Ed25519-signed Receipt sealed into durable vault objects that prove complete chain of custody.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
