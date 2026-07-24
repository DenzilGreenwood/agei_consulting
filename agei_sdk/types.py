import json
import hashlib
import time
import uuid
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, asdict

def canonicalize_json(data: Any) -> bytes:
    """
    Implements RFC 8785 Canonical JSON serialization.
    For this mockup, we use json.dumps with sorted_keys and no whitespace.
    """
    return json.dumps(
        data,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(',', ':')
    ).encode('utf-8')

def hash_payload(data: Any) -> str:
    """
    Creates a SHA-256 hash of the canonicalized JSON payload.
    Prefixes with 'sha256:' as per requirements.
    """
    canonical_bytes = canonicalize_json(data)
    digest = hashlib.sha256(canonical_bytes).hexdigest()
    return f"sha256:{digest}"

@dataclass
class Receipt:
    receipt_id: str
    tenant_id: str
    gate_id: str
    decision: str  # 'Approve', 'Deny', 'Escalate', 'Inspect'
    reason: str
    payload_hash: str
    timestamp: float
    signature: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
