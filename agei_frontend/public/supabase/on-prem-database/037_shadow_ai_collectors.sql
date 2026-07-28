-- ============================================================================
-- AGEI Layer: Shadow AI Collectors and Events
-- ============================================================================

-- ============================================================================
-- TABLE: shadow_ai_collectors
-- ============================================================================
CREATE TABLE shadow_ai_collectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    
    name text NOT NULL,
    collector_type text NOT NULL CHECK (
        collector_type IN ('network_sniffer', 'endpoint_agent', 'browser_extension', 'saas_log', 'manual_import', 'mock_collector')
    ),
    
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    last_seen_at timestamptz,
    trust_level text NOT NULL DEFAULT 'standard' CHECK (trust_level IN ('high', 'standard', 'low')),
    
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES principals(id),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shadow_ai_collectors_org ON shadow_ai_collectors(organization_id);

-- ============================================================================
-- TABLE: shadow_ai_collector_keys
-- ============================================================================
CREATE TABLE shadow_ai_collector_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id uuid NOT NULL REFERENCES shadow_ai_collectors(id) ON DELETE CASCADE,
    
    key_hash text NOT NULL UNIQUE,
    key_prefix text NOT NULL,
    
    scope text NOT NULL DEFAULT 'shadow_ai.discoveries.write',
    
    is_active boolean NOT NULL DEFAULT true,
    revoked_at timestamptz,
    
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shadow_ai_collector_keys_collector ON shadow_ai_collector_keys(collector_id);

-- ============================================================================
-- ALTER: shadow_ai_discovery_records
-- ============================================================================
ALTER TABLE shadow_ai_discovery_records 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new' 
CHECK (status IN ('new', 'under_review', 'known_approved', 'unmanaged', 'false_positive', 'escalated'));

ALTER TABLE shadow_ai_discovery_records 
ADD COLUMN IF NOT EXISTS linked_governance_id uuid;

ALTER TABLE shadow_ai_discovery_records 
ADD COLUMN IF NOT EXISTS linked_governance_type text;

ALTER TABLE shadow_ai_discovery_records 
ADD COLUMN IF NOT EXISTS collector_id uuid REFERENCES shadow_ai_collectors(id);

-- ============================================================================
-- TABLE: shadow_ai_discovery_events
-- ============================================================================
CREATE TABLE shadow_ai_discovery_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    discovery_record_id uuid NOT NULL REFERENCES shadow_ai_discovery_records(id) ON DELETE CASCADE,
    
    event_type text NOT NULL CHECK (
        event_type IN (
            'discovery_received',
            'marked_known',
            'marked_needs_review',
            'marked_unmanaged',
            'marked_false_positive',
            'escalated_to_governance',
            'linked_to_use_case',
            'linked_to_workflow',
            'created_use_case',
            'comment_added'
        )
    ),
    
    actor_user_id uuid REFERENCES principals(id),
    
    previous_status text,
    new_status text,
    
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shadow_ai_discovery_events_discovery ON shadow_ai_discovery_events(discovery_record_id);
CREATE INDEX idx_shadow_ai_discovery_events_org ON shadow_ai_discovery_events(organization_id);

-- Prevent UPDATE and DELETE on events to ensure immutability
CREATE RULE prevent_shadow_ai_discovery_events_update AS ON UPDATE TO shadow_ai_discovery_events DO INSTEAD NOTHING;
CREATE RULE prevent_shadow_ai_discovery_events_delete AS ON DELETE TO shadow_ai_discovery_events DO INSTEAD NOTHING;

-- Grant permissions for new tables
GRANT SELECT ON shadow_ai_collectors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_collectors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_collectors TO service_role;

GRANT SELECT ON shadow_ai_collector_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_collector_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_ai_collector_keys TO service_role;

GRANT SELECT ON shadow_ai_discovery_events TO anon;
GRANT SELECT, INSERT ON shadow_ai_discovery_events TO authenticated;
GRANT SELECT, INSERT ON shadow_ai_discovery_events TO service_role;
