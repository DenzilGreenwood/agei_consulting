import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { AvatarCarousel } from "@/components/AvatarCarousel";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card -z-10" />
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            AI Governance Demands <span className="text-primary">Proof, Not Logs.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Don't rely on policy theater or mutable application logs to manage enterprise AI risk. We design and integrate AI Governance Evidence Infrastructure (AGEI)—cryptographic plumbing that makes policy machine-enforceable and audits cryptographically verifiable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/diagnostic" className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity w-full sm:w-auto">
              Schedule a Confidential Executive Briefing
            </Link>
            <Link href="/why-governance-fails" className="glass text-foreground px-8 py-3 rounded-md font-semibold text-lg hover:bg-muted transition-colors w-full sm:w-auto">
              Read the Category Framework
            </Link>
          </div>
        </div>
      </section>

      {/* The Core Contrast Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">The Log Myth vs. Verifiable Evidence</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Most enterprises assume their MLOps dashboards and SIEM logs provide compliance. They do not. Logs are mutable, optimized for operational debugging, and detached from corporate policy. If an autonomous agent triggers an unauthorized $100k transaction, an unstructured log file cannot by itself prove authority, delegation, or policy compliance to an auditor.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-4 border-b border-r border-border font-semibold text-foreground w-1/4">Dimension</th>
                  <th className="p-4 border-b border-r border-border font-semibold text-foreground w-3/8">The Ordinary Logging Stack</th>
                  <th className="p-4 border-b border-border font-semibold text-primary w-3/8">CognitiveInsight's Evidence Stack</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-background">
                  <td className="p-4 border-b border-r border-border font-medium">Core Purpose</td>
                  <td className="p-4 border-b border-r border-border text-muted-foreground">Operational debugging and system health.</td>
                  <td className="p-4 border-b border-border text-foreground">Proving governance-relevant facts with cryptographically verifiable evidence.</td>
                </tr>
                <tr className="bg-card">
                  <td className="p-4 border-b border-r border-border font-medium">Integrity</td>
                  <td className="p-4 border-b border-r border-border text-muted-foreground">Mutable, easily modified, or rotated out-of-band.</td>
                  <td className="p-4 border-b border-border text-foreground">Cryptographically sealed, append-only Merkle receipt chains.</td>
                </tr>
                <tr className="bg-background">
                  <td className="p-4 border-b border-r border-border font-medium">Policy Binding</td>
                  <td className="p-4 border-b border-r border-border text-muted-foreground">Incidental. Disconnected from policy versions.</td>
                  <td className="p-4 border-b border-border text-foreground">Direct mapping of versioned rules to runtime gate decisions.</td>
                </tr>
                <tr className="bg-card">
                  <td className="p-4 border-r border-border font-medium">Verification</td>
                  <td className="p-4 border-r border-border text-muted-foreground">Requires full trust in the system operator.</td>
                  <td className="p-4 text-foreground">Standalone, zero-trust offline verification of signatures.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Our Four Consulting Pillars */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Elite Practice Areas for High-Stakes Enterprise AI</h2>
            <p className="text-xl text-muted-foreground">We bridge the gap between executive risk policy and machine-verifiable operational reality.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Cryptographic AI Assurance & Systems Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">We design and implement Lazy Capsule Materialization (LCM) and Tamper-Evident Evidence Vaults. We capture lightweight, signed event receipts continuously—reducing compliance storage overhead by ~99%—and materialize heavy, audit-ready evidence capsules only when triggered.</p>
                <Link href="/services" className="text-primary hover:underline font-medium">Explore Cryptographic Assurance &rarr;</Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Autonomous Agent Governance & Runtime Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">We structure agentic workflows around the Five Governance Planes: Identity, Policy, Privilege, Execution, and Evidence. We implement Pre-Action Proof-Carrying Tool Execution to strictly govern autonomous agents acting under "ambient system privilege" without explicit, delegated human authority.</p>
                <Link href="/services" className="text-primary hover:underline font-medium">Explore Agent Governance &rarr;</Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Shadow AI Discovery & Proportional Risk Routing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">We build purpose-limited telemetry pipelines to discover unmanaged AI tools inside your perimeter. Instead of blunt blocklists, we classify usage and route response actions proportionately—migrating high-value behavior into sanctioned enterprise channels.</p>
                <Link href="/services" className="text-primary hover:underline font-medium">Explore Shadow AI Discovery &rarr;</Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Downstream Provenance & Artifact Defensibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6">We protect your high-stakes outputs (PDFs, media, legal summaries) after they leave your runtime environment. We engineer Dual-State Hashing pipelines combining explicit watermark descriptors with resilient Forensic Fingerprinting to defend your intellectual property and prove content origin under dispute.</p>
                <Link href="/services" className="text-primary hover:underline font-medium">Explore Downstream Provenance &rarr;</Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Targeted Buyer Entry Points */}
      <section className="py-20 px-4 bg-card border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Executive Business Value</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-6">
              CognitiveInsight.ai helps enterprise leaders turn AI governance from policy intent into operational evidence. We work with executive stakeholders to reduce manual audit preparation, improve control coverage, and create cryptographically verifiable records that support oversight, audit readiness, and governance maturity. The following are representative stakeholder profiles and the outcomes they care about most.
            </p>
          </div>

          <AvatarCarousel />
        </div>
      </section>

      {/* Editorial Quote */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <blockquote className="text-2xl md:text-3xl font-light leading-relaxed text-foreground mb-8">
            "The future of AI governance will not be determined by what agents are capable of doing. It will be determined by what authority they are allowed to exercise, what information they are permitted to access, what they are allowed to remember, and what evidence exists to demonstrate they operated within those boundaries."
          </blockquote>
          <p className="text-lg text-primary font-medium">— Denzil Greenwood, Founder of CognitiveInsight.ai</p>
        </div>
      </section>
    </div>
  );
}
