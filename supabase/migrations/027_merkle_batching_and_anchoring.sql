-- ============================================================================
-- AGEI Canonical Migration 027: Merkle Batching and Anchoring
-- ============================================================================
-- Purpose:
--   Extend receipt batching with Merkle root hash computation and external
--   anchoring capability. Enables tamper-evident receipt batching with optional
--   external verification anchors (blockchain, timestamping service, etc.).
--
-- CIAF-LCM Concept:
--   Receipts can be batched into Merkle trees for efficient verification.
--   Root hashes can be anchored to external immutable ledgers for:
--     - Blockchain anchoring (Ethereum, Bitcoin, etc.)
--     - Trusted timestamping services
--     - Internal audit log anchors
--     - Compliance registry anchors
--
-- Key Features:
--   - receipt_batches extended with anchoring fields
--   - receipt_batch_anchors table for multi-anchor support
--   - Status tracking for batch lifecycle
--   - External anchor reference storage
--
-- Extracted from:
--   031_agei_lcm_full_alignment.sql
--
-- Depends on:
--   007_receipts_and_lineage.sql (defines receipt_batches, receipt_batch_items)
--
-- Evidence Role:
--   Tamper-evident batching - anchor receipt proofs to external immutable ledgers
-- ============================================================================

-- ============================================================================
-- EXTEND: receipt_batches
-- ============================================================================
-- Add anchoring capabilities to existing receipt_batches table
-- ============================================================================

ALTER TABLE receipt_batches
  ADD COLUMN IF NOT EXISTS batch_type text NOT NULL DEFAULT 'receipt_batch',
  ADD COLUMN IF NOT EXISTS root_hash text,
  ADD COLUMN IF NOT EXISTS anchored_at timestamptz,
  ADD COLUMN IF NOT EXISTS anchor_target text,
  ADD COLUMN IF NOT EXISTS anchor_reference text,
  ADD COLUMN IF NOT EXISTS anchor_payload jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'sealed', 'anchored', 'verified', 'failed')
  );

-- Backfill root_hash from merkle_root_hash if it exists
UPDATE receipt_batches
SET root_hash = merkle_root_hash
WHERE root_hash IS NULL
  AND merkle_root_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_batches_root_hash 
    ON receipt_batches(root_hash) WHERE root_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipt_batches_anchor 
    ON receipt_batches(anchor_target, anchored_at) WHERE anchored_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipt_batches_status 
    ON receipt_batches(status);

COMMENT ON COLUMN receipt_batches.batch_type IS 'Type of batch: receipt_batch (default), audit_pack_batch, verification_batch';
COMMENT ON COLUMN receipt_batches.root_hash IS 'Merkle root hash of all receipts in batch - enables efficient verification';
COMMENT ON COLUMN receipt_batches.anchored_at IS 'When the root hash was anchored to an external system';
COMMENT ON COLUMN receipt_batches.anchor_target IS 'Where anchored: ethereum, bitcoin, timestamping_service, internal_ledger, compliance_registry';
COMMENT ON COLUMN receipt_batches.anchor_reference IS 'External reference (blockchain tx hash, timestamp token, ledger entry ID)';
COMMENT ON COLUMN receipt_batches.anchor_payload IS 'Full anchor response/proof from external system';
COMMENT ON COLUMN receipt_batches.status IS 'Batch lifecycle: created → sealed → anchored → verified';

-- ============================================================================
-- TABLE: receipt_batch_anchors
-- ============================================================================
-- Purpose: Multiple anchors per batch (e.g., blockchain + timestamp service)
-- Evidence: External verification references for receipt batches
-- ============================================================================

CREATE TABLE receipt_batch_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  batch_id uuid NOT NULL REFERENCES receipt_batches(id) ON DELETE CASCADE,
  
  -- Anchor details
  root_hash text NOT NULL,
  anchor_target text NOT NULL,
  anchor_reference text NOT NULL,
  anchor_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  anchored_at timestamptz NOT NULL DEFAULT now(),
  
  -- Status and metadata
  created_by uuid REFERENCES principals(id),
  status text NOT NULL DEFAULT 'anchored' CHECK (
    status IN ('pending', 'anchored', 'verified', 'failed')
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  CONSTRAINT receipt_batch_anchors_root_hash_format CHECK (
    root_hash ~ '^sha256:[a-f0-9]{64}$'
  )
);

CREATE INDEX idx_receipt_batch_anchors_batch ON receipt_batch_anchors(batch_id);
CREATE INDEX idx_receipt_batch_anchors_org ON receipt_batch_anchors(organization_id);
CREATE INDEX idx_receipt_batch_anchors_target ON receipt_batch_anchors(anchor_target, anchored_at DESC);
CREATE INDEX idx_receipt_batch_anchors_root_hash ON receipt_batch_anchors(root_hash);
CREATE INDEX idx_receipt_batch_anchors_status ON receipt_batch_anchors(status);

-- Grant Data API access
GRANT SELECT ON receipt_batch_anchors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batch_anchors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batch_anchors TO service_role;

COMMENT ON TABLE receipt_batch_anchors IS 'External/internal anchoring records for Merkle receipt batches. Supports multiple anchors per batch.';
COMMENT ON COLUMN receipt_batch_anchors.root_hash IS 'Merkle root hash that was anchored - should match receipt_batches.root_hash';
COMMENT ON COLUMN receipt_batch_anchors.anchor_target IS 'Anchoring system: ethereum, bitcoin, polygonscan, linea, timestamping_service, internal_ledger, compliance_registry';
COMMENT ON COLUMN receipt_batch_anchors.anchor_reference IS 'External proof reference: blockchain transaction hash, timestamp token, ledger entry ID, API reference';
COMMENT ON COLUMN receipt_batch_anchors.anchor_payload IS 'Full anchor response/proof from external system (transaction receipt, timestamp token, verification data)';
COMMENT ON COLUMN receipt_batch_anchors.status IS 'Anchor lifecycle: pending (requested), anchored (confirmed), verified (independently verified), failed';

-- ============================================================================
-- AGEI MERKLE BATCHING AND ANCHORING COMPLETE
-- ============================================================================
-- Receipt batching workflow:
--   1. Application creates receipt_batch
--   2. Receipts added via receipt_batch_items
--   3. Merkle tree computed → root_hash stored
--   4. Batch status: created → sealed
--   5. Root hash anchored to external system (blockchain, timestamp service)
--   6. receipt_batch_anchors record created
--   7. Batch status: sealed → anchored
--   8. External verification performed
--   9. Batch status: anchored → verified
--
-- Verification workflow:
--   1. User requests receipt verification
--   2. Lookup receipt in receipt_batch_items
--   3. Compute Merkle proof from receipt to batch root_hash
--   4. Lookup batch root_hash in receipt_batch_anchors
--   5. Verify anchor reference in external system (e.g., blockchain)
--   6. Return verification result with external proof
--
-- Benefits:
--   - Tamper-evident: Any modification invalidates Merkle proof
--   - Efficient: Verify many receipts with single external anchor
--   - Flexible: Multiple anchor targets per batch
--   - Compliance-ready: External anchors for regulatory requirements
-- ============================================================================
