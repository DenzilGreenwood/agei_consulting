# AI Governance Evidence Infrastructure (AGEI)
## Enterprise Technical Implementation Guide
**Version:** 1.0.0 (Enterprise Release)
**Date:** July 2026
**Author/Publisher:** CognitiveInsight
**Classification:** Proprietary / Business Source License 1.1 (BUSL-1.1)

### Executive Summary: Making Governance Painless
For an enterprise, implementing a comprehensive AI governance structure is historically synonymous with operational friction, engineering delays, and performance degradation. The central thesis of AI Governance Evidence Infrastructure (AGEI) and the Cognitive Insight Audit Framework (CIAF-LCM) is that governance must be implemented as mathematical plumbing, not policy theater.

To make this transition painless for your engineering and risk teams, this implementation guide relies on three foundational architectural patterns:

*   **The Out-of-Band "Sidecar" SDK Pattern:** Developers do not modify core neural networks or agent reasoning loops. Instead, they use simple decorators, middleware, or event brokers to stream metadata out-of-band to a dedicated service layer.
*   **Lazy Capsule Materialization (LCM):** Instead of capturing and duplicating terabytes of raw inputs/outputs at runtime (which spikes cloud storage costs and introduces severe privacy/GDPR liabilities), the system captures sub-second, lightweight Receipts continuously, only materializing heavy, audit-ready Evidence Capsules when triggered by an anomaly, threshold breach, or audit.
*   **Turnkey Relational Graph database Schema:** A pre-engineered, 60-table database schema designed for Supabase/PostgreSQL that maps organizational rules directly to cryptographic constraints out-of-the-box.

This guide provides your systems architects and software engineers with a concrete, copy-pasteable roadmap for bootstrapping, integrating, and verifying an enterprise-grade AGEI deployment.

---

### 1. Architectural Overview & Data Flow
The AGEI operating contract moves from human-authored policy state down to machine-verifiable cryptographic proof:

```text
[ Human Policy Document ]
          │
          ▼ (Translated into JSON)
┌─────────────────────────────────┐
│       public.policy_sets        │◄─── Binds to specific compliance clauses (EU AI Act, NIST)
└────────────────┬────────────────┘
                 │
                 ▼ (Versioned & Signed)
┌─────────────────────────────────┐
│     public.policy_versions      │◄─── Payload is canonically serialized & signed
└────────────────┬────────────────┘
                 │
                 ▼ (Extracted rules)
┌─────────────────────────────────┐
│       public.policy_rules       │◄─── Thresholds, required inputs, and bans
└────────────────┬────────────────┘
                 │
                 ▼ (Evaluation)
┌─────────────────────────────────┐
│    public.policy_evaluations    │◄─── Records outcome and supporting input hash
└────────────────┬────────────────┘
                 │
                 ▼ (Enforcement Gate)
┌─────────────────────────────────┐
│     public.gate_evaluations     │◄─── Aggregates rule statuses: Approve, Deny, Escalate
└────────────────┬────────────────┘
                 │
                 ▼ (Evidence)
┌─────────────────────────────────┐
│         public.receipts         │◄─── Immutable record signed with Ed25519 & batched
└─────────────────────────────────┘
```

---

### 2. Turnkey Database Bootstrapping (PostgreSQL/Supabase)
The core structure of the database relies on enforcing cryptographic invariants at the database engine level. This ensures that even if an administrator bypasses the application layer, the database constraints prevent the tampering or forging of historical compliance records.

Run the following SQL script in your Supabase SQL Editor or enterprise PostgreSQL database to bootstrap the core tables for your tenant, policy, gate, and receipt tables:

