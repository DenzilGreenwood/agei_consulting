# AI Governance Evidence Infrastructure (AGEI)
## Enterprise Technical Implementation Guide
**Version:** 2.0.0 (Enterprise Release - Multi-Agent & Delegated Authority Edition)
**Date:** July 2026
**Author/Publisher:** CognitiveInsight
**Classification:** Proprietary / Business Source License 1.1 (BUSL-1.1)

### Executive Summary: Making Governance Painless
For an enterprise, implementing a comprehensive AI governance structure is historically synonymous with operational friction, engineering delays, and performance degradation. The central thesis of AI Governance Evidence Infrastructure (AGEI) and the Cognitive Insight Audit Framework (CIAF-LCM) is that governance must be implemented as mathematical plumbing, not policy theater.

To make this transition painless for your engineering and risk teams, this implementation guide relies on four foundational architectural patterns:

*   **The Out-of-Band "Sidecar" SDK Pattern:** Developers do not modify core neural networks or agent reasoning loops. Instead, they use simple decorators, middleware, or event brokers to stream metadata out-of-band to a dedicated service layer.
*   **Lazy Capsule Materialization (LCM):** Instead of capturing and duplicating terabytes of raw inputs/outputs at runtime (which spikes cloud storage costs and introduces severe privacy/GDPR liabilities), the system captures sub-second, lightweight Receipts continuously, only materializing heavy, audit-ready Evidence Capsules when triggered by an anomaly, threshold breach, or audit.
*   **Cascading Cryptographic Delegations:** Governs the "action risk" of multi-agent orchestration. Autonomous sub-agents are blocked from executing tools unless they carry a valid, cryptographically signed delegation token tracing back to a human-authorized root session.
*   **Turnkey Relational Graph Database Schema:** A pre-engineered, 60-table database schema designed for Supabase/PostgreSQL that maps organizational rules directly to cryptographic constraints out-of-the-box.

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
            model_version = kwargs.get("model_version", "unknown_model_v1")
            validation_metrics = kwargs.get("validation_metrics", {})

            rules_evaluated = {
                "RULE_001_ACCURACY_THRESHOLD": "pass" if validation_metrics.get("accuracy", 0.0) >= 0.90 else "fail",
                "RULE_002_BIAS_CHECK_COMPLETE": "pass" if validation_metrics.get("bias_checked", False) else "fail",
                "RULE_003_SECURITY_SBOM_PRESENT": "pass" if "sbom_hash" in kwargs else "fail"
            }

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

            if outcome == 'deny':
                print("[AGEI SYSTEM ENFORCEMENT] BLOCKING RELEASE: Model version failed validation gates.")
                return {"status": "BLOCKED", "records": records}

            result = func(*args, **kwargs)
            result["agei_proof"] = records
            return result
        return wrapper
    return decorator
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
        payload = receipt_object.get("receipt_payload")
        declared_hash = receipt_object.get("content_hash")
        declared_signature_hex = receipt_object.get("signature")

        canonical_bytes = json.dumps(
            payload,
            sort_keys=True,
            ensure_ascii=False,
            separators=(',', ':')
        ).encode('utf-8')

        recalculated_hash = "sha256:" + hashlib.sha256(canonical_bytes).hexdigest()
        if recalculated_hash != declared_hash:
            print(f"[Verification Failed] Content hash mismatch.")
            return False

        from cryptography.hazmat.primitives import serialization
        public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))

        signature_bytes = bytes.fromhex(declared_signature_hex)
        public_key.verify(signature_bytes, canonical_bytes)

        print("[Verification Succeeded] Receipt integrity and signature are cryptographically valid.")
        return True

    except InvalidSignature:
        print("[Verification Failed] Signature is invalid.")
        return False
    except Exception as e:
        print(f"[Verification Error] An error occurred during validation process: {str(e)}")
        return False
```

---

### 5. Multi-Agent Orchestration & Delegated Authority
In complex multi-agent architectures (such as LangGraph, CrewAI, or AutoGen), a high-level Orchestrator Agent dynamically delegates sub-tasks to specialized Execution or Tool-Using Agents. Without structured constraints, these sub-agents frequently act under overbroad "ambient system privileges" or duplicate credentials wholesale, creating massive security and compliance gaps.

To keep action risks bounded, the AGEI architecture enforces a Cascading Cryptographic Delegation Chain mapped directly to your database tables:

```text
[ Human User ]
     │  
     ▼ (Ed25519 signed root delegation token)
┌──────────────────────────────────────┐
│      public.agent_delegations        │◄─── Mapped to Orchestrator Session (A)
└──────────────────┬───────────────────┘
                   │
                   ▼ (Orchestrator-signed sub-delegation token)
┌──────────────────────────────────────┐
│      public.agent_delegations (Sub)  │◄─── Mapped to Writer Session (B) with attenuated scope
└──────────────────┬───────────────────┘
                   │
                   ▼ (Presented context & policy checks)
┌──────────────────────────────────────┐
│   public.pre_action_proof_bundles    │◄─── Verified by tool wrapper before run
└──────────────────┬───────────────────┘
                   │
                   ▼ (Execution evidence)
┌──────────────────────────────────────┐
│    public.agent_tool_invocations     │◄─── Emits signed execution receipts to vault
└──────────────────────────────────────┘
```

#### The Three Invariants of Multi-Agent Delegation:
1.  **No Ambient Privilege (Human-Anchored Lineage):** An agent cannot invoke a tool unless its active session can trace its root authority back to an active `agent_delegations` token signed by a verified human principal.
2.  **Attenuation of Authority (Least Privilege):** A delegated sub-agent can never exercise more authority than its parent. Each step down the orchestration tree must narrow (attenuate) the permissible actions, schemas, and resource categories in the `authority_scope` JSON payload.
3.  **Composite Receipt Bundling:** The final execution receipt links to parent and child nodes in `public.receipt_links` and `public.evidence_lineage_links` for multi-level graph traversal.

#### Out-of-Band Integration: Attenuated Token Parsing SDK
Below is the complete, production-grade Python SDK module (`agei_multi_agent_sdk.py`) illustrating how to generate, attenuate, and recursively verify multi-agent delegation tokens and pre-action proofs out-of-band before executing a database action:

```python
import json
import hashlib
import time
import uuid
from typing import Dict, List, Any, Optional
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Helper for canonical serialization
def canonicalize(payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')

class DelegationToken:
    """
    Represents a cryptographically signed authority delegation token.
    Maps directly to the public.agent_delegations database model.
    """
    def __init__(
        self,
        delegation_id: str,
        delegating_principal_id: str,
        agent_principal_id: str,
        agent_session_id: str,
        authority_scope: Dict[str, Any], # JSON dict of allowed tables, actions, and limits
        valid_until: float,
        parent_token: Optional['DelegationToken'] = None
    ):
        self.delegation_id = delegation_id
        self.delegating_principal_id = delegating_principal_id
        self.agent_principal_id = agent_principal_id
        self.agent_session_id = agent_session_id
        self.authority_scope = authority_scope
        self.valid_until = valid_until
        self.parent_token = parent_token
        self.signature: Optional[str] = None
        self.signed_by_fingerprint: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        payload = {
            "delegation_id": self.delegation_id,
            "delegating_principal_id": self.delegating_principal_id,
            "agent_principal_id": self.agent_principal_id,
            "agent_session_id": self.agent_session_id,
            "authority_scope": self.authority_scope,
            "valid_until": self.valid_until
        }
        if self.parent_token:
            payload["parent_delegation"] = self.parent_token.to_dict()
        return payload

    def sign(self, private_key: ed25519.Ed25519PrivateKey, public_key_pem: str):
        """Signs the canonicalized delegation token payload."""
        canonical_bytes = canonicalize(self.to_dict())
        self.signature = private_key.sign(canonical_bytes).hex()
        self.signed_by_fingerprint = hashlib.sha256(public_key_pem.encode('utf-8')).hexdigest()[:16]

class PreActionProofBundle:
    """
    A complete, portable proof package compiled before tool execution.
    Maps to public.pre_action_proof_bundles.
    """
    def __init__(
        self,
        org_id: str,
        session_id: str,
        tool_key: str,
        context_hash: str,
        delegation: DelegationToken
    ):
        self.id = str(uuid.uuid4())
        self.org_id = org_id
        self.session_id = session_id
        self.tool_key = tool_key
        self.context_hash = context_hash
        self.delegation = delegation
        self.signature: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "org_id": self.org_id,
            "session_id": self.session_id,
            "tool_key": self.tool_key,
            "context_hash": self.context_hash,
            "delegation": self.delegation.to_dict()
        }

    def sign(self, agent_private_key: ed25519.Ed25519PrivateKey):
        canonical_bytes = canonicalize(self.to_dict())
        self.signature = agent_private_key.sign(canonical_bytes).hex()

