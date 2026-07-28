import Link from 'next/link';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export const metadata = {
  title: 'Consulting Practice Operating System (CPOS) v4 | AGEI',
  description: 'CPOS Strategic Intake & Advisory Phase Realignment (v4)',
};

export default function CPOSDocsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12 flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-full mt-1 flex-shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            CPOS Strategic Intake & Advisory Phase Realignment (v4)
          </h1>
          <p className="text-muted-foreground font-medium">
            High-Assurance GRC Questionnaires & Phase 2 Shadow AI Perimeter Audit Integration
          </p>
          <p className="text-xs text-muted-foreground mt-2">CognitiveInsight.ai Systems Architecture & Delivery Reference | July 2026</p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h2>1. Executive Summary: The Structural Pivot</h2>
        <p>
          To differentiate CognitiveInsight.ai from generic consulting firms practicing "Governance Theater" (static PDF policies, manual GRC surveys, and Excel registries), we are reorganizing our advisory lifecycle and internal Consulting Practice Operating System (CPOS) [513].
        </p>
        <p>
          This realignment does two things to increase the value and defensibility of our enterprise engagements:
        </p>
        <ul>
          <li><strong>Phase 1: High-Assurance Strategic GRC Intake Form:</strong> We replace standard, checkbox-style GRC questionnaires (which focus on passive administrative documentation) with deep, technically precise questions focused on system autonomy, cryptographic proof, runtime enforcement, and authority delegation [117, 121, 201].</li>
          <li><strong>Phase 2: Shadow AI Perimeter Audit Integration:</strong> We move the Shadow AI Perimeter Audit from Phase 1 to Phase 2: Design & Align [USER_REQUEST]. This allows us to use Phase 1 strictly to align stakeholders, set up organizational objectives, and establish the strategic baseline, and then launch the deep, software-driven network telemetry scan in Phase 2 to map their unmanaged AI perimeter in real time [156, USER_REQUEST].</li>
        </ul>

        <Mermaid chart={`graph TD
Phase1["PHASE 1: DISCOVER & ASSESS<br/>──────────────────────<br/>CPOS High-Assurance Intake Form (Maturity Benchmarking & Profile Alignment)"]
Phase2["PHASE 2: DESIGN & ALIGN<br/>──────────────────────<br/>- Software-Led Shadow AI Perimeter Audit (Privacy-Preserving Ingest & Scan)<br/>- Governance Operating Model (GOM) & Decision Authority Matrix Compilation"]

Phase1 --> Phase2

style Phase1 stroke:#818cf8,fill:#eef2ff
style Phase2 stroke:#fb923c,fill:#fff7ed`} />

        <h2>2. Phase 1: High-Assurance Strategic GRC Intake Form</h2>
        <p>
          Standard GRC questionnaires ask passive questions like "Do you have a written AI policy?" or "Do you have an AI Steering Committee?" [513]. These fail because they measure compliance as a documentation exercise rather than a system invariant [93].
        </p>
        <p>
          The CPOS intake portal enforces five high-assurance question sets designed to expose the operational and cryptographic gaps in the client's current runtime architecture [USER_REQUEST]:
        </p>

        <h3>Lobe 1: Identity & Ambient Privilege boundaries</h3>
        <p><strong>The Market's Question:</strong> "Do you manage user access to your AI models?"</p>
        <p><strong>CognitiveInsight's High-Assurance Question:</strong><br/>
          "Does your AI system operate under broad, static ambient system privileges (e.g., a shared administrative cloud service account), or do you enforce just-in-time, scoped cryptographic delegations that recursively bind model execution directly to an authenticated human principal?" [148, 198, 455]
        </p>
        <p><strong>Why it Matters:</strong> Autonomous agents running under ambient credentials can cause lateral privilege escalation, unauthorized tool execution, and untraceable data access [146, 148, 450]. High-assurance requires attenuated, proof-carrying delegation chains [121, 146].</p>

        <h3>Lobe 2: Policy Enforcement Fidelity (Runtime vs. Paper)</h3>
        <p><strong>The Market's Question:</strong> "Are your corporate AI policies documented and approved?"</p>
        <p><strong>CognitiveInsight's High-Assurance Question:</strong><br/>
          "Are your AI risk boundaries and compliance rulesets defined as un-evaluable human prose (such as PDF guidelines on an intranet), or are they programmatically hardcoded as database-enforced runtime policy gates (Approve, Deny, Escalate, Inspect) that actively block execution loops?" [107, 117, 321]
        </p>
        <p><strong>Why it Matters:</strong> PDF binders are ignored by software developers and bypassed by autonomous scripts [USER_REQUEST]. True governance requires policy-to-gate compilation that actively intercepts model pipeline transitions before execution [108, 121, 151].</p>

        <h3>Lobe 3: Evidentiary Integrity ("Proof vs. Logs")</h3>
        <p><strong>The Market's Question:</strong> "Do you maintain logs of AI model prompts and system errors?"</p>
        <p><strong>CognitiveInsight's High-Assurance Question:</strong><br/>
          "Do your compliance verification systems rely on mutable database logs and flat text files (which are vulnerable to administrative alteration or deletion), or do they continuously generate deterministically serialized, cryptographically signed receipts chained in an append-only ledger?" [93, 139, 490]
        </p>
        <p><strong>Why it Matters:</strong> Administrators and malicious actors can rewrite or truncate standard text logs to hide breaches or errors [USER_REQUEST]. High-assurance requires WORM (Write-Once-Read-Many) tables and out-of-band Ed25519-signed receipts anchored via Merkle Roots to an external notary [9, 135, 478].</p>

        <h3>Lobe 4: Downstream Provenance & Asset Custody</h3>
        <p><strong>The Market's Question:</strong> "Do you watermark your AI outputs?"</p>
        <p><strong>CognitiveInsight's High-Assurance Question:</strong><br/>
          "When AI-generated clinical records, financial summaries, or contracts leave your secure environment, do they rely on strip-prone metadata tags, or do you register dual-state cryptographic content hashes and utilize layout-independent forensic shingling to defend custody?" [158, 396]
        </p>
        <p><strong>Why it Matters:</strong> Metadata and visual watermarks are easily stripped by copying, cropping, or format conversion [158, 391]. High-assurance requires Dual-State Hashing and Forensic Fingerprinting to support origin verification even from screenshot fragments or printed sheets [158, 159, 392].</p>

        <h3>Lobe 5: Perimeter Discovery and Privacy Posture</h3>
        <p><strong>The Market's Question:</strong> "Do you block unapproved AI applications like ChatGPT?"</p>
        <p><strong>CognitiveInsight's High-Assurance Question:</strong><br/>
          "Do you have real-time visibility into unmanaged employee AI interactions, and if so, does your discovery system hoard plaintext prompts (violating GDPR data-minimization rules) or does it enforce a privacy-preserving 'Hash-Only' content retention model?" [156, 432]
        </p>
        <p><strong>Why it Matters:</strong> Blocking firewalls push shadow AI use deeper into unmonitored channels, while hoarding raw prompt logs creates massive secondary PII and security liabilities [156, 180, 530]. High-assurance requires "Hash-Only" discovery to verify leaks without storing raw data [156, 524].</p>

        <h2>3. Database Layer: Survey Schema Extension</h2>
        <p>To store these high-assurance survey submissions securely and prevent data leakage, we deploy a standardized schema in the client's on-premise database, protected by strict PostgreSQL Row-Level Security (RLS) [251, USER_REQUEST]:</p>

        <pre><code className="language-sql">{`-- Schema for High-Assurance Strategic Intake
CREATE TABLE public.cpos_strategic_surveys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    submitted_by uuid NOT NULL REFERENCES public.principals(id),
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),

    -- High-Assurance Lobe Responses (Scores: 1 = Low, 2 = Mid, 3 = High Assurance)
    privilege_model_score integer NOT NULL CHECK (privilege_model_score BETWEEN 1 AND 3),
    privilege_model_notes text,

    enforcement_fidelity_score integer NOT NULL CHECK (enforcement_fidelity_score BETWEEN 1 AND 3),
    enforcement_fidelity_notes text,

    evidentiary_integrity_score integer NOT NULL CHECK (evidentiary_integrity_score BETWEEN 1 AND 3),
    evidentiary_integrity_notes text,

    downstream_provenance_score integer NOT NULL CHECK (downstream_provenance_score BETWEEN 1 AND 3),
    downstream_provenance_notes text,

    perimeter_privacy_score integer NOT NULL CHECK (perimeter_privacy_score BETWEEN 1 AND 3),
    perimeter_privacy_notes text,

    -- Calculated Metrics
    aggregate_maturity_score numeric NOT NULL GENERATED ALWAYS AS (
        (privilege_model_score + enforcement_fidelity_score + evidentiary_integrity_score + downstream_provenance_score + perimeter_privacy_score)::numeric / 5.0
    ) STORED,

    CONSTRAINT cpos_strategic_surveys_pkey PRIMARY KEY (id)
);

-- Enable RLS for Strict Multi-Tenant Isolation
ALTER TABLE public.cpos_strategic_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_surveys ON public.cpos_strategic_surveys
    FOR ALL USING (public.is_org_member(organization_id));

-- Trigger to make submissions strictly WORM (No edits or deletes allowed)
CREATE TRIGGER lock_survey_submissions
    BEFORE UPDATE OR DELETE ON public.cpos_strategic_surveys
    FOR EACH ROW EXECUTE FUNCTION public.enforce_worm_invariant();`}</code></pre>

        <h2>4. Phase 2: Integrating the Shadow AI Perimeter Audit</h2>
        <p>By moving the Shadow AI Perimeter Audit into Phase 2, we establish a logical progression [USER_REQUEST]:</p>
        
        <ul>
          <li><strong>Phase 1 Alignment:</strong> We use the high-assurance intake forms to identify the client's current maturity and match them to their baseline Assurance Profile (1, 2, or 3) [227].</li>
          <li><strong>Phase 2 Ingestion Activation:</strong> Once profiled, the client consents to installing our passive, purpose-limited network discovery telemetry [USER_REQUEST].</li>
          <li><strong>The Active Scan:</strong> Over a 2-3 week period, the telemetry ingestion gateway captures employee egress prompts to public AI services, instantly executing our "Hash-Only" Privacy Invariant (discarding cleartext prompts and preserving only SHA-256 digests in <code>public.shadow_ai_discovery_records</code>) [156, 524].</li>
          <li><strong>The Deliverable compilation:</strong> At the end of Phase 2, the CPOS backend gathers these discovery records and compiles them into the Shadow AI Perimeter Audit deliverable, sealed with the client's cryptographic Ed25519 key in <code>public.receipts</code> [158, 271].</li>
        </ul>

        <h3>Realignment of the Advisory Lifecycle Matrix</h3>
        <p>The updated CPOS lifecycle is now structured as follows [USER_REQUEST]:</p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border">
            <thead className="bg-muted text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Advisory Phase</th>
                <th className="px-4 py-3">Duration & Fee</th>
                <th className="px-4 py-3">Key CPOS Activity</th>
                <th className="px-4 py-3">Primary Deliverable</th>
                <th className="px-4 py-3">CIAF-LCM System Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-medium">Phase 1: Discover & Assess</td>
                <td className="px-4 py-3">2–3 Weeks<br/>$15,000</td>
                <td className="px-4 py-3">Deploy high-assurance strategic GRC survey [USER_REQUEST].</td>
                <td className="px-4 py-3">AI Governance Maturity & Readiness Assessment [227]</td>
                <td className="px-4 py-3">Score submissions and align client to Assurance Profile 1, 2, or 3 [227].</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Phase 2: Design & Align</td>
                <td className="px-4 py-3">4–6 Weeks<br/>$45,000</td>
                <td className="px-4 py-3">Activate passive network telemetry and scan egress traffic [USER_REQUEST].</td>
                <td className="px-4 py-3">Shadow AI Perimeter Audit & Decision Authority Matrix [USER_REQUEST]</td>
                <td className="px-4 py-3">Execute privacy-preserving "Hash-Only" content ingestion [156, 524] and compile the GOM rulesets.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Phase 3: Govern & Adopt</td>
                <td className="px-4 py-3">6–10 Weeks<br/>$95,000+</td>
                <td className="px-4 py-3">Integrate Sidecar SDKs and enable Postgres RLS gates [USER_REQUEST].</td>
                <td className="px-4 py-3">Operational AGEI Sandbox & Merkle Audit Portal</td>
                <td className="px-4 py-3">Install daily-rotating Ed25519 keys and enforce WORM-style append-only ledger triggers [135, USER_REQUEST].</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>5. Next.js API Implementation (pages/api/cpos/intake.ts)</h2>
        <p>This Server API route processes submissions of the high-assurance strategic intake form, maps the scores to an Assurance Profile, and persists the submission natively under multi-tenant isolation constraints:</p>
        
        <pre><code className="language-typescript">{`import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    organizationId,
    submittedBy,
    privilegeModelScore, privilegeModelNotes,
    enforcementFidelityScore, enforcementFidelityNotes,
    evidentiaryIntegrityScore, evidentiaryIntegrityNotes,
    downstreamProvenanceScore, downstreamProvenanceNotes,
    perimeterPrivacyScore, perimeterPrivacyNotes
  } = req.body;

  try {
    // 1. Insert survey submission under strict tenant isolation
    const { data: submission, error: insertErr } = await supabase
      .from('cpos_strategic_surveys')
      .insert({
        organization_id: organizationId,
        submitted_by: submittedBy,
        privilege_model_score: privilegeModelScore,
        privilege_model_notes: privilegeModelNotes,
        enforcement_fidelity_score: enforcementFidelityScore,
        enforcement_fidelity_notes: enforcementFidelityNotes,
        evidentiary_integrity_score: evidentiaryIntegrityScore,
        evidentiary_integrity_notes: evidentiaryIntegrityNotes,
        downstream_provenance_score: downstreamProvenanceScore,
        downstream_provenance_notes: downstreamProvenanceNotes,
        perimeter_privacy_score: perimeterPrivacyScore,
        perimeter_privacy_notes: perimeterPrivacyNotes
      })
      .select()
      .single();

    if (insertErr || !submission) throw insertErr || new Error('Failed to persist survey submission');

    // 2. Resolve Assurance Profile based on the aggregate maturity score
    const avgScore = parseFloat(submission.aggregate_maturity_score);
    let targetProfile = 'Profile 1: Internal Evidence';
    let nextStepAdvisory = 'Phase 1 Complete - Transitioning to Phase 2: Design & Align ($45,000)';

    if (avgScore >= 1.5 && avgScore < 2.5) {
      targetProfile = 'Profile 2: Regulated Evidence';
    } else if (avgScore >= 2.5) {
      targetProfile = 'Profile 3: Forensic Evidence';
    }

    return res.status(200).json({
      success: true,
      surveyId: submission.id,
      aggregateScore: avgScore,
      resolvedProfile: targetProfile,
      recommendedAction: nextStepAdvisory
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}`}</code></pre>
      </div>
    </div>
  );
}
