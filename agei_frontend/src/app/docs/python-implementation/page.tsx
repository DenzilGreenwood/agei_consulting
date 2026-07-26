import Link from 'next/link';
import React from 'react';
import { Server, ShieldCheck, Database, Code, ChevronDown, Key, FileCode2, Users, EyeOff } , ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Python Implementation Guide | AGEI',
  description: 'Translating raw operational events into cryptographically bound, relational database records.',
};

export default function PythonImplementationPage() {
  const sections = [
    {
      id: 1,
      title: "The Cryptographic Foundation",
      icon: <Key className="h-6 w-6 text-primary" />,
      description: (
        <div className="space-y-4">
          <p>
            To ensure that any external verifier or auditor can validate an evidence object without trusting the database operator, the payload must first be serialized deterministically using Canonical JSON (RFC 8785). It is then hashed using SHA-256 and signed with a localized or KMS-backed Ed25519 private key. Any system implementing RFC 8785 (Python, Go, Rust, etc.) will derive an identical byte sequence for a given logical JSON structure before hashing or signing, so external verifiers can recompute SHA‑256 and validate Ed25519 signatures without trusting the database operator, assuming keys and receipts are managed correctly.
          </p>
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mt-4">
            <h4 className="font-bold text-foreground mb-2">Quantum and Crypto‑Agility Note</h4>
            <p className="text-sm">
              The current implementation uses Ed25519 for digital signatures, which provides strong protection against classical attacks but is not resistant to large‑scale quantum adversaries, since elliptic‑curve schemes can be broken by Shor’s algorithm on sufficiently powerful quantum computers. The AGEI / CIAF design is intentionally crypto‑agile: evidence envelopes, receipts, and proof bundles record <code>signature_algorithm</code> and <code>canonicalization_version</code> explicitly, so organizations can migrate to NIST‑standardized post‑quantum signature schemes such as CRYSTALS‑Dilithium, Falcon, or SPHINCS+ without changing the higher‑level evidence model.
            </p>
            <p className="text-sm mt-2">
              <strong>Field Constraint Note:</strong> <code>signature_algorithm</code> is expected to hold values like <code>"ED25519"</code> today, and could later be <code>"Dilithium2"</code>, <code>"Falcon-512"</code>, <code>"SPHINCS+-128s"</code> or <code>"ML-DSA-65"</code> depending on what you standardize internally.
            </p>
            <div className="mt-4 pt-4 border-t border-primary/20">
              <h4 className="font-bold text-foreground mb-2">Implementation Limitation</h4>
              <p className="text-sm">
                <strong>Cross-language canonicalization caution:</strong> Cross-language support is only safe when all producers and verifiers implement RFC 8785 exactly. Standard JSON libraries are not sufficient because serialization details differ across languages, runtimes, and platforms (e.g., recursive key sorting, float formatting, Unicode escaping, and line-ending normalization). To preserve hash and signature validity, all implementations must pass the conformance test vectors before producing or verifying evidence objects.
              </p>
            </div>
          </div>
        </div>
      ),
      code: `import json
import hashlib
from datetime import datetime, timezone
from cryptography.hazmat.primitives.asymmetric import ed25519

def canonicalize(payload: dict) -> bytes:
    """
    Serializes a dictionary to UTF-8 bytes using the CIAF \`ciaf-json-v1\`
    canonicalization standard (recursive key sorting, line-ending normalization,
    deterministic number formatting, and raw UTF-8 Unicode preservation).
    """
    return serialize_ciaf_json_v1(payload)

def generate_cryptographic_proof(payload_dict: dict, private_key_pem: bytes) -> dict:
    """
    Generates SHA-256 hash and Ed25519 signature over canonicalized payload.
    """
    # 1. Deterministically serialize the payload
    canonical_bytes = canonicalize(payload_dict)
    
    # 2. Compute SHA-256 content hash
    raw_hash = hashlib.sha256(canonical_bytes).hexdigest()
    content_hash = f"sha256:{raw_hash}" # Matches database check constraints
    
    # 3. Load private key and sign the canonicalized bytes
    private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_pem)
    signature_bytes = private_key.sign(canonical_bytes)
    signature_hex = signature_bytes.hex()
    
    return {
        "content_hash": content_hash,
        "signature": signature_hex,
        "hash_algorithm": "sha256",
        "signature_algorithm": "ED25519",
        "canonicalization_version": "rfc8785"
    }`
    },
    {
      id: 2,
      title: "Standard Lifecycle Receipt Collection",
      icon: <FileCode2 className="h-6 w-6 text-primary" />,
      description: "This code demonstrates how to collect an operational event—such as a Model Evaluation/Validation check—wrap it in the standardized envelope, and insert it asynchronously using the high-performance asyncpg driver into the public.receipts table.",
      code: `import asyncio
import asyncpg
from uuid import UUID

async def collect_evaluation_receipt(
    conn: asyncpg.Connection,
    organization_id: UUID,
    policy_version_id: UUID,
    gate_evaluation_id: UUID,
    signing_key_id: UUID,
    signed_by_principal_id: UUID,
    private_key_pem: bytes,
    evaluation_data: dict
) -> UUID:
    """
    Constructs, hashes, signs, and persists an Evaluation Receipt in public.receipts.
    """
    event_timestamp = datetime.now(timezone.utc)
    
    # 1. Construct the internal 'payload' block
    payload = {
        "evaluated_model_id": evaluation_data["model_id"],
        "evaluation_bundle_key": evaluation_data["bundle_key"],
        "metrics_achieved": evaluation_data["metrics"],
        "validation_gates": evaluation_data["rules_run"],
        "validation_summary_status": evaluation_data["summary_status"]
    }
    
    # 2. Construct the standardized envelope
    envelope_data = {
        "receipt_metadata": {
            "receipt_type": "model_evaluation_receipt",
            "schema_version_id": "8f87e5b2-30fc-4de7-bc99-1a91e57c8bf0",
            "signing_key_id": str(signing_key_id),
            "signed_by_principal_id": str(signed_by_principal_id),
            "signed_at": event_timestamp.isoformat()
        },
        "event_context": {
            "organization_id": str(organization_id),
            "lifecycle_stage": "validation",
            "gate_evaluation_id": str(gate_evaluation_id),
            "policy_version_id": str(policy_version_id),
            "resource_type": "model_version",
            "resource_id": evaluation_data["model_id"]
        },
        "payload": payload
    }
    
    # 3. Generate cryptographic proofs over the envelope
    proofs = generate_cryptographic_proof(envelope_data, private_key_pem)
    
    # 4. Final receipts database record payload
    receipt_payload = {
        **envelope_data,
        "cryptographic_proof": proofs
    }
    
    # 5. Insert directly into public.receipts using PostgreSQL bindings
    receipt_id = await conn.fetchval(
        """
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
            gate_evaluation_id,
            policy_version_id,
            resource_type,
            resource_id,
            lifecycle_stage,
            is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE)
        RETURNING id;
        """,
        organization_id,
        "model_evaluation_receipt",
        json.dumps(receipt_payload),
        proofs["content_hash"],
        proofs["hash_algorithm"],
        proofs["canonicalization_version"],
        proofs["signature"],
        proofs["signature_algorithm"],
        signing_key_id,
        signed_by_principal_id,
        event_timestamp,
        gate_evaluation_id,
        policy_version_id,
        "model_version",
        evaluation_data["model_id"],
        "validation"
    )
    
    return receipt_id`
    },
    {
      id: 3,
      title: "Advanced Multi-Agent Pre-Action Proof Collection",
      icon: <Users className="h-6 w-6 text-primary" />,
      description: "In autonomous multi-agent environments, agents cannot execute tools under ambient permissions. They must carry a Pre-Action Proof Bundle proving that a policy check occurred and a valid delegation chain exists up to a human principal.",
      code: `async def collect_pre_action_proof_bundle(
    conn: asyncpg.Connection,
    organization_id: UUID,
    agent_session_id: UUID,
    agent_delegation_id: UUID,
    tool_definition_id: UUID,
    gate_evaluation_id: UUID,
    policy_check_receipt_id: UUID,
    signing_key_id: UUID,
    agent_principal_id: UUID,
    private_key_pem: bytes,
    tool_parameters: dict
) -> UUID:
    """
    Constructs and persists a pre-action proof bundle before an agent invokes a tool.
    """
    # 1. Capture context of the execution attempt
    context_data = {
        "agent_session_id": str(agent_session_id),
        "tool_definition_id": str(tool_definition_id),
        "delegation_id": str(agent_delegation_id),
        "invocation_parameters_hash": "sha256:" + hashlib.sha256(canonicalize(tool_parameters)).hexdigest()
    }
    
    canonical_context = canonicalize(context_data)
    context_hash = "sha256:" + hashlib.sha256(canonical_context).hexdigest()
    
    # 2. Build proof payload
    proof_payload = {
        "context_data": context_data,
        "gates_evaluated": [str(gate_evaluation_id)],
        "policy_receipt": str(policy_check_receipt_id)
    }
    
    proofs = generate_cryptographic_proof(proof_payload, private_key_pem)
    
    # 3. Write directly to pre_action_proof_bundles
    proof_bundle_id = await conn.fetchval(
        """
        INSERT INTO public.pre_action_proof_bundles (
            organization_id,
            agent_session_id,
            tool_definition_id,
            context_hash,
            policy_check_receipt_id,
            delegation_id,
            gate_evaluation_id,
            risk_class,
            proof_payload,
            proof_hash,
            hash_algorithm,
            canonicalization_version,
            signature,
            signature_algorithm,
            signing_key_id,
            signed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id;
        """,
        organization_id,
        agent_session_id,
        tool_definition_id,
        context_hash,
        policy_check_receipt_id,
        agent_delegation_id,
        gate_evaluation_id,
        "high",
        json.dumps(proof_payload),
        proofs["content_hash"],
        proofs["hash_algorithm"],
        proofs["canonicalization_version"],
        proofs["signature"],
        proofs["signature_algorithm"],
        signing_key_id,
        agent_principal_id
    )
    
    return proof_bundle_id`
    },
    {
      id: 4,
      title: "Privacy-Preserving Shadow AI Discovery Ingestion",
      icon: <EyeOff className="h-6 w-6 text-primary" />,
      description: "To enforce unmanaged use discovery while strictly complying with GDPR Article 5 data minimization principles, the code implements a Hash-Only Content Retention Mode. It hashes the raw intercepted input, discards the cleartext, and writes the classification outcome to public.shadow_ai_discovery_records.",
      code: `async def ingest_shadow_ai_signal(
    conn: asyncpg.Connection,
    organization_id: UUID,
    employee_principal_id: UUID,
    raw_signal_data: dict, # Intercepted firewall or browser proxy log
) -> dict:
    """
    Ingests network metadata, hashes raw prompts, and returns a sanitized discovery record.
    """
    # 1. ENFORCE PRIVACY GUARD: Compute SHA-256 over raw text input, then discard cleartext
    raw_prompt = raw_signal_data.get("intercepted_prompt", "")
    prompt_hash = "sha256:" + hashlib.sha256(raw_prompt.encode('utf-8')).hexdigest()
    
    sanitized_discovery_payload = {
        "tool_destination_domain": raw_signal_data["target_domain"],
        "payload_size_characters": len(raw_prompt),
        "network_port": raw_signal_data.get("port", 443),
        "content_retention_mode": "hash_only",
        "discovery_hash": prompt_hash # Relates to discovery_hash column
    }
    
    # 2. Query posture registry to determine policy violation level
    tool_posture = await conn.fetchrow(
        "SELECT id, posture, risk_rating FROM public.shadow_ai_tool_registry WHERE tool_url = $1 LIMIT 1",
        raw_signal_data["target_domain"]
    )
    
    status = "new"
    risk_level = "low"
    response_action = "educate"
    
    if tool_posture:
        if tool_posture["posture"] == "prohibited":
            status = "unmanaged"
            risk_level = tool_posture["risk_rating"]
            response_action = "block" # Maps to block response taxomomy
        elif tool_posture["posture"] == "unknown":
            status = "under_review"
            risk_level = "medium"
            response_action = "migrate_to_sanctioned_channel"
            
    # 3. Create public.shadow_ai_discovery_records
    discovery_id = await conn.fetchval(
        """
        INSERT INTO public.shadow_ai_discovery_records (
            organization_id,
            discovery_id,
            signal_source,
            signal_type,
            observed_tool_name,
            actor_principal_id,
            observed_at,
            confidence_score,
            data_sensitivity_hint,
            content_retention_mode,
            discovery_payload,
            discovery_hash,
            status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id;
        """,
        organization_id,
        f"disc_{datetime.now().strftime('%Y%m%d')}_{prompt_hash[:8]}",
        "next_generation_firewall",
        "http_post",
        raw_signal_data["target_domain"],
        employee_principal_id,
        datetime.now(timezone.utc),
        1.00,
        "contains_confidential_source_code",
        "hash_only",
        json.dumps(sanitized_discovery_payload),
        prompt_hash,
        status
    )
    
    return {
        "discovery_record_id": discovery_id,
        "risk_level": risk_level,
        "recommended_action": response_action
    }`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <Link href="/docs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </Link>
      </div>
      
      {/* Header */}
      <div className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Python Implementation Guide
        </h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-3xl leading-relaxed">
          To collect and persist data for the <strong>AI Governance Evidence Infrastructure (AGEI)</strong>, your code must translate raw operational events into cryptographically bound, relational database records. This process moves beyond traditional mutable logs to create <strong>independently verifiable evidence</strong>.
        </p>
      </div>

      {/* Core Patterns Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-full w-6 h-6 text-xs">1</span>
            <h3 className="font-bold">Cryptographic Foundation</h3>
          </div>
          <p className="text-sm text-muted-foreground">Enforcing Canonical JSON (RFC 8785), generating SHA-256 content hashes, and executing Ed25519 digital signatures.</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-full w-6 h-6 text-xs">2</span>
            <h3 className="font-bold">Lifecycle Receipts</h3>
          </div>
          <p className="text-sm text-muted-foreground">Constructing the core evidence envelope and writing to <code>public.receipts</code> asynchronously with asyncpg.</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-full w-6 h-6 text-xs">3</span>
            <h3 className="font-bold">Domain-Specific Auth</h3>
          </div>
          <p className="text-sm text-muted-foreground">Implementing Pre-Action Agent Gates and Privacy-Preserving Shadow AI Discovery Ingestion pipelines.</p>
        </div>
      </div>

      {/* Python Snippets Catalog */}
      <section>
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden group/card hover:border-primary/40 transition-colors">
              <div className="p-6 md:p-8 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  {section.icon}
                  <h3 className="text-2xl font-bold text-foreground">
                    {section.id}. {section.title}
                  </h3>
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  {section.description}
                </div>
              </div>
              
              <div className="p-6 md:p-8 bg-muted/10">
                <details className="group border border-border rounded-xl bg-card overflow-hidden shadow-sm open:shadow-md transition-all" open>
                  <summary className="flex items-center justify-between p-4 cursor-pointer bg-muted/40 hover:bg-muted/80 transition-colors font-mono text-sm font-semibold select-none border-b border-transparent group-open:border-border">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      <span>Python Implementation</span>
                    </div>
                    <span className="flex items-center text-xs font-sans text-muted-foreground gap-2">
                      <span className="group-open:hidden">Click to expand</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="p-4 bg-black/5 dark:bg-black/40 overflow-x-auto text-xs text-foreground font-mono leading-relaxed">
                    <pre><code>{section.code}</code></pre>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