class VerificationEngine:
    """
    An out-of-band tool gate auditor that parses attenuated delegation tokens
    and verifies signatures recursively to enforce Zero-Trust controls.
    """
    @staticmethod
    def verify_scopes_are_attenuated(parent_scope: Dict[str, Any], child_scope: Dict[str, Any]) -> bool:
        """
        Enforces strict least-privilege attenuation.
        Checks that the child's requested resources and actions are a strict subset of the parent's.
        """
        try:
            parent_actions = set(parent_scope.get("allowed_actions", []))
            child_actions = set(child_scope.get("allowed_actions", []))
            if not child_actions.issubset(parent_actions):
                print(f"[Scope Violation] Sub-agent requested actions {child_actions - parent_actions} not in parent scope.")
                return False

            parent_resources = set(parent_scope.get("allowed_resources", []))
            child_resources = set(child_scope.get("allowed_resources", []))
            if not child_resources.issubset(parent_resources):
                print(f"[Scope Violation] Sub-agent requested resources {child_resources - parent_resources} not in parent scope.")
                return False

            # Check numeric limits (e.g. max_transaction_value)
            if child_scope.get("max_value", 0) > parent_scope.get("max_value", 0):
                print("[Scope Violation] Sub-agent requested maximum value limit higher than parent authorization.")
                return False

            return True
        except Exception:
            return False

    @classmethod
    def verify_delegation_chain(
        cls,
        token: DelegationToken,
        expected_root_public_key_pem: str,
        active_public_keys: Dict[str, str] # principal_id -> public_key_pem
    ) -> bool:
        """
        Recursively verifies signatures, timeouts, and scope attenuation
        up to the root human principal.
        """
        # 1. Check expiration
        if time.time() > token.valid_until:
            print(f"[Chain Failed] Delegation {token.delegation_id} has expired.")
            return bool(False)

        # 2. Check and verify current token's signature
        signer_id = token.delegating_principal_id
        signer_pub_key_pem = active_public_keys.get(signer_id)
        if not signer_pub_key_pem:
            print(f"[Chain Failed] Signer principal {signer_id} public key is not registered.")
            return False

        try:
            pub_key = serialization.load_pem_public_key(signer_pub_key_pem.encode('utf-8'))
            canonical_payload = canonicalize(token.to_dict())
            pub_key.verify(bytes.fromhex(token.signature), canonical_payload)
        except Exception:
            print(f"[Chain Failed] Signature verification failed on delegation {token.delegation_id}.")
            return False

        # 3. Base Case: Root Token reached
        if token.parent_token is None:
            # The root delegation must match the human principal's key
            root_fingerprint = hashlib.sha256(expected_root_public_key_pem.encode('utf-8')).hexdigest()[:16]
            if token.signed_by_fingerprint != root_fingerprint:
                print("[Chain Failed] Root delegation is not signed by the expected Human Owner.")
                return False
            print("[Chain Succeeded] Cryptographic chain validation completed back to Human Root.")
            return True

        # 4. Recursive Step: Check Scope Attenuation against Parent
        if not cls.verify_scopes_are_attenuated(token.parent_token.authority_scope, token.authority_scope):
            print(f"[Chain Failed] Attenuation check failed between delegation {token.delegation_id} and its parent.")
            return False

        return cls.verify_delegation_chain(token.parent_token, expected_root_public_key_pem, active_public_keys)

    @classmethod
    def evaluate_pre_action_proof(
        cls,
        proof: PreActionProofBundle,
        expected_root_public_key_pem: str,
        active_public_keys: Dict[str, str]
    ) -> bool:
        """
        Verifies the proof signature itself, and then traverses the embedded delegation chain.
        """
        agent_id = proof.delegation.agent_principal_id
        agent_pub_key_pem = active_public_keys.get(agent_id)
        if not agent_pub_key_pem:
            print(f"[Proof Failed] Active agent {agent_id} public key is not registered.")
            return False

        try:
            # Verify the Proof signature
            pub_key = serialization.load_pem_public_key(agent_pub_key_pem.encode('utf-8'))
            canonical_payload = canonicalize(proof.to_dict())
            pub_key.verify(bytes.fromhex(proof.signature), canonical_payload)
        except Exception:
            print("[Proof Failed] Pre-action proof envelope signature is invalid.")
            return False

        # Verify the underlying delegation chain recursively
        return cls.verify_delegation_chain(proof.delegation, expected_root_public_key_pem, active_public_keys)

