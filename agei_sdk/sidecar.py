import time
import uuid
import base64
import os
try:
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
except ImportError:
    ed25519 = None

from .types import Receipt, hash_payload, canonicalize_json

class AGEISidecar:
    """
    Middleware that performs out-of-band JSON canonicalization, local Ed25519 signing, 
    and API telemetry ingestion.
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._private_key = None
        self._public_key = None
        self._setup_keys()

    def _setup_keys(self):
        """Sets up Layer 1 (Local) Ed25519 signing keys."""
        if ed25519 is None:
            # Fallback for systems without cryptography library
            return
        
        self._private_key = ed25519.Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

    def sign_payload(self, data_bytes: bytes) -> str:
        """Signs the canonicalized data with Ed25519."""
        if not self._private_key:
            return "signature:mock_ed25519_signature"
            
        signature = self._private_key.sign(data_bytes)
        return "ed25519:" + base64.b64encode(signature).decode('utf-8')

    def generate_receipt(self, gate_id: str, decision: str, reason: str, payload: dict) -> Receipt:
        """
        Generates an atomic receipt out-of-band for a gate evaluation.
        """
        # 1. Canonicalize & Hash payload
        canonical_bytes = canonicalize_json(payload)
        payload_hash = hash_payload(payload)

        # 2. Sign canonical data
        signature = self.sign_payload(canonical_bytes)

        # 3. Create Receipt
        receipt = Receipt(
            receipt_id=str(uuid.uuid4()),
            tenant_id=self.tenant_id,
            gate_id=gate_id,
            decision=decision,
            reason=reason,
            payload_hash=payload_hash,
            timestamp=time.time(),
            signature=signature
        )
        
        # 4. In a real system, we'd enqueue this for async database writing or batching
        self._emit_telemetry(receipt)
        
        return receipt

    def _emit_telemetry(self, receipt: Receipt):
        """Simulates sending the receipt to the Supabase backend."""
        # This would typically be a non-blocking background queue task
        pass
