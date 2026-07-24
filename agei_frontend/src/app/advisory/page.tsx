import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function Advisory() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--foreground)]">A Transparent Roadmap to Verifiable Trust.</h1>
        <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
          AI governance transformation is a structured journey. We publish our phases, timelines, and premium pricing upfront to establish clear commercial expectations.
        </p>
      </div>

      <div className="relative border-l-2 border-[var(--border)] ml-6 md:ml-12 pl-8 md:pl-12 space-y-16 py-8">
        {/* Phase 1 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-[var(--accent)] text-[var(--background)] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-[var(--accent)]/20">
            1
          </div>
          <Card>
            <CardHeader className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-[var(--foreground)]">Discover & Assess</CardTitle>
                <div className="text-sm font-semibold text-[var(--accent)] mt-2 md:mt-0 bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                  From $15,000 | 2–3 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We deploy our purpose-limited discovery telemetry to map unmanaged "Shadow AI" use across your network and endpoints. We benchmark your operational maturity against the three AGEI Assurance Profiles.</p>
              <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] inline-block">
                <span className="text-[var(--foreground)] font-medium">Primary Deliverable:</span> Shadow AI Evidence Perimeter Scan & Discovery Audit.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 2 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-[var(--accent)] text-[var(--background)] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-[var(--accent)]/20">
            2
          </div>
          <Card className="border-[var(--accent)]">
            <CardHeader className="bg-[var(--accent)]/10 border-b border-[var(--border)]">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-[var(--accent)]">Design & Align (Most Popular)</CardTitle>
                <div className="text-sm font-semibold text-[var(--accent)] mt-2 md:mt-0 bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                  From $45,000 | 4–6 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We map your executive policies into machine-evaluable rulesets. We design your custom Decision Authority Matrix and define the precise rules for your Provenance, Validation, Deployment, and Runtime gates.</p>
              <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] inline-block">
                <span className="text-[var(--foreground)] font-medium">Primary Deliverable:</span> Executable Gate Modeling & Schema Design.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 3 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-[var(--accent)] text-[var(--background)] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-[var(--accent)]/20">
            3
          </div>
          <Card>
            <CardHeader className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-[var(--foreground)]">Govern & Adopt</CardTitle>
                <div className="text-sm font-semibold text-[var(--accent)] mt-2 md:mt-0 bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                  From $95,000 | 6–10 Weeks
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We implement our out-of-band Runtime Evidence SDK / Sidecar natively inside your MLOps and orchestration architectures. We set up your central Tamper-Evident Evidence Vault and integrate Pre-Action Proofs for your autonomous agents.</p>
              <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] inline-block">
                <span className="text-[var(--foreground)] font-medium">Primary Deliverable:</span> Evidence Vault & Sidecar SDK Production Integration.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 4 */}
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] bg-[var(--accent)] text-[var(--background)] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-[var(--accent)]/20">
            4
          </div>
          <Card>
            <CardHeader className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <CardTitle className="text-2xl text-[var(--foreground)]">Measure & Improve</CardTitle>
                <div className="text-sm font-semibold text-[var(--accent)] mt-2 md:mt-0 bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                  $8,000 / month | Ongoing
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4"><strong>Core Activities:</strong> We provide fractional GRC advisory, perform continuous oversight, manage signing key rotations, and generate automated Sealed Audit Packs and cryptographic verification reports for your quarterly board reviews.</p>
              <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] inline-block">
                <span className="text-[var(--foreground)] font-medium">Primary Deliverable:</span> Continuous Assurance & Automated Audit Packs.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
