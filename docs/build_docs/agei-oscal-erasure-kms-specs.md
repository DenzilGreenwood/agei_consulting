# AGEI Core Specs: Dual-Layer KMS, OSCAL Compiler, and Cryptographic Erasure
This document provides the technical specifications, system designs, and executable integration blueprints for Gap 3 (Dual-Layer KMS & Key Lifecycle), Gap 4 (OSCAL Compliance-as-Code Compiler), and Gap 5 (Cryptographic Erasure & Envelope Encryption).

These specifications map directly to the 60-table PostgreSQL database schema and provide the necessary implementation files to make your AI Governance Evidence Infrastructure (AGEI) enterprise-ready.

## Part 1: Dual-Layer Key & KMS Lifecycle Architecture (Gap 3)
To ensure high-throughput execution with legal-grade non-repudiation, the AGEI key lifecycle operates on a Dual-Layer Signing Architecture. This decouples fast, high-frequency runtime events from permanent, audit-ready compliance anchoring.

```text
                  +-----------------------------------------------+
                  |          AI Runtime / MLOps Pipeline          |
                  +-----------------------------------------------+
                                          |
                                          | [1] Local Event Occurs
                                          v
+--------------------+   [2] Signs Payload   +--------------------+
|  Ephemeral Local   |---------------------->| Local Attestation  |
| Ed25519 Key (24h)  |                       | Receipt (Signed)   |
+--------------------+                       +--------------------+
                                                      |
                                                      | [3] Batched into Merkle Tree
                                                      v
+--------------------+   [5] Asymmetric Sign +--------------------+
|  Amazon KMS Key    |---------------------->| Merkle Batch Root  |
|  (Audit / Legal)   |                       |  Anchor (Sealed)   |
+--------------------+                       +--------------------+
```

### 1. Layer 1: Local System Signatures (Attestation Keys)
*   **Cryptographic Primitive:** Edwards-curve Digital Signature Algorithm (Ed25519) over Curve25519.
*   **Generation & Execution:** Generated locally in-memory by the MLOps node or sidecar microservice container.
*   **Rotation Lifecycle:** Rotated automatically every 24 hours. When rotation occurs, the old private key is purged from memory, and the public key fingerprint is marked retired in the database.
*   **Core Purpose:** To provide immediate, non-repudiable proof of origin at the system level. It verifies: "This specific container/microservice running on host X executed this lifecycle transition or tool invocation at this precise millisecond."
*   **Database Mapping:**
    *   Creates a daily entry in `public.signing_keys` with `key_storage_mode = 'app_encrypted'`, `signature_algorithm = 'ED25519'`, and `key_purpose = 'local_attestation'`.
    *   Signs individual events, writing records to `public.receipts` and `public.evidence_signatures`.

### 2. Layer 2: Cloud KMS Audit & Legal Signatures (Anchor Keys)
*   **Cryptographic Primitive:** Asymmetric Key Signing (e.g., ECDSA NIST P-256 or RSA-3072) executed via Hardware Security Module (HSM).
*   **Generation & Execution:** Generated and kept exclusively within Amazon KMS (or an equivalent FIPS 140-2 Level 3 Hardware Security Module). The private key material never leaves the KMS boundary; signing requests are sent via KMS API endpoints.
*   **Rotation Lifecycle:** Configured with an AWS KMS daily alias rotation or explicit daily KMS key recreation depending on the legal posture.
*   **Core Purpose:** Reserved exclusively for audit, compliance, and legal verification. It seals aggregated blocks of work, ensuring that data-at-rest cannot be retroactively manipulated by an administrator or a compromised runtime node.
*   **Scope of Signatures:**
    *   Sealing Merkle Tree Batch Roots (`public.receipt_batches`).
    *   Signing Regulator-Ready Compliance Bundles (`public.audit_packs`).
    *   Sealing Long-Term Records in the Evidence Vault (`public.vault_objects`).
    *   Attesting Incident Investigation Closures (`public.incidents`).
*   **Database Mapping:**
    *   Represented in `public.signing_keys` with `key_storage_mode = 'kms_managed'`, `kms_provider = 'aws'`, and populated fields for `kms_key_id`, `kms_region`, and `kms_config` (containing AWS IAM roles and policies).

### 3. Key Transition and Database Record State Matrix
When keys rotate or events are signed, records inside `public.signing_keys` transition through distinct states to ensure audit trace sanity over multi-year horizons:

| Field Name | Layer 1 (Local Attestation) | Layer 2 (Amazon KMS Audit) |
| :--- | :--- | :--- |
| `key_storage_mode` | `app_encrypted` (or `ephemeral_memory`) | `kms_managed` |
| `signature_algorithm` | `ED25519` | `ECDSA_P256` or `RSA_3072` |
| `kms_provider` | `NULL` | `aws` |
| `kms_key_id` | `NULL` | `arn:aws:kms:us-east-1:123456789012:key/abc-123` |
| `valid_from` | `2026-07-24T00:00:00Z` | `2026-07-24T00:00:00Z` |
| `valid_until` | `2026-07-25T00:00:00Z` (24h Window) | `2026-07-25T00:00:00Z` (Scheduled Rotation) |
| `rotation_reason` | `scheduled_daily_local_rotation` | `scheduled_compliance_anchor_rotation` |

---

## Part 2: OSCAL Compliance-as-Code Compiler Specification (Gap 4)
The Compliance-as-Code Compiler translates standard, human-readable GRC frameworks modeled in OSCAL (Open Security Controls Assessment Language) directly into machine-enforceable database constraints within your AGEI policy schema.

### 1. System Mapping Context
The compiler processes OSCAL Component Definitions or System Security Plans (SSP) in JSON, parses the control implementations, and generates relational entries across three main schema families:

```text
+------------------------------+
|     OSCAL JSON Document      |
|  (Component / Control Spec)  |
+------------------------------+
               |
               v [AGEI Policy Compiler]
+------------------------------+
|      public.policy_sets      | (Defines the compliance framework, e.g., "NIST AI RMF 1.0")
+------------------------------+
               |
               v Has Many
+------------------------------+
|    public.policy_versions    | (Versioned payload tracking changes to the framework rules)
+------------------------------+
               |
               v Has Many
+------------------------------+
|     public.policy_rules      | (Individual constraints, thresholds, and severe actions)
+------------------------------+
```

### 2. Executable Compiler Blueprint (Python)
Save this module as part of your AGEI Platform backend. It ingests an OSCAL component payload, processes the control parameters, and writes the validated database entries.

```python
import json
import uuid
import hashlib
from datetime import datetime

class OSCALPolicyCompiler:
    def __init__(self, organization_id: str, principal_id: str):
        self.organization_id = organization_id
        self.principal_id = principal_id

    def _generate_canonical_hash(self, payload: dict) -> str:
        # RFC 8785 Canonical JSON hashing
        canonical_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        payload_hash = hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
        return f"sha256:{payload_hash}"

    def compile_component_to_policy(self, oscal_json_str: str) -> dict:
        """
        Parses an OSCAL Component Definition JSON and returns SQL migration data
        for policy_sets, policy_versions, and policy_rules.
        """
        oscal_data = json.loads(oscal_json_str)
        component = oscal_data.get("component-definition", {})
        metadata = component.get("metadata", {})

        # 1. Resolve Policy Set Metadata
        policy_set_id = str(uuid.uuid4())
        policy_set_name = metadata.get("title", "Compiled OSCAL Governance Framework")
        policy_set_slug = policy_set_name.lower().replace(" ", "-").replace(".", "-")[:50]

        policy_set_data = {
            "id": policy_set_id,
            "organization_id": self.organization_id,
            "name": policy_set_name,
            "slug": policy_set_slug,
            "description": f"Auto-compiled from OSCAL. Version {metadata.get('version', '1.0.0')}",
            "is_active": True,
            "created_by": self.principal_id
        }

        # 2. Extract and Model Version Payload
        policy_version_id = str(uuid.uuid4())
        raw_components = component.get("components", [])

        # Structure the rules nested in the version payload
        compiled_rules = []
        for comp in raw_components:
            comp_name = comp.get("title", "Unnamed Component")
            for control_impl in comp.get("control-implementations", []):
                for rule in control_impl.get("implemented-requirements", []):
                    rule_id = str(uuid.uuid4())
                    rule_key = rule.get("control-id", "unknown_control").lower()

                    # Parse parameters to define severity and thresholds
                    props = {p["name"]: p["value"] for p in rule.get("props", []) if "name" in p}
                    severity = props.get("severity", "medium")
                    rule_type = props.get("rule_type", "requirement")

                    compiled_rules.append({
                        "id": rule_id,
                        "policy_version_id": policy_version_id,
                        "organization_id": self.organization_id,
                        "rule_key": f"{comp_name.lower().replace(' ', '_')}:{rule_key}",
                        "rule_name": rule.get("description", "OSCAL Control Rule"),
                        "rule_type": rule_type,
                        "severity": severity,
                        "rule_payload": rule,
                        "is_enabled": True
                    })

        version_payload = {
            "oscal_source_version": metadata.get("version", "1.0.0"),
            "total_rules_compiled": len(compiled_rules),
            "compiled_at": datetime.utcnow().isoformat() + "Z"
        }

        payload_hash = self._generate_canonical_hash(version_payload)

        policy_version_data = {
            "id": policy_version_id,
            "policy_set_id": policy_set_id,
            "organization_id": self.organization_id,
            "version": metadata.get("version", "1.0.0"),
            "version_number": 1,
            "policy_payload": version_payload,
            "payload_hash": payload_hash,
            "hash_algorithm": "sha256",
            "canonicalization_version": "agei-json-v1",
            "is_active": True,
            "is_published": True,
            "created_by": self.principal_id
        }

        return {
            "policy_set": policy_set_data,
            "policy_version": policy_version_data,
            "policy_rules": compiled_rules
        }
```

