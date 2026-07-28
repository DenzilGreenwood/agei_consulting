export type InfluenceLevel = 'High' | 'Medium' | 'Low';
export type InterestLevel = 'High' | 'Medium' | 'Low';
export type ChampionStatus = 'Strong Champion' | 'Supportive' | 'Neutral' | 'Skeptical' | 'Opposed';
export type DecisionRights = 'Can Approve' | 'Can Veto' | 'Advisory Only';
export type RoleType = 'Executive Sponsor' | 'Governance' | 'IT Implementation' | 'Business Owner' | 'End User' | 'Risk/Compliance' | 'Data/ML' | 'Security/Cyber' | 'Audit';

export interface Stakeholder {
  id: string;
  name: string;
  organization: string;
  department: string;
  role_title: string;
  role_type: RoleType;
  influence: InfluenceLevel;
  interest: InterestLevel;
  champion_status: ChampionStatus;
  accountability_domain: string;
  decision_rights: DecisionRights;
  primary_concerns: string[];
  engagement_plan: string;
}

export interface SuccessCriterion {
  id: string;
  text: string;
  is_completed: boolean;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  success_criteria: SuccessCriterion[];
}

export type CapsuleType = 'Finding' | 'Recommendation' | 'Decision' | 'Risk' | 'Issue' | 'Evidence' | 'Observation';
export type DeliverableType = 'Executive Brief' | 'Runbook' | 'White Paper' | 'Technical Spec';
export type DeliverableStatus = 'Draft' | 'Review' | 'Delivered';

export interface Journal {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  is_private: boolean;
  participant_ids: string[];
  decision_owner_id?: string;
}

export interface Capsule {
  id: string;
  capsule_type: CapsuleType;
  title: string;
  summary: string;
  supporting_context: string;
  source_journal_id: string | null;
  mapped_objective_id: string | null;
  created_at: string;
}

export interface Deliverable {
  id: string;
  title: string;
  type: DeliverableType;
  status: DeliverableStatus;
  included_objective_ids: string[];
  included_capsule_ids: string[];
  sponsor_id?: string;
  reviewer_ids: string[];
  signoff_id?: string;
  compiled_markdown: string;
}

export type OutcomeType = 'Work Delivered' | 'Software Implemented' | 'Value Realized' | 'Strategic Shift';

export interface Outcome {
  id: string;
  title: string;
  description: string;
  type: OutcomeType;
  metrics: string[];
  owner_id?: string;
  impacted_stakeholder_ids: string[];
  created_at: string;
}

export type StandardDocType = 
  | 'Intake Submission'
  | 'Engagement Letter'
  | 'Deliverables List'
  | 'Work Document'
  | 'Outcome Form';

export type DocStatus = 'Draft' | 'Sent' | 'Signed' | 'Archived';

export interface OrganizationDocument {
  id: string;
  type: StandardDocType;
  title: string;
  content: string;
  status: DocStatus;
  created_at: string;
  updated_at: string;
  
  stakeholder_ids: string[];
  linked_capsule_ids: string[];
  
  template_variables: {
    engagement_fee?: number;
    target_timeline_weeks?: number;
    assurance_profile_target?: 1 | 2 | 3;
  };

  cryptographic_metadata?: {
    canonicalization_version: string;
    content_hash: string;
    signature?: string;
    signed_by_principal_id?: string;
    signed_at?: string;
  };
}

export interface WorkspaceState {
  stakeholders: Stakeholder[];
  objectives: Objective[];
  journals: Journal[];
  capsules: Capsule[];
  deliverables: Deliverable[];
  outcomes: Outcome[];
  org_documents: OrganizationDocument[];
}
