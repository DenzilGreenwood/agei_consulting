import React from 'react';
import { BookOpen, Map, Database, LayoutGrid, ShieldCheck, FileText, CheckCircle2 } , ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Concordance Map | AGEI Docs',
    description: 'Mathematical translation table mapping technical specifications to the foundational research portfolio.',
};

export default function ConcordancePage() {
    const indexDocs = [
        {
            id: "01_AGEI_Operating_Model_and_Reference_Architecture",
            routeId: "01",
            title: "Operating Model & Reference Architecture",
            source: "01_AGEI_Operating_Model_and_Reference_Architecture.docx [89]",
            role: "Establishes the 8-layer reference model mapping organizational policy to immutable database constraints [92, 96]."
        },
        {
            id: "02_CIAF_LCM_Process_Model_Database_Aligned",
            routeId: "02",
            title: "Foundational Process Model",
            source: "02_CIAF_LCM_Process_Model_Database_Aligned.docx [89]",
            role: "Details the policy-to-evidence chain and defines the standard lifecycle transitions from data ingestion to audit pack materialization [105, 106]."
        },
        {
            id: "03_CIAF_LCM_Governance_Gates_Database_Aligned",
            routeId: "03",
            title: "Lifecycle Governance Gates",
            source: "03_CIAF_LCM_Governance_Gates_Database_Aligned.docx [89]",
            role: "Explicitly models enforcement points (Provenance, Validation, Deployment, Runtime, and Incident Gates) and defines the \"Deny-by-Default\" state machine [109, 116, 117]."
        },
        {
            id: "04_AGEI_Practical_Lifecycle_Walkthrough",
            routeId: "04",
            title: "Practical Lifecycle Walkthrough",
            source: "04_AGEI_Practical_Lifecycle_Walkthrough.docx [89]",
            role: "Provides a step-by-step operational simulation of a regulated model promotion, showing how each table is modified at runtime [125, 126]."
        },
        {
            id: "05_AGEI_Assurance_Profiles",
            routeId: "05",
            title: "Assurance Profiles & Claim Discipline",
            source: "05_AGEI_Assurance_Profiles.docx [89]",
            role: "Establishes precise definitions for the three levels of evidence strength (Profile 1: Internal, Profile 2: Regulated, Profile 3: Forensic) and defines strict rules for legal compliance terminology [131, 132, 136]."
        },
        {
            id: "06_Tamper_Evident_Evidence_Vault_Database_Aligned",
            routeId: "06",
            title: "Tamper-Evident Evidence Vault",
            source: "06_Tamper_Evident_Evidence_Vault_Database_Aligned.docx [89]",
            role: "Details the cryptographic custody substrate, implementing Canonical JSON (RFC 8785) serialization, SHA-256 content hashing, Ed25519 digital signatures, hash chaining, and Merkle tree batching [139, 140, 142]."
        },
        {
            id: "07_Governance_Planes_for_Agentic_AI_Database_Aligned",
            routeId: "07",
            title: "Governance Planes for Agentic AI",
            source: "07_Governance_Planes_for_Agentic_AI_Database_Aligned.docx [89]",
            role: "Maps our five-plane runtime envelope (Identity, Policy, Privilege, Execution, and Evidence) to direct relational database tables to bound autonomous agent tool execution [146, 147]."
        },
        {
            id: "08_Shadow_AI_and_Dual_Layer_Provenance_Database_Aligned",
            routeId: "08",
            title: "Shadow AI & Downstream Provenance",
            source: "08_Shadow_AI_and_Dual_Layer_Provenance_Database_Aligned.docx [89]",
            role: "Expands our evidence perimeter. Details how to ingest, sanitize, and classify unmanaged employee AI usage, as well as how to enforce explicit watermarking and forensic fingerprinting for exported artifacts [154, 155]."
        }
    ];

    const citations = [
        { range: "[1] - [88]", name: "Supabase Postgres Database Schema", focus: "The raw PostgreSQL database DDL defining our 60 active, relational tables, constraints, foreign keys, and column structures [1, 252]." },
        { range: "[89] - [91]", name: "00_AGEI_Document_Set_Index", focus: "Core portfolio index, completion notes, and licensing schemas [89]." },
        { range: "[92] - [104]", name: "01_AGEI_Operating_Model_and_Reference_Architecture", focus: "Overview of adjacent systems (MLOps, SIEM, GRC, IAM) and the 8-layer reference architecture [94, 95, 96]." },
        { range: "[105] - [115]", name: "02_CIAF_LCM_Process_Model_Database_Aligned", focus: "Concrete mappings of the policy-to-evidence process and lazy materialization timelines [106, 112]." },
        { range: "[116] - [124]", name: "03_CIAF_LCM_Governance_Gates_Database_Aligned", focus: "Operational rules comparing policy evaluations (rule-level) to gate evaluations (control-level) and override structures [118, 120]." },
        { range: "[125] - [130]", name: "04_AGEI_Practical_Lifecycle_Walkthrough", focus: "Step-by-step table tracing for a regulated model promotion from initial API request to Merkle batching [126]." },
        { range: "[131] - [138]", name: "05_AGEI_Assurance_Profiles", focus: "Maturity roadmaps and legal \"Claim Discipline\" language rules (e.g., proving control execution vs. claiming perfect compliance) [132, 136, 137]." },
        { range: "[139] - [145]", name: "06_Tamper_Evident_Evidence_Vault_Database_Aligned", focus: "Detailed custody rules, WORM storage classes, and Merkle tree batching processes [140, 142, 143]." },
        { range: "[146] - [153]", name: "07_Governance_Planes_for_Agentic_AI_Database_Aligned", focus: "Architectural plans for the 5 runtime planes and the \"Zero-Ambient-Privilege\" invariant [146, 147]." },
        { range: "[154] - [161]", name: "08_Shadow_AI_and_Dual_Layer_Provenance_Database_Aligned", focus: "Dual-state hashing (pre- and post-watermark) and network/proxy shadow-use discovery signals [155, 156, 158]." },
        { range: "[162] - [187]", name: "Foundational Category Framework Whitepaper", focus: "Introduces AI Governance Evidence Infrastructure as a distinct enterprise software and advisory category [162, 171]." },
        { range: "[188] - [225]", name: "AGEI Agent Classification and Governance Model", focus: "Establishes our neuro-symbolic agent taxonomy (Assistant, Workflow, Routing, Monitoring, Decision Support, Tool-Using, Execution, Orchestration, Strategic) [191, 192]." },
        { range: "[226] - [227]", name: "Assurance Diagnostic Questions", focus: "Detailed diagnostic questionnaire and scoring rules for mapping prospects to Assurance Profiles [226, 227]." },
        { range: "[228] - [248]", name: "CIAF-LCM Proposed Schema Documentation", focus: "Historic JSON Schema review, highlighting previous metadata and lineage gaps [228, 229, 237]." },
        { range: "[249] - [307]", name: "CIAF-LCM Schema Contract from Database", focus: "Complete database contract detailing the 60 relational tables, cross-cutting fields, and API entry points [249, 250, 254]." },
        { range: "[308] - [336]", name: "CIAF-LCM with Governance Gates", focus: "Re-evaluation of the lazy capsule materialization (LCM) pattern and runtime performance trade-offs [308, 321, 328]." },
        { range: "[337] - [367]", name: "Cognitive Insight Audit Framework with Gates", focus: "Operational receipt structures and standard gate taxonomies [338, 345, 353]." },
        { range: "[368] - [389]", name: "Cognitive Insight Audit Framework (CIAF-LCM)", focus: "Explains why policy must behave as a first-class versioned artifact inside the evidence database [368, 376]." },
        { range: "[390] - [415]", name: "Dual-Layer Provenance for AI-Generated Artifacts", focus: "Detailed rules for text anchor shingling and threat/transformation response scenarios (PDF, OCR, paraphrase) [390, 398, 411]." },
        { range: "[416] - [448]", name: "Global Regulatory and Standards Reference Guide", focus: "Detailed compliance mapping for global frameworks including the EU AI Act, NIST AI RMF, ISO 42001, and CAC [416, 420, 421]." },
        { range: "[449] - [477]", name: "Governance Planes for Agentic AI", focus: "Focuses on agent tool elevation and OWASP GenAI security integration [449, 456, 475]." },
        { range: "[478] - [507]", name: "Tamper-Evident Evidence Vault", focus: "Detailed technical analysis of Ed25519 signatures, content-addressable storage, and WORM storage classes [478, 484, 489]." },
        { range: "[508] - [512]", name: "Supabase Consulting Platform Analysis", focus: "Conceptual audit of internal GRC tools and the Consulting Practice Operating System (CPOS) workflow [508, 511]." },
        { range: "[513] - [514]", name: "Website Content Strategy Guide", focus: "Marketing and positioning alignments for the public-facing pages [513, 514]." },
        { range: "[515] - [530]", name: "Professional Resume & Competencies", focus: "Core technical summary and research background for Denzil James Greenwood [515, 516]." },
        { range: "[531] - [555]", name: "Shadow AI Governance Whitepaper", focus: "Evaluates the Microsoft Work Trend Index, unmanaged risk routing, and privacy/ethics boundaries [531, 534, 549]." }
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>
            <div className="mb-10 border-b border-border pb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Concordance Map</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 flex items-center gap-3">
                    <Map className="h-10 w-10 text-primary" />
                    AGEI Documentation Index and Source Concordance
                </h1>
                <div className="text-sm font-mono text-muted-foreground bg-muted inline-block px-4 py-2 rounded-lg border border-border">
                    <span className="block md:inline mr-4"><strong>CognitiveInsight.ai</strong> — Enterprise Reference Library</span>
                    <span className="block md:inline mr-4"><strong>Author:</strong> Denzil Greenwood, Founder & Principal Researcher</span>
                    <span className="block md:inline"><strong>Date:</strong> July 2026</span>
                </div>
            </div>

            <div className="space-y-16">

                {/* 1. Overview and Purpose */}
                <section>
                    <div className="flex items-center gap-2 border-b border-border pb-2 mb-6">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold">1. Overview and Purpose</h2>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                        <p>
                            To satisfy the core security and audit requirement of &quot;Proof, Not Logs,&quot; every technical specification, database schema, operational script, and user interface design deployed by CognitiveInsight is strictly traceable to foundational research <code>[93, 162]</code>.
                        </p>
                        <p>
                            Throughout our developer documentation, web redesign blueprints, and integration guides, you will find bracketed numeric references (e.g., <code>[92]</code>, <code>[261]</code>, <code>[478]</code>). This Source Concordance acts as the authoritative reference guide for developers, Chief Information Security Officers (CISOs), Chief Risk Officers (CROs), and external regulators. It maps every numeric citation directly to the underlying technical whitepapers, database-aligned operating models, and global compliance crosswalks that form our intellectual property <code>[93, 418]</code>.
                        </p>
                        <p>
                            By publishing this page in our Developer Documentation Center under <code>/docs/concordance</code>, we ensure that our engineering frameworks remain fully transparent, peer-reviewable, and forensic-grade <code>[92, 131]</code>.
                        </p>
                    </div>
                </section>

                {/* 2. Foundational Research Portfolio */}
                <section>
                    <div className="flex items-center gap-2 border-b border-border pb-2 mb-6">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold">2. Foundational Research Portfolio (Document Index)</h2>
                    </div>
                    <p className="text-muted-foreground mb-8 text-lg">
                        The following eight core operating papers represent the database-aligned technical library authored by Denzil Greenwood to define the AI Governance Evidence Infrastructure (AGEI) category <code>[89, 162]</code>:
                    </p>

                    <div className="grid gap-6 md:grid-cols-2">
                        {indexDocs.map((doc, idx) => (
                            <Link href={`/docs/papers/${doc.routeId}`} key={idx} className="block">
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all relative overflow-hidden group h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                                        <FileText className="h-24 w-24 text-primary" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-primary font-black uppercase tracking-wider text-xs mb-2">
                                            {doc.id}
                                        </div>
                                        <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">{doc.title}</h3>
                                        <div className="mb-4 bg-muted p-2 rounded border border-border">
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Source Reference</span>
                                            <code className="text-xs text-primary font-mono">{doc.source}</code>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Role in Architecture</span>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{doc.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 3. The Source Concordance */}
                <section>
                    <div className="flex items-center gap-2 border-b border-border pb-2 mb-6">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold">3. The Source Concordance (Citation Lookup Table)</h2>
                    </div>
                    <p className="text-muted-foreground mb-6 text-lg">
                        When reviewing our documentation, compile scripts, or source code, use this lookup index to map bracketed citation numbers back to their exact origin within Denzil Greenwood&apos;s research and database schemas:
                    </p>

                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-foreground border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-bold whitespace-nowrap">Citation Range</th>
                                        <th className="px-6 py-4 font-bold">Document Name / Source Material</th>
                                        <th className="px-6 py-4 font-bold">Core Conceptual Focus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-muted-foreground">
                                    {citations.map((cite, idx) => (
                                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-primary whitespace-nowrap">{cite.range}</td>
                                            <td className="px-6 py-4 font-medium text-foreground min-w-[250px]">{cite.name}</td>
                                            <td className="px-6 py-4 text-sm leading-relaxed">{cite.focus}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* 4. Cross-Cutting Fields Standard */}
                <section>
                    <div className="flex items-center gap-2 border-b border-border pb-2 mb-6">
                        <Database className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold">4. Key Cross-Cutting Field Standard</h2>
                    </div>
                    <p className="text-muted-foreground mb-8 text-lg">
                        To preserve clean linkage across all documents, every table in our database and every JSON payload generated by our SDK must carry these cross-cutting fields to maintain a perfect evidence graph <code>[255]</code>:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { field: "organization_id", desc: "Enforces strict multi-tenant database boundaries and Row-Level Security (RLS) [255]." },
                            { field: "policy_version_id", desc: "Proves which specific set of corporate rules was in force during evaluation [255, 282]." },
                            { field: "gate_evaluation_id", desc: "Connects a runtime or lifecycle action directly to a policy check outcome [255, 282]." },
                            { field: "receipt_id / evidence_object_id", desc: "Binds lightweight events directly to richer out-of-band audit payloads in the vault [255, 282]." }
                        ].map((col, idx) => (
                            <div key={idx} className="bg-muted p-6 rounded-xl border border-border relative">
                                <CheckCircle2 className="absolute top-6 right-6 h-6 w-6 text-success opacity-50" />
                                <code className="text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-md font-bold font-mono text-sm inline-block mb-3">
                                    {col.field}
                                </code>
                                <p className="text-base text-muted-foreground leading-relaxed">{col.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}