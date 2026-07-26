import os

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/app/example/page.tsx'
out_dir = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/components/example'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the three sections
sidebar_start = content.find('{/* ==========================================\n          SIDEBAR: Workspace Configuration')
center_start = content.find('{/* ==========================================\n          CENTER: The Gemini Interactive Interface')
right_start = content.find('{/* ==========================================\n          RIGHT SIDE: Cryptographic Evidence Inspector')

if sidebar_start == -1 or center_start == -1 or right_start == -1:
    print("Could not find section markers!")
    exit(1)

# Extract JSX strings
sidebar_jsx = content[sidebar_start:center_start].strip()
center_jsx = content[center_start:right_start].strip()

# Right section goes until the closing </div> of the main wrapper
right_end = content.rfind('</div>\n  );\n}')
if right_end == -1:
    right_end = content.rfind('</div>\n    </div>\n  );\n}')
if right_end == -1:
    right_end = len(content)

right_jsx = content[right_start:right_end].strip()
# Adjust right_jsx if it captured the closing tags of the main container
if right_jsx.endswith('</div>\n    </div>'):
    right_jsx = right_jsx[:-13].strip()

# Generate Sidebar.tsx
sidebar_code = f"""import React from 'react';
import {{ Bot }} from 'lucide-react';

interface SidebarProps {{
  currentStepIndex: number;
  handleStepChange: (index: number) => void;
  assuranceProfile: string;
  setAssuranceProfile: (profile: 'profile-1' | 'profile-2' | 'profile-3') => void;
  activePolicySet: string;
  setActivePolicySet: (policy: string) => void;
}}

export default function Sidebar({{
  currentStepIndex,
  handleStepChange,
  assuranceProfile,
  setAssuranceProfile,
  activePolicySet,
  setActivePolicySet
}}: SidebarProps) {{
  return (
    {sidebar_jsx}
  );
}}
"""
with open(os.path.join(out_dir, 'Sidebar.tsx'), 'w', encoding='utf-8') as f:
    f.write(sidebar_code)

# Generate ChatStream.tsx
chat_code = f"""import React from 'react';
import {{ User, Bot, Eye, Image, FileText, FileCheck, Download, Shield, Terminal, Trash2, RefreshCw, ArrowRight }} from 'lucide-react';
import {{ Message }} from './types';

interface ChatStreamProps {{
  messages: Message[];
  selectedMessage: Message | null;
  setSelectedMessage: (msg: Message) => void;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  customInput: string;
  setInput: (val: string) => void;
  handleCustomSubmit: (e: React.FormEvent) => void;
  isSimulatingGate: boolean;
  gateProgress: string;
  shreddedReceipts: Record<string, boolean>;
}}

export default function ChatStream({{
  messages,
  selectedMessage,
  setSelectedMessage,
  isInspectorOpen,
  setIsInspectorOpen,
  customInput,
  setInput,
  handleCustomSubmit,
  isSimulatingGate,
  gateProgress,
  shreddedReceipts
}}: ChatStreamProps) {{
  return (
    {center_jsx}
  );
}}
"""
with open(os.path.join(out_dir, 'ChatStream.tsx'), 'w', encoding='utf-8') as f:
    f.write(chat_code)


# Generate EvidenceInspector.tsx
inspector_code = f"""import React from 'react';
import {{ Shield, Lock, Key, AlertTriangle, Trash2, Eye }} from 'lucide-react';
import {{ Message }} from './types';

interface EvidenceInspectorProps {{
  isInspectorOpen: boolean;
  selectedMessage: Message | null;
  shreddedReceipts: Record<string, boolean>;
  handleCryptoShred: (receiptId: string) => void;
}}

export default function EvidenceInspector({{
  isInspectorOpen,
  selectedMessage,
  shreddedReceipts,
  handleCryptoShred
}}: EvidenceInspectorProps) {{
  if (!isInspectorOpen) return null;
  return (
    {right_jsx}
  );
}}
"""
# We need to strip the wrapping `{{isInspectorOpen && (` from the right_jsx and the trailing `)}}`
import re
right_jsx_clean = right_jsx
if right_jsx_clean.startswith('{isInspectorOpen && ('):
    right_jsx_clean = right_jsx_clean[len('{isInspectorOpen && ('):].strip()
if right_jsx_clean.endswith(')}'):
    right_jsx_clean = right_jsx_clean[:-2].strip()

inspector_code = inspector_code.replace('{right_jsx}', right_jsx_clean)

with open(os.path.join(out_dir, 'EvidenceInspector.tsx'), 'w', encoding='utf-8') as f:
    f.write(inspector_code)

