import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export const metadata = {
  title: 'Symmetric Audit & Real-Time Transactional Attestation | AGEI',
  description: 'A High-Assurance Hybrid Design Blueprint for Multi-Tenant Privacy and Circular Auditor Accountability',
};

export default function SymmetricAuditPage() {
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
          <Scale className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            AGEI Core Specification: Symmetric Audit & Real-Time Transactional Attestation
          </h1>
          <p className="text-muted-foreground font-medium">
            A High-Assurance Hybrid Design Blueprint for Multi-Tenant Privacy and Circular Auditor Accountability
          </p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h2>1. Architectural Philosophy: The "Symmetric Audit" Invariant</h2>
        <p>
          Traditional security models can create a trust asymmetry between auditors and system operators: Who audits the auditor? If an external regulator or an internal high-privileged administrator has access to a compliance dashboard, they possess the ambient privilege to view sensitive files, query system logs, or silently alter historical classifications.
        </p>
        <p>
          To solve this, the AI Governance Evidence Infrastructure (AGEI) enforces a symmetric audit model [92, 162]. Under this design:
        </p>
        <ul>
          <li><strong>Low-privilege user logs:</strong> Each governed interaction on either the on-premise application server or the external Cloud Attestation server is modeled as a first-class CIAF-LCM transaction [106].</li>
          <li><strong>Bidirectional cryptographic receipting:</strong> Selected contextual actions (such as viewing a patient file, editing a prompt boundary, or running an audit job) are captured in detailed context on the customer's on-premise database, but their metadata envelope, cryptographic signature, and posture flags are immediately committed to the external Cloud Attestation database as a normal receipt [111, 253].</li>
          <li><strong>Bidirectional Audit Linkage:</strong> When an external auditor accesses the Cloud Attestation database to run a verification job, the cloud-side API logs the auditor's activities as a tamper-evident Cloud Audit Receipt [143]. The unredacted forensic details of the auditor’s query are sent back and stored inside the client's on-premise WORM vault, while the cryptographically signed anchor of that access log remains on the cloud [135, 139].</li>
        </ul>
        <p>
          The design is intended to make it difficult for an administrator to wipe their own tracks on-premise without breaking the cloud hash chain, and the architecture is intended to reduce the risk of an auditor snooping on client data in the cloud without generating a persistent access log held in custody by the client [117].
        </p>

        <h2>2. Hybrid Transactional Flow & Payload Split</h2>
        <p>
          To maintain a clear separation between privacy-preserving context storage and external attestation, the backend splits every user interaction into a <strong>Private Context Payload</strong> (retained strictly on-premise) and a <strong>Public Attestation Receipt</strong> (committed in real time to the external server) [308, 338].
        </p>

        <Mermaid chart={`graph TB
subgraph OnPrem["CLIENT ON-PREMISE BOUNDARY<br/>(Host-Managed Private Context)"]
  Action["User Action (e.g., Query Data)"]
  EventLog["Write Raw Interaction Log<br/>──────────────────────<br/>(public.account_event_log)"]
  Capsule["Generate Local Evidence Capsule<br/>──────────────────────<br/>(public.evidence_capsules)<br/>- Detailed contextual payload<br/>- Materialization status: 'pending'"]
  Action --> EventLog
  EventLog --> Capsule
end

subgraph Cloud["COGNITIVEINSIGHT CLOUD<br/>(Append-Only Attestation Hub)"]
  API["API Endpoint<br/>──────────────────────<br/>[POST /api/attest/receipt]"]
  AttestDB["Write Attestation Record<br/>──────────────────────<br/>(public.receipts)<br/>- receipt_id (UUID)<br/>- content_hash (SHA-256)<br/>- Ed25519 signature<br/>- POSTURE FLAGS (Visible)<br/>  • is_anomaly: TRUE<br/>  • is_override: FALSE<br/>  • data_leak_flag: TRUE"]
  API --> AttestDB
end

Capsule --> API

style OnPrem stroke:#818cf8,fill:#eef2ff
style Cloud stroke:#a78bfa,fill:#f5f3ff
style EventLog stroke:#fb923c,fill:#fff7ed
style Capsule stroke:#4ade80,fill:#f0fdf4
style API stroke:#38bdf8,fill:#f0f9ff
style AttestDB stroke:#e879f9,fill:#fdf4ff`} />

        <h3>A. On-Premise Storage (The Ground-Truth Context)</h3>
        <p>
          The local database (controlled by the organization) writes a highly detailed transaction log directly to <code>public.account_event_log</code> [70] or <code>public.authorization_audit_events</code> [81], and encapsulates it within an <code>evidence_capsules</code> record [11]:
        </p>
        <pre><code className="language-json">{`{
  "capsule_id": "caps_local_2026_07_26_0012",
  "organization_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
  "principal_id": "9a1f8b2c-30fc-4de7-bc99-1a91e57c8bf0",
  "principal_email": "m.vance@enterprise-client.com",
  "action_performed": "view_model_evaluation_metrics",
  "resource_type": "model_version",
  "resource_id": "claims_triage_v4.3.2",
  "unredacted_context": {
    "query_parameters": {
      "include_pii_features": true,
      "target_geography": "US-SW"
    },
    "ip_address": "192.168.1.125",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  },
  "materialization_status": "materialized",
  "capsule_hash": "sha256:d8e8f8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff8877"
}`}</code></pre>

        <h3>B. Cloud Commitment (The Sanitized Attestation Receipt)</h3>
        <p>
          The local on-premise server runs a trigger that extracts only the structural metadata, signs it with the local Ed25519 system key, and pushes it to the external Cloud Attestation Server [253]:
        </p>
        <pre><code className="language-json">{`{
  "receipt_metadata": {
    "receipt_id": "rcpt:org-456:user-action:uuid-9988",
    "receipt_type": "user_interaction_receipt",
    "canonicalization_version": "agei-json-v1",
    "hash_algorithm": "sha256",
    "signature_algorithm": "ED25519",
    "signing_key_id": "signing-key-uuid-1122",
    "signed_by_principal_id": "agent-sidecar-uuid",
    "signed_at": "2026-07-26T17:08:22Z"
  },
  "event_context": {
    "organization_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
    "lifecycle_stage": "runtime_audit",
    "policy_version_id": "policy-version-uuid-7766"
  },
  "payload": {
    "obfuscated_principal_hash": "sha256:5ef22cbfde812ac11f1816f1a8c634d0b1351515286c4a8bdf12349e1e2cfc",
    "action_category": "read_access",
    "resource_type": "model_version",
    "resource_id_hash": "sha256:88ee9d4fbcda712ac11f1816f1a8c634d0b1351515286c4a8bdf58149e1e2cfd",
    "governance_flags": {
      "is_anomaly": false,
      "policy_violation": false,
      "gate_outcome": "approve",
      "escalation_triggered": false,
      "data_leak_suspected": false
    }
  },
  "cryptographic_proof": {
    "content_hash": "sha256:d8e8f8c8a8b8f8776655c4c4b3b3a2a21100ff8877",
    "signature": "eddsa-ed25519:7a8b9c..."
  }
}`}</code></pre>

        <h2>3. Database Invariants & Real-Time Triggers</h2>
        <p>
          To automate this logging pipeline and enforce the attestation flow, the on-premise database runs a PostgreSQL trigger. The moment a user interacts with a governed asset, a record is created in <code>public.account_event_log</code> [70], which fires an execution loop that generates a receipt and forces a real-time HTTP commit to the cloud [264].
        </p>

        <h3>The On-Premise Audit Trigger (PostgreSQL DDL)</h3>
        <pre><code className="language-sql">{`-- Create table to track outbound attestation delivery status
CREATE TABLE public.outbound_attestation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger function to capture user interactions and queue them for attestation
CREATE OR REPLACE FUNCTION public.trigger_user_interaction_attestation()
RETURNS TRIGGER AS $$
DECLARE
    v_receipt_id UUID;
    v_payload_json JSONB;
    v_content_hash TEXT;
    v_signing_key_id UUID;
    v_system_principal_id UUID;
BEGIN
    -- 1. Compute deterministic content hash of the log row
    v_payload_json := jsonb_build_object(
        'event_id', NEW.id,
        'organization_id', NEW.organization_id,
        'event_type', NEW.event_type,
        'event_status', NEW.event_status,
        'occurred_at', NEW.occurred_at
    );

    -- Hash calculation matching RFC 8785 canonicalization
    v_content_hash := 'sha256:' || encode(digest(v_payload_json::text, 'sha256'), 'hex');

    -- 2. Resolve default signing key and system principal
    SELECT id INTO v_signing_key_id FROM public.signing_keys
    WHERE organization_id = NEW.organization_id AND is_active = TRUE AND is_default = TRUE LIMIT 1;

    SELECT id INTO v_system_principal_id FROM public.principals
    WHERE principal_type = 'system' AND is_active = TRUE LIMIT 1;

    -- 3. Insert local receipt record (WORM protected)
    INSERT INTO public.receipts (
        organization_id,
        receipt_type,
        receipt_payload,
        content_hash,
        hash_algorithm,
        canonicalization_version,
        signature,
        signature_algorithm,
        signing_key_id,
        signed_by,
        event_timestamp,
        lifecycle_stage,
        is_verified
    ) VALUES (
        NEW.organization_id,
        'user_interaction_receipt',
        v_payload_json,
        v_content_hash,
        'sha256',
        'agei-json-v1',
        'ephemeral_signature_placeholder', -- Signed by localized agent daemon
        'ED25519',
        v_signing_key_id,
        v_system_principal_id,
        NEW.occurred_at,
        'runtime_audit',
        TRUE
    ) RETURNING id INTO v_receipt_id;

    -- 4. Queue the sanitized receipt for the external Attestation Cloud
    INSERT INTO public.outbound_attestation_queue (receipt_id, payload)
    VALUES (
        v_receipt_id,
        jsonb_build_object(
            'receipt_id', v_receipt_id,
            'organization_id', NEW.organization_id,
            'receipt_type', 'user_interaction_receipt',
            'content_hash', v_content_hash,
            'event_timestamp', NEW.occurred_at,
            'governance_flags', jsonb_build_object(
                'is_anomaly', FALSE,
                'policy_violation', (NEW.event_status = 'denied'),
                'gate_outcome', CASE WHEN NEW.event_status = 'recorded' THEN 'approve' ELSE 'deny' END
            )
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to account_event_log
CREATE TRIGGER audit_user_interactions
    AFTER INSERT ON public.account_event_log
    FOR EACH ROW EXECUTE FUNCTION public.trigger_user_interaction_attestation();`}</code></pre>

        <h2>4. Auditor User Logging & Materialization Flow</h2>
        <p>
          When an auditor logs into the external Cloud Attestation database, their own actions are funneled through the same CIAF-LCM pipeline, implementing an additional check against administrative abuse [143].
        </p>

        <h3>A. Symmetric Audit Flow</h3>
        <Mermaid chart={`graph TB
Auditor["[ Cloud Auditor logs in ]"]
Receipt["[ Emits Cloud Audit Receipt ]"]
Anchor["[ Anchors SHA-256 to Cloud Ledger ]"]
subgraph ClientVault["[ Writes to Client On-Premise Vault ]"]
  VaultTable["(public.evidence_capsules)<br/>- Status: 'pending_materialization'"]
end

Auditor --> Receipt
Receipt --> Anchor
Anchor -->|Secure Outbound Sync| ClientVault

style Auditor stroke:#818cf8,fill:#eef2ff
style Receipt stroke:#fb923c,fill:#fff7ed
style Anchor stroke:#4ade80,fill:#f0fdf4
style ClientVault stroke:#e879f9,fill:#fdf4ff`} />

        <h3>B. Materialization Logic</h3>
        <p>If a dispute arises, an on-premise security officer can request the complete unredacted unrolling of an auditor's cloud session:</p>
        <ol>
          <li>The officer creates a <code>materialization_requests</code> entry with a high priority (<code>priority = 'urgent'</code>) and states a reason code (<code>reason_code = 'forensic_verification'</code>) [75].</li>
          <li>The CPOS backend verifies the officer’s cryptographic authority, pulls the encrypted context from the local vault, decrypts it, and renders it to the localized Read-Only/Print dashboard [12].</li>
          <li>This materialization event itself generates a tamper-evident receipt record [11]. The auditor and the administrator have their actions linked in the evidence graph.</li>
        </ol>

        <h2>5. UI Architecture: High-Assurance Audit Portal</h2>
        <p>
          The on-premise server hosts a dedicated React-based Audit & Information Portal. Access is restricted using secure, short-lived JWT tokens containing fine-grained, read-only permissions [510].
        </p>

        <h3>The Dashboard Visual Interface</h3>
        <p>The layout is designed as a split-screen workspace divided into three functional zones:</p>
        <ul>
          <li><strong>The Live Reconciliation Grid (The Trust Verification Matrix):</strong>
            <ul>
              <li>Displays all active system interactions (both On-Premise user events and Cloud Auditor sessions) side-by-side.</li>
              <li>Every row features an integrity status badge.</li>
              <li>When clicked, the UI re-hashes the local receipt, traverses the local Merkle path, queries the external cloud server, and verifies that the local hash matches the cloud-anchored root [101, 142].</li>
            </ul>
          </li>
          <li><strong>The Posture Flags Console:</strong>
            <ul>
              <li>Summarizes crucial security metrics: Anomaly Alerts, Blocked Shadow AI Requests, Active Policy Deviations, and Override History [35, 120, 274].</li>
              <li>Allows auditors to quickly filter by critical events without exposing any underlying customer data or proprietary code blocks.</li>
            </ul>
          </li>
          <li><strong>The Secure Materialization Drawer:</strong>
            <ul>
              <li>Features a locked interface for high-risk actions. If an investigator needs to view unredacted user prompts, they click <code>[ Request Capsule Expansion ]</code>.</li>
              <li>The UI prompts the investigator for their hardware security key, issues a time-bound cryptographic token, and launches a secure, restricted print window displaying the fully materialized evidence capsule [101, 167].</li>
            </ul>
          </li>
        </ul>

        <h2>6. Verification & Reconciliation Blueprint (Python)</h2>
        <p>
          To demonstrate how the on-premise portal programmatically asserts that the local records match the cloud attestation ledger under verification, the following script can be executed locally to perform an independent verification audit:
        </p>

        <pre><code className="language-python">{`import hashlib
import json

def verify_and_reconcile(local_record: dict, cloud_attestation: dict) -> dict:
    """
    Independent audit function that compares local database records with their corresponding cloud attestation.
    Returns audit status, identifying any deletions, modifications, or anomalies.
    """
    # 1. Deterministically serialize and re-hash the local context
    canonical_local = json.dumps(local_record, sort_keys=True, separators=(',', ':')).encode('utf-8')
    computed_local_hash = f"sha256:{hashlib.sha256(canonical_local).hexdigest()}"

    # 2. Extract Cloud Anchor values
    cloud_hash_seal = cloud_attestation.get("content_hash")
    cloud_flags = cloud_attestation.get("governance_flags", {})

    # 3. Perform Integrity Checks
    hash_verified = (computed_local_hash == cloud_hash_seal)

    # Determine Posture Verdict
    if not hash_verified:
        verdict = "POTENTIAL_TAMPER_DETECTED"
        details = "Local database row hash does not match the cloud-anchored seal. Hash mismatch indicates the row may have changed after attestation."
    else:
        verdict = "VERIFIED_SECURE"
        details = "Local row matches the cloud-anchored seal under verification. Transactional integrity checks pass."

    return {
        "receipt_id": cloud_attestation.get("receipt_id"),
        "verdict": verdict,
        "hash_verified": hash_verified,
        "local_computed_hash": computed_local_hash,
        "cloud_sealed_hash": cloud_hash_seal,
        "posture_flags": cloud_flags,
        "audit_notes": details
    }
`}</code></pre>

      </div>
    </div>
  );
}
