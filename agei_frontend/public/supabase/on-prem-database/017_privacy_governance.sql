-- ============================================================================
-- AGEI Layer: Privacy Governance
-- ============================================================================
-- CIAF-LCM Concept:
--   GDPR and privacy compliance evidence. Privacy evidence workflows - NOT
--   raw personal data storage. Data subject rights, consent, lawful basis,
--   retention, cross-border transfers, DPIAs, and privacy redaction.
--
-- Tables:
--   data_subjects, data_subject_identifiers, data_subject_requests,
--   data_subject_request_actions, consent_records, lawful_basis_records,
--   processing_activities, dpia_records, retention_policies,
--   cross_border_transfer_records, legal_holds, personal_data_references,
--   privacy_redaction_events, privacy_exports
--
-- Depends on:
--   organizations, principals, policy_versions, gate_evaluations, receipts,
--   evidence_objects, vault_objects, audit_packs
--
-- Evidence Role:
--   Privacy evidence workflows - NOT raw personal data storage
--
-- Extension Pack:
--   AGEI Privacy Pack (Optional)
-- ============================================================================

-- ============================================================================
-- TABLE: data_subjects
-- ============================================================================
-- Purpose: Pseudonymous data-subject registry
-- Evidence: Privacy rights handling without storing raw personal data
-- ============================================================================

CREATE TABLE data_subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Pseudonymous identity
    subject_key_hash text NOT NULL,
    subject_type text NOT NULL,
    
    -- Jurisdiction
    jurisdiction text,
    residency_country text,
    relationship_to_org text,
    
    -- Verification
    verification_status text NOT NULL DEFAULT 'unverified',
    verified_at timestamptz,
    verified_by uuid REFERENCES principals(id),
    
    -- Status
    subject_status text NOT NULL DEFAULT 'active',
    pseudonymized_at timestamptz,
    erased_at timestamptz,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT data_subjects_unique_org_key UNIQUE (organization_id, subject_key_hash)
);

CREATE INDEX idx_data_subjects_org ON data_subjects(organization_id);
CREATE INDEX idx_data_subjects_key_hash ON data_subjects(subject_key_hash);
CREATE INDEX idx_data_subjects_type ON data_subjects(subject_type);
CREATE INDEX idx_data_subjects_jurisdiction ON data_subjects(jurisdiction);
CREATE INDEX idx_data_subjects_status ON data_subjects(subject_status);

COMMENT ON TABLE data_subjects IS 'Pseudonymous data-subject registry for privacy rights handling; avoid storing raw personal data here';
COMMENT ON COLUMN data_subjects.subject_key_hash IS 'SHA-256 hash of pseudonymous subject key';

-- ============================================================================
-- TABLE: data_subject_identifiers
-- ============================================================================
-- Purpose: Hashed or encrypted-pointer identifiers
-- Evidence: For matching DSRs to data subjects
-- ============================================================================

CREATE TABLE data_subject_identifiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    data_subject_id uuid NOT NULL REFERENCES data_subjects(id) ON DELETE CASCADE,
    
    -- Identifier
    identifier_type text NOT NULL,
    identifier_hash text NOT NULL,
    hash_algorithm text NOT NULL DEFAULT 'sha256',
    salt_ref text,
    
    -- Encrypted storage
    encrypted_identifier_ref text,
    storage_bucket text,
    storage_path text,
    
    -- Matching
    is_primary boolean NOT NULL DEFAULT false,
    confidence_score numeric,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_data_subject_identifiers_org ON data_subject_identifiers(organization_id);
CREATE INDEX idx_data_subject_identifiers_subject ON data_subject_identifiers(data_subject_id);
CREATE INDEX idx_data_subject_identifiers_type ON data_subject_identifiers(identifier_type);
CREATE INDEX idx_data_subject_identifiers_hash ON data_subject_identifiers(identifier_hash);
CREATE INDEX idx_data_subject_identifiers_primary ON data_subject_identifiers(is_primary) WHERE is_primary = true;

COMMENT ON TABLE data_subject_identifiers IS 'Hashed or encrypted-pointer identifiers for matching DSRs to data subjects';