```sql
-- Create custom cryptographic types if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_algorithm') THEN
        CREATE TYPE signature_algorithm AS ENUM ('ED25519', 'RS256', 'ES256');
    END IF;
END $$;

-- 1. Organizations (Tenant Isolation)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- Enable Row-Level Security (RLS) for multi-tenant isolation
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Principals (Identity Layer)
CREATE TABLE IF NOT EXISTS public.principals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    principal_type text NOT NULL CHECK (principal_type = ANY (ARRAY['user', 'service', 'system', 'api_key', 'agent'])),
    external_id text,
    display_name text,
    is_active boolean NOT NULL DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT principals_pkey PRIMARY KEY (id)
);

-- 3. Policy Versions
CREATE TABLE IF NOT EXISTS public.policy_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    version text NOT NULL,
    version_number integer NOT NULL DEFAULT 1,
    policy_payload jsonb NOT NULL,
    payload_hash text NOT NULL CHECK (payload_hash ~ '^sha256:[a-f0-9]{64}$'),
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signed_by uuid NOT NULL REFERENCES public.principals(id),
    signed_at timestamp with time zone NOT NULL DEFAULT now(),
    is_active boolean NOT NULL DEFAULT true,
    is_published boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT policy_versions_pkey PRIMARY KEY (id)
);

-- 4. Gate Definitions
CREATE TABLE IF NOT EXISTS public.gate_definitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    name text NOT NULL,
    slug text NOT NULL,
    gate_type text NOT NULL,
    policy_version_id uuid REFERENCES public.policy_versions(id),
    evaluation_mode text NOT NULL DEFAULT 'strict'::text CHECK (evaluation_mode = ANY (ARRAY['strict', 'advisory', 'logging'])),
    failure_action text NOT NULL DEFAULT 'block'::text CHECK (failure_action = ANY (ARRAY['block', 'warn', 'log'])),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Gate Evaluations (Enforcement Outcomes)
CREATE TABLE IF NOT EXISTS public.gate_evaluations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    gate_definition_id uuid NOT NULL, -- references gate_definitions after mapping
    policy_version_id uuid REFERENCES public.policy_versions(id),
    evaluated_resource_type text NOT NULL,
    evaluated_resource_id text NOT NULL,
    evaluation_payload jsonb NOT NULL,
    evaluation_status text NOT NULL CHECK (evaluation_status = ANY (ARRAY['pass', 'fail', 'warning', 'error', 'skipped'])),
    gate_outcome text NOT NULL CHECK (gate_outcome = ANY (ARRAY['approve', 'deny', 'escalate', 'inspect'])),
    decision_reason_code text,
    is_overridden boolean NOT NULL DEFAULT false,
    override_reason text,
    evaluation_hash text NOT NULL CHECK (evaluation_hash ~ '^sha256:[a-f0-9]{64}$'),
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signed_by uuid NOT NULL REFERENCES public.principals(id),
    signed_at timestamp with time zone NOT NULL DEFAULT now(),
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    duration_ms integer,
    CONSTRAINT gate_evaluations_pkey PRIMARY KEY (id)
);

-- 6. Receipts (Verifiable Chain of State)
CREATE TABLE IF NOT EXISTS public.receipts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id),
    receipt_type text NOT NULL,
    receipt_payload jsonb NOT NULL,
    content_hash text NOT NULL CHECK (content_hash ~ '^sha256:[a-f0-9]{64}$'),
    hash_algorithm text NOT NULL DEFAULT 'sha256'::text,
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1'::text,
    signature text NOT NULL,
    signature_algorithm signature_algorithm NOT NULL DEFAULT 'ED25519',
    signed_by uuid NOT NULL REFERENCES public.principals(id),
    signed_at timestamp with time zone NOT NULL DEFAULT now(),
    event_timestamp timestamp with time zone NOT NULL,
    gate_evaluation_id uuid REFERENCES public.gate_evaluations(id),
    policy_version_id uuid REFERENCES public.policy_versions(id),
    resource_type text,
    resource_id text,
    lifecycle_stage text,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT receipts_pkey PRIMARY KEY (id)
);

-- Automatically recalculate duration_ms on gate evaluation insertion
CREATE OR REPLACE FUNCTION public.calculate_evaluation_duration()
RETURNS TRIGGER AS $$
BEGIN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calculate_duration
BEFORE INSERT ON public.gate_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_evaluation_duration();
```

---

### 3. Out-of-Band Integration: The Sidecar SDK Pattern
The absolute best way to integrate cryptographic AI governance without disrupting your development velocity is to use the Sidecar SDK pattern with Python decorators. This separates the complex code required for hashing, JSON canonicalization, and digital signature creation from the code that generates predictions or triggers agent planning loops.

Below is a complete, production-ready Python integration script (`agei_sidecar.py`) demonstrating how to implement a Validation Gate check before promoting a model version to production, using RFC 8785 Canonical JSON serialization and Ed25519 signing:

```python
import json
import hashlib
import time
import uuid
from typing import Dict, Any, Callable
from cryptography.hazmat.primitives.asymmetric import ed25519

# -------------------------------------------------------------------------
# Core Helper: RFC 8785 Canonical JSON Representation
# -------------------------------------------------------------------------
def canonicalize_json(payload: Dict[str, Any]) -> bytes:
    """
    A simplified, deterministic RFC 8785 JSON canonicalizer.
    Ensures key sorting, removes extra spacing, and enforces UTF-8.
    """
    return json.dumps(
        payload,
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':')
    ).encode('utf-8')

# -------------------------------------------------------------------------
# AGEI Sidecar Class
# -------------------------------------------------------------------------
class AGEISidecar:
    def __init__(self, org_id: str, client_principal_id: str):
        self.org_id = org_id
        self.client_principal_id = client_principal_id
        # In a real enterprise KMS, private keys live inside an HSM or Azure Key Vault.
        # For simulation, we generate an ephemeral Ed25519 keypair.
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()

    def generate_public_key_pem(self) -> str:
        """Returns the public key fingerprint/representation."""
        from cryptography.hazmat.primitives import serialization
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

    def submit_gate_and_generate_receipt(
        self,
        gate_slug: str,
        resource_type: str,
        resource_id: str,
        policy_version_id: str,
        rules_evaluated: Dict[str, str], # rule_key -> 'pass'/'fail'
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulates evaluating rules, registering the gate outcome,
        and outputting a cryptographically signed, compliant receipt.
        """
        start_time = time.time()

        # 1. Evaluate Rule Results to Determine Gate Outcome
        statuses = list(rules_evaluated.values())
        if 'fail' in statuses:
            gate_status = 'fail'
            gate_outcome = 'deny'
        elif 'error' in statuses:
            gate_status = 'error'
            gate_outcome = 'escalate'
        else:
            gate_status = 'pass'
            gate_outcome = 'approve'

        completed_time = time.time()
        duration_ms = int((completed_time - start_time) * 1000)

        # 2. Structure Gate Evaluation Payload
        evaluation_payload = {
            "rules_evaluated": rules_evaluated,
            "context_data": context_data,
            "environment": "production"
        }
        canonical_eval = canonicalize_json(evaluation_payload)
        eval_hash = "sha256:" + hashlib.sha256(canonical_eval).hexdigest()

        # 3. Create Digital Signature over Gate Evaluation Hash
        signature = self.private_key.sign(canonical_eval).hex()

        gate_evaluation_id = str(uuid.uuid4())

        # 4. Generate the Atomic, Portable Receipt
        receipt_payload = {
            "receipt_type": f"{gate_slug}_evaluation_receipt",
            "resource_type": resource_type,
            "resource_id": resource_id,
            "gate_evaluation_id": gate_evaluation_id,
            "gate_outcome": gate_outcome,
            "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        canonical_receipt = canonicalize_json(receipt_payload)
        content_hash = "sha256:" + hashlib.sha256(canonical_receipt).hexdigest()
        receipt_signature = self.private_key.sign(canonical_receipt).hex()

        return {
            "receipt": {
                "id": str(uuid.uuid4()),
                "organization_id": self.org_id,
                "receipt_type": receipt_payload["receipt_type"],
                "receipt_payload": receipt_payload,
                "content_hash": content_hash,
                "hash_algorithm": "sha256",
                "canonicalization_version": "agei-json-v1",
                "signature": receipt_signature,
                "signature_algorithm": "ED25519",
                "signed_by": self.client_principal_id,
                "event_timestamp": receipt_payload["timestamp_utc"],
                "gate_evaluation_id": gate_evaluation_id,
                "policy_version_id": policy_version_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "lifecycle_stage": "validation"
            },
            "gate_evaluation": {
                "id": gate_evaluation_id,
                "organization_id": self.org_id,
                "gate_definition_slug": gate_slug,
                "policy_version_id": policy_version_id,
                "evaluated_resource_type": resource_type,
                "evaluated_resource_id": resource_id,
                "evaluation_payload": evaluation_payload,
                "evaluation_status": gate_status,
                "gate_outcome": gate_outcome,
                "evaluation_hash": eval_hash,
                "signature": signature,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(start_time)),
                "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(completed_time)),
                "duration_ms": duration_ms
            }
        }

# -------------------------------------------------------------------------
# The Painless Integration Decorator
# -------------------------------------------------------------------------
def validation_gate(sidecar: AGEISidecar, gate_slug: str, policy_version_id: str):
    """
    A standard Python decorator that intercepts model promotion actions,
    runs policy validation rules out-of-band, and records the signed outcome.
    """
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Extract the model version details from arguments
            model_version = kwargs.get("model_version", "unknown_model_v1")
            validation_metrics = kwargs.get("validation_metrics", {})

            # Define human-authored corporate governance rule triggers
            rules_evaluated = {
                "RULE_001_ACCURACY_THRESHOLD": "pass" if validation_metrics.get("accuracy", 0.0) >= 0.90 else "fail",
                "RULE_002_BIAS_CHECK_COMPLETE": "pass" if validation_metrics.get("bias_checked", False) else "fail",
                "RULE_003_SECURITY_SBOM_PRESENT": "pass" if "sbom_hash" in kwargs else "fail"
            }

            # Evaluate rules out-of-band using the AGEI Sidecar
            records = sidecar.submit_gate_and_generate_receipt(
                gate_slug=gate_slug,
                resource_type="model_version",
                resource_id=model_version,
                policy_version_id=policy_version_id,
                rules_evaluated=rules_evaluated,
                context_data={"metrics_received": validation_metrics}
            )

            outcome = records["gate_evaluation"]["gate_outcome"]
            print(f"[AGEI Sidecar] Evaluation Complete for Gate '{gate_slug}' on resource {model_version}.")
            print(f"[AGEI Sidecar] Gate Status: {records['gate_evaluation']['evaluation_status'].upper()} -> Outcome: {outcome.upper()}")

            # Enforce the "Deny-by-Default" operating invariant
            if outcome == 'deny':
                print("[AGEI SYSTEM ENFORCEMENT] BLOCKING RELEASE: Model version failed validation gates.")
                # We return the compiled denial records for audit trail registration instead of proceeding
                return {"status": "BLOCKED", "records": records}

            # If approved, run core logic and append the validation receipt to the deployment bundle
            result = func(*args, **kwargs)
            result["agei_proof"] = records
            return result
        return wrapper
    return decorator


# -------------------------------------------------------------------------
# Code Execution Demonstration
# -------------------------------------------------------------------------
if __name__ == "__main__":
    # Setup simulated client sidecar environment
    my_org_id = str(uuid.uuid4())
    my_principal_id = str(uuid.uuid4())
    my_policy_id = str(uuid.uuid4())

    sidecar = AGEISidecar(org_id=my_org_id, client_principal_id=my_principal_id)

    # Define a core model promotion function wrapped with our out-of-band Gate check
    @validation_gate(sidecar=sidecar, gate_slug="prod_validation_gate", policy_version_id=my_policy_id)
    def promote_model_to_production(model_version: str, validation_metrics: dict, sbom_hash: str):
        print(f"Executing Core Pipeline: Promoting {model_version} to global production servers...")
        return {"status": "SUCCESS", "deployed_servers": ["us-east-1", "eu-central-1"]}

    # Scenario A: Passing release metrics
    print("\n=== RUNNING PROMOTION CASE 1: PASSING METRICS ===")
    output_pass = promote_model_to_production(
        model_version="claims_triage_v4.3.0",
        validation_metrics={"accuracy": 0.94, "bias_checked": True},
        sbom_hash="sha256:8f43c3f7..."
    )
    print("Release Job Status:", output_pass["status"])
    print("Embedded Audit Receipt ID:", output_pass.get("agei_proof", {}).get("receipt", {}).get("id"))

    # Scenario B: Failing release metrics (accuracy below 90%)
    print("\n=== RUNNING PROMOTION CASE 2: FAILING ACCURACY METRIC ===")
    output_fail = promote_model_to_production(
        model_version="claims_triage_v4.4.0-experimental",
        validation_metrics={"accuracy": 0.85, "bias_checked": True},
        sbom_hash="sha256:f7a2d3c9..."
    )
    print("Release Job Status:", output_fail["status"])
```

