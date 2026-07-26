export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  attachment?: {
    type: 'image' | 'document';
    name: string;
    size?: string;
  };
  docCreated?: {
    title: string;
    type: string;
    size: string;
  };
  proof?: {
    receiptId: string;
    gateOutcome: 'approve' | 'deny' | 'escalate';
    policyName: string;
    signature: string;
    keyId: string;
    shredded: boolean;
    merkleRoot: string;
    preWatermarkHash?: string;
    postWatermarkHash?: string;
    latencyMs: number;
    lobesUsed: string[];
    delegationChain?: {
      actor: string;
      role: string;
      authority: string;
      signature: string;
    }[];
  };
}

