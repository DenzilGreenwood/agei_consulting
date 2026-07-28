-- ============================================================================
-- Add Ed25519 Signatures to Evidence Capsules
-- ============================================================================
-- Purpose:
--   Add cryptographic signature fields to evidence_capsules table for
--   tamper-proof integrity verification of captured evidence.
--
-- Design:
--   Evidence capsules should be signed like receipts and gate evaluations
--   to ensure the captured evidence hasn't been tampered with.
-- ============================================================================

-- Add signature columns to evidence_capsules
ALTER TABLE evidence_capsules
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS signature_algorithm signature_algorithm,
  ADD COLUMN IF NOT EXISTS signing_key_id uuid REFERENCES signing_keys(id),
  ADD COLUMN IF NOT EXISTS signed_by uuid REFERENCES principals(id),
  ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- Add signature format validation constraint
ALTER TABLE evidence_capsules
  ADD CONSTRAINT evidence_capsules_signature_format CHECK (
    signature IS NULL OR agei_validate_signature_format(signature, signature_algorithm::text)
  );

-- Create index on signed_by for querying
CREATE INDEX IF NOT EXISTS idx_evidence_capsules_signed_by 
  ON evidence_capsules(signed_by) 
  WHERE signed_by IS NOT NULL;

-- Create index on signing_key_id for key rotation tracking
CREATE INDEX IF NOT EXISTS idx_evidence_capsules_signing_key 
  ON evidence_capsules(signing_key_id) 
  WHERE signing_key_id IS NOT NULL;

COMMENT ON COLUMN evidence_capsules.signature IS 'Ed25519 cryptographic signature of capsule_hash for tamper detection';
COMMENT ON COLUMN evidence_capsules.signature_algorithm IS 'Signature algorithm used (ED25519)';
COMMENT ON COLUMN evidence_capsules.signing_key_id IS 'Reference to the signing key used';
COMMENT ON COLUMN evidence_capsules.signed_by IS 'Principal who signed the capsule (typically service or agent)';
COMMENT ON COLUMN evidence_capsules.signed_at IS 'Timestamp when capsule was signed';
