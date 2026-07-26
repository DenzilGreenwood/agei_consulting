"use client";

import React, { useEffect } from "react";
import mermaid from "mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function Methodology() {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    mermaid.initialize({
      startOnLoad: true,
      theme: "base",
      themeVariables: {
        fontFamily: "var(--font-geist-sans)",
      },
    });
    // Wait a tick for the DOM to update with the mermaid div before calling contentLoaded
    setTimeout(() => mermaid.contentLoaded(), 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">We Rely on a Verifiable Control Plane, Not Consulting Guesswork.</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Every CognitiveInsight advisory engagement is powered by the AGEI Platform, a secure client workspace for governance evidence collection, control evaluation, and audit readiness.
        </p>
      </div>
      <div className="glass p-8 rounded-xl mb-16">
        <h2 className="text-2xl font-bold mb-6 text-primary text-center">How the AGEI Platform Transforms Your Engagement</h2>
        <p className="text-lg text-foreground mb-6 text-center">
          When you hire CognitiveInsight, you do not just get a static PowerPoint slide deck. Your engagement is initiated, managed, and audited through a dedicated secure client workspace. This platform acts as your live AI Governance control plane.
        </p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scope Mapping & Objective Registry</CardTitle>
            </CardHeader>
            <CardContent>
              We map business goals and compliance requirements such as the EU AI Act and ISO 42001 into executable rulesets.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Continuous Signal & Discovery Ingest</CardTitle>
            </CardHeader>
            <CardContent>
              In addition to stakeholder interviews, we ingest client telemetry and unmanaged tool discovery records into a live evidence graph.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Gate Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              We test actual systems against derived Governance Gates across provenance, validation, deployment, and runtime.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merkle Receipt Chain Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              You can observe evidence accumulation in real time through a secure hash-chained receipt ledger.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sealed Audit Packs & Verification Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              We export sealed ZIP archives containing rule execution histories, receipts, and signatures, then run verification jobs to support independent audit review.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