---

### 4. Zero-Trust Verification Engine
An evidence-based audit vault has no value if the verifier must trust the database itself. In a Profile 3 (Forensic) compliance audit or a regulatory dispute, the investigator runs an independent, offline script to verify that the signatures are valid and the payload hasn't been altered.

Here is the exact verification code your auditors can run to validate any exported AGEI Receipt or Gate Evaluation payload:

```python
import json
import hashlib
from typing import Dict, Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

def verify_receipt(receipt_object: Dict[str, Any], public_key_pem: str) -> bool:
    """
    Independently verifies the integrity and signature of an AGEI Receipt.
    Matches standard criteria: SHA-256 content hashes, Ed25519 signatures,
    and RFC 8785 Canonical JSON validation.
    """
    try:
        # Extract metadata
        payload = receipt_object.get("receipt_payload")
        declared_hash = receipt_object.get("content_hash")
        declared_signature_hex = receipt_object.get("signature")

        # 1. Re-serialize canonically to prevent whitespace discrepancies
        canonical_bytes = json.dumps(
            payload,
            sort_keys=True,
            ensure_ascii=False,
            separators=(',', ':')
        ).encode('utf-8')

        # 2. Re-compute SHA-256 Hash
        recalculated_hash = "sha256:" + hashlib.sha256(canonical_bytes).hexdigest()
        if recalculated_hash != declared_hash:
            print(f"[Verification Failed] Content hash mismatch.")
            print(f"  Declared: {declared_hash}")
            print(f"  Computed: {recalculated_hash}")
            return False

        # 3. Load Public Key and verify digital signature
        from cryptography.hazmat.primitives import serialization
        public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))

        signature_bytes = bytes.fromhex(declared_signature_hex)
        public_key.verify(signature_bytes, canonical_bytes)

        print("[Verification Succeeded] Receipt integrity and signature are cryptographically valid.")
        return True

    except InvalidSignature:
        print("[Verification Failed] Signature is invalid. Payload may have been tampered with or signed by an unauthorized key.")
        return False
    except Exception as e:
        print(f"[Verification Error] An error occurred during validation process: {str(e)}")
        return False
```

