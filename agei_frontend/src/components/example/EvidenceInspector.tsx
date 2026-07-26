import React from 'react';
import { Shield, Lock, Key, AlertTriangle, Trash2, Eye } from 'lucide-react';
import { Message } from './types';

interface EvidenceInspectorProps {
  isInspectorOpen: boolean;
  selectedMessage: Message | null;
  shreddedReceipts: Record<string, boolean>;
  handleCryptoShred: (receiptId: string) => void;
}

export default function EvidenceInspector({
  isInspectorOpen,
  selectedMessage,
  shreddedReceipts,
  handleCryptoShred
}: EvidenceInspectorProps) {
  if (!isInspectorOpen) return null;
  return (
    <>
    {/* ==========================================
          RIGHT SIDE: Cryptographic Evidence Inspector
          ========================================== */}
      
        <div className="w-[450px] border-l border-border bg-card flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-border px-4 flex items-center gap-2 bg-muted">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Cryptographic Inspector</h3>
              <p className="text-[10px] text-muted-foreground font-mono">Proof Context Audit Engine</p>
            </div>
          </div>

          {/* Active Evidence View */}
          {selectedMessage && selectedMessage.proof ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              {/* Section 1: Gate Evaluation Summary */}
              <div className="bg-muted p-4 rounded-xl border border-border space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-xs font-bold text-foreground">Gate Evaluation</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedMessage.proof.gateOutcome === 'approve'
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-destructive/30 bg-destructive/10 text-destructive'
                  }`}>
                    {selectedMessage.proof.gateOutcome.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Policy Sets Enforced</span>
                    <span className="text-foreground text-right max-w-[200px] truncate">{selectedMessage.proof.policyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evaluation Latency</span>
                    <span className="text-primary font-mono font-bold">{selectedMessage.proof.latencyMs} ms</span>
                  </div>
                </div>
              </div>



              {/* Section 3: Cascading Delegation Chain (Gap 2 Visualizer) */}
              {selectedMessage.proof.delegationChain && (
                <div className="bg-muted p-4 rounded-xl border border-border space-y-3">
                  <span className="text-xs font-bold text-foreground block border-b border-border pb-2">
                    Delegation Chain Integrity (CTE Verification)
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Recursive common table expression successfully traversed authority up to Root principal:
                  </p>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary/60">
                    {selectedMessage.proof.delegationChain.map((node, i) => (
                      <div key={i} className="flex gap-3 pl-1 text-[11px] relative">
                        <div className="w-6 h-6 rounded-full bg-muted border border-secondary/40 flex items-center justify-center shrink-0 z-10 text-primary font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 bg-muted p-2 rounded border border-border">
                          <div className="font-semibold text-foreground">{node.actor}</div>
                          <div className="text-[10px] text-muted-foreground">{node.role} • {node.authority}</div>
                          <code className="block text-[9px] text-secondary font-mono truncate mt-1 bg-muted p-1 rounded">
                            {node.signature}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Signed Event Receipt (RFC 8785) */}
              <div className="bg-muted p-4 rounded-xl border border-border space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-xs font-bold text-foreground">Signed Event Receipt</span>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold mb-1">
                      Receipt UUID
                    </span>
                    <code className="block text-[10px] text-primary bg-muted border border-border p-2 rounded font-mono truncate">
                      {selectedMessage.proof.receiptId}
                    </code>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold mb-1">
                      KMS Signature Algorithm & Key Fingerprint
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground font-mono bg-muted p-2 border border-border rounded">
                      <Key className="h-3 w-3 text-primary" />
                      <span>{selectedMessage.proof.keyId} (Ed25519)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold mb-1">
                      Decrypted Receipt Content Payload
                    </span>
                    <div className="bg-muted border border-border p-3 rounded font-mono text-[9px] text-foreground overflow-x-auto select-all max-h-48 scrollbar-thin">
                      {shreddedReceipts[selectedMessage.proof.receiptId] ? (
                        <div className="text-destructive font-bold space-y-2 py-4 text-center">
                          <AlertTriangle className="h-6 w-6 mx-auto mb-1 animate-bounce" />
                          <p>[CRYPTOGRAPHICALLY SHREDDED]</p>
                          <p className="text-[8px] font-normal text-muted-foreground leading-normal">
                            decryption_key_status = "destroyed"<br />
                            Raw text is now irreversibly unrecoverable.<br />
                            Outer ledger signatures and Merkle link indices remain valid.
                          </p>
                        </div>
                      ) : (
                        <pre className="whitespace-pre">{JSON.stringify({
                          "receipt_id": selectedMessage.proof.receiptId,
                          "timestamp": "2026-07-25T05:40:02Z",
                          "canonicalization_version": "agei-json-v1",
                          "auth_delegation_path": selectedMessage.proof.delegationChain ? "Recursively Verified" : "Human Direct",
                          "personal_data_encrypted": true,
                          "symmetric_key_ref": `env-key-ref-${selectedMessage.proof.receiptId.substring(5, 12)}`,
                          "payload_digest": selectedMessage.proof.merkleRoot,
                          "out-of-band-sidecar-signed": selectedMessage.proof.signature
                        }, null, 2)}</pre>
                      )}
                    </div>
                  </div>

                  {/* GDPR Right to be Forgotten Interactive Action */}
                  <div className="pt-2 border-t border-border">
                    {shreddedReceipts[selectedMessage.proof.receiptId] ? (
                      <div className="bg-destructive/5 border border-destructive/30 p-2.5 rounded-lg text-[10px] text-destructive leading-relaxed">
                        <span className="font-bold block mb-0.5 text-destructive">✓ Article 17 Erasure Enforced:</span>
                        We have shredded the symmetric decryption key stored inside <code>public.subject_encryption_keys</code>. The ledger continues to mathematically prove transaction process integrity to auditors, but personal data is gone forever.
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCryptoShred(selectedMessage.proof!.receiptId)}
                        className="w-full py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/50 text-destructive rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Trigger GDPR Article 17 Crypto-Shred
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Merkle Tree Batch Integrity */}
              <div className="bg-muted p-4 rounded-xl border border-border space-y-3">
                <span className="text-xs font-bold text-foreground block border-b border-border pb-2">
                  Merkle Tree Block Attachment
                </span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold mb-1">
                      Active Merkle Root Hash
                    </span>
                    <code className="block text-[10px] text-primary bg-muted border border-border p-2 rounded font-mono truncate">
                      {selectedMessage.proof.merkleRoot}
                    </code>
                  </div>
                  {selectedMessage.proof.preWatermarkHash && selectedMessage.proof.postWatermarkHash && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="text-[10px] text-warning font-bold uppercase tracking-wider block">
                        Dual-State Hashes (Provenance)
                      </span>
                      <div className="space-y-1.5 text-[9px] font-mono">
                        <div className="bg-muted p-2 rounded border border-border">
                          <span className="text-muted-foreground block mb-0.5 uppercase text-[8px] font-semibold">Pre-Watermark Hash:</span>
                          <span className="text-foreground truncate block">{selectedMessage.proof.preWatermarkHash}</span>
                        </div>
                        <div className="bg-muted p-2 rounded border border-border">
                          <span className="text-muted-foreground block mb-0.5 uppercase text-[8px] font-semibold">Post-Watermark Hash:</span>
                          <span className="text-foreground truncate block">{selectedMessage.proof.postWatermarkHash}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-muted p-2.5 rounded text-[10px] text-muted-foreground border border-border leading-normal">
                    This block has been anchored to WORM storage with Daily KMS signing, preventing retroactive database tampering by local host admins.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-2">
              <Eye className="h-8 w-8 text-muted-foreground animate-pulse" />
              <div>
                <p className="text-xs font-bold text-muted-foreground">Select an Assistant Response</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal max-w-[240px]">
                  Click the 'Inspect Receipt' button on any assistant response message to inspect its dynamic 5-plane AGEI proof.
                </p>
              </div>
            </div>
          )}
        </div>
    </>
  );
}
