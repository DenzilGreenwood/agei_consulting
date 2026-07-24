-- ============================================================================
-- AGEI Layer: Extensions and Enums
-- ============================================================================
-- CIAF-LCM Concept:
--   PostgreSQL extensions and custom types required for cryptographic
--   functions, type safety, and HITL/agentic workflows.
--
-- Tables:
--   None (enums and extensions only)
--
-- Depends on:
--   None (foundation layer)
--
-- Evidence Role:
--   Foundation for cryptographic functions and type safety
--
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions for hashing and signatures';

-- ============================================================================
-- CUSTOM ENUMS
-- ============================================================================

-- HITL request status
CREATE TYPE hitl_request_status AS ENUM (
  'pending',              -- Request created, awaiting human review
  'opened',               -- Reviewer has opened the request
  'decided',              -- Decision recorded
  'expired',              -- Request timed out without decision
  'cancelled',            -- Request cancelled by system or admin
  'workflow_resumed',     -- Workflow continued after approval
  'workflow_blocked'      -- Workflow blocked after denial
);

COMMENT ON TYPE hitl_request_status IS 'Status values for HITL request lifecycle';

-- HITL decision type
CREATE TYPE hitl_decision_type AS ENUM (
  'approve',                   -- Approve action/deployment
  'deny',                      -- Deny action/deployment
  'approve_with_conditions',   -- Approve with restrictions
  'modify_and_approve',        -- Modified version approved
  'request_inspection',        -- Need more evidence first
  'request_more_evidence',     -- Insufficient information
  'escalate',                  -- Escalate to higher authority
  'expire',                    -- Let request timeout
  'cancel'                     -- Cancel the request
);

COMMENT ON TYPE hitl_decision_type IS 'Decision types for human reviewers in HITL workflows';

-- Reviewer role types
CREATE TYPE reviewer_role AS ENUM (
  'model_owner',
  'model_risk_reviewer',
  'data_governance_reviewer',
  'privacy_reviewer',
  'security_reviewer',
  'compliance_reviewer',
  'customer_support_supervisor',
  'legal_reviewer',
  'incident_commander',
  'executive_approver'
);

COMMENT ON TYPE reviewer_role IS 'Authorized reviewer roles for HITL decisions';

-- Risk classification
CREATE TYPE risk_classification AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

COMMENT ON TYPE risk_classification IS 'Risk levels for gate evaluations and HITL requests';

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'bounced',
  'failed',
  'clicked',
  'expired'
);

COMMENT ON TYPE notification_status IS 'Delivery status for notification events';
