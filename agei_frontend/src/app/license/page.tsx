import React from 'react';
import { ShieldCheck, Scale, FileText, CheckCircle2, XCircle, Info, Landmark, Key, Server, Mail, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'License | CognitiveInsight.ai',
  description: 'Business Source License 1.1 (BUSL-1.1) and usage terms for AGEI, CIAF, and LCM.',
};

export default function LicensePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[calc(100vh-4rem)] text-foreground">
      
      {/* Header */}
      <div className="mb-12 border-b border-border pb-8 text-center md:text-left">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
          <Scale className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Business Source License 1.1
        </h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-3xl leading-relaxed">
          This project is licensed under the Business Source License 1.1 (BUSL-1.1), adapted for the CIAF + LCM framework with specific terms appropriate for AI governance software, cryptographic audit systems, and agent execution boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Terms */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Terms</h2>
            </div>
            <div className="prose prose-sm dark:prose-invert text-muted-foreground leading-relaxed max-w-none">
              <p>The Licensor hereby grants you the right to copy, modify, create derivative works, redistribute, and make non-production use of the Licensed Work.</p>
              <p>The Licensor may make an Additional Use Grant, below, permitting limited production use.</p>
              <p>Effective on the Change Date, or the fourth anniversary of the first publicly available distribution of a specific version of the Licensed Work under this License, whichever comes first, the Licensor hereby grants you rights under the terms of the Change License, and the rights granted in the paragraph above terminate.</p>
              <p>If your use of the Licensed Work does not comply with the requirements currently in effect as described in this License, you must purchase a commercial license from the Licensor, its affiliated entities, or authorized resellers, or you must refrain from using the Licensed Work.</p>
              <p>All copies of the original and modified Licensed Work, and derivative works of the Licensed Work, are subject to this License. This License applies separately for each version of the Licensed Work and the Change Date may vary for each version of the Licensed Work released by Licensor.</p>
              <p>You must conspicuously display this License on each original or modified copy of the Licensed Work. If you receive the Licensed Work in original or modified form from a third party, the terms and conditions set forth in this License apply to your use of that work.</p>
              <p>Any use of the Licensed Work in violation of this License will automatically terminate your rights under this License for the current and all other versions of the Licensed Work.</p>
              <p>This License does not grant you any right in any trademark or logo of Licensor or its affiliates (provided that you may use a trademark or logo of Licensor as expressly required by this License).</p>
              
              <div className="bg-muted p-4 rounded-lg mt-6 border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                TO THE EXTENT PERMITTED BY APPLICABLE LAW, THE LICENSED WORK IS PROVIDED ON AN "AS IS" BASIS. LICENSOR HEREBY DISCLAIMS ALL WARRANTIES AND CONDITIONS, EXPRESS OR IMPLIED, INCLUDING (WITHOUT LIMITATION) WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND TITLE.
              </div>
            </div>
          </section>

          {/* Additional Use Grant (Allowed Uses) */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <h2 className="text-2xl font-bold">Additional Use Grant</h2>
            </div>
            <p className="text-muted-foreground mb-6">You may use the Licensed Work for the following purposes without obtaining a commercial license:</p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-success/30 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Landmark className="h-4 w-4 text-success" /> 1. Non-Commercial Research</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Academic research and educational purposes</li>
                  <li>Non-commercial evaluation and proof-of-concept development</li>
                  <li>Learning and training within educational institutions</li>
                </ul>
              </div>
              <div className="bg-card border border-success/30 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Server className="h-4 w-4 text-success" /> 2. Internal Evaluation</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Internal business evaluation and testing for up to 90 days per organization</li>
                  <li>Performance benchmarking for internal purposes</li>
                  <li>Security testing and vulnerability disclosure</li>
                </ul>
              </div>
              <div className="bg-card border border-success/30 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><ShieldCheck className="h-4 w-4 text-success" /> 3. Personal Use</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Personal, non-commercial use and experimentation</li>
                  <li>Hobby projects and personal research</li>
                </ul>
              </div>
              <div className="bg-card border border-success/30 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-foreground"><Key className="h-4 w-4 text-success" /> 4. Open Source Contributions</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Contributing improvements back to the Licensed Work under the same BUSL-1.1 license terms</li>
                  <li>Participating in the development community</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-bold">Prohibited Uses Without Commercial License</h2>
            </div>
            <p className="text-muted-foreground mb-6">You may <strong>NOT</strong> use the Licensed Work for the following without obtaining a commercial license from <a href="mailto:founder@cognitiveinsight.ai" className="text-primary hover:underline">founder@cognitiveinsight.ai</a>:</p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">1. Commercial Services</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Operating any commercial service, product, or application that incorporates the Licensed Work</li>
                  <li>Offering commercial support, consulting, or implementation services based on the Licensed Work</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">2. SaaS/Hosted Services</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Offering the Licensed Work as a service or hosted solution to third parties</li>
                  <li>Operating a managed service based on the Licensed Work</li>
                  <li>Cloud-hosted deployments for commercial purposes</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">3. Revenue Generation</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Using the Licensed Work to directly or indirectly generate revenue</li>
                  <li>Consulting services, implementation services, or support services for fees</li>
                  <li>Bundling with paid offerings or revenue-sharing models</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">4. Competitive Products</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Creating or distributing a product that directly competes with CIAF or LCM frameworks</li>
                  <li>Using the Licensed Work to build competing AI governance or audit solutions</li>
                  <li>Developing alternative implementations that directly substitute for the Licensed Work</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">5. Circumvention and Tampering</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Attempting to circumvent, disable, or modify the cryptographic receipt mechanisms</li>
                  <li>Tampering with LCM anchoring systems or audit trail functionality</li>
                  <li>Removing or disabling security, verification, or audit features</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">6. Production Deployments</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Any production use in commercial environments beyond the 90-day evaluation period</li>
                  <li>Scaling beyond internal evaluation limits for commercial purposes</li>
                </ul>
              </div>
              <div className="sm:col-span-2 bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-foreground text-sm">7. White-Label Solutions</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Rebranding or white-labeling the Licensed Work for commercial distribution</li>
                  <li>Removing attribution or obscuring the origin of the Licensed Work in commercial offerings</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Defensive Publication Notice */}
          <section className="bg-muted p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Defensive Publication Notice</h2>
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>This Licensed Work serves as a defensive publication establishing prior art for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The CIAF (Cognitive Insight Audit Framework) for agent execution control</li>
                <li>Lazy Capsule Materialization (LCM) process for verifiable evidence</li>
                <li>Cryptographic audit structures and chain-of-custody mechanisms</li>
                <li>Identity and authorization models for autonomous agents</li>
                <li>PAM (Privileged Access Management) for AI systems</li>
                <li>Tamper-evident receipt and verification systems</li>
              </ul>
              <p>The cryptographic audit structures, anchor derivation methods, and evidence materialization techniques described herein are published to prevent proprietary capture and establish public prior art.</p>
              <p>No patent claims are asserted by the Licensor, and this License does not grant any patent rights beyond those necessary to use the Licensed Work in accordance with the terms of this License.</p>
              <p>Technical documentation and specifications referenced as part of this defensive publication include: Complete architectural documentation in <code>/docs</code>, Implementation in this repository, API Reference and design specifications, Evidence and cryptographic receipt structures.</p>
            </div>
          </section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Parameters Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Info className="h-5 w-5 text-primary" />
              Parameters
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Licensor</span>
                <span className="font-medium text-foreground">Denzil James Greenwood / CognitiveInsight.ai</span>
              </div>
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Licensed Work</span>
                <span className="font-medium text-foreground">AGEI - AI Governance Evidence Infrastructure, CIAF - Cognitive Insight Audit Framework + LCM - Lazy Capsule Materialization</span>
              </div>
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Copyright</span>
                <span className="font-medium text-foreground">© 2026 Denzil James Greenwood</span>
              </div>
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Repository</span>
                <a href="https://github.com/DenzilGreenwood/agei_consulting.git" className="font-medium text-primary hover:underline break-all">https://github.com/DenzilGreenwood/agei_consulting.git</a>
              </div>
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Change Date</span>
                <span className="font-medium text-foreground">January 1, 2029</span>
              </div>
              <div>
                <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider mb-1">Change License</span>
                <span className="font-medium text-foreground">Apache License 2.0</span>
              </div>
            </div>
          </div>

          {/* Commercial Licensing */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-3 border-b border-primary/10 pb-2">Commercial Licensing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For commercial use, production deployments, or any use case not covered by the Additional Use Grant, you must obtain a commercial license.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 mb-4 list-disc list-inside">
              <li>Full commercial usage rights</li>
              <li>Production deployment rights and scalability</li>
              <li>Priority support and SLAs</li>
              <li>Security patch priority access</li>
              <li>Integration & implementation support</li>
              <li>Legal indemnification for approved use cases</li>
            </ul>
            <a href="mailto:founder@cognitiveinsight.ai" className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors text-sm shadow-md shadow-primary/20">
              Request Commercial License
            </a>
          </div>

          {/* Trademarks & Attribution */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">Trademarks & Attribution</h3>
            <div className="text-xs text-muted-foreground space-y-3">
              <p>"Cognitive Insight™" and "LCM™" (Lazy Capsule Materialization) are trademarks of Denzil James Greenwood.</p>
              <p>This License does not grant permission to use these trademarks except as required for attribution.</p>
              <div>
                <strong className="text-foreground">Required Attribution:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>This License file (LICENSE.md)</li>
                  <li>Copyright notice: © 2026 Denzil James Greenwood</li>
                  <li>Reference to CognitiveInsight.ai</li>
                  <li>Trademark notices for Cognitive Insight™ and LCM™</li>
                  <li>Clear indication of any modifications made</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Contacts */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Support
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <a href="mailto:founder@cognitiveinsight.ai" className="block hover:text-primary transition-colors">Licensing: founder@cognitiveinsight.ai</a>
              <a href="mailto:founder@cognitiveinsight.ai" className="block hover:text-primary transition-colors">Technical: founder@cognitiveinsight.ai</a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