-- ============================================================================
-- TABLE: processing_activities
-- ============================================================================
-- Purpose: Article 30-style processing activity records
-- Evidence: Tied to CIAF-LCM policy, gates, receipts, and vault evidence
-- ============================================================================

CREATE TABLE processing_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Activity identity
    activity_key text NOT NULL,
    name text NOT NULL,
    description text,
    
    -- Parties
    controller_name text,
    processor_name text,
    dpo_contact text,
    owner_principal_id uuid REFERENCES principals(id),
    processing_role text NOT NULL,
    
    -- Processing details
    purposes jsonb NOT NULL,
    data_subject_categories jsonb NOT NULL,
    personal_data_categories jsonb NOT NULL,
    special_category_data boolean NOT NULL DEFAULT false,
    criminal_offense_data boolean NOT NULL DEFAULT false,
    
    -- Sharing
    recipients jsonb,
    third_country_transfers jsonb,
    transfer_safeguards jsonb,
    
    -- Retention and security
    retention_schedule jsonb,
    security_measures jsonb,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_definition_id uuid REFERENCES gate_definitions(id),
    receipt_id uuid,
    evidence_object_id uuid,
    vault_object_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'active',
    effective_from timestamptz,
    effective_until timestamptz,
    
    -- Cryptographic integrity
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    activity_hash text,
    hash_algorithm text DEFAULT 'sha256',
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT processing_activities_unique_org_key UNIQUE (organization_id, activity_key),
    CONSTRAINT processing_activities_hash_format CHECK (
        activity_hash IS NULL OR activity_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_processing_activities_org ON processing_activities(organization_id);
CREATE INDEX idx_processing_activities_key ON processing_activities(activity_key);
CREATE INDEX idx_processing_activities_status ON processing_activities(status);
CREATE INDEX idx_processing_activities_owner ON processing_activities(owner_principal_id);

COMMENT ON TABLE processing_activities IS 'Article 30-style processing activity records tied to CIAF-LCM policy, gates, receipts, and vault evidence';

-- ============================================================================
-- TABLE: lawful_basis_records
-- ============================================================================
-- Purpose: Lawful-basis evidence for processing activities
-- Evidence: GDPR Article 6 lawful basis tracking
-- ============================================================================

CREATE TABLE lawful_basis_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Processing activity reference
    processing_activity_id uuid REFERENCES processing_activities(id),
    
    -- Lawful basis
    lawful_basis text NOT NULL,
    basis_scope jsonb NOT NULL,
    basis_description text,
    legitimate_interests_assessment_ref text,
    
    -- Consent linkage
    consent_record_id uuid,
    
    -- Validity
    valid_from timestamptz NOT NULL,
    valid_until timestamptz,
    withdrawn_at timestamptz,
    withdrawal_receipt_id uuid,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'active',
    
    -- Cryptographic integrity
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    record_hash text,
    hash_algorithm text DEFAULT 'sha256',
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT lawful_basis_records_hash_format CHECK (
        record_hash IS NULL OR record_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_lawful_basis_records_org ON lawful_basis_records(organization_id);
CREATE INDEX idx_lawful_basis_records_activity ON lawful_basis_records(processing_activity_id);
CREATE INDEX idx_lawful_basis_records_basis ON lawful_basis_records(lawful_basis);
CREATE INDEX idx_lawful_basis_records_status ON lawful_basis_records(status);

COMMENT ON TABLE lawful_basis_records IS 'Lawful-basis evidence for processing activities and governed AI events';

-- ============================================================================
-- TABLE: consent_records
-- ============================================================================
-- Purpose: Consent records for processing
-- Evidence: GDPR consent lifecycle tracking
-- ============================================================================

CREATE TABLE consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Data subject
    data_subject_id uuid REFERENCES data_subjects(id),
    processing_activity_id uuid REFERENCES processing_activities(id),
    
    -- Consent identity
    consent_key text,
    
    -- Consent status
    consent_status text NOT NULL,
    consent_scope jsonb NOT NULL,
    
    -- Consent method
    consent_method text,
    consent_text_hash text,
    consent_version text,
    
    -- Lifecycle
    granted_at timestamptz,
    withdrawn_at timestamptz,
    expires_at timestamptz,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT consent_records_hash_format CHECK (
        consent_text_hash IS NULL OR consent_text_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_consent_records_org ON consent_records(organization_id);
CREATE INDEX idx_consent_records_subject ON consent_records(data_subject_id);
CREATE INDEX idx_consent_records_activity ON consent_records(processing_activity_id);
CREATE INDEX idx_consent_records_status ON consent_records(consent_status);

COMMENT ON TABLE consent_records IS 'Consent records for processing with lifecycle tracking';

-- ============================================================================
-- TABLE: dpia_records
-- ============================================================================
-- Purpose: Data Protection Impact Assessments
-- Evidence: GDPR Article 35 DPIA records
-- ============================================================================

CREATE TABLE dpia_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- DPIA identity
    processing_activity_id uuid REFERENCES processing_activities(id),
    dpia_key text NOT NULL,
    title text NOT NULL,
    
    -- Risk assessment
    risk_level text NOT NULL,
    assessment_payload jsonb NOT NULL,
    residual_risks jsonb,
    mitigations jsonb,
    
    -- Consultation
    consultation_required boolean NOT NULL DEFAULT false,
    consultation_reference text,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'draft',
    approved_by uuid REFERENCES principals(id),
    approved_at timestamptz,
    
    -- Cryptographic integrity
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    assessment_hash text,
    hash_algorithm text DEFAULT 'sha256',
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT dpia_records_unique_org_key UNIQUE (organization_id, dpia_key),
    CONSTRAINT dpia_records_hash_format CHECK (
        assessment_hash IS NULL OR assessment_hash ~ '^sha256:[a-f0-9]{64}$'
    )
);

CREATE INDEX idx_dpia_records_org ON dpia_records(organization_id);
CREATE INDEX idx_dpia_records_activity ON dpia_records(processing_activity_id);
CREATE INDEX idx_dpia_records_risk ON dpia_records(risk_level);
CREATE INDEX idx_dpia_records_status ON dpia_records(status);

COMMENT ON TABLE dpia_records IS 'Data Protection Impact Assessments with risk assessment and mitigations';

-- ============================================================================
-- TABLE: retention_policies
-- ============================================================================
-- Purpose: Data retention policies
-- Evidence: Retention schedule tracking
-- ============================================================================

CREATE TABLE retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Policy identity
    policy_key text NOT NULL,
    name text NOT NULL,
    description text,
    
    -- Retention details
    data_category text,
    retention_period_days int4,
    retention_basis text,
    disposal_action text NOT NULL,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    receipt_id uuid,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT retention_policies_unique_org_key UNIQUE (organization_id, policy_key)
);

CREATE INDEX idx_retention_policies_org ON retention_policies(organization_id);
CREATE INDEX idx_retention_policies_key ON retention_policies(policy_key);
CREATE INDEX idx_retention_policies_active ON retention_policies(is_active) WHERE is_active = true;

COMMENT ON TABLE retention_policies IS 'Data retention policies and schedules';

-- ============================================================================
-- TABLE: cross_border_transfer_records
-- ============================================================================
-- Purpose: Cross-border data transfer records
-- Evidence: GDPR Chapter V transfer mechanisms
-- ============================================================================

CREATE TABLE cross_border_transfer_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Processing activity reference
    processing_activity_id uuid REFERENCES processing_activities(id),
    
    -- Transfer details
    destination_country text NOT NULL,
    recipient_name text,
    transfer_mechanism text NOT NULL,
    safeguards jsonb NOT NULL,
    transfer_scope jsonb NOT NULL,
    risk_assessment_ref text,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'active',
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    metadata jsonb
);

