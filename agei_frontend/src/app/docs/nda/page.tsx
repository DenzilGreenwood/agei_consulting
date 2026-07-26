import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'AGEI Hybrid Architecture (NDA) | AGEI',
  description: 'Technical specification for the Hybrid Cryptographic Assurance Model.',
};

export default function NDAPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12 flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-full mt-1">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            AGEI Hybrid Architecture: On-Premise Audit Portal and External Attestation Protocol
          </h1>
          <p className="text-muted-foreground">
            This technical specification details the Hybrid Cryptographic Assurance Model for the AI Governance Evidence Infrastructure (AGEI).
          </p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>
          To resolve the core conflict between absolute client data privacy and un-spoofable third-party verifiability, this architecture bifurcates the system into two distinct environments:
        </p>
        <ul>
          <li><strong>The On-Premise Audit & Information Portal (Local Customer Boundary):</strong> A robust database-aligned visualization and compliance reporting application deployed within the client's firewall. Accessible via cryptographically signed JSON Web Tokens (JWTs), it serves as the human-readable portal for external auditors and internal teams.</li>
          <li><strong>The Cloud Assertion Vault (External Attestation Server):</strong> An ultra-secure, append-only cryptographic anchoring registry managed by CognitiveInsight.ai. It contains zero cleartext data, registering only cryptographically signed Merkle Roots and event batch signatures.</li>
        </ul>

        <h2>1. Architectural System Topography</h2>
        <p>
          The topography separates the Private Context Space from the Public Attestation Space, ensuring that raw prompt telemetry, proprietary code, and sensitive corporate databases never leave the client's physical custody.
        </p>
        <pre><code>{`                  ┌───────────────────────────────────────────────────────────┐
                  │                ON-PREMISE SECURITY BOUNDARY               │
                  │                                                           │
                  │  ┌───────────────────────┐     ┌───────────────────────┐  │
  Inference SDK  ─┼─►│  public.receipts (DB) │◄────┤   Audit Portal UI     │  │
  & Agentic Gates │  └──────────┬────────────┘     │  (Next.js / Read-Only)│  │
                  │             │                  └──────────▲────────────┘  │
                  │             ▼                             │               │
                  │      [Merkle Batcher]                     │ JWT Access    │
                  │             │                             │ (Auditors/User)
                  │             ▼                             │               │
                  └─────────────┼─────────────────────────────┼───────────────┘
                                │                             │
                        Local   │ Signed Merkle Root          │
                        Web     ▼                             │
                        Push  ┌───────────────────────────────┴───────────────┐
                              │           COGNITIVEINSIGHT.AI CLOUD           │
                              │                                               │
                              │  ┌─────────────────────────────────────────┐  │
                              │  │      public.receipt_batch_anchors       │  │
                              │  │          (External Attestation)         │  │
                              │  └─────────────────────────────────────────┘  │
                              └───────────────────────────────────────────────┘`}</code></pre>

        <h3>1.1 Data Residency Allocations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-b border-border py-2 px-4">Database Table / Artifact</th>
                <th className="border-b border-border py-2 px-4">On-Premise Residency</th>
                <th className="border-b border-border py-2 px-4">External Attestation Server</th>
                <th className="border-b border-border py-2 px-4">Reason for Placement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.principals (Emails, Keys)</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-red-500 font-semibold">NO</td>
                <td className="border-b border-border py-2 px-4">Prevents exposure of employee PII to the cloud.</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.receipts (Raw JSON payloads)</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-red-500 font-semibold">NO</td>
                <td className="border-b border-border py-2 px-4">Retains proprietary enterprise content locally.</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.receipt_batches (Merkle trees)</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-red-500 font-semibold">NO</td>
                <td className="border-b border-border py-2 px-4">Stores raw leaf arrays and inclusion structures.</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.receipt_batch_anchors</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4">Anchors the signed Merkle Root hash as a secure public reference.</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.signing_keys (Decryption keys)</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-red-500 font-semibold">NO</td>
                <td className="border-b border-border py-2 px-4">Strict FIPS 140-3 boundary isolation.</td>
              </tr>
              <tr>
                <td className="border-b border-border py-2 px-4 font-mono text-sm">public.verification_jobs</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4 text-emerald-600 font-semibold">YES</td>
                <td className="border-b border-border py-2 px-4">Reconstructs the mathematical verification proof on both sides.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>2. On-Premise Audit & Information Portal Specs</h2>
        <p>The on-premise portal is a web interface allowing authorized stakeholders to navigate, filter, and print the relational evidence graph.</p>

        <h3>2.1 The JWT Authentication Envelope</h3>
        <p>External auditors and organizational viewers gain access via scoped JSON Web Tokens signed by the enterprise identity provider (IdP). The token payload restricts permission sets:</p>
        <pre><code className="language-json">{`{
  "iss": "https://auth.enterprise-client.com",
  "sub": "usr_9f8e7d6c5b",
  "role": "auditor",
  "org_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
  "permissions": [
    "receipts:read",
    "receipts:print",
    "lineage:traverse",
    "audit_packs:read",
    "verification_jobs:run"
  ],
  "exp": 1785081600
}`}</code></pre>

        <h3>2.2 Access Tier Invariants (Read-Only & Print Enforcement)</h3>
        <p>To prevent organizational viewers or guest auditors from tampering with compliance records or configuration state:</p>
        <ul>
          <li><strong>UI Invariant:</strong> All inputs, action buttons, and configuration fields are dynamically disabled. Only searching, filtering, and printing/PDF generation routes are mounted in the browser.</li>
          <li><strong>API Invariant:</strong> The on-premise backend middleware intercepts all non-GET HTTP verbs. Any POST, PUT, or DELETE attempt on core tables from an active auditor session returns HTTP 403 Forbidden.</li>
          <li><strong>Database Invariant:</strong> As defined in our <code>agei-database-policies-indices.sql</code> script, Row-Level Security (RLS) is applied to prevent data modification:</li>
        </ul>
        <pre><code className="language-sql">{`-- Lock down receipts to prevent any administrative updates or deletes
CREATE POLICY restrict_auditor_mutations ON public.receipts
  FOR UPDATE OR DELETE
  USING (FALSE) -- Permanently denies execution
  WITH CHECK (FALSE);`}</code></pre>

        <h2>3. External Server Attestation Protocol</h2>
        <p>The external Attestation Server acts as a zero-knowledge notary. It registers daily or hourly cryptographic snapshots ("anchors") pushed from the on-premise system.</p>

        <h3>3.1 The Attestation Ingestion Payload</h3>
        <p>When a Merkle batch is sealed on-premise, the local batcher issues an out-of-band HTTPS POST to the external Cloud Assertion Vault (<code>https://api.cognitiveinsight.ai/v1/attestation/anchor</code>). The payload is strictly limited to cryptographic proofs:</p>
        <pre><code className="language-json">{`{
  "anchor_id": "anc:org-123:batch-4009",
  "organization_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
  "batch_number": 4009,
  "merkle_root_hash": "sha256:d8e8f8c8a8b8f8776655c4c4b3b3a2a21100f9e9d9c9b9a9332211aa00ff8877",
  "batch_size": 1420,
  "signature": "eddsa-ed25519:6c7a8b9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b...",
  "signing_key_fingerprint": "fp:ed25519:2026:01",
  "anchored_at": "2026-07-26T14:30:00Z",
  "validation_rules_version": "v2.1.0"
}`}</code></pre>

        <p>By storing only this payload, CognitiveInsight.ai has:</p>
        <ul>
          <li><strong>Zero view</strong> of the client's corporate data (preserving absolute GDPR/CCPA privacy boundaries).</li>
          <li><strong>Absolute mathematical verification power</strong> (allowing any external auditor to verify that the local database hasn't been quietly edited post-event).</li>
        </ul>

        <h2>4. The Cryptographic Match-and-Compare Protocol</h2>
        <p>When an external auditor reviews an event receipt inside the on-premise portal, they can execute a Cross-Verification Job. This job proves that the local record matches the immutable public anchor.</p>

        <h3>4.1 Verification Lifecycle & Mathematics</h3>
        <pre><code>{`   On-Premise Receipt        Merkle Proof Path         Cloud Attestation Server
  ┌──────────────────┐      ┌─────────────────┐      ┌───────────────────────────┐
  │  Content Hash:   ├─────►│ - Left Hash     ├─────►│  Registered Merkle Root   │
  │  "sha256:a1b2"   │      │ - Right Hash    │      │  "sha256:d8e8f8..."       │
  └──────────────────┘      │ - Root Node     │      └─────────────▲─────────────┘
                            └────────┬────────┘                    │
                                     │                             │ Is Match?
                                     ▼                             │
                              [Local Compute] ─────────────────────┘
                              (Recomputed Root)`}</code></pre>

        <ol>
          <li><strong>Local Receipt Retrieval:</strong> The auditor selects a receipt (e.g., <code>receipt_id = 'rcpt:123'</code>) in the on-premise portal.</li>
          <li><strong>Inclusion Proof Construction:</strong> The on-premise backend fetches the <code>merkle_proof</code> path from <code>public.receipt_batch_items</code> for that receipt, which contains the coordinate hashes required to traverse the Merkle tree.</li>
          <li><strong>Recomputation:</strong> The portal recomputes the expected Merkle Root by hashing up the tree from the receipt's <code>content_hash</code> using the proof path.</li>
          <li><strong>Cloud Compare:</strong> The portal calls the CognitiveInsight Cloud API to fetch the anchored root for that batch_id.</li>
          <li><strong>Assertion Check:</strong> The portal compares the recomputed Merkle root against the externally anchored Merkle root. If they are identical, the receipt is verified as authentic, untampered, and chronologically sealed.</li>
        </ol>

        <h2>5. Executable Verification Simulation (Python)</h2>
        <p>Below is a complete, runnable Python script that simulates this exact dual-server validation loop. It demonstrates deterministic Merkle proof traversal and cross-checks local state against an external attestation anchor.</p>

        <pre><code className="language-python">{`import hashlib
import json
from datetime import datetime, timezone

def canonicalize(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')

def sha256_hash(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()

# ---------------------------------------------------------
# STEP 1: Simulate On-Premise Receipt & Merkle Tree Creation
# ---------------------------------------------------------

# We have 4 local receipts in a batch
receipts = [
    {"receipt_id": "rcpt_01", "event": "Dataset Registered", "data": "claims_v1"},
    {"receipt_id": "rcpt_02", "event": "Model Trained", "data": "router_v4"},
    {"receipt_id": "rcpt_03", "event": "Model Validated", "data": "accuracy=92%"},
    {"receipt_id": "rcpt_04", "event": "Model Deployed", "data": "prod_east_node"}
]

# Calculate local leaf hashes
hashes = [sha256_hash(canonicalize(r)) for r in receipts]

# Build a simple Merkle Tree
# Leaves: H1, H2, H3, H4
# Parent Left (L1) = hash(H1 + H2)
# Parent Right (L2) = hash(H3 + H4)
# Merkle Root = hash(L1 + L2)

def combine_hashes(h1: str, h2: str) -> str:
    combined = (h1 + h2).encode('utf-8')
    return sha256_hash(combined)

l1 = combine_hashes(hashes[0], hashes[1])
l2 = combine_hashes(hashes[2], hashes[3])
local_merkle_root = combine_hashes(l1, l2)

print(f"[*] On-Premise Merkle Tree Built Successfully.")
print(f"    - Leaf 1 (Dataset): {hashes[0]}")
print(f"    - Leaf 2 (Training): {hashes[1]}")
print(f"    - Leaf 3 (Validation): {hashes[2]}")
print(f"    - Leaf 4 (Deployment): {hashes[3]}")
print(f"    - Computed Merkle Root: {local_merkle_root}\\n")

# ---------------------------------------------------------
# STEP 2: Simulate Commitment to the External Cloud Anchor
# ---------------------------------------------------------
# The on-premise system commits ONLY the Merkle Root Hash to CognitiveInsight.ai
external_attestation_server_db = {
    "batch_anchor_4009": {
        "batch_number": 4009,
        "merkle_root_hash": local_merkle_root,
        "anchored_at": datetime.now(timezone.utc).isoformat(),
        "status": "anchored"
    }
}
print(f"[+] External Server Anchor Created (Root: {local_merkle_root}).\\n")

# ---------------------------------------------------------
# STEP 3: Simulate Auditor Independent Verification Check
# ---------------------------------------------------------

def run_auditor_verification(target_receipt: dict, proof_path: list, expected_root: str) -> bool:
    """
    Auditor takes a single local receipt, its proof path, and compares
    it against the externally anchored Merkle Root.
    """
    # 1. Compute hash of the local target receipt
    current_hash = sha256_hash(canonicalize(target_receipt))
    print(f"[*] Auditor starts verification for: {target_receipt['receipt_id']}")
    print(f"    - Local Receipt Hash: {current_hash}")

    # 2. Traverse up the proof path to recompute the root
    # Proof path contains tuples of (sibling_hash, direction)
    for sibling_hash, direction in proof_path:
        if direction == "left":
            current_hash = combine_hashes(sibling_hash, current_hash)
        else:
            current_hash = combine_hashes(current_hash, sibling_hash)
        print(f"    - Combined Step Hash: {current_hash}")

    # 3. Compare the final recomputed hash against the external anchor root
    print(f"    - Recomputed Root: {current_hash}")
    print(f"    - Externally Anchored Root: {expected_root}")

    is_valid = (current_hash == expected_root)
    return is_valid

# Verify Receipt 3 (Model Validated)
# Sibling of Receipt 3 (H3) is Receipt 4 (H4) on the Right
# Sibling of Right Parent (L2) is Left Parent (L1) on the Left
proof_for_receipt_3 = [
    (hashes[3], "right"), # Combine H3 + H4 -> L2
    (l1, "left")         # Combine L1 + L2 -> Root
]

# Fetch the anchor from our external server mock
cloud_anchor_root = external_attestation_server_db["batch_anchor_4009"]["merkle_root_hash"]

# Execute the proof check
verification_success = run_auditor_verification(
    target_receipt=receipts[2],
    proof_path=proof_for_receipt_3,
    expected_root=cloud_anchor_root
)

if verification_success:
    print("\\n[SUCCESS] Verification complete! Receipt is cryptographically authentic.")
else:
    print("\\n[FAILED] Verification failed! Local receipt has been tampered with or corrupted.")`}</code></pre>

        <h2>6. Regulatory & Security Auditing Benefits</h2>
        <p>This hybrid configuration satisfies standard compliance frameworks under intense audit scrutiny:</p>
        <ul>
          <li><strong>EU AI Act - Article 12 (Traceability):</strong> Standard logs can be edited by database administrators. This protocol ensures that once a lifecycle or validation gate receipt is recorded, its record of existence is permanently anchored externally, rendering backdating or log-manipulation impossible.</li>
          <li><strong>GDPR - Article 5 (Data Minimization) & Article 17 (Right to Erasure):</strong> The external Cloud Assertion Vault stores only Merkle roots (random hash digests). If an on-premise system needs to comply with an erasure request and shred localized data, the public ledger is unaffected, and no personal data is ever exposed to third parties.</li>
          <li><strong>ISO/IEC 42001 (Continuous Control Enforcement):</strong> Provides proof to certification bodies that safety gates are not checked manually or retroactively; the signature and timestamp chains prove they occurred out-of-band at the exact moment of inference or model promotion.</li>
        </ul>
      </div>
    </div>
  );
}
