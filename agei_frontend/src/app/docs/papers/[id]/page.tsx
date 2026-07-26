import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, ChevronLeft, ShieldCheck, Database, Calendar, Tag } from 'lucide-react';

const papersData: Record<string, any> = {
  "01": {
    id: "01",
    title: "Operating Model and Reference Architecture",
    filename: "01_AGEI_Operating_Model_and_Reference_Architecture.docx",
    role: "Establishes the 8-layer reference model mapping organizational policy to immutable database constraints.",
    abstract: "This foundational document outlines the high-level systemic components and assurance frameworks required for the AI Governance Evidence Infrastructure. It establishes the architectural boundaries between MLOps, SIEM, GRC, and the cryptographic evidence layers.",
    tags: ["Architecture", "Operating Model", "Assurance"],
    date: "July 2026"
  },
  "02": {
    id: "02",
    title: "CIAF LCM Process Model",
    filename: "02_CIAF_LCM_Process_Model_Database_Aligned.docx",
    role: "Details the policy-to-evidence chain and defines the standard lifecycle transitions from data ingestion to audit pack materialization.",
    abstract: "Defines the core mechanisms for Lazy Capsule Materialization (LCM). This model details how lightweight cryptographic receipts are continuously generated during operation, deferring the assembly of heavy evidence capsules until an explicit audit or security threshold is met.",
    tags: ["Process Model", "LCM", "Evidence Collection"],
    date: "July 2026"
  },
  "03": {
    id: "03",
    title: "CIAF LCM Governance Gates",
    filename: "03_CIAF_LCM_Governance_Gates_Database_Aligned.docx",
    role: "Explicitly models enforcement points and defines the 'Deny-by-Default' state machine.",
    abstract: "Provides the technical specifications for executing policy enforcement points across the AI lifecycle, including Provenance, Validation, Deployment, Runtime, and Incident Gates. It defines the 'Deny-by-Default' invariant for agent operations.",
    tags: ["Governance", "Gates", "Policy Enforcement"],
    date: "July 2026"
  },
  "04": {
    id: "04",
    title: "Practical Lifecycle Walkthrough",
    filename: "04_AGEI_Practical_Lifecycle_Walkthrough.docx",
    role: "Provides a step-by-step operational simulation of a regulated model promotion.",
    abstract: "An end-to-end operational flow demonstrating how the AGEI processes work in reality. It traces a regulated model promotion from the initial API request through to Merkle batching, showing exactly how tables are modified at runtime.",
    tags: ["Walkthrough", "Lifecycle", "Simulation"],
    date: "July 2026"
  },
  "05": {
    id: "05",
    title: "Assurance Profiles",
    filename: "05_AGEI_Assurance_Profiles.docx",
    role: "Establishes precise definitions for the three levels of evidence strength.",
    abstract: "Standardized tiers of cryptographic maturity. This paper outlines Profile 1 (Internal), Profile 2 (Regulated), and Profile 3 (Forensic), setting strict rules for legal compliance terminology and 'Claim Discipline'.",
    tags: ["Assurance", "Compliance", "Maturity Model"],
    date: "July 2026"
  },
  "06": {
    id: "06",
    title: "Tamper-Evident Evidence Vault",
    filename: "06_Tamper_Evident_Evidence_Vault_Database_Aligned.docx",
    role: "Details the cryptographic custody substrate and storage integrity mechanisms.",
    abstract: "A deep technical dive into the storage of governance receipts. It covers the implementation of Canonical JSON (RFC 8785) serialization, SHA-256 content hashing, Ed25519 digital signatures, hash chaining, and Merkle tree batching in WORM storage.",
    tags: ["Cryptography", "Vault", "WORM Storage"],
    date: "July 2026"
  },
  "07": {
    id: "07",
    title: "Governance Planes for Agentic AI",
    filename: "07_Governance_Planes_for_Agentic_AI_Database_Aligned.docx",
    role: "Maps the five-plane runtime envelope to bound autonomous agent tool execution.",
    abstract: "Focuses on controlling autonomous AI agents by routing execution through five specific control planes: Identity, Policy, Privilege, Execution, and Evidence. It establishes the 'Zero-Ambient-Privilege' invariant.",
    tags: ["Agentic AI", "Control Planes", "Zero Trust"],
    date: "July 2026"
  },
  "08": {
    id: "08",
    title: "Shadow AI and Dual-Layer Provenance",
    filename: "08_Shadow_AI_and_Dual_Layer_Provenance_Database_Aligned.docx",
    role: "Expands the evidence perimeter to handle unmanaged employee AI usage and output tracking.",
    abstract: "Details methods for discovering and auditing unmanaged AI endpoints within a corporate network. It also establishes the technical requirements for Dual-Layer Provenance, using both explicit watermarking and forensic fingerprinting for AI-generated artifacts.",
    tags: ["Shadow AI", "Provenance", "Watermarking"],
    date: "July 2026"
  }
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const paper = papersData[resolvedParams.id];
  if (!paper) {
    return { title: 'Paper Not Found | AGEI Docs' };
  }
  return {
    title: `${paper.title} | AGEI Research Portfolio`,
    description: paper.abstract,
  };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const paper = papersData[resolvedParams.id];

  if (!paper) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[calc(100vh-4rem)]">
      
      {/* Navigation Breadcrumbs */}
      <div className="mb-10">
        <Link href="/docs/concordance" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Concordance Map
        </Link>
      </div>

      {/* Paper Header */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <FileText className="h-48 w-48 text-primary" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-lg border border-primary/20">
              Paper {paper.id}
            </span>
            <span className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-lg border border-border">
              <Calendar className="mr-2 h-4 w-4" />
              {paper.date}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            {paper.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {paper.tags.map((tag: string, idx: number) => (
              <span key={idx} className="flex items-center text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                <Tag className="mr-1.5 h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={`/papers/${paper.filename}`} 
              download
              className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Full Paper (.docx)
            </a>
          </div>
        </div>
      </div>

      {/* Paper Details */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted p-8 rounded-2xl border border-border">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Database className="h-6 w-6 text-primary" />
            Architectural Role
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {paper.role}
          </p>
        </div>

        <div className="bg-muted p-8 rounded-2xl border border-border">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Abstract / Focus
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {paper.abstract}
          </p>
        </div>
      </div>

    </div>
  );
}