CREATE INDEX idx_cross_border_transfer_records_org ON cross_border_transfer_records(organization_id);
CREATE INDEX idx_cross_border_transfer_records_activity ON cross_border_transfer_records(processing_activity_id);
CREATE INDEX idx_cross_border_transfer_records_country ON cross_border_transfer_records(destination_country);
CREATE INDEX idx_cross_border_transfer_records_status ON cross_border_transfer_records(status);

COMMENT ON TABLE cross_border_transfer_records IS 'Cross-border data transfer records with transfer mechanisms and safeguards';

-- ============================================================================
-- TABLE: legal_holds
-- ============================================================================
-- Purpose: Legal hold records
-- Evidence: Retention suspension for legal proceedings
-- ============================================================================

CREATE TABLE legal_holds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Hold identity
    hold_key text NOT NULL,
    hold_type text NOT NULL,
    hold_reason text NOT NULL,
    scope jsonb NOT NULL,
    
    -- Subject references
    applies_to_data_subject_id uuid REFERENCES data_subjects(id),
    applies_to_request_id uuid,
    
    -- Status
    status text NOT NULL DEFAULT 'active',
    
    -- Lifecycle
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    released_at timestamptz,
    released_by uuid REFERENCES principals(id),
    release_reason text,
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT legal_holds_unique_org_key UNIQUE (organization_id, hold_key)
);

