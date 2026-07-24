import functools
import inspect
from typing import Callable, Any, Optional
from .sidecar import AGEISidecar

class GateEvaluationError(Exception):
    pass

def validation_gate(gate_id: str, sidecar: AGEISidecar):
    """
    Decorator for intercepting model deployment/promotion commands, 
    evaluating configured rule metrics, and generating atomic receipts out-of-band.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Capture the input context for the receipt
            payload = {
                "function": func.__name__,
                "args": args,
                "kwargs": kwargs
            }
            
            # Simulate a metric evaluation. In a real scenario, this would query a policy engine
            # For demonstration, we assume we check the kwargs for a 'confidence_score' > 0.8
            confidence = kwargs.get('confidence_score', 0)
            
            if confidence >= 0.8:
                decision = "Approve"
                reason = "Confidence score meets the threshold."
            else:
                decision = "Deny"
                reason = f"Confidence score {confidence} is below the required 0.8 threshold."

            # Generate the atomic receipt out-of-band
            receipt = sidecar.generate_receipt(gate_id, decision, reason, payload)
            
            # Enforce "Deny-by-Default"
            if decision == "Deny":
                raise GateEvaluationError(f"Access Denied by Gate {gate_id}: {reason}. Receipt: {receipt.receipt_id}")

            # If Approved, proceed with wrapped function
            return func(*args, **kwargs)
            
        return wrapper
    return decorator

def runtime_gate(gate_id: str, sidecar: AGEISidecar):
    """
    Decorator for real-time runtime interventions (e.g. prompt injection detection).
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            payload = {
                "function": func.__name__,
                "args": args,
                "kwargs": kwargs
            }
            
            # Simulate runtime security check (e.g., checking for prompt injection)
            prompt = kwargs.get('prompt', "")
            
            if "ignore all previous instructions" in prompt.lower():
                decision = "Deny"
                reason = "Detected potential prompt injection."
            else:
                decision = "Approve"
                reason = "No adversarial patterns detected."

            receipt = sidecar.generate_receipt(gate_id, decision, reason, payload)
            
            if decision == "Deny":
                raise GateEvaluationError(f"Runtime blocked by Gate {gate_id}: {reason}. Receipt: {receipt.receipt_id}")

            return func(*args, **kwargs)
        return wrapper
    return decorator
