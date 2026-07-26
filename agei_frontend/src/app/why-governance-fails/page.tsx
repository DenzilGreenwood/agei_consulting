import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function WhyGovernanceFails() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">The Four Fatal Flaws of Modern AI Governance</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          AI governance often fails because policies live in documents, while decisions happen in code. That gap creates governance theater: lots of intent, little execution, and no reliable evidence.
        </p>
      </div>

      <div className="space-y-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Flaw 1: Governance Theater (PDF Binders & Static Checklists)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Most organizations manage AI risk by writing standard operating procedures, filling out risk registers, and saving approval emails. These manual artifacts represent "intent," not "execution." They are instantly outdated, expensive to audit, and largely invisible to runtime applications.</p>
            <div className="bg-muted p-4 rounded-md border border-border">
              <strong className="text-foreground">The CognitiveInsight Solution:</strong> We turn human-authored policies into machine-evaluable rules stored directly in your database, enforcing policy at the code boundary before governed actions execute.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Flaw 2: Shadow AI (The Unmanaged Perimeter)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Banning AI tools often fails in practice. Employees facing tight deadlines routinely paste sensitive financial, legal, or health records into consumer-grade, unapproved models. Standard firewalls or blunt blocklists frustrate teams and drive AI usage further underground.</p>
            <div className="bg-muted p-4 rounded-md border border-border">
              <strong className="text-foreground">The CognitiveInsight Solution:</strong> We deploy purpose-limited signal collection to convert unmanaged usage into structured Discovery Records. We classify risk based on data sensitivity and route users toward sanctioned enterprise alternatives.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Flaw 3: Policy Without Plumbing (No Runtime Gate Enforcement)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Security guardrails usually filter inputs and outputs after the model has processed them. For autonomous, tool-using agents, this post hoc monitoring can create a serious control gap. Once an agent has direct database access or execution authority, it can change external state before an input filter fires.</p>
            <div className="bg-muted p-4 rounded-md border border-border">
              <strong className="text-foreground">The CognitiveInsight Solution:</strong> We enforce pre-action proofs at the tool boundary, so sensitive actions cannot proceed unless the required policy checks and delegation evidence are present.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Flaw 4: The Log Myth (Mutable & Unstructured Telemetry)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Standard logs are useful for operations, but they are not designed as forensic evidence. Without canonical structure, signatures, and chain-of-custody links, they remain easy to alter, hard to verify, and weak for audit.</p>
            <div className="bg-muted p-4 rounded-md border border-border">
              <strong className="text-foreground">The CognitiveInsight Solution:</strong> We implement a dedicated Tamper-Evident Evidence Vault. Every governed lifecycle transition produces a tamper-evident, Ed25519-signed receipt sealed into durable vault objects that support chain-of-custody evidence.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