CREATE INDEX idx_legal_holds_org ON legal_holds(organization_id);
CREATE INDEX idx_legal_holds_key ON legal_holds(hold_key);
CREATE INDEX idx_legal_holds_status ON legal_holds(status);
CREATE INDEX idx_legal_holds_subject ON legal_holds(applies_to_data_subject_id);

COMMENT ON TABLE legal_holds IS 'Legal hold records for suspending retention and deletion';

-- ============================================================================
-- TABLE: personal_data_references
-- ============================================================================
-- Purpose: Purpose-limited references to personal data locations
-- Evidence: Linked to receipts/evidence/vault without duplicating raw data
-- ============================================================================

CREATE TABLE personal_data_references (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Subject references
    data_subject_id uuid REFERENCES data_subjects(id),
    processing_activity_id uuid REFERENCES processing_activities(id),
    lawful_basis_record_id uuid REFERENCES lawful_basis_records(id),
    
    -- Reference type
    reference_type text NOT NULL,
    
    -- CIAF linkage
    receipt_id uuid,
    evidence_object_id uuid,
    vault_object_id uuid,
    
    -- Data classification
    personal_data_category text NOT NULL,
    sensitivity_level text NOT NULL,
    
    -- Storage mode
    payload_storage_mode text NOT NULL,
    
    -- Content hashes
    original_content_hash text,
    current_content_hash text,
    redacted_content_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- External storage
    storage_bucket text,
    storage_path text,
    storage_content_hash text,
    external_system_ref text,
    external_record_id text,
    
    -- Minimization
    minimization_profile jsonb,
    
    -- Retention
    retention_policy_id uuid REFERENCES retention_policies(id),
    legal_hold_id uuid REFERENCES legal_holds(id),
    
    -- Restriction
    is_restricted boolean NOT NULL DEFAULT false,
    restricted_at timestamptz,
    restriction_reason text,
    
    -- Erasure
    is_erased boolean NOT NULL DEFAULT false,
    erased_at timestamptz,
    erasure_receipt_id uuid,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    
    CONSTRAINT personal_data_references_hash_format CHECK (
        (original_content_hash IS NULL OR original_content_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (current_content_hash IS NULL OR current_content_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (redacted_content_hash IS NULL OR redacted_content_hash ~ '^sha256:[a-f0-9]{64}$')
    )
);

CREATE INDEX idx_personal_data_references_org ON personal_data_references(organization_id);
CREATE INDEX idx_personal_data_references_subject ON personal_data_references(data_subject_id);
CREATE INDEX idx_personal_data_references_activity ON personal_data_references(processing_activity_id);
CREATE INDEX idx_personal_data_references_type ON personal_data_references(reference_type);
CREATE INDEX idx_personal_data_references_category ON personal_data_references(personal_data_category);
CREATE INDEX idx_personal_data_references_restricted ON personal_data_references(is_restricted) WHERE is_restricted = true;
CREATE INDEX idx_personal_data_references_erased ON personal_data_references(is_erased) WHERE is_erased = true;

COMMENT ON TABLE personal_data_references IS 'Purpose-limited references to where personal data exists, linked to receipts/evidence/vault objects without duplicating raw personal data';

-- ============================================================================
-- TABLE: data_subject_requests
-- ============================================================================
-- Purpose: Data-subject rights request workflow
-- Evidence: Linked to CIAF-LCM receipts, gates, evidence, and audit packs
-- ============================================================================

CREATE TABLE data_subject_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request identity
    data_subject_id uuid REFERENCES data_subjects(id),
    request_number text,
    request_type text NOT NULL,
    request_channel text,
    request_payload jsonb NOT NULL,
    
    -- Verification
    identity_verification_status text NOT NULL DEFAULT 'pending',
    
    -- Scope
    scope jsonb NOT NULL,
    
    -- Status
    status text NOT NULL DEFAULT 'received',
    
    -- Timeline
    received_at timestamptz NOT NULL,
    due_at timestamptz NOT NULL,
    completed_at timestamptz,
    closed_at timestamptz,
    
    -- Assignment
    assigned_to uuid REFERENCES principals(id),
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    audit_pack_id uuid REFERENCES audit_packs(id),
    
    -- Denial/extension
    denial_reason text,
    extension_reason text,
    extended_due_at timestamptz,
    
    -- Metadata
    metadata jsonb,
    tags jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id)
);

