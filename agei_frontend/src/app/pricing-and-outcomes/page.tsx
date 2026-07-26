import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function Advisory() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">Pricing and Outcomes</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Our engagements are structured around clear deliverables and measurable business outcomes. Each tier builds on the previous one, so clients can start with discovery and move through design, implementation, and ongoing assurance.
        </p>
      </div>

      <div className="relative border-l-2 border-border ml-6 md:ml-12 pl-8 md:pl-12 space-y-16 py-8">
        {/* Phase 1 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            1
          </div>
          <Card>
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-foreground">Discover & Assess</CardTitle>
                <div className="timeline-badge">
                  From $15,000 | 2–3 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We deploy our purpose-limited discovery telemetry to map unmanaged "Shadow AI" use across your network and endpoints. We benchmark your operational maturity against the three AGEI Assurance Profiles.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Primary Deliverable</span>
                  Shadow AI Evidence Perimeter Scan & Discovery Audit.
                </div>
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Expected Outcome</span>
                  Visibility into unmanaged AI usage and baseline risk maturity.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 2 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            2
          </div>
          <Card>
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-foreground">Design & Align</CardTitle>
                <div className="timeline-badge">
                  From $45,000 | 4–6 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-primary mb-3">Includes Discover & Assess, plus executable architecture design.</p>
              <p className="mb-4"><strong>Core Activities:</strong> We map your executive policies into machine-evaluable rulesets. We design your custom Decision Authority Matrix and define the precise rules for your Provenance, Validation, Deployment, and Runtime gates.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Primary Deliverable</span>
                  Executable Gate Modeling & Schema Design.
                </div>
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Expected Outcome</span>
                  A clear, actionable architecture mapping executive policy to code.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 3 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            3
          </div>
          <Card>
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-foreground">Govern & Adopt</CardTitle>
                <div className="timeline-badge">
                  From $95,000 | 6–10 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-primary mb-3">Includes Discover & Assess and Design & Align, plus production integration.</p>
              <p className="mb-4"><strong>Core Activities:</strong> We implement our out-of-band Runtime Evidence SDK / Sidecar natively inside your MLOps and orchestration architectures. We set up your central Tamper-Evident Evidence Vault and integrate Pre-Action Proofs for your autonomous agents.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Primary Deliverable</span>
                  Evidence Vault & Sidecar SDK Production Integration.
                </div>
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Expected Outcome</span>
                  A fully integrated, verifiable control plane running in production.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 4 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            4
          </div>
          <Card>
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-foreground">Measure & Improve</CardTitle>
                <div className="timeline-badge">
                  $8,000 / month | Ongoing
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We provide fractional GRC advisory, perform continuous oversight, monitor regulatory changes, manage signing key rotations, and generate automated Sealed Audit Packs and cryptographic verification reports for your quarterly board reviews. We also serve as a liaison for external auditors, legal counsel, and regulators, support continuous improvement cycles with operations and the board, and assist with investigations and evidence review as needed.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Primary Deliverable</span>
                  Continuous Assurance & Automated Audit Packs.
                </div>
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Expected Outcome</span>
                  Continuous defensibility, executive-ready compliance reporting, and adaptive governance aligned to regulatory change.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 5 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/20">
            5
          </div>
          <Card>
            <CardHeader className="bg-primary/5 border-b border-border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-foreground">Train & Enable</CardTitle>
                <div className="timeline-badge">
                  From $12,000 | 1–2 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We train implementation teams, governance owners, and internal auditors on how to operate the AGEI platform, interpret evidence packs, verify receipts, and maintain the control model as policies evolve.</p>
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Primary Deliverable</span>
                  Role-Based Enablement Sessions & Auditor Readiness Workshop.
                </div>
                <div className="bg-background p-3 rounded border border-border flex-1">
                  <span className="text-foreground font-medium block mb-1 text-xs uppercase tracking-wider text-muted-foreground">Expected Outcome</span>
                  Faster adoption, better operational handoff, and a governance team that can sustain and audit the program independently.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        * Each tier builds on the previous tier; Tier 3 includes the work product and deliverables from Tiers 1 and 2.
      </p>
    </div>
  );
}