# -------------------------------------------------------------------------
# Execution Walkthrough: Nested Multi-Agent Delegation
# -------------------------------------------------------------------------
if __name__ == "__main__":
    # Generate simulated cryptographic principals
    human_key = ed25519.Ed25519PrivateKey.generate()
    human_pem = human_key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode('utf-8')

    orchestrator_key = ed25519.Ed25519PrivateKey.generate()
    orchestrator_pem = orchestrator_key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode('utf-8')

    sub_agent_key = ed25519.Ed25519PrivateKey.generate()
    sub_agent_pem = sub_agent_key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode('utf-8')

    # Setup Global Key Directory (representing supabase records)
    human_id = "principal:human:elena-cro"
    orchestrator_id = "principal:agent:orchestrator-copilot"
    sub_agent_id = "principal:agent:database-query-worker"

    key_directory = {
        human_id: human_pem,
        orchestrator_id: orchestrator_pem,
        sub_agent_id: sub_agent_pem
    }

    # Define the Scopes
    # Root human scope permits reading claims and executing tools up to $10,000
    human_root_scope = {
        "allowed_actions": ["read:claims", "execute:database_query", "execute:code_interpreter"],
        "allowed_resources": ["table:claims_q2", "table:customers_pci"],
        "max_value": 10000
    }

    # Orchestrator attenuates scope for the database-query worker (strict read subset, max $500 value)
    sub_agent_attenuated_scope = {
        "allowed_actions": ["read:claims", "execute:database_query"], # subset
        "allowed_resources": ["table:claims_q2"], # subset
        "max_value": 500 # attenuated from 10000
    }

    print("--- STEP 1: HUMAN CRATE INITIAL DELEGATION TOKEN TO ORCHESTRATOR ---")
    root_token = DelegationToken(
        delegation_id=str(uuid.uuid4()),
        delegating_principal_id=human_id,
        agent_principal_id=orchestrator_id,
        agent_session_id="session:orch-001",
        authority_scope=human_root_scope,
        valid_until=time.time() + 3600 # 1 hour validity
    )
    root_token.sign(human_key, human_pem)
    print("Root Delegation Token created and signed by Human User.")

    print("\n--- STEP 2: ORCHESTRATOR GENERATES NESTED ATTENUATED DELEGATION TO WORKER ---")
    nested_token = DelegationToken(
        delegation_id=str(uuid.uuid4()),
        delegating_principal_id=orchestrator_id,
        agent_principal_id=sub_agent_id,
        agent_session_id="session:query-worker-002",
        authority_scope=sub_agent_attenuated_scope,
        valid_until=time.time() + 1800, # 30 minutes validity
        parent_token=root_token
    )
    nested_token.sign(orchestrator_key, orchestrator_pem)
    print("Sub-Agent Attenuated Delegation Token created and signed by Orchestrator.")

    print("\n--- STEP 3: SUB-AGENT COMPILES PRE-ACTION PROOF BUNDLE TO RUN QUERY ---")
    mock_context_hash = "sha256:" + hashlib.sha256(b"SELECT SUM(claim_amount) FROM claims_q2").hexdigest()
    proof_bundle = PreActionProofBundle(
        org_id="org:enterprise-client",
        session_id="session:query-worker-002",
        tool_key="database_query_tool",
        context_hash=mock_context_hash,
        delegation=nested_token
    )
    proof_bundle.sign(sub_agent_key)
    print("Pre-Action Proof Bundle generated and signed by Sub-Agent.")

    print("\n--- STEP 4: TOOL GATE EVALUATION PROCESS ---")
    is_authorized = VerificationEngine.evaluate_pre_action_proof(
        proof=proof_bundle,
        expected_root_public_key_pem=human_pem,
        active_public_keys=key_directory
    )

    if is_authorized:
        print("[TOOL GATE APPROVAL] ACCESS GRANTED: Executing query on 'table:claims_q2'. Generating execution receipt.")
    else:
        print("[TOOL GATE BLOCK] ACCESS DENIED: Broken delegation chain or scope violation.")
```

By deploying this out-of-band checking system, you establish physical, deterministic guarantees that agents cannot go rogue. Even if an LLM generates a wild prompt path, the local Sidecar query filter intercepts, parses the cascading delegations, and blocks any action violating scope attenuation.

---

### 6. Zero-Trust Verification Engine (Continued: Downstream Audit Verification)
An evidence-based audit vault has no value if the verifier must trust the database itself. In a Profile 3 (Forensic) compliance audit or a regulatory dispute, the investigator runs an independent, offline script to verify that the signatures are valid and the payload hasn't been altered.

The standalone verification of receipts matches the standard cryptographic patterns mentioned above. When checking entire Audit Packs, the verifier loops through all `audit_pack_items`, validating content hashes, checking the chronological hash chain references, and re-traversing the multi-agent delegation lineages.

---

### 7. Enterprise Implementation & Maturity Roadmap
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
*   Deploy pre-action gates and standard Attenuated Delegations around conversational assistant workflows to prevent "ambient" tool privilege.
**Enterprise Outcome:** One-click Generation of Sealed Audit Packs with complete lineage chains for auditors.

#### Phase 3: Forensic Defensibility (4–6 Months)
**Objective:** Zero-trust security suitable for courtroom-ready dispute resolution or highly adversarial environments.
**Core Milestones:**
*   Configure Merkle Tree batching to anchor multiple receipt roots under centralized ledger arrays.
*   Deploy Dual-Layer Provenance (Explicit Watermarking + Distinctive Forensic Anchors) on high-stakes exported reports and media artifacts.
*   Apply GDPR-compliant Cryptographic Erasure and Attenuated Multi-Agent Proof Traversals to secure autonomous execution perimeters.
**Enterprise Outcome:** Mathematical defensibility of AI outcomes that stands up to regulatory cross-examination.