CREATE INDEX idx_data_subject_requests_org ON data_subject_requests(organization_id);
CREATE INDEX idx_data_subject_requests_subject ON data_subject_requests(data_subject_id);
CREATE INDEX idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_due ON data_subject_requests(due_at);
CREATE INDEX idx_data_subject_requests_assigned ON data_subject_requests(assigned_to);

COMMENT ON TABLE data_subject_requests IS 'Data-subject rights request workflow linked to CIAF-LCM receipts, gates, evidence, and audit packs';

-- ============================================================================
-- TABLE: data_subject_request_actions
-- ============================================================================
-- Purpose: Immutable action trail for data-subject rights handling
-- Evidence: Link action_receipt_id for CIAF-LCM evidence-grade proof
-- ============================================================================

CREATE TABLE data_subject_request_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request reference
    request_id uuid NOT NULL REFERENCES data_subject_requests(id),
    
    -- Action
    action_type text NOT NULL,
    action_status text NOT NULL,
    action_payload jsonb NOT NULL,
    
    -- Target
    target_reference_type text,
    target_reference_id uuid,
    
    -- Content hashes
    before_hash text,
    after_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- CIAF linkage
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    action_receipt_id uuid,
    evidence_object_id uuid,
    
    -- Execution
    performed_at timestamptz NOT NULL,
    performed_by uuid REFERENCES principals(id),
    
    -- Review
    reviewer_id uuid REFERENCES principals(id),
    review_notes text,
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT data_subject_request_actions_hash_format CHECK (
        (before_hash IS NULL OR before_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (after_hash IS NULL OR after_hash ~ '^sha256:[a-f0-9]{64}$')
    )
);

CREATE INDEX idx_data_subject_request_actions_org ON data_subject_request_actions(organization_id);
CREATE INDEX idx_data_subject_request_actions_request ON data_subject_request_actions(request_id);
CREATE INDEX idx_data_subject_request_actions_type ON data_subject_request_actions(action_type);
CREATE INDEX idx_data_subject_request_actions_performed ON data_subject_request_actions(performed_at DESC);

COMMENT ON TABLE data_subject_request_actions IS 'Immutable action trail for data-subject rights handling; link action_receipt_id for CIAF-LCM evidence-grade proof';

-- ============================================================================
-- TABLE: privacy_redaction_events
-- ============================================================================
-- Purpose: Immutable privacy operation evidence
-- Evidence: Redaction/erasure/pseudonymization actions
-- ============================================================================

