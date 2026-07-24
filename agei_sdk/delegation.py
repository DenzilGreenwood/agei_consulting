import time
import uuid
from typing import Dict, Any, List
from .sidecar import AGEISidecar
from .types import hash_payload

class PreActionProofBundle:
    def __init__(self, orchestrator_id: str, worker_id: str, scope: List[str], valid_until: float, sidecar: AGEISidecar):
        self.bundle_id = str(uuid.uuid4())
        self.orchestrator_id = orchestrator_id
        self.worker_id = worker_id
        self.scope = scope
        self.valid_until = valid_until
        self.sidecar = sidecar
        self.signature = None
        self.payload = None

    def sign(self):
        """Orchestrator signs the delegation payload."""
        self.payload = {
            "bundle_id": self.bundle_id,
            "orchestrator_id": self.orchestrator_id,
            "worker_id": self.worker_id,
            "scope": self.scope,
            "valid_until": self.valid_until
        }
        
        from .types import canonicalize_json
        canonical_bytes = canonicalize_json(self.payload)
        self.signature = self.sidecar.sign_payload(canonical_bytes)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "payload": self.payload,
            "signature": self.signature
        }

class Agent:
    def __init__(self, agent_id: str, sidecar: AGEISidecar):
        self.agent_id = agent_id
        self.sidecar = sidecar

class Orchestrator(Agent):
    def spawn_worker(self, worker_id: str, scope: List[str], ttl_seconds: int = 3600) -> 'Worker':
        """Spawns a worker and attenuates its authority scope."""
        print(f"[Orchestrator {self.agent_id}] Spawning worker {worker_id} with scope {scope}")
        valid_until = time.time() + ttl_seconds
        
        # Generate the pre-action proof bundle
        bundle = PreActionProofBundle(self.agent_id, worker_id, scope, valid_until, self.sidecar)
        bundle.sign()
        
        return Worker(worker_id, self.sidecar, bundle)

class Worker(Agent):
    def __init__(self, agent_id: str, sidecar: AGEISidecar, delegation_bundle: PreActionProofBundle):
        super().__init__(agent_id, sidecar)
        self.delegation_bundle = delegation_bundle

    def invoke_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Simulates invoking a database tool with delegated authority."""
        if time.time() > self.delegation_bundle.valid_until:
            raise PermissionError("Delegation bundle expired.")
            
        if tool_name not in self.delegation_bundle.scope:
            raise PermissionError(f"Tool {tool_name} is outside the attenuated scope of this worker.")
        
        print(f"[Worker {self.agent_id}] Invoking {tool_name} with args {args}")
        print(f"[Worker {self.agent_id}] Attaching PreActionProofBundle: {self.delegation_bundle.bundle_id}")
        
        # Simulate generating a receipt for the action
        payload = {
            "tool": tool_name,
            "args": args,
            "bundle": self.delegation_bundle.to_dict()
        }
        
        receipt = self.sidecar.generate_receipt(
            gate_id="gate_tool_invocation",
            decision="Approve",
            reason="Delegation valid and scope authorized.",
            payload=payload
        )
        
        return f"Tool {tool_name} executed successfully. Receipt: {receipt.receipt_id}"

def run_delegation_demo():
    """Implements a multi-agent delegation runner showing how an Orchestrator agent spawns a Worker agent."""
    tenant_id = str(uuid.uuid4())
    sidecar = AGEISidecar(tenant_id)
    
    orchestrator = Orchestrator("agent-orchestrator-1", sidecar)
    
    try:
        worker = orchestrator.spawn_worker(
            worker_id="agent-worker-1",
            scope=["db_read_users", "db_write_logs"],
            ttl_seconds=300
        )
        
        # Should succeed
        result = worker.invoke_tool("db_read_users", {"limit": 10})
        print(result)
        
        # Should fail due to scope attenuation
        worker.invoke_tool("db_delete_users", {"user_id": "123"})
        
    except Exception as e:
        print(f"Error during invocation: {e}")

if __name__ == "__main__":
    run_delegation_demo()
