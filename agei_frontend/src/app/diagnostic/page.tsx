'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/Card";
import { CheckCircle2, ShieldAlert, FileSearch, Cpu } from "lucide-react";

export default function IntakePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization_name: '',
    problem_statement: '',
    selected_tier: 0
  });

  const tiers = [
    {
      id: 1,
      title: "Tier 1 — Internal control visibility",
      description: "We mainly need better traceability and internal accountability for our AI systems.",
      icon: <FileSearch className="w-5 h-5" />
    },
    {
      id: 2,
      title: "Tier 2 — Regulatory audits & reporting",
      description: "We have hard regulatory or audit deadlines and must produce credible evidence packs.",
      icon: <ShieldAlert className="w-5 h-5" />
    },
    {
      id: 3,
      title: "Tier 3 — High-liability autonomous systems",
      description: "We run or plan to run autonomous/transactional agents with serious downside if they misbehave.",
      icon: <Cpu className="w-5 h-5" />
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selected_tier === 0) {
      alert('Please select a risk tier that best describes your situation.');
      return;
    }
    
    // Attempt to save to CPOS Local Storage to simulate database insertion
    try {
      const activeOrgId = localStorage.getItem('cpos_active_org_id');
      if (activeOrgId) {
        const key = `cpos_workspace_state_${activeOrgId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const state = JSON.parse(stored);
          const newDoc = {
            id: `doc-intake-${Date.now()}`,
            type: 'Intake Submission',
            title: `Intake Submission: ${formData.name}`,
            content: formData.problem_statement,
            status: 'Signed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stakeholder_ids: [],
            linked_capsule_ids: [],
            template_variables: {
              assurance_profile_target: formData.selected_tier,
              organization_name: formData.organization_name
            }
          };
          state.org_documents = [newDoc, ...(state.org_documents || [])];
          localStorage.setItem(key, JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error("Failed to save intake to local storage", error);
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-xl w-full border-accent/20 shadow-2xl shadow-accent/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-12 pb-10 px-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground">Application Received</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Thank you for your candor. Your intake responses have been securely logged and are being reviewed against our current capacity constraints.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If your risk profile aligns with our expertise and we have an open slot, our team will contact you within 48 hours to schedule a diagnostic scoping call.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Scarcity Hook Hero */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Diagnostic Intake</h1>
          <div className="max-w-2xl mx-auto">
            <blockquote className="border-l-4 border-primary pl-6 py-2 text-left italic text-xl md:text-2xl font-medium text-foreground/90">
              “Honesty is the cornerstone of this relationship. I am only taking on three clients at this time. Tell me, candidly: why should I work with you?”
            </blockquote>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Section 1: The Core Question */}
          <section className="space-y-6 bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm">
            <div>
              <label htmlFor="problem" className="block text-lg font-semibold mb-2">
                The Core Problem
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Describe, in your own words, the biggest AI risk or governance problem you are facing.
              </p>
            </div>
            <textarea
              id="problem"
              required
              rows={6}
              value={formData.problem_statement}
              onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
              className="w-full bg-background border border-input rounded-lg p-4 text-sm leading-relaxed focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
              placeholder="Be as specific and candid as possible. What keeps you up at night?"
            />
          </section>

          {/* Section 2: Self-Selection Tier */}
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Risk Profile Triage</h2>
              <p className="text-sm text-muted-foreground">
                Which of the following statements most accurately reflects your current situation?
              </p>
            </div>
            
            <div className="space-y-4">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, selected_tier: tier.id })}
                  className={`w-full flex items-start p-5 rounded-xl border text-left transition-all duration-200 ${
                    formData.selected_tier === tier.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className={`mt-1 mr-4 flex-shrink-0 ${formData.selected_tier === tier.id ? "text-primary" : "text-muted-foreground"}`}>
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${formData.selected_tier === tier.id ? "text-foreground" : "text-foreground/80"}`}>
                      {tier.title}
                    </h3>
                    <p className={`text-sm ${formData.selected_tier === tier.id ? "text-foreground/90" : "text-muted-foreground"}`}>
                      "{tier.description}"
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ml-4 flex-shrink-0 flex items-center justify-center mt-2 ${
                    formData.selected_tier === tier.id ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {formData.selected_tier === tier.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Contact Details */}
          <section className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm space-y-6">
            <h2 className="text-lg font-semibold mb-2">Principal Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <input
                  required
                  type="text"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  className="w-full bg-background border border-input rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-input rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-background border border-input rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-background border border-input rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity w-full md:w-auto"
            >
              Submit Application
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
