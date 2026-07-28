-- ============================================================================
-- AGEI AI Governance Evidence Infrastructure
-- Migration: 003 - Hash and Canonicalization Functions
-- ============================================================================
-- Extension Pack:
--   Core (Required)
-- ============================================================================

-- ============================================================================
-- FUNCTION: agei_canonicalize_json
-- ============================================================================
-- Purpose: Recursive JSON canonicalization for deterministic hashing
-- Standard: agei-json-v1
-- ============================================================================

CREATE OR REPLACE FUNCTION agei_canonicalize_json(input_data jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result text;
    elem jsonb;
    key text;
    keys text[];
    canonical_pairs text[];
BEGIN
    -- Null case
    IF input_data IS NULL OR input_data = 'null'::jsonb THEN
        RETURN 'null';
    END IF;

    -- Boolean case
    IF jsonb_typeof(input_data) = 'boolean' THEN
        RETURN CASE WHEN input_data::text = 'true' THEN 'true' ELSE 'false' END;
    END IF;

    -- Number case
    IF jsonb_typeof(input_data) = 'number' THEN
        RETURN input_data::text;
    END IF;

    -- String case
    IF jsonb_typeof(input_data) = 'string' THEN
        RETURN to_jsonb(input_data #>> '{}')::text;
    END IF;

    -- Array case
    IF jsonb_typeof(input_data) = 'array' THEN
        result := '[';
        FOR elem IN SELECT * FROM jsonb_array_elements(input_data)
        LOOP
            IF result <> '[' THEN
                result := result || ',';
            END IF;
            result := result || agei_canonicalize_json(elem);
        END LOOP;
        result := result || ']';
        RETURN result;
    END IF;

    -- Object case
    IF jsonb_typeof(input_data) = 'object' THEN
        -- Get sorted keys
        SELECT array_agg(k ORDER BY k)
        INTO keys
        FROM jsonb_object_keys(input_data) AS k;

        -- Build canonical key-value pairs
        canonical_pairs := ARRAY[]::text[];
        FOREACH key IN ARRAY keys
        LOOP
            canonical_pairs := array_append(
                canonical_pairs,
                to_jsonb(key)::text || ':' || agei_canonicalize_json(input_data -> key)
            );
        END LOOP;

        RETURN '{' || array_to_string(canonical_pairs, ',') || '}';
    END IF;

    -- Fallback
    RETURN input_data::text;
END;
$$;

COMMENT ON FUNCTION agei_canonicalize_json IS 'AGEI JSON canonicalization (agei-json-v1). Produces deterministic string representation for hashing.';

-- ============================================================================
-- FUNCTION: agei_hash_jsonb
-- ============================================================================
-- Purpose: Hash JSONB payload using AGEI canonicalization
-- Output: sha256:<64 lowercase hex>
-- ============================================================================

CREATE OR REPLACE FUNCTION agei_hash_jsonb(input_data jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    canonical_text text;
    hash_bytes bytea;
BEGIN
    -- Canonicalize
    canonical_text := agei_canonicalize_json(input_data);
    
    -- Hash
    hash_bytes := digest(canonical_text, 'sha256');
    
    -- Return formatted hash
    RETURN 'sha256:' || encode(hash_bytes, 'hex');
END;
$$;

COMMENT ON FUNCTION agei_hash_jsonb IS 'Hash JSONB payload using agei-json-v1 canonicalization. Returns sha256:<64 hex> format.';

-- ============================================================================
-- FUNCTION: agei_verify_hash
-- ============================================================================
-- Purpose: Verify that stored hash matches computed hash
-- Returns: boolean
-- ============================================================================

CREATE OR REPLACE FUNCTION agei_verify_hash(
    payload jsonb,
    stored_hash text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    computed_hash text;
BEGIN
    computed_hash := agei_hash_jsonb(payload);
    RETURN computed_hash = stored_hash;
END;
$$;

COMMENT ON FUNCTION agei_verify_hash IS 'Verify that stored hash matches payload. Returns true if valid.';

-- ============================================================================
-- FUNCTION: agei_validate_signature_format
-- ============================================================================
-- Purpose: Validate Ed25519 signature format (base64 encoded, 88 chars)
-- ============================================================================

CREATE OR REPLACE FUNCTION agei_validate_signature_format(
    signature text,
    algorithm text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Ed25519 signatures are 64 bytes = 88 base64 characters (with padding)
    IF algorithm = 'ED25519' THEN
        RETURN signature ~ '^[A-Za-z0-9+/]{86}==$';
    END IF;
    
    -- RSA-SHA256 signatures vary but should be base64
    IF algorithm LIKE 'RSA-%' THEN
        RETURN signature ~ '^[A-Za-z0-9+/=]+$' AND length(signature) >= 256;
    END IF;
    
    -- ECDSA signatures
    IF algorithm LIKE 'ECDSA-%' THEN
        RETURN signature ~ '^[A-Za-z0-9+/=]+$' AND length(signature) >= 64;
    END IF;
    
    -- KMS/HSM managed
    IF algorithm = 'KMS' OR algorithm = 'HSM' THEN
        RETURN signature ~ '^[A-Za-z0-9+/=]+$' AND length(signature) >= 64;
    END IF;
    
    RETURN false;
END;
$$;

COMMENT ON FUNCTION agei_validate_signature_format IS 'Validate signature format for various algorithms. Ed25519 = 88 base64 chars.';