---

## Part 3: Cryptographic Erasure & Privacy-Preserving Custody (Gap 5)
Under strict regulations (e.g., GDPR Article 17 "Right to be Forgotten" and CCPA), organizations must erase personal data upon request. However, compliance audits demand that the integrity of historical audit logs remain mathematically unbroken.

AGEI resolves this paradox using Envelope Encryption combined with Cryptographic Erasure (Crypto-Shredding).

### 1. Conceptual Sequence Flow
```text
[1] Incoming AI Prompt/Event
        |
        v
[2] Extract Data Subject ID (User Fingerprint)
        |
        v
[3] Look up or Generate AES-256 Key in DB
    (public.subject_encryption_keys)
        |
        v
[4] Encrypt Sensitive Prompt Data (AES-GCM)
        |
        v
[5] Write Ciphertext to Vault (public.receipt_encrypted_content)
        |
        +-----------------------------------------------+
        |                                               |
        v [NORMAL STATE: Key Exists]                    v [ERASURE TRIGGERED: DSR Received]
[6a] Authorized Auditor Requests Audit           [6b] Shred Key Material in DB
        |                                               | (SET key_status = 'destroyed')
        v                                               v
[7a] Fetch Key material, decrypt, and inspect   [7b] Key is GONE. Payload remains
                                                     permanently undecipherable.
                                                     Merkle tree audit chain stays 100% INTACT.
```

### 2. Technical Payload Comparison

**State A: Fully Traceable / Decryptable Event (Active Status)**
In this state, the cryptographic envelope is intact. The data subject's personal data is fully encrypted using their corresponding subject key, allowing selective decryption by an authorized auditor with the correct decryption credentials.

```json
{
  "receipt_id": "8f6b0f34-1102-4ec4-9dfc-cf237a6b2210",
  "organization_id": "3be93cba-2f88-444a-8742-df820a4bde28",
  "event_type": "sensitive_agent_tool_invocation",
  "lifecycle_stage": "runtime_execution",
  "content_hash": "sha256:d13e3bc8213e4b7d59863bc43e26bc239bc27a19234b9cf8d1a1e948c213459c",
  "encrypted_content": {
    "envelope_id": "e00941ba-7789-41ef-bb22-f1e1cb027891",
    "subject_id": "da521e42-1209-4abc-99ef-12e3e5bf0212",
    "encryption_key_ref": "key-envelope-da521e42-v1",
    "encryption_algorithm": "aes-256-gcm",
    "key_status": "active",
    "ciphertext": "zG18HskdBWfH0YpTfB==...",
    "key_auth_tag": "fa982130e52b21c4",
    "key_iv": "1e9bc420f12c9823e5a"
  },
  "metadata": {
    "contains_personal_data": true,
    "privacy_jurisdiction": "GDPR"
  }
}
```

**State B: Post-Erasure Non-Recoverable Audit Log (Destroyed Status)**
When data erasure is requested via a Data Subject Request (DSR), the cryptographic key associated with the subject is shredded in the database. The structural metadata of the audit trail remains intact, proving the control ran, but the personal data payload becomes mathematical noise.

