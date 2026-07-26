"use client";

import React, { useEffect } from "react";
import mermaid from "mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function Methodology() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "base",
      themeVariables: {
        fontFamily: "var(--font-geist-sans)",
      },
    });
    mermaid.contentLoaded();
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">We Rely on a Verifiable Control Plane, Not Consulting Guesswork.</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Every CognitiveInsight advisory engagement is powered by our proprietary software platform: the AGEI Platform.
        </p>
      </div>

      <div className="glass p-8 rounded-xl mb-16">
        <h2 className="text-2xl font-bold mb-6 text-primary text-center">How the AGEI Platform Transforms Your Engagement</h2>
        <p className="text-lg text-foreground mb-6 text-center">
          When you hire CognitiveInsight, you do not just get a static PowerPoint slide deck. Your entire engagement is initiated, managed, and audited through a dedicated, secure Next.js and Supabase workspace. This platform acts as your live AI Governance control plane.
        </p>
        
        <div className="bg-background p-6 rounded-lg border border-border overflow-x-auto flex justify-center">
          <div className="mermaid">
{`---
config:
  layout: elk
  markdownAutoWrap: true
---
flowchart TD
    A["\`**ADVISORY INPUTS**

    Assurance Scope
    Regulatory Crosswalks\`"]:::advisory
    B["\`**OPERATIONAL INGESTION**

    Automated Telemetry
    Shadow AI Discovery\`"]:::ingestion
    C["\`**SYNTHESIS ENGINE**

    Lifecycle Gate Audits
    The Five Planes Audit\`"]:::synthesis
    D["\`**PORTABLE EVIDENCE**

    Merkle Receipt Chain
    Verification Logs
    Sealed Audit Packs\`"]:::evidence

    A --> B --> C --> D

    classDef advisory fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b;
    classDef ingestion fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a;
    classDef synthesis fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#3b0764;
    classDef evidence fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#14532d;`}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scope Mapping & Objective Registry</CardTitle>
          </CardHeader>
          <CardContent>
            We map your business goals and compliance requirements (EU AI Act, ISO 42001) directly into executable rulesets.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Continuous Signal & Discovery Ingest</CardTitle>
          </CardHeader>
          <CardContent>
            Rather than doing interviews, we ingest client system telemetry and unmanaged tool discovery records directly into our system's live graph.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Gate Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            We test your actual systems against our derived Governance Gates (Provenance, Validation, Deployment, Runtime).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Merkle Receipt Chain Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            You can watch your evidence grow in real time, visualized as a secure hash-chained receipt ledger proving system compliance.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sealed Audit Packs & Verification Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            We export structured, sealed ZIP archives containing rule execution histories, receipts, and signatures, and run verification jobs to mathematically prove compliance to your audit committee.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
