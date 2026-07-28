-- ============================================================================
-- AGEI Migration 033: Principal Preferences
-- ============================================================================
-- Purpose:
--   Store user preferences for default organization selection and other settings.
--   This allows users with multiple organization memberships to set a preferred default.
--
-- Design Principle:
--   - Optional table - organization selection can also be handled via session/cookie
--   - Server always verifies the selected organization against active memberships
--   - Browser-provided organization_id is never trusted without validation
--
-- Dependencies:
--   001_identity_and_tenancy.sql (principals, organizations)
--
-- Changes:
--   - CREATE TABLE principal_preferences (additive)
--   - CREATE INDEX for lookups
--   - GRANT permissions
-- ============================================================================

-- ============================================================================
-- TABLE: principal_preferences
-- ============================================================================
-- User preferences including default organization selection
-- ============================================================================

CREATE TABLE IF NOT EXISTS principal_preferences (
  principal_id uuid PRIMARY KEY REFERENCES principals(id) ON DELETE CASCADE,
  
  -- Organization preference
  default_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- UI preferences
  theme text CHECK (theme IN ('light', 'dark', 'system')),
  timezone text,
  locale text,
  
  -- Notification preferences
  email_notifications_enabled boolean DEFAULT true,
  slack_notifications_enabled boolean DEFAULT false,
  
  -- Additional preferences
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_principal_preferences_default_org ON principal_preferences(default_organization_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE principal_preferences IS 'User preferences including default organization selection';
COMMENT ON COLUMN principal_preferences.default_organization_id IS 'Preferred default organization when user has multiple memberships. Server must verify active membership before using.';
COMMENT ON COLUMN principal_preferences.metadata IS 'Additional preferences: dashboard_layout, api_usage_alerts, etc.';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE principal_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY principal_preferences_select_own ON principal_preferences
  FOR SELECT
  USING (principal_id = current_principal_id());

-- Users can insert their own preferences
CREATE POLICY principal_preferences_insert_own ON principal_preferences
  FOR INSERT
  WITH CHECK (principal_id = current_principal_id());

-- Users can update their own preferences
CREATE POLICY principal_preferences_update_own ON principal_preferences
  FOR UPDATE
  USING (principal_id = current_principal_id());

-- Platform owners can view all preferences (for support)
CREATE POLICY principal_preferences_select_platform_owner ON principal_preferences
  FOR SELECT
  USING (is_platform_owner());

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON principal_preferences TO authenticated;
GRANT SELECT ON principal_preferences TO service_role;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_principal_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_principal_preferences_updated_at
  BEFORE UPDATE ON principal_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_principal_preferences_timestamp();