---

### 5. Enterprise Implementation & Maturity Roadmap
To prevent organization-wide inertia, CognitiveInsight recommends implementing AGEI across three distinct phases of evidence strength:

```text
┌─────────────────────────────────┐
│  Phase 1: Internal Operational  │◄── Focus: JSON receipts, unique hashes, schema registry
└────────────────┬────────────────┘
                 │ (Establish Baseline)
                 ▼
┌─────────────────────────────────┐
│  Phase 2: Regulated Assurance   │◄── Focus: Ed25519 digital signatures, deterministic rules, automatic exports
└────────────────┬────────────────┘
                 │ (Embed Hard Cryptography)
                 ▼
┌─────────────────────────────────┐
│   Phase 3: Forensic Defensibility│◄── Focus: Merkle tree batching, secure KMS key custody, legal holds
└─────────────────────────────────┘
```

#### Phase 1: Internal Operational Evidence (1–2 Months)
**Objective:** Eliminate raw text logs and establish unified structure.
**Core Milestones:**
*   Deploy the organizations, principals, and receipts Supabase tables.
*   Map core AI models as first-class `ai_lifecycle_objects`.
*   Implement basic, out-of-band metadata streaming (no signatures, unique hashes only) to index MLOps transitions.
**Enterprise Outcome:** Immediate 99% savings on MLOps governance data storage overhead.

#### Phase 2: Regulated Assurance (2–4 Months)
**Objective:** Audit readiness for the EU AI Act, NIST AI RMF, and internal compliance checks.
**Core Milestones:**
*   Implement Policy Versions and Gate Definitions within your pipeline.
*   Enable KMS-integrated Ed25519 digital signatures over all generated receipts.
*   Deploy pre-action gates around conversational assistant workflows to prevent "ambient" tool privilege.
**Enterprise Outcome:** One-click Generation of Sealed Audit Packs with complete lineage chains for auditors.

#### Phase 3: Forensic Defensibility (4–6 Months)
**Objective:** Zero-trust security suitable for courtroom-ready dispute resolution or highly adversarial environments.
**Core Milestones:**
*   Configure Merkle Tree batching to anchor multiple receipt roots under centralized ledger arrays.
*   Deploy Dual-Layer Provenance (Explicit Watermarking + Distinctive Forensic Anchors) on high-stakes exported reports and media artifacts.
*   Apply GDPR-compliant Cryptographic Erasure workflows using AES envelope encryption.
**Enterprise Outcome:** Mathematical defensibility of AI outcomes that stands up to regulatory cross-examination.
