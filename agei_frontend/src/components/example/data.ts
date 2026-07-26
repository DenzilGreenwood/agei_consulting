import { Message } from './types';

export const SEED_STEPS: Message[][] = [
  // Conversation 1: Standard Chat & Image Upload (Privacy / Dual Hash Model)
  [
    {
      id: 'm1-user',
      sender: 'user',
      text: "Analyze this raw clinical trial scan 'patient_brain_mri_q2.png' and extract anomalies. Be careful, this contains patient PII.",
      attachment: {
        type: 'image',
        name: 'patient_brain_mri_q2.png',
        size: '4.2 MB'
      }
    },
    {
      id: 'm1-assistant',
      sender: 'assistant',
      text: "I have processed the MRI scan. The neural Concept Router identified an outstanding localized region in the frontal cortex (Lobe: Spatial Layout & Object Identity). No high-severity path anomalies detected. All patient-sensitive direct data (PII) has been isolated into an encrypted payload container and key-sealed under Envelope Encryption.",
      proof: {
        receiptId: "rcpt_74fa293c-e2f4-411a-bf39",
        gateOutcome: 'approve',
        policyName: "HIPAA-GDPR Health Data Compliance Policy v1.4",
        signature: "ed25519:6f82a9d2bc103f572a1b903e1c94ff8a38b2734190c112d8a635293ca8e9102dbf013d",
        keyId: "kms-key-us-east-hsm-03",
        shredded: false,
        merkleRoot: "sha256:d82f3a9e102fbc41029da9f1a0e12d83a1f9e2b103e91d0e12d1c9a10bf9e30a",
        latencyMs: 142,
        lobesUsed: ["Object Identity", "Spatial Layout", "Factual", "Ambiguity"],
      }
    }
  ],
  // Conversation 2: Multi-Agent Research & Execution (Gap 2 Solution)
  [
    {
      id: 'm2-user',
      sender: 'user',
      text: "Coordinate a research agent to scrape market data for Competitor X and compile the raw findings into an internal briefing dossier.",
    },
    {
      id: 'm2-assistant',
      sender: 'assistant',
      text: "Orchestration complete. I spawned a secondary 'Market Research Agent' with attenuated read-only permissions to query external endpoints, and a 'Document Compiler Agent' to format the output. The complete delegation chain has been cryptographically validated up to your human authentication root.",
      proof: {
        receiptId: "rcpt_83bc912a-39fa-4cda-921a",
        gateOutcome: 'approve',
        policyName: "Enterprise Multi-Agent Role & Privilege Boundary Policy v3.1",
        signature: "ed25519:8f43c3f7e2a9b103d82a1c0091ff7a38b472e391c0e1a123f81e39a038fbc9103e8271",
        keyId: "kms-key-sec-agent-hsm-12",
        shredded: false,
        merkleRoot: "sha256:4f3c7d9e01ab8c3f6e8d019ab72641f92e10a2b0e91f03e19da7b019b8f3c7e0",
        latencyMs: 284,
        lobesUsed: ["Intent", "Factual", "Temporal"],
        delegationChain: [
          { actor: "Denzil Greenwood (Human Root)", role: "Chief Architect / Owner", authority: "Full Principal Access", signature: "ed25519:user_3a9f..." },
          { actor: "Orchestrator Agent (Primary)", role: "Task Coordinator", authority: "Attenuated Spawn & Delegate", signature: "ed25519:agent_a_4d82..." },
          { actor: "Market Research Agent (Sub)", role: "Web Scraper / Collector", authority: "Scoped Read-Only / Tool-Query", signature: "ed25519:agent_b_92fb..." }
        ]
      }
    }
  ],
  // Conversation 3: High-Risk Document Creation & Downstream Provenance (Watermarking / Gap 5)
  [
    {
      id: 'm3-user',
      sender: 'user',
      text: "Generate the final Q2 Competitive Intel and financial report and export it as an audit-ready, watermarked PDF.",
    },
    {
      id: 'm3-assistant',
      sender: 'assistant',
      text: "I have generated and verified the requested PDF document. The file has cleared all outbound corporate policy checks, has been embedded with dynamic steganographic watermark descriptors, and contains forensic shingle anchors.",
      docCreated: {
        title: "Q2_Competitor_Intel_Dossier_Final.pdf",
        type: "PDF Document",
        size: "1.8 MB"
      },
      proof: {
        receiptId: "rcpt_92fa3b8c-10ea-49fa-a83d",
        gateOutcome: 'approve',
        policyName: "Enterprise Downstream Release & Provenance Policy v2.0",
        signature: "ed25519:4a9c8f3e2b109da3e1b0c9a10e82f7c38b43d2e9e1c010b9f873e1c9a03cf8a27b82f0",
        keyId: "kms-key-prov-hsm-09",
        shredded: false,
        merkleRoot: "sha256:7a9c2e01b3d8f4c2e91da7b3e0e1a2f9c8d7e6b0a1f2e3d4c5b6a7f8e9d0c1b2",
        preWatermarkHash: "sha256:8f43c3f7f8d2b109e8a3c9e8b01fa2d3c9e8f43d2b1a0e1c3d9e8b1c0a2d3e91",
        postWatermarkHash: "sha256:4a9c3b8f7d2b1a0e8c3d9e8b10f2d3c9e8f43d2b1a0e1c3d9e8b1c0a2d3e9102",
        latencyMs: 312,
        lobesUsed: ["Factual", "Intent", "Object Identity", "Spatial Layout"]
      }
    }
  ]
];

