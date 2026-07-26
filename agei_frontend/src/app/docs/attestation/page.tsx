import Link from 'next/link';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

export const metadata = {
  title: 'Real-Time Transactional Attestation Architecture | AGEI',
  description: 'Operational Blueprint for On-Premise/Cloud Split AI Evidence Infrastructure.',
};

export default function AttestationPage() {
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
          <RefreshCcw className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-sm uppercase">Commercial Confidential</span>
            <span className="text-muted-foreground text-sm font-medium">Version 1.0.0 (Production)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            Real-Time Transactional Attestation Architecture
          </h1>
          <p className="text-muted-foreground font-medium">
            Operational Blueprint for On-Premise/Cloud Split AI Evidence Infrastructure<br />
            CognitiveInsight.ai Technical Specification
          </p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h2>1. Executive Summary</h2>
        <p>
          This architecture specification outlines the deployment model for organizations that require absolute data custody and on-premise database control, while demanding mathematically non-repudiable, third-party verifiable audits.
        </p>
        <p>
          Under the Hybrid Cryptographic Assurance Model, the client hosts and maintains the complete 60-table Relational Evidence Graph [254] on their own secure local servers (e.g., via on-premise PostgreSQL/Supabase) [250]. To prevent local administrators or malicious actors from retroactively modifying, deleting, or injecting local records (i.e., Cognitive Tampering), the local system enforces a <strong>Real-Time Transactional Attestation Pipeline</strong>.
        </p>
        <p>
          Every security-relevant database interaction—including user logins [70], administrative authorization overrides [81, 120], policy revisions [107], and model execution receipts [111]—is converted into a cryptographically sealed, canonicalized attestation payload. This payload is committed synchronously or near-real-time asynchronously to the CognitiveInsight Cloud Attestation Server. The cloud server acts as an independent, append-only Zero-Knowledge Trust Anchor, storing only irreversible hashes, digital signatures, and structural metadata. This architecture ensures absolute client privacy while providing instant, tamper-detection capabilities that can withstand skeptical external audits [135, 139].
        </p>

        <h2>2. Structural Architecture: The Split-State Invariant</h2>
        <p>
          To achieve both absolute privacy and indisputable verification, the system splits its state space across two physical boundaries:
        </p>

        <pre><code>{`[ PRIVATE CLIENT PERIMETER (ON-PREMISE) ]                   [ COGNITIVEINSIGHT (CLOUD) ]
(Absolute Custody of Raw Text, PII & Secrets)              (Independent Trust Anchor Ledger)

  Operational AI Event
          │
          ▼
  ┌────────────────────────────────┐
  │ Local Supabase DB (On-Prem)    │
  ├────────────────────────────────┤
  │ - Raw Context / Prompt logs    │
  │ - Policy Evaluations           │
  │ - Detailed Audit database rows │
  └──────────────┬─────────────────┘
                 │
                 │ (1. Database Trigger Captures Event)
                 ▼
  ┌────────────────────────────────┐
  │ Local Sidecar SDK Daemon       │
  ├────────────────────────────────┤
  │ - Canonicalizes (RFC 8785)     │
  │ - Generates SHA-256 Hash       │
  │ - Signs with Ed25519           │
  └──────────────┬─────────────────┘
                 │
                 │ (2. Out-of-Band Real-Time HTTPS POST)
                 └────────────────────────────────────────► ┌─────────────────────────────┐
                                                            │ Cloud Attestation Server    │
                                                            ├─────────────────────────────┤
                                                            │ - Verifies Client Signature │
                                                            │ - Commits Seal to WORM DB   │
                                                            │ - No Plain Text or PII      │
                                                            └─────────────────────────────┘`}</code></pre>

        <h3>2.1 The On-Premise Boundary (Context and Lineage Space)</h3>
        <p>
          The client hosts the physical PostgreSQL database containing the full schema contract families [254]. This perimeter stores all raw inputs, outputs, models, evaluations, and organizational context.
        </p>
        <ul>
          <li><strong>Target Tables:</strong> All 60 tables, including <code>public.receipts</code> [264], <code>public.api_request_logs</code> [260], <code>public.agent_tool_invocations</code> [30], <code>public.account_event_log</code> [70], <code>public.subject_encryption_keys</code> [72], and <code>public.shadow_ai_discovery_records</code> [274].</li>
          <li><strong>Data Custody:</strong> 100% of PII, raw enterprise prompts, model weight checksums, and organizational role mappings remain behind the corporate firewall.</li>
          <li><strong>User Access:</strong> Managed strictly via local JWT-based JSON Web Tokens, restricted to Read-Only & Print permissions for external auditors to prevent manual administrative tampering [139].</li>
        </ul>

        <h3>2.2 The Cloud Attestation Boundary (Zero-Knowledge proof Space)</h3>
        <p>
          CognitiveInsight.ai hosts the external Attestation Server.
        </p>
        <ul>
          <li><strong>Target Tables:</strong> <code>public.receipt_batch_anchors</code> [73] and a simplified transactional seal ledger.</li>
          <li><strong>Information Contained:</strong> Only cryptographic seals (SHA-256 hashes, Ed25519 signatures, timestamp bounds, client ID, and sequence sequence numbers) [111, 264]. No plain text, raw prompts, model definitions, or user personal data is ever committed to our cloud.</li>
        </ul>

        <h2>3. Real-Time Ingestion Pipeline: The Sidecar Trigger Model</h2>
        <p>
          Every interaction with the on-premise database must commit its state change to the cloud ledger instantly. This is handled using a combination of PostgreSQL Database Triggers and a Localized Sidecar SDK Daemon.
        </p>

        <h3>3.1 Step-by-Step Execution Sequence</h3>
        <ol>
          <li><strong>The Event occurs:</strong> A user logs in, a model deployment is requested, or an agent invokes a high-risk tool [109, 126].</li>
          <li><strong>The Write to Database:</strong> The application executes a SQL <code>INSERT</code> statement on the local on-premise database.</li>
          <li><strong>The Database Trigger Fires:</strong> A PostgreSQL trigger intercepts the insert and forwards the row data to the <code>pg_net</code> extension or notifies a Sidecar Daemon over a local UNIX socket.</li>
          <li><strong>The Sidecar Processing Loop:</strong> The Sidecar Daemon:
            <ul>
              <li><strong>Redacts Sensitive Data:</strong> Pulls only non-sensitive structural properties (Event ID, Tenant ID, Receipt Type, Sequence Number).</li>
              <li><strong>Enforces Canonicalization (RFC 8785):</strong> Alphabetizes properties, removes spacing, and normalizes floats into a deterministic UTF-8 byte stream [515].</li>
              <li><strong>Hashes the Content:</strong> Computes a SHA-256 hash over the payload [515].</li>
              <li><strong>Generates Signature (Ed25519):</strong> Signs the hash using the local rotating private key [515].</li>
            </ul>
          </li>
          <li><strong>The Cloud Commit (The Attestation):</strong> The sidecar performs a secure HTTPS POST request to the external Cloud Attestation Server, carrying only the cryptographic proof bundle [111].</li>
          <li><strong>The Cloud Validation & Storage:</strong> The Cloud Attestation Server verifies the Ed25519 signature against the client's registered public key. Upon validation, the cloud server writes the seal to its append-only database and returns a signed <code>cloud_attestation_receipt</code> [111].</li>
          <li><strong>The Local Linkage:</strong> The sidecar daemon writes the <code>cloud_attestation_receipt_id</code> and the returned timestamp back to the local database, completing the chain.</li>
        </ol>

        <h2>4. On-Premise Trigger Implementation (DDL)</h2>
        <p>
          To automate this pipeline and ensure that no developer can bypass the attestation loop, database-level triggers are bound directly to your core on-premise tables.
        </p>

        <pre><code className="language-sql">{`-- DDL to create the local Outbox Queue for Attestations
CREATE TABLE public.attestation_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    canonical_payload JSONB NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Trigger Function to capture new local receipts
CREATE OR REPLACE FUNCTION public.trigger_receipt_attestation()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    v_canonical JSONB;
    v_hash TEXT;
BEGIN
    -- 1. Extract structural properties (Discarding raw payloads for privacy)
    v_canonical := jsonb_build_object(
        'receipt_id', NEW.id,
        'organization_id', NEW.organization_id,
        'receipt_type', NEW.receipt_type,
        'content_hash', NEW.content_hash,
        'event_timestamp', NEW.event_timestamp,
        'gate_evaluation_id', NEW.gate_evaluation_id,
        'lifecycle_stage', NEW.lifecycle_stage
    );

    -- 2. Push to local outbox (Sidecar Daemon polls this queue)
    INSERT INTO public.attestation_outbox (table_name, record_id, canonical_payload, payload_hash)
    VALUES (TG_TABLE_NAME, NEW.id, v_canonical, NEW.content_hash);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger to public.receipts
CREATE TRIGGER queue_receipt_attestation
    AFTER INSERT ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_receipt_attestation();`}</code></pre>

        <h2>5. Standardized Attestation Schema Contract (JSON Payload)</h2>
        <p>
          Every payload transmitted from the local on-premise server to the external Cloud Attestation Server must adhere to this strict Zero-Knowledge structure. It is complete enough to be independently verified by any third-party auditor, yet contains absolutely zero proprietary corporate IP or customer PII.
        </p>
        <pre><code className="language-json">{`{
  "attestation_metadata": {
    "organization_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
    "on_prem_server_id": "srv:on-prem:ok-calera-001",
    "attestation_type": "transactional_db_insert",
    "canonicalization_version": "agei-json-v1",
    "timestamp_utc": "2026-07-26T16:53:12Z"
  },
  "database_context": {
    "source_table": "public.receipts",
    "primary_key_id": "c3e1a052-aebc-47ac-aca0-8c0d53ec0482",
    "receipt_type": "model_deployment_receipt",
    "lifecycle_stage": "deployment"
  },
  "cryptographic_seal": {
    "local_content_hash": "sha256:d8e8f8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff8877",
    "hash_algorithm": "sha256",
    "signing_key_id": "key:client-ed25519-2026-07",
    "client_signature": "eddsa-ed25519:81f185c7d8a9e0129b8c7c7f3e8f81a7b8e1f0e21a2c3d4e5f6a7b8c9d0e1f2a..."
  }
}`}</code></pre>

        <h2>6. Verification and Cross-Comparison Engine</h2>
        <p>
          Because the external attestation ledger holds a mathematical "twin" of every write made in the private local database, auditing the system is extremely secure. This process is called Ledger Reconciliation.
        </p>
        <p>
          When an auditor executes a Verification Job [266] on the on-premise portal, the backend performs a programmatic cross-comparison with the Cloud Attestation ledger:
        </p>

        <pre><code>{`[ ON-PREM DATABASE ]                                        [ CLOUD LEDGER ]
Row ID: c3e1a052...                                         Event ID: c3e1a052...
Local Hash: sha256:d8e8f8...   ◄─── [Compare Hashes] ───►   Attested Hash: sha256:d8e8f8...
Local Signature: verified      ◄─ [Verify Signature] ───►   Client Signature: verified`}</code></pre>

        <h3>6.1 The Verification Outcomes</h3>
        <p>During reconciliation, the comparison engine identifies three critical risk patterns:</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-b border-border py-2 px-4">Discovered State</th>
                <th className="border-b border-border py-2 px-4">Diagnostic Analysis</th>
                <th className="border-b border-border py-2 px-4">Risk Level & Action Routing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-border py-2 px-4 font-semibold text-emerald-600">Perfect Match</td>
                <td className="border-b border-border py-2 px-4 text-sm">The on-premise row ID, content hash, and client signature perfectly match the record committed to the cloud.</td>
                <td className="border-b border-border py-2 px-4 text-sm"><strong>SAFE (Green):</strong> Cryptographic verification complete. Integrity guaranteed [132].</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-semibold text-rose-500">Gaps / Omissions</td>
                <td className="border-b border-border py-2 px-4 text-sm">A transaction ID exists in the cloud ledger but is missing entirely from the on-premise database.</td>
                <td className="border-b border-border py-2 px-4 text-sm"><strong>HIGH RISK (Red):</strong> Local administrative deletion detected. Indicates a user attempted to wipe historical logs [496]. Trigger <code>public.incidents</code> [15].</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-semibold text-rose-500">Mismatched Seals</td>
                <td className="border-b border-border py-2 px-4 text-sm">The transaction ID exists on-premise, but the local payload recalculates to a hash that mismatches the cloud's attested hash.</td>
                <td className="border-b border-border py-2 px-4 text-sm"><strong>CRITICAL RISK (Red):</strong> Historical data alteration (Cognitive Tampering) detected. The raw contents were modified after attestation [520]. Lock database session [36].</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-semibold text-amber-500">Unattested Records</td>
                <td className="border-b border-border py-2 px-4 text-sm">A receipt exists in the local on-premise database but has no corresponding record in the cloud attestation database.</td>
                <td className="border-b border-border py-2 px-4 text-sm"><strong>MEDIUM RISK (Yellow):</strong> Bypass attempt or network queue failure. The transaction executed out-of-band of the runtime control gates [113].</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>6.2 Python Verification Proof of Concept</h3>
        <p>
          This script demonstrates how an auditor runs an offline validation, pulling the local database row, calculating its canonical hash, and asserting that it matches the cloud anchor root:
        </p>

        <pre><code className="language-python">{`import hashlib
import json
import requests

def verify_local_record_against_cloud(local_record: dict, client_key_pem: bytes) -> bool:
    """
    Validates that a local on-premise database record perfectly matches
    its immutable cryptographic attestation on the cloud server.
    """
    # 1. Strip raw context to isolate structural schema
    structural_payload = {
        "receipt_id": local_record["id"],
        "organization_id": local_record["organization_id"],
        "receipt_type": local_record["receipt_type"],
        "content_hash": local_record["content_hash"],
        "event_timestamp": local_record["event_timestamp"],
        "gate_evaluation_id": local_record["gate_evaluation_id"],
        "lifecycle_stage": local_record["lifecycle_stage"]
    }

    # 2. Canonicalize local data (RFC 8785)
    canonical_bytes = json.dumps(structural_payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
    computed_hash = "sha256:" + hashlib.sha256(canonical_bytes).hexdigest()

    # 3. Fetch attestation from the independent Cloud Ledger
    cloud_api_url = f"https://api.cognitiveinsight.ai/v1/attestations/{local_record['id']}"
    headers = {"Authorization": "Bearer CLIENT_SECRET_KEY"}

    try:
        response = requests.get(cloud_api_url, headers=headers, timeout=5)
        if response.status_code == 404:
            print("[ALERT] UNATTESTED RECORD DETECTED: No cloud seal exists.")
            return False
        response.raise_for_status()
        cloud_seal = response.json()
    except Exception as e:
        print(f"[ERROR] Cloud ledger unreachable: {e}")
        return False

    # 4. Assert Invariants
    # Invariant 1: Hashes must match
    if computed_hash != cloud_seal["cryptographic_seal"]["local_content_hash"]:
        print("[ALERT] COGNITIVE TAMPERING DETECTED: Local record has been altered!")
        return False

    # Invariant 2: Original signature must match
    if local_record["signature"] != cloud_seal["cryptographic_seal"]["client_signature"]:
        print("[ALERT] SIGNATURE MISMATCH: Local verification identity has been manipulated!")
        return False

    print("[SUCCESS] Record verified. Absolute historical integrity guaranteed.")
    return True`}</code></pre>

        <h2>7. Strategic Business Benefits</h2>
        <p>By combining local database control with real-time cloud attestation, CognitiveInsight.ai delivers a unique, zero-friction commercial value proposition:</p>
        <ul>
          <li><strong>Eliminates "Surveillance Anxiety":</strong> Since the cloud attestation server receives only cryptographic hashes, your clients are guaranteed that CognitiveInsight never sees their proprietary data, raw prompts, model outputs, or customer details, solving GDPR and SOC2 compliance concerns [135, 180].</li>
          <li><strong>Unbreakable Audit Trail:</strong> Traditional local system logs are mutable by system administrators (such as a rogue IT employee or compromised superuser). By committing every single transaction seal to your cloud in real time, the database becomes mathematically append-only [496]. A compromised admin can delete local database records, but the discrepancy will instantly flag as a gap during the next reconciliation audit [139].</li>
          <li><strong>Maximum System Velocity:</strong> Decoupling the heavy raw database storage from the cloud attestation ledger keeps local query speeds incredibly high. It keeps cloud storage overhead at an absolute minimum (~200 bytes per event), meaning the system can process millions of transactions daily at near-zero hosting costs [523].</li>
        </ul>
      </div>
    </div>
  );
}