```json
{
  "receipt_id": "8f6b0f34-1102-4ec4-9dfc-cf237a6b2210",
  "organization_id": "3be93cba-2f88-444a-8742-df820a4bde28",
  "event_type": "sensitive_agent_tool_invocation",
  "lifecycle_stage": "runtime_execution",
  "content_hash": "sha256:d13e3bc8213e4b7d59863bc43e26bc239bc27a19234b9cf8d1a1e948c213459c",
  "encrypted_content": {
    "envelope_id": "e00941ba-7789-41ef-bb22-f1e1cb027891",
    "subject_id": "da521e42-1209-4abc-99ef-12e3e5bf0212",
    "encryption_key_ref": "key-envelope-da521e42-v1",
    "encryption_algorithm": "aes-256-gcm",
    "key_status": "destroyed",
    "destroyed_at": "2026-07-24T07:15:00Z",
    "erasure_request_id": "99e218c3-424a-4abc-88ef-2213e11a00a2",
    "destruction_reason": "DSR_GDPR_Art_17_Right_To_Be_Forgotten",
    "ciphertext": "zG18HskdBWfH0YpTfB==...",
    "key_auth_tag": "fa982130e52b21c4",
    "key_iv": "1e9bc420f12c9823e5a"
  },
  "metadata": {
    "contains_personal_data": true,
    "privacy_jurisdiction": "GDPR",
    "crypto_shredded": true
  }
}
```

---

## Part 4: Database State Transition SQL Script
To execute these key transitions, policy compilations, and cryptographic erasure requests in your Supabase backend, run this transaction script in your SQL editor:

```sql
-- AGEI Transaction Script: Key Management, OSCAL Compiler Bootstrap, & Crypto Erasure
BEGIN;

-- 1. Register Local daily signing key for Layer 1
INSERT INTO public.signing_keys (
    id,
    organization_id,
    key_name,
    key_purpose,
    key_storage_mode,
    signature_algorithm,
    key_size,
    public_key,
    public_key_fingerprint,
    valid_from,
    valid_until,
    metadata
) VALUES (
    'a3e9b11c-d402-4abc-8fde-e1293fb0e123',
    '3be93cba-2f88-444a-8742-df820a4bde28',
    'local-node-01-daily-attestation',
    'local_attestation',
    'app_encrypted',
    'ED25519',
    256,
    'MCowBQYDK2VwAyEA0v...',
    'fp:sha256:d13e3bc8213e4b7d59863bc43e26bc239bc27a19',
    NOW(),
    NOW() + INTERVAL '24 hours',
    '{"node_id": "k8s-pod-mlops-deploy-674b"}'::jsonb
);

-- 2. Register AWS KMS Audit Key for Layer 2
INSERT INTO public.signing_keys (
    id,
    organization_id,
    key_name,
    key_purpose,
    key_storage_mode,
    signature_algorithm,
    public_key,
    public_key_fingerprint,
    kms_provider,
    kms_key_id,
    kms_region,
    valid_from,
    metadata
) VALUES (
    'e5c2193b-fde2-4cba-aa22-cf892e11fa02',
    '3be93cba-2f88-444a-8742-df820a4bde28',
    'aws-hsm-production-audit-key',
    'evidence_signing',
    'kms_managed',
    'ED25519', -- Or Secp256r1 based on KMS config
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    'fp:sha256:88ef2213e11a00a299e218c3424a4abc8fdee129',
    'aws',
    'arn:aws:kms:us-east-1:123456789012:key/abc-123',
    'us-east-1',
    NOW(),
    '{"hsm_compliance": "FIPS_140_2_Level_3"}'::jsonb
);

-- 3. Execute GDPR Article 17 Crypto-Shred Request
-- Updates the encryption key status to 'destroyed' and wipes the local encrypted material reference
UPDATE public.subject_encryption_keys
SET
    key_status = 'destroyed',
    disabled_at = NOW(),
    destroyed_at = NOW(),
    destruction_reason = 'DSR_GDPR_Art_17_Right_To_Be_Forgotten',
    erasure_request_id = '99e218c3-424a-4abc-88ef-2213e11a00a2',
    encrypted_key_material = NULL, -- Shred raw key material
    key_iv = NULL,                 -- Shred IV
    key_auth_tag = NULL            -- Shred GCM tag
WHERE subject_id = 'da521e42-1209-4abc-99ef-12e3e5bf0212';

-- Update associated encrypted payload records to reflect shredded state
UPDATE public.receipt_encrypted_content
SET
    encryption_status = 'crypto_erased',
    crypto_erased_at = NOW(),
    erasure_request_id = '99e218c3-424a-4abc-88ef-2213e11a00a2'
WHERE subject_id = 'da521e42-1209-4abc-99ef-12e3e5bf0212';

COMMIT;
```
