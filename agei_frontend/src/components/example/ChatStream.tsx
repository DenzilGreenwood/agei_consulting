import React from 'react';
import { User, Bot, Eye, Image, FileText, FileCheck, Download, Shield, Terminal, Trash2, RefreshCw, ArrowRight } from 'lucide-react';
import { Message } from './types';

interface ChatStreamProps {
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
}

export default function ChatStream({
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
}: ChatStreamProps) {
  return (
    <>
    {/* ==========================================
          CENTER: The Gemini Interactive Interface
          ========================================== */}
      <div className="flex-1 flex flex-col justify-between bg-background">
        {/* Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              Active Session:
              <span className="font-mono text-xs bg-muted border border-border px-2 py-0.5 rounded text-primary">
                ses_sess_94bc-a82f3
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isInspectorOpen
                  ? 'bg-muted border-primary/50 text-primary shadow'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Terminal className="h-4 w-4" />
              {isInspectorOpen ? 'Hide Evidence Panel' : 'Show Evidence Panel'}
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-4 p-4 rounded-xl transition-all border ${
                  msg.sender === 'user'
                    ? 'bg-card border-border shadow-sm'
                    : 'bg-muted border-border'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-lg h-9 w-9 flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-muted border border-border text-foreground'
                    : 'bg-gradient-to-tr from-primary to-secondary text-primary-foreground'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Body */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {msg.sender === 'user' ? 'You' : 'CognitiveInsight Assistant'}
                    </span>
                    {msg.sender === 'assistant' && msg.proof && (
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                          selectedMessage?.id === msg.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-border'
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        Inspect Receipt
                      </button>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-foreground">
                    {msg.text}
                  </p>

                  {/* Render Mock Uploads */}
                  {msg.attachment && (
                    <div className="flex items-center gap-3 bg-muted p-2.5 rounded-lg border border-border max-w-sm">
                      {msg.attachment.type === 'image' ? <Image className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{msg.attachment.name}</p>
                        {msg.attachment.size && <span className="text-[10px] text-muted-foreground">{msg.attachment.size}</span>}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-success border border-success/60 bg-success/5 px-2 py-0.5 rounded">
                        Hashed
                      </span>
                    </div>
                  )}

                  {/* Render Created Documents */}
                  {msg.docCreated && (
                    <div className="flex items-center gap-3 bg-muted p-3 rounded-lg border border-secondary/60 max-w-md">
                      <FileCheck className="h-6 w-6 text-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{msg.docCreated.title}</p>
                        <span className="text-[10px] text-muted-foreground">{msg.docCreated.type} • {msg.docCreated.size}</span>
                      </div>
                      <button className="flex items-center gap-1 text-[10px] font-bold text-secondary hover:text-secondary border border-secondary px-2.5 py-1.5 rounded transition-all bg-secondary/5 hover:bg-secondary/10">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  )}

                  {/* AGEI Context Footprint Badge */}
                  {msg.sender === 'assistant' && msg.proof && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                        msg.proof.gateOutcome === 'approve'
                          ? 'border-success/40 bg-success/5 text-success'
                          : 'border-destructive/40 bg-destructive/5 text-destructive'
                      }`}>
                        <Shield className="h-3.5 w-3.5" />
                        Outcome: {msg.proof.gateOutcome.toUpperCase()}
                      </div>

                      <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-secondary/30 bg-secondary/5 text-secondary flex items-center gap-1">
                        <Terminal className="h-3 w-3" />
                        Receipt Locked
                      </div>

                      {shreddedReceipts[msg.proof.receiptId] && (
                        <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          GDPR Key Shredded
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Custom Interactive Gate Simulation overlay */}
            {isSimulatingGate && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border animate-pulse max-w-xl mx-auto">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">AGEI Out-of-Band Validation Running...</p>
                  <p className="text-[11px] text-primary mt-0.5 font-mono">{gateProgress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={handleCustomSubmit} className="max-w-3xl mx-auto flex items-center gap-3 bg-muted p-2.5 rounded-xl border border-border">
            <div className="flex gap-1 border-r border-border pr-2">
              <button
                type="button"
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                title="Mock Image Upload"
              >
                <Image className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                title="Mock Document Upload"
              >
                <FileText className="h-4.5 w-4.5" />
              </button>
            </div>

            <input
              type="text"
              value={customInput}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything... (type 'leak' or 'bypass' to simulate safety triggers)"
              className="flex-1 bg-transparent text-sm text-foreground placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-tr from-primary to-secondary hover:from-primary hover:to-secondary text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all shrink-0"
            >
              Generate
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="max-w-3xl mx-auto flex justify-between items-center px-2.5 mt-2">
            <span className="text-[10px] text-muted-foreground">
              💡 Formulates metadata hashes natively inside your sidecar runtime before submitting queries.
            </span>
            <span className="text-[10px] font-mono text-primary/80">
              Out-of-band latency: &lt;1.5ms
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