CREATE TABLE privacy_redaction_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request reference
    request_id uuid REFERENCES data_subject_requests(id),
    personal_data_reference_id uuid REFERENCES personal_data_references(id),
    
    -- Redaction
    redaction_type text NOT NULL,
    redaction_method text NOT NULL,
    
    -- Target
    target_type text NOT NULL,
    target_id uuid,
    external_target_ref text,
    
    -- Content hashes
    original_content_hash text,
    redacted_content_hash text,
    redaction_manifest jsonb NOT NULL,
    irreversibility_claim text,
    
    -- Legal basis
    legal_basis_record_id uuid REFERENCES lawful_basis_records(id),
    legal_hold_id uuid REFERENCES legal_holds(id),
    
    -- CIAF linkage
    policy_version_id uuid REFERENCES policy_versions(id),
    gate_evaluation_id uuid REFERENCES gate_evaluations(id),
    receipt_id uuid,
    evidence_object_id uuid,
    
    -- Execution
    performed_at timestamptz NOT NULL,
    performed_by uuid REFERENCES principals(id),
    
    -- Review
    reviewed_by uuid REFERENCES principals(id),
    reviewed_at timestamptz,
    
    -- Cryptographic integrity
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    event_hash text,
    hash_algorithm text DEFAULT 'sha256',
    
    -- Metadata
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    
    CONSTRAINT privacy_redaction_events_hash_format CHECK (
        (original_content_hash IS NULL OR original_content_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (redacted_content_hash IS NULL OR redacted_content_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (event_hash IS NULL OR event_hash ~ '^sha256:[a-f0-9]{64}$')
    )
);

CREATE INDEX idx_privacy_redaction_events_org ON privacy_redaction_events(organization_id);
CREATE INDEX idx_privacy_redaction_events_request ON privacy_redaction_events(request_id);
CREATE INDEX idx_privacy_redaction_events_reference ON privacy_redaction_events(personal_data_reference_id);
CREATE INDEX idx_privacy_redaction_events_type ON privacy_redaction_events(redaction_type);
CREATE INDEX idx_privacy_redaction_events_performed ON privacy_redaction_events(performed_at DESC);

COMMENT ON TABLE privacy_redaction_events IS 'Immutable privacy operation evidence; use to show redaction/erasure/pseudonymization actions while preserving auditability';

-- ============================================================================
-- TABLE: privacy_exports
-- ============================================================================
-- Purpose: Export manifest for access/portability/regulator packages
-- Evidence: Should link to audit_packs/vault_objects for evidence-grade export
-- ============================================================================

CREATE TABLE privacy_exports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    -- Request reference
    request_id uuid REFERENCES data_subject_requests(id),
    data_subject_id uuid REFERENCES data_subjects(id),
    
    -- Export details
    export_type text NOT NULL,
    export_format text NOT NULL,
    export_scope jsonb NOT NULL,
    
    -- CIAF linkage
    audit_pack_id uuid REFERENCES audit_packs(id),
    vault_object_id uuid,
    
    -- Storage
    storage_bucket text,
    storage_path text,
    storage_content_hash text,
    
    -- Cryptographic integrity
    export_hash text,
    hash_algorithm text DEFAULT 'sha256',
    canonicalization_version text NOT NULL DEFAULT 'agei-json-v1',
    
    -- Status
    status text NOT NULL DEFAULT 'pending',
    
    -- Lifecycle
    created_at timestamptz NOT NULL DEFAULT NOW(),
    sealed_at timestamptz,
    delivered_at timestamptz,
    expires_at timestamptz,
    
    -- Principals
    created_by uuid REFERENCES principals(id),
    delivered_by uuid REFERENCES principals(id),
    
    -- Metadata
    metadata jsonb,
    
    CONSTRAINT privacy_exports_hash_format CHECK (
        (export_hash IS NULL OR export_hash ~ '^sha256:[a-f0-9]{64}$') AND
        (storage_content_hash IS NULL OR storage_content_hash ~ '^sha256:[a-f0-9]{64}$')
    )
);

CREATE INDEX idx_privacy_exports_org ON privacy_exports(organization_id);
CREATE INDEX idx_privacy_exports_request ON privacy_exports(request_id);
CREATE INDEX idx_privacy_exports_subject ON privacy_exports(data_subject_id);
CREATE INDEX idx_privacy_exports_type ON privacy_exports(export_type);
CREATE INDEX idx_privacy_exports_status ON privacy_exports(status);

COMMENT ON TABLE privacy_exports IS 'Export manifest for access/portability/regulator packages; should link to audit_packs/vault_objects where evidence-grade export is required';

-- Update triggers
CREATE TRIGGER update_data_subjects_updated_at BEFORE UPDATE ON data_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_activities_updated_at BEFORE UPDATE ON processing_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawful_basis_records_updated_at BEFORE UPDATE ON lawful_basis_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpia_records_updated_at BEFORE UPDATE ON dpia_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_border_transfer_records_updated_at BEFORE UPDATE ON cross_border_transfer_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_holds_updated_at BEFORE UPDATE ON legal_holds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_data_references_updated_at BEFORE UPDATE ON personal_data_references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
