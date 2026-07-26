"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const avatars = [
  {
    id: "elena",
    icon: "🏛️",
    name: "Elena Rostova, Chief Risk Officer (CRO)",
    quote: "“I’m tired of paying millions for static PDF policies that developers ignore. I need evidence that our AI controls align with the EU AI Act and ISO 42001.”",
    solution: "Solution: Policy-to-Gate Translation & Merkle Audit Packs",
    problem: "Traditional governance programs rely heavily on static policies, manual interviews, and retrospective reporting. That creates friction for risk teams and makes it harder to demonstrate how controls operate in practice.",
    operationalValue: [
      "Reduce manual audit preparation by consolidating evidence into sealed, repeatable audit packs.",
      "Translate policy requirements into machine-evaluable gates that can be applied consistently at runtime.",
      "Improve alignment between executive intent, technical enforcement, and audit review."
    ],
    punchline: "“We help you move from policy documents to machine-verifiable controls, so your risk team can spend less time assembling evidence and more time improving governance.”"
  },
  {
    id: "marcus",
    icon: "🛡️",
    name: "Marcus Vance, Chief Information Security Officer (CISO)",
    quote: "“Our developers are deploying autonomous tool-using agents, and employees are pasting confidential code into public models. I need to secure our perimeter.”",
    solution: "Solution: Five Planes Framework & Shadow AI Registry",
    problem: "Security teams are managing two fast-moving risks at once: unmanaged AI usage outside approved channels and agentic systems that may exercise authority beyond their intended boundaries.",
    operationalValue: [
      "Improve visibility into unmanaged AI activity using purpose-limited discovery telemetry.",
      "Reduce exposure by routing risky usage into sanctioned internal alternatives.",
      "Enforce policy checks before sensitive tool actions are executed by autonomous systems."
    ],
    punchline: "“We help you see where AI is being used, understand the risk, and put controls around both shadow usage and agentic execution.”"
  },
  {
    id: "aris",
    icon: "⚙️",
    name: "Dr. Aris Thorne, Head of AI Engineering",
    quote: "“Governance cannot slow our inference pipelines or bloat cloud storage with terabytes of raw prompt logs.”",
    solution: "Solution: Out-of-band Sidecar SDK & Lazy Capsule Materialization (LCM)",
    problem: "Engineering teams need governance controls that preserve system performance and avoid unnecessary data growth.",
    operationalValue: [
      "Capture lightweight metadata continuously without forcing heavy payload retention.",
      "Materialize full evidence only when a policy event, alert, or audit request justifies it.",
      "Keep governance overhead low while preserving verifiable records for review."
    ],
    punchline: "“We add governance without turning your inference stack into a logging bottleneck.”"
  },
  {
    id: "sarah",
    icon: "⚖️",
    name: "Sarah Jenkins, General Counsel (GC)",
    quote: "“If we release an AI-generated report, metadata stripping or malicious cropping could break our chain of custody. We need dispute-ready defensibility.”",
    solution: "Solution: Dual-State Hashing & Forensic Fingerprinting",
    problem: "Once AI-generated outputs leave the controlled environment, metadata may be stripped and visual or textual attribution can become harder to prove.",
    operationalValue: [
      "Preserve stronger provenance for distributed artifacts.",
      "Support dispute review with layered evidence that can survive copying, cropping, and format changes.",
      "Strengthen legal and operational confidence in high-stakes AI outputs."
    ],
    punchline: "“We help you preserve provenance and chain-of-custody evidence even after AI-generated content leaves your internal systems.”"
  }
];

export function AvatarCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % avatars.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + avatars.length) % avatars.length);
  };

  const current = avatars[currentIndex];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Carousel Container */}
      <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm transition-all duration-300">
        <div className="bg-muted/50 p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{current.icon}</span>
            <h4 className="font-semibold text-xl text-primary">{current.name}</h4>
          </div>
          <p className="text-muted-foreground italic text-lg mb-4">{current.quote}</p>
          <div className="text-sm font-bold bg-primary text-primary-foreground inline-block px-3 py-1 rounded">
            {current.solution}
          </div>
        </div>
        <div className="p-6 space-y-6 md:min-h-[380px]">
          <div>
            <h5 className="font-bold text-foreground mb-2">The Problem</h5>
            <p className="text-muted-foreground text-sm leading-relaxed">{current.problem}</p>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-2">The Operational Value</h5>
            <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-muted-foreground">
              {current.operationalValue.map((val, i) => (
                <li key={i}>{val}</li>
              ))}
            </ul>
          </div>
          <div className="bg-primary/5 p-4 rounded-md border-l-4 border-primary">
            <p className="font-semibold text-foreground text-sm italic leading-relaxed">{current.punchline}</p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-6 px-2">
        <div className="flex gap-2">
          {avatars.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex ? "bg-primary" : "bg-border hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-border bg-background hover:bg-muted text-foreground transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-full border border-border bg-background hover:bg-muted text-foreground transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
