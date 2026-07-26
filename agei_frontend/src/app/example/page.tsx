"use client";

import React, { useState, useEffect } from 'react';
import { Message } from '@/components/example/types';
import { SEED_STEPS } from '@/components/example/data';
import Sidebar from '@/components/example/Sidebar';
import ChatStream from '@/components/example/ChatStream';
import EvidenceInspector from '@/components/example/EvidenceInspector';

export default function AGEIGovernedWorkspace() {
  const [messages, setMessages] = useState<Message[]>(SEED_STEPS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [assuranceProfile, setAssuranceProfile] = useState<'profile-1' | 'profile-2' | 'profile-3'>('profile-3');
  const [activePolicySet, setActivePolicySet] = useState<string>('g1');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(SEED_STEPS[0][1]);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [customInput, setInput] = useState<string>('');
  const [isSimulatingGate, setIsSimulatingGate] = useState<boolean>(false);
  const [gateProgress, setGateProgress] = useState<string>('');
  const [shreddedReceipts, setShreddedReceipts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const assistantMsg = messages.find(m => m.sender === 'assistant');
    if (assistantMsg) {
      setSelectedMessage(assistantMsg);
    } else {
      setSelectedMessage(null);
    }
  }, [messages]);

  const handleStepChange = (index: number) => {
    setCurrentStepIndex(index);
    setMessages(SEED_STEPS[index]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const userMsgId = `custom-user-${Date.now()}`;
    const assistantMsgId = `custom-assistant-${Date.now()}`;

    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: customInput
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsSimulatingGate(true);
    setGateProgress('Identity Plane: Active Session Verified...');

    setTimeout(() => {
      setGateProgress('Policy Plane: Running automated rule checks...');
      setTimeout(() => {
        setGateProgress('Execution Plane: Injecting Sidecar SDK receipt...');
        setTimeout(() => {
          setGateProgress('Evidence Plane: Sealing cryptographic block...');
          setTimeout(() => {
            const isDenialTrigger = customInput.toLowerCase().includes('leak') || customInput.toLowerCase().includes('bypass');

            const newAssistantMsg: Message = isDenialTrigger ? {
              id: assistantMsgId,
              sender: 'assistant',
              text: "ACCESS DENIED BY RUNTIME GATE: The attempted request violates rule 'RULE_05_IP_LEAK_PREVENTION' of the corporate data security policy. An evidence-bearing Denial Receipt has been emitted.",
              proof: {
                receiptId: `rcpt_denial_${Math.random().toString(36).substring(2, 11)}`,
                gateOutcome: 'deny',
                policyName: "Enterprise Threat & IP Boundary Protection Policy v1.1",
                signature: "ed25519:denial_signed_proof_block_e1b9a2c3d4f5...",
                keyId: "kms-key-denial-gate-05",
                shredded: false,
                merkleRoot: "sha256:denied_merkle_root_unbroken_trail_8f43...",
                latencyMs: 98,
                lobesUsed: ["Intent", "Ambiguity"]
              }
            } : {
              id: assistantMsgId,
              sender: 'assistant',
              text: `I have processed your request ("${customInput}"). This transaction was fully mediated through out-of-band verification and sealed under your active Assurance Profile.`,
              proof: {
                receiptId: `rcpt_custom_${Math.random().toString(36).substring(2, 11)}`,
                gateOutcome: 'approve',
                policyName: "Standard Enterprise Governance and Usage Policy v1.0",
                signature: "ed25519:custom_generated_active_signature_3a8f9...",
                keyId: "kms-key-custom-app-01",
                shredded: false,
                merkleRoot: "sha256:custom_computed_unbroken_merkle_batch_root...",
                latencyMs: 124,
                lobesUsed: ["Factual", "Intent"]
              }
            };

            setMessages(prev => [...prev, newAssistantMsg]);
            setIsSimulatingGate(false);
            setGateProgress('');
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  const handleCryptoShred = (receiptId: string) => {
    setShreddedReceipts(prev => ({
      ...prev,
      [receiptId]: true
    }));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background text-foreground font-sans overflow-hidden">
      <Sidebar 
        currentStepIndex={currentStepIndex}
        handleStepChange={handleStepChange}
        assuranceProfile={assuranceProfile}
        setAssuranceProfile={setAssuranceProfile}
        activePolicySet={activePolicySet}
        setActivePolicySet={setActivePolicySet}
      />
      
      <ChatStream 
        messages={messages}
        selectedMessage={selectedMessage}
        setSelectedMessage={setSelectedMessage}
        isInspectorOpen={isInspectorOpen}
        setIsInspectorOpen={setIsInspectorOpen}
        customInput={customInput}
        setInput={setInput}
        handleCustomSubmit={handleCustomSubmit}
        isSimulatingGate={isSimulatingGate}
        gateProgress={gateProgress}
        shreddedReceipts={shreddedReceipts}
      />

      <EvidenceInspector 
        isInspectorOpen={isInspectorOpen}
        selectedMessage={selectedMessage}
        shreddedReceipts={shreddedReceipts}
        handleCryptoShred={handleCryptoShred}
      />
    </div>
  );
}