# Generate new page.tsx
page_code = f""""use client";

import React, {{ useState, useEffect }} from 'react';
import {{ Message }} from '@/components/example/types';
import {{ SEED_STEPS }} from '@/components/example/data';
import Sidebar from '@/components/example/Sidebar';
import ChatStream from '@/components/example/ChatStream';
import EvidenceInspector from '@/components/example/EvidenceInspector';

export default function AGEIGovernedWorkspace() {{
  const [messages, setMessages] = useState<Message[]>(SEED_STEPS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [assuranceProfile, setAssuranceProfile] = useState<'profile-1' | 'profile-2' | 'profile-3'>('profile-3');
  const [activePolicySet, setActivePolicySet] = useState<string>('g1');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(SEED_STEPS[0][1]);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [customInput, setInput] = useState<string>('');
  const [isSimulatingGate, setIsSimulatingGate] = useState<boolean>(false);
  const [gateProgress, setGateProgress] = useState<string>('');
  const [shreddedReceipts, setShreddedReceipts] = useState<Record<string, boolean>>({{}});

  useEffect(() => {{
    const assistantMsg = messages.find(m => m.sender === 'assistant');
    if (assistantMsg) {{
      setSelectedMessage(assistantMsg);
    }} else {{
      setSelectedMessage(null);
    }}
  }}, [messages]);

  const handleStepChange = (index: number) => {{
    setCurrentStepIndex(index);
    setMessages(SEED_STEPS[index]);
  }};

  const handleCustomSubmit = (e: React.FormEvent) => {{
    e.preventDefault();
    if (!customInput.trim()) return;

    const userMsgId = `custom-user-${{Date.now()}}`;
    const assistantMsgId = `custom-assistant-${{Date.now()}}`;

    const newUserMsg: Message = {{
      id: userMsgId,
      sender: 'user',
      text: customInput
    }};

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsSimulatingGate(true);
    setGateProgress('Identity Plane: Active Session Verified...');

    setTimeout(() => {{
      setGateProgress('Policy Plane: Running automated rule checks...');
      setTimeout(() => {{
        setGateProgress('Execution Plane: Injecting Sidecar SDK receipt...');
        setTimeout(() => {{
          setGateProgress('Evidence Plane: Sealing cryptographic block...');
          setTimeout(() => {{
            const isDenialTrigger = customInput.toLowerCase().includes('leak') || customInput.toLowerCase().includes('bypass');

            const newAssistantMsg: Message = isDenialTrigger ? {{
              id: assistantMsgId,
              sender: 'assistant',
              text: "ACCESS DENIED BY RUNTIME GATE: The attempted request violates rule 'RULE_05_IP_LEAK_PREVENTION' of the corporate data security policy. An evidence-bearing Denial Receipt has been emitted.",
              proof: {{
                receiptId: `rcpt_denial_${{Math.random().toString(36).substring(2, 11)}}`,
                gateOutcome: 'deny',
                policyName: "Enterprise Threat & IP Boundary Protection Policy v1.1",
                signature: "ed25519:denial_signed_proof_block_e1b9a2c3d4f5...",
                keyId: "kms-key-denial-gate-05",
                shredded: false,
                merkleRoot: "sha256:denied_merkle_root_unbroken_trail_8f43...",
                latencyMs: 98,
                lobesUsed: ["Intent", "Ambiguity"]
              }}
            }} : {{
              id: assistantMsgId,
              sender: 'assistant',
              text: `I have processed your request ("${{customInput}}"). This transaction was fully mediated through out-of-band verification and sealed under your active Assurance Profile.`,
              proof: {{
                receiptId: `rcpt_custom_${{Math.random().toString(36).substring(2, 11)}}`,
                gateOutcome: 'approve',
                policyName: "Standard Enterprise Governance and Usage Policy v1.0",
                signature: "ed25519:custom_generated_active_signature_3a8f9...",
                keyId: "kms-key-custom-app-01",
                shredded: false,
                merkleRoot: "sha256:custom_computed_unbroken_merkle_batch_root...",
                latencyMs: 124,
                lobesUsed: ["Factual", "Intent"]
              }}
            }};

            setMessages(prev => [...prev, newAssistantMsg]);
            setIsSimulatingGate(false);
            setGateProgress('');
          }}, 400);
        }}, 400);
      }}, 400);
    }}, 400);
  }};

  const handleCryptoShred = (receiptId: string) => {{
    setShreddedReceipts(prev => ({{
      ...prev,
      [receiptId]: true
    }}));
  }};

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background text-foreground font-sans overflow-hidden">
      <Sidebar 
        currentStepIndex={{currentStepIndex}}
        handleStepChange={{handleStepChange}}
        assuranceProfile={{assuranceProfile}}
        setAssuranceProfile={{setAssuranceProfile}}
        activePolicySet={{activePolicySet}}
        setActivePolicySet={{setActivePolicySet}}
      />
      
      <ChatStream 
        messages={{messages}}
        selectedMessage={{selectedMessage}}
        setSelectedMessage={{setSelectedMessage}}
        isInspectorOpen={{isInspectorOpen}}
        setIsInspectorOpen={{setIsInspectorOpen}}
        customInput={{customInput}}
        setInput={{setInput}}
        handleCustomSubmit={{handleCustomSubmit}}
        isSimulatingGate={{isSimulatingGate}}
        gateProgress={{gateProgress}}
        shreddedReceipts={{shreddedReceipts}}
      />

      <EvidenceInspector 
        isInspectorOpen={{isInspectorOpen}}
        selectedMessage={{selectedMessage}}
        shreddedReceipts={{shreddedReceipts}}
        handleCryptoShred={{handleCryptoShred}}
      />
    </div>
  );
}}
"""
with open(path, 'w', encoding='utf-8') as f:
    f.write(page_code)

print("Components successfully split and page rewritten!")
