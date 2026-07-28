import { WorkspaceState } from './types';

export const initialMockData: WorkspaceState = {
  stakeholders: [
    {
      id: 'sh-1',
      name: 'Elena Rostova',
      organization: 'Acme Corp',
      department: 'Risk Management',
      role_title: 'Chief Risk Officer (CRO)',
      role_type: 'Executive Sponsor',
      influence: 'High',
      interest: 'High',
      champion_status: 'Supportive',
      accountability_domain: 'Enterprise Risk & Compliance',
      decision_rights: 'Can Approve',
      primary_concerns: ['Verifiable proof', 'Avoid self-reported metrics', 'Regulatory fines'],
      engagement_plan: 'Weekly steering committee, requires executive brief before major deploys.'
    },
    {
      id: 'sh-2',
      name: 'Dr. Aris Thorne',
      organization: 'Acme Corp',
      department: 'Engineering',
      role_title: 'Head of ML Engineering',
      role_type: 'IT Implementation',
      influence: 'High',
      interest: 'High',
      champion_status: 'Skeptical',
      accountability_domain: 'Pipeline Uptime & Developer Velocity',
      decision_rights: 'Can Veto',
      primary_concerns: ['Latency overhead', 'Integration friction', 'CI/CD pipeline blocks'],
      engagement_plan: 'Daily async syncs, architectural review board.'
    },
    {
      id: 'sh-3',
      name: 'Sarah Jenkins',
      organization: 'Acme Corp',
      department: 'Legal',
      role_title: 'General Counsel',
      role_type: 'Risk/Compliance',
      influence: 'Medium',
      interest: 'High',
      champion_status: 'Neutral',
      accountability_domain: 'Data Sovereignty & GDPR',
      decision_rights: 'Advisory Only',
      primary_concerns: ['PII leakage', 'Third-party cloud APIs', 'Prompt logging liability'],
      engagement_plan: 'Ad-hoc reviews for data flows and compliance sign-offs.'
    }
  ],
  objectives: [
    {
      id: 'obj-1',
      title: 'Establish Claims Triage Shadow AI Baseline',
      description: 'Discover and map all unmanaged LLM usage within the Claims Triage team.',
      success_criteria: [
        { id: 'sc-1-1', text: 'Deploy passive network telemetry for 14 days.', is_completed: true },
        { id: 'sc-1-2', text: 'Identify top 3 unmanaged endpoints.', is_completed: true },
        { id: 'sc-1-3', text: 'Quantify daily PII exposure risk.', is_completed: false }
      ]
    },
    {
      id: 'obj-2',
      title: 'Deploy Cryptographic Attestation Pipeline',
      description: 'Implement the AGEI Symmetric Audit model for all prod AI inferences.',
      success_criteria: [
        { id: 'sc-2-1', text: 'Install Sidecar SDK on staging.', is_completed: true },
        { id: 'sc-2-2', text: 'Verify Ed25519 signature generation.', is_completed: true },
        { id: 'sc-2-3', text: 'Achieve >99% Cloud Anchor synchronization.', is_completed: false }
      ]
    },
    {
      id: 'obj-3',
      title: 'Define Runtime Policy Gates',
      description: 'Translate PDF guidelines into deterministic runtime interception rules.',
      success_criteria: [
        { id: 'sc-3-1', text: 'Map GDPR requirements to gate definitions.', is_completed: false },
        { id: 'sc-3-2', text: 'Implement crypto-shredding for revoked consents.', is_completed: false }
      ]
    }
  ],
  journals: [
    {
      id: 'j-1',
      title: 'Discovery Workshop: Claims Triage',
      content: 'Met with Aris today. They are currently using raw OpenAI API keys hardcoded in their Python workers. No centralized gateway. "We just need it to be fast," he said. This is a massive compliance blindspot. We need to route this through the AGEI gateway ASAP.',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      tags: ['Discovery', 'Engineering'],
      is_private: false,
      participant_ids: ['sh-2'],
      decision_owner_id: 'sh-2'
    },
    {
      id: 'j-2',
      title: 'Legal Sync with Sarah',
      content: 'Sarah is terrified that adjusters are pasting raw patient medical records into ChatGPT. We discussed the hash-only discovery pattern. She agrees that hoarding the plaintext prompts for audit is just as dangerous as the leak itself.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      tags: ['Legal', 'Privacy'],
      is_private: false,
      participant_ids: ['sh-3'],
      decision_owner_id: 'sh-3'
    },
    {
      id: 'j-3',
      title: 'Architecture Review: SDK Sidecar',
      content: 'The Sidecar SDK deployment is going well. We successfully generated our first Ed25519 signature locally. However, latency spiked by 40ms. Aris is pushing back. We might need to make the cloud anchoring completely asynchronous to appease him.',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      tags: ['Technical', 'Latency'],
      is_private: false,
      participant_ids: ['sh-2'],
      decision_owner_id: 'sh-2'
    },
    {
      id: 'j-4',
      title: 'Drafting the Executive Brief',
      content: 'Elena needs a summary by Friday. Need to make sure we highlight the difference between their current ambient privilege model and our proposed cryptographic delegation. She needs to see the ROI on the immutable receipts.',
      created_at: new Date().toISOString(),
      tags: ['Executive', 'Reporting'],
      is_private: false,
      participant_ids: ['sh-1']
    }
  ],
  capsules: [
    {
      id: 'cap-1',
      capsule_type: 'Finding',
      title: 'Hardcoded API Keys in Production',
      summary: 'Claims Triage workers bypass gateways using raw OpenAI keys.',
      supporting_context: 'They are currently using raw OpenAI API keys hardcoded in their Python workers. No centralized gateway.',
      source_journal_id: 'j-1',
      mapped_objective_id: 'obj-1',
      created_at: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString()
    },
    {
      id: 'cap-2',
      capsule_type: 'Risk',
      title: 'PII Leakage via Web Portals',
      summary: 'Adjusters may be exposing patient medical records to unmanaged LLMs.',
      supporting_context: 'Adjusters are pasting raw patient medical records into ChatGPT.',
      source_journal_id: 'j-2',
      mapped_objective_id: 'obj-1',
      created_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString()
    },
    {
      id: 'cap-3',
      capsule_type: 'Decision',
      title: 'Adopt Hash-Only Discovery',
      summary: 'Agreed to discard cleartext prompts during shadow AI discovery to minimize liability.',
      supporting_context: 'We discussed the hash-only discovery pattern. She agrees that hoarding the plaintext prompts for audit is just as dangerous as the leak itself.',
      source_journal_id: 'j-2',
      mapped_objective_id: 'obj-1',
      created_at: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString()
    },
    {
      id: 'cap-4',
      capsule_type: 'Observation',
      title: 'Local Signature Generation Successful',
      summary: 'Sidecar SDK is successfully signing payloads with Ed25519.',
      supporting_context: 'We successfully generated our first Ed25519 signature locally.',
      source_journal_id: 'j-3',
      mapped_objective_id: 'obj-2',
      created_at: new Date(Date.now() - 86400000 * 1 + 3600000).toISOString()
    },
    {
      id: 'cap-5',
      capsule_type: 'Issue',
      title: 'Sidecar Latency Spike',
      summary: 'Synchronous anchoring is adding 40ms of latency, causing friction with engineering.',
      supporting_context: 'However, latency spiked by 40ms. Aris is pushing back.',
      source_journal_id: 'j-3',
      mapped_objective_id: 'obj-2',
      created_at: new Date(Date.now() - 86400000 * 1 + 7200000).toISOString()
    },
    {
      id: 'cap-6',
      capsule_type: 'Recommendation',
      title: 'Shift to Async Anchoring',
      summary: 'Decouple the cloud attestation POST request from the critical inference path.',
      supporting_context: 'We might need to make the cloud anchoring completely asynchronous to appease him.',
      source_journal_id: 'j-3',
      mapped_objective_id: 'obj-2',
      created_at: new Date(Date.now() - 86400000 * 1 + 10800000).toISOString()
    }
  ],
  deliverables: [
    {
      id: 'del-1',
      title: 'Phase 1: Shadow AI Discovery Report',
      type: 'Executive Brief',
      status: 'Draft',
      included_objective_ids: ['obj-1'],
      included_capsule_ids: ['cap-1', 'cap-2', 'cap-3'],
      sponsor_id: 'sh-1',
      reviewer_ids: ['sh-2', 'sh-3'],
      compiled_markdown: ''
    }
  ],
  outcomes: [
    {
      id: 'out-draft-1',
      title: 'Draft Working Document: Receipt Verification',
      description: 'tch/test_receipt.json"\n    with open(test_file_path, "w") as f:\n        json.dump(sample_receipt, f, indent=2)\n\n    # Execute verification\n    verify_exported_receipt(test_file_path, pub_hex)',
      type: 'Work Delivered',
      metrics: [],
      impacted_stakeholder_ids: [],
      created_at: new Date().toISOString()
    }
  ],
  org_documents: [
    {
      id: 'doc-intake-1',
      type: 'Intake Submission',
      title: 'Root Intake: Client X',
      content: 'We need to move fast but compliance is breathing down our necks. We heard you can provide mathematical proof of what our models are doing.',
      status: 'Signed',
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      stakeholder_ids: ['sh-1'],
      linked_capsule_ids: [],
      template_variables: {},
      cryptographic_metadata: {
        canonicalization_version: 'ciaf-json-v1',
        content_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        signature: 'ed25519_sig_mock_...',
        signed_by_principal_id: 'sh-1',
        signed_at: new Date(Date.now() - 86400000 * 7).toISOString()
      }
    }
  ]
};
