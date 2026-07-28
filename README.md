# CognitiveInsight.ai – Consulting Practice Operating System (CPOS)

Welcome to the **CognitiveInsight.ai Consulting Practice Operating System (CPOS) v4**. This repository contains the core software delivery hub and dashboard utilized by CognitiveInsight consultants to manage, execute, and cryptographically verify enterprise AI governance transformations under the **AI Governance Evidence Infrastructure (AGEI)** frameworks.

## 🧠 Overview

Unlike generic consulting practices that deliver static PDFs and manual GRC surveys, CognitiveInsight treats advisory engagements as multi-stakeholder software and GRC implementations. The CPOS turns consulting into an operational "control plane" where:
- Strategic intake is quantified through high-assurance maturity profiling.
- Client adoption and "Shadow AI" network ingestion are actively monitored via passive telemetry.
- Consulting deliverables, sign-offs, and compliance milestones are sealed as cryptographically verifiable (Ed25519) receipts anchored to a cloud ledger (Symmetric Audit Model).

## 🏛️ Architecture

The system is deployed using a hybrid boundary architecture (The Split-State Invariant):
1. **Private Client Perimeter (On-Premise):** The client maintains complete custody of their AI event information in a local Postgres/Supabase instance. This is an append-only ledger that is isolated from organizational administration. This is a speration of duties concern to maintain the integraty of the data.
2. **CognitiveInsight Cloud (External Anchor):** An independent, append-only attestation hub that receives canonicalized, cryptographic seals of events (Zero-Knowledge Trust Anchor) without ever ingesting cleartext PII.

### Tech Stack
- **Frontend / Client Dashboard:** Next.js 16 (Turbopack) with React, styled using Tailwind CSS and `lucide-react` icons.
- **Backend APIs:** Next.js Serverless API Routes.
- **Database & Auth:** Supabase (PostgreSQL), utilizing strict Row-Level Security (RLS) for tenant isolation.
- **Diagrams:** Interactive architecture mapping using Mermaid.js integrated into React components.

## 🚀 Key Features

* **CPOS Enterprise Delivery Cockpit (`/admin/cpos`):** A multi-tenant executive dashboard to track engagement health, Phase progression (Discover & Assess ──► Design & Align ──► Govern & Adopt), budget utilization, and software deployment pipelines.
* **High-Assurance Strategic GRC Intake Form (`/admin/cpos/intake`):** A robust, 5-lobe maturity profiling tool that evaluates clients on Identity Privilege, Enforcement Fidelity, Evidentiary Integrity, Downstream Provenance, and Perimeter Privacy. Submissions are rigorously isolated via RLS and locked by WORM (Write-Once-Read-Many) triggers.
* **Symmetric Audit & Attestation Portals:** Tools that execute the Bidirectional Cryptographic Receipting flow—proving to regulators that all administrative overrides, UAT approvals, and network telemetry scans are authentic and unmodified.
* **Shadow AI Perimeter Scan Integration:** Automated tracking and visualization of employee ingress/egress to unmanaged AI tools, resolving to a "Hash-Only" privacy-preserving retention model.

## 📂 Project Structure

```
AGEI_Consulting/
├── agei_frontend/                 # Main Next.js Web Application
│   ├── src/app/                   # App Router (Dashboards, Docs, Actions)
│   │   ├── admin/cpos/            # CPOS Admin Cockpit & Intake Forms
│   │   ├── docs/                  # AGEI Technical Specifications & Architecture Docs
│   │   └── actions/               # Server Actions for DB queries
│   ├── src/pages/api/             # Next.js API Routes (e.g., Intake form submission logic)
│   └── src/components/            # Shared React components (Mermaid renderer, UI blocks)
├── supabase/
│   └── migrations/                # Database schemas, RLS policies, and WORM triggers
│       ├── 00_cpos_enterprise.sql
│       └── 01_cpos_strategic_intake.sql
└── README.md                      # Project documentation
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase CLI (for local database development)

### Running the Application Locally

1. **Install Dependencies:**
   Navigate into the frontend directory and install NPM packages.
   \`\`\`bash
   cd agei_frontend
   npm install
   \`\`\`

2. **Environment Variables:**
   Ensure you have a \`.env.local\` file in the \`agei_frontend\` directory with your Supabase keys:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-key"
   \`\`\`

3. **Start the Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at [http://localhost:3000](http://localhost:3000).

### Database Migrations
To apply the CPOS SQL schemas to a local Supabase instance, run:
\`\`\`bash
supabase db push
\`\`\`
*(Ensure you have linked your Supabase project or started a local instance via `supabase start`)*.

## 📖 Documentation Reference
Consultants and enterprise engineers can view the full technical architecture specifications live in the application by navigating to \`/docs\`:
- `/docs/cpos`: CPOS Strategic Intake & Advisory Phase Realignment
- `/docs/attestation`: Operational Blueprint for On-Premise/Cloud Split AI Evidence
- `/docs/symmetric-audit`: Symmetric Audit & Real-Time Transactional Attestation
- `/docs/nda`: Cryptographic Mutual NDA & Evidentiary Discovery Framework
