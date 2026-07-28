'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';
import { useSetup } from '@/lib/setup/SetupContext';
import { OrganizationDocument } from '@/lib/workspace/types';
import { 
  Phone, User, ShieldAlert, Cpu, FileSearch, AlertTriangle, 
  Target, Plus, BookOpen, DollarSign, CheckCircle2, Shield, Building2,
  ArrowLeft, ListFilter, Clock, X
} from 'lucide-react';
import { Card, CardContent } from "@/components/Card";

export default function DiscoveryPage() {
  const { state, addStakeholder, addJournal, updateOrgDocument } = useWorkspace();
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);

  // 1. Fetch Intake Submissions
  const intakeDocs = (state.org_documents || [])
    .filter(d => d.type === 'Intake Submission')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (selectedIntakeId) {
    const activeIntake = intakeDocs.find(d => d.id === selectedIntakeId);
    if (!activeIntake) {
      setSelectedIntakeId(null);
      return null;
    }
    return (
      <ActiveConsoleView 
        activeIntake={activeIntake} 
        onBack={() => setSelectedIntakeId(null)}
        updateOrgDocument={updateOrgDocument}
        addStakeholder={addStakeholder}
        addJournal={addJournal}
      />
    );
  }

  return (
    <PipelineView 
      intakeDocs={intakeDocs} 
      onSelect={setSelectedIntakeId}
      updateOrgDocument={updateOrgDocument}
    />
  );
}

// ----------------------------------------------------------------------------
// PIPELINE VIEW
// ----------------------------------------------------------------------------
function PipelineView({ 
  intakeDocs, 
  onSelect,
  updateOrgDocument
}: { 
  intakeDocs: OrganizationDocument[], 
  onSelect: (id: string) => void,
  updateOrgDocument: (doc: OrganizationDocument) => void
}) {
  const { state: setupState } = useSetup();
  const slaHours = setupState.settings?.sla_hours || 1;
  const [dismissedSla, setDismissedSla] = useState(false);

  const handleStatusChange = (doc: OrganizationDocument, newStatus: string) => {
    updateOrgDocument({
      ...doc,
      template_variables: {
        ...doc.template_variables,
        pipeline_status: newStatus as any
      }
    });
  };

  const calculateBantScore = (bant: any) => {
    let score = 0;
    if (bant?.budget_status) score++;
    if (bant?.primary_decision_maker_name) score++;
    if (bant?.impact_if_unsolved) score++;
    if (bant?.trigger_event) score++;
    return score;
  };

  // SLA Calculation (find intakes that are "New" and older than SLA hours)
  const breachedIntakes = intakeDocs.filter(doc => {
    const status = doc.template_variables?.pipeline_status || 'New';
    if (status !== 'New') return false; // Only flag un-touched intakes
    const ageInHours = (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60);
    return ageInHours >= slaHours;
  });

  return (
    <div className="p-6 h-[calc(100vh-140px)] flex flex-col relative">
      {/* SLA Notification Popup */}
      {breachedIntakes.length > 0 && !dismissedSla && (
        <div className="fixed bottom-10 left-10 z-50 animate-in slide-in-from-left-4 fade-in duration-300">
          <div className="bg-rose-500 text-white rounded-lg shadow-xl p-4 max-w-sm flex items-start gap-3 border border-rose-600">
            <div className="mt-0.5"><Clock className="w-5 h-5" /></div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">SLA Breach Warning</h4>
              <p className="text-xs text-rose-100 leading-relaxed">
                You have {breachedIntakes.length} intake{breachedIntakes.length > 1 ? 's' : ''} waiting longer than {slaHours} hour{slaHours > 1 ? 's' : ''}. Please review and respond.
              </p>
            </div>
            <button onClick={() => setDismissedSla(true)} className="text-rose-200 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Intake Pipeline</h1>
          <p className="text-muted-foreground">Manage incoming diagnostic requests and qualification</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-md text-muted-foreground">
          <ListFilter className="w-4 h-4" /> {intakeDocs.length} Total Leads
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Arrival Date</th>
                <th className="px-6 py-4 font-medium">Prospect / Organization</th>
                <th className="px-6 py-4 font-medium">Risk Tier</th>
                <th className="px-6 py-4 font-medium">BANT Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {intakeDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No intake submissions found in this workspace. Simulate one from the public form!
                  </td>
                </tr>
              ) : (
                intakeDocs.map((doc) => {
                  const prospectName = doc.title.split(': ')[1] || "Unknown";
                  const prospectOrg = doc.template_variables?.organization_name || "Unknown Org";
                  const tier = doc.template_variables?.assurance_profile_target || 1;
                  const bantScore = calculateBantScore(doc.template_variables?.bant);
                  const status = doc.template_variables?.pipeline_status || 'New';
                  
                  return (
                    <tr key={doc.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{prospectName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {prospectOrg}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tier === 1 ? 'bg-indigo-500/10 text-indigo-600' : 
                          tier === 2 ? 'bg-rose-500/10 text-rose-600' : 
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          Tier {tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${bantScore === 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {bantScore}/4
                          </span>
                          {bantScore === 4 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(doc, e.target.value)}
                          className="bg-transparent border border-input rounded text-xs px-2 py-1 outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                          <option className="bg-background text-foreground" value="New">New</option>
                          <option className="bg-background text-foreground" value="Contacted">Contacted</option>
                          <option className="bg-background text-foreground" value="Discovery Scheduled">Discovery Scheduled</option>
                          <option className="bg-background text-foreground" value="Discovery Completed">Discovery Completed</option>
                          <option className="bg-background text-foreground" value="Qualified">Qualified</option>
                          <option className="bg-background text-foreground" value="Passed">Passed</option>
                          <option className="bg-background text-foreground" value="On Hold">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onSelect(doc.id)}
                          className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                        >
                          Launch Console
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// ACTIVE CONSOLE VIEW (Detail)
// ----------------------------------------------------------------------------
function ActiveConsoleView({ 
  activeIntake, 
  onBack,
  updateOrgDocument,
  addStakeholder,
  addJournal
}: { 
  activeIntake: OrganizationDocument,
  onBack: () => void,
  updateOrgDocument: any,
  addStakeholder: any,
  addJournal: any
}) {
  const [activeStep, setActiveStep] = useState(0);

  // Global State
  const [prospectOrg, setProspectOrg] = useState(activeIntake?.template_variables?.organization_name || "");
  const [discoveryNotes, setDiscoveryNotes] = useState(activeIntake?.template_variables?.discovery_notes || "");
  const [status, setStatus] = useState(activeIntake?.template_variables?.pipeline_status || "New");

  // BANT Form State
  const initialBant = activeIntake?.template_variables?.bant || {};
  const [bant, setBant] = useState({
    budget_status: initialBant.budget_status || '',
    budget_band: initialBant.budget_band || '',
    primary_decision_maker_name: initialBant.primary_decision_maker_name || '',
    primary_decision_maker_role: initialBant.primary_decision_maker_role || '',
    procurement_required: initialBant.procurement_required || '',
    impact_if_unsolved: initialBant.impact_if_unsolved || '',
    trigger_event: initialBant.trigger_event || '',
    target_start_window: initialBant.target_start_window || ''
  });

  // Calculate BANT Score (0-4)
  let bantScore = 0;
  if (bant.budget_status) bantScore++;
  if (bant.primary_decision_maker_name) bantScore++;
  if (bant.impact_if_unsolved) bantScore++;
  if (bant.trigger_event) bantScore++;

  // Master Save Function
  const saveDiscoveryConsole = () => {
    const updatedDoc: OrganizationDocument = {
      ...activeIntake,
      template_variables: {
        ...activeIntake.template_variables,
        organization_name: prospectOrg,
        discovery_notes: discoveryNotes,
        pipeline_status: status as any,
        bant: {
          budget_status: bant.budget_status as any,
          budget_band: bant.budget_band,
          primary_decision_maker_name: bant.primary_decision_maker_name,
          primary_decision_maker_role: bant.primary_decision_maker_role,
          procurement_required: bant.procurement_required as any,
          impact_if_unsolved: bant.impact_if_unsolved,
          trigger_event: bant.trigger_event,
          target_start_window: bant.target_start_window
        }
      }
    };
    updateOrgDocument(updatedDoc);
    alert('Discovery workspace saved to Intake Document!');
  };

  const pushAuthorityToEngine = () => {
    if (!bant.primary_decision_maker_name) {
      alert("Please enter a Primary Decision Maker name first.");
      return;
    }
    addStakeholder({
      id: `sh-dm-${Date.now()}`,
      name: bant.primary_decision_maker_name,
      organization: prospectOrg || "Prospect Company",
      role_title: bant.primary_decision_maker_role || "Decision Maker",
      role_type: "Executive sponsor",
      influence_level: 'High',
      interest_level: 'High',
      primary_concerns: []
    });
    alert(`Added ${bant.primary_decision_maker_name} to Workspace Stakeholders!`);
  };

  const prospectName = activeIntake.title.split(': ')[1] || "Jane Doe";
  const prospectEmail = "prospect@company.com";
  const prospectPhone = "+1 (555) 012-3456";
  const riskTier = activeIntake.template_variables?.assurance_profile_target || 2;
  const rawNarrative = activeIntake.content;

  const highlightNarrative = (text: string) => {
    const keywords = ['audit', 'compliance', 'shadow ai', 'autonomous', 'agents', 'liability', 'regulator'];
    let highlighted = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`(${kw})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1 rounded">$1</span>');
    });
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const tierConfigMap = {
    1: {
      label: "Tier 1: Internal Control Visibility",
      icon: <FileSearch className="w-5 h-5 text-indigo-500" />,
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      packages: "Discover & Assess, Train & Enable",
      budget: "$15k - $30k (2-4 weeks)",
      persona: "VP of Engineering / IT Lead",
      urgencyPrompt: "If we did nothing and stayed with current visibility, what's the most likely bad outcome?"
    },
    2: {
      label: "Tier 2: Regulatory Audits & Reporting",
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      packages: "Discover & Assess + Design & Align",
      budget: "$40k - $80k (6-8 weeks)",
      persona: "Chief Risk Officer / General Counsel",
      urgencyPrompt: "What happens if you cannot produce credible evidence for the upcoming audit?"
    },
    3: {
      label: "Tier 3: High-Liability Autonomous Systems",
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      packages: "Full Stack (Discover to Measure & Improve)",
      budget: "$120k+ (Retainer)",
      persona: "CEO / Board Level",
      urgencyPrompt: "In a worst-case agent failure, what's the downside—financial, legal, reputational?"
    }
  };

  const tierConfig = tierConfigMap[riskTier as 1|2|3] || tierConfigMap[1];

  const handleLogMeeting = () => {
    addJournal({
      id: `j-${Date.now()}`,
      title: `Discovery Call: ${prospectOrg} (${prospectName})`,
      content: `Initial discovery call regarding: ${rawNarrative}\n\nNotes:\n- `,
      created_at: new Date().toISOString(),
      tags: ['Discovery', 'Intake'],
      is_private: true
    });
    alert('Started new Meeting Journal in the background!');
  };

  const scriptSteps = [
    {
      title: "1. Opening & Agenda",
      content: (
        <div className="space-y-4">
          <p className="italic text-muted-foreground border-l-4 border-primary pl-4 py-1">
            "Thank you for applying. I saw your note about the AI risks {prospectOrg} is facing. Before we dive in, does 30 minutes still work for you?"
          </p>
          <p className="italic text-muted-foreground border-l-4 border-primary pl-4 py-1">
            "I'd like to cover three things today: your current AI risk picture, your governance goals, and whether we're a fit to work together."
          </p>
        </div>
      )
    },
    {
      title: "2. Reflecting their Narrative",
      content: (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg border border-border/50 text-sm">
            <span className="font-bold text-xs uppercase text-muted-foreground mb-2 block">Their Core Problem:</span>
            {highlightNarrative(rawNarrative)}
          </div>
          <p className="italic text-muted-foreground border-l-4 border-primary pl-4 py-1">
            "You mentioned this problem in your intake. Can you walk me through what that looks like in practice, day-to-day?"
          </p>
        </div>
      )
    },
    {
      title: "3. BANT Qualification",
      content: (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Actively score the prospect across the 4 key dimensions:</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg border border-border/50 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500"/> Budget</h4>
              <select 
                value={bant.budget_status} onChange={e => setBant({...bant, budget_status: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1 text-foreground"
              >
                <option className="bg-background text-foreground" value="">-- Status --</option>
                <option className="bg-background text-foreground" value="Allocated">Allocated</option>
                <option className="bg-background text-foreground" value="Tentative">Tentative</option>
                <option className="bg-background text-foreground" value="Not allocated">Not Allocated</option>
              </select>
              <input 
                type="text" placeholder="Approx Band (e.g. $50k)" value={bant.budget_band}
                onChange={e => setBant({...bant, budget_band: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg border border-border/50 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary"/> Authority</h4>
              <input 
                type="text" placeholder="Decision Maker Name" value={bant.primary_decision_maker_name}
                onChange={e => setBant({...bant, primary_decision_maker_name: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1"
              />
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Role (e.g. CISO)" value={bant.primary_decision_maker_role}
                  onChange={e => setBant({...bant, primary_decision_maker_role: e.target.value})}
                  className="w-1/2 text-sm rounded-md border-input bg-background px-2 py-1"
                />
                <select 
                  value={bant.procurement_required} onChange={e => setBant({...bant, procurement_required: e.target.value})}
                  className="w-1/2 text-sm rounded-md border-input bg-background px-2 py-1 text-foreground"
                >
                  <option className="bg-background text-foreground" value="">-- Procurement --</option>
                  <option className="bg-background text-foreground" value="Yes">Yes</option>
                  <option className="bg-background text-foreground" value="No">No</option>
                  <option className="bg-background text-foreground" value="Unknown">Unknown</option>
                </select>
              </div>
              <button onClick={pushAuthorityToEngine} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Push to Stakeholders
              </button>
            </div>

            <div className="bg-muted p-4 rounded-lg border border-border/50 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2"><Target className="w-4 h-4 text-rose-500"/> Need</h4>
              <div className="text-xs bg-rose-500/10 text-rose-600 px-2 py-1 rounded border border-rose-500/20 font-medium">
                Mapped to {tierConfig.label}
              </div>
              <textarea 
                placeholder="Impact if unsolved..." rows={2} value={bant.impact_if_unsolved}
                onChange={e => setBant({...bant, impact_if_unsolved: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1 resize-none"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg border border-border/50 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-amber-500"/> Timing</h4>
              <input 
                type="text" placeholder="Trigger Event (e.g. Q3 Audit)" value={bant.trigger_event}
                onChange={e => setBant({...bant, trigger_event: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1"
              />
              <input 
                type="text" placeholder="Target Start Window" value={bant.target_start_window}
                onChange={e => setBant({...bant, target_start_window: e.target.value})}
                className="w-full text-sm rounded-md border-input bg-background px-2 py-1"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. Severity & Urgency",
      content: (
        <div className="space-y-4">
          <div className={`p-3 rounded-md border text-sm ${tierConfig.color}`}>
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            <strong>Tier Specific Prompt:</strong> {tierConfig.urgencyPrompt}
          </div>
          <p className="italic text-muted-foreground border-l-4 border-primary pl-4 py-1">
            {tierConfig.urgencyPrompt}
          </p>
        </div>
      )
    },
    {
      title: "5. Budget & Scope Fit",
      content: (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg border border-border/50 text-sm">
            <span className="font-bold text-xs uppercase text-muted-foreground mb-2 block">Recommended Path:</span>
            <span className="font-semibold">{tierConfig.packages}</span><br/>
            <span className="text-muted-foreground">{tierConfig.budget}</span>
          </div>
          <p className="italic text-muted-foreground border-l-4 border-primary pl-4 py-1">
            "For work at this level, teams typically invest {tierConfig.budget}. Does that band feel realistic for you, or are we outside your expected scope?"
          </p>
        </div>
      )
    },
    {
      title: "6. Discovery Notes & Wrap Up",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Capture any referrals, nuances, or important off-script notes here:</p>
          <textarea 
            placeholder="Important discovery notes..." rows={6} value={discoveryNotes}
            onChange={e => setDiscoveryNotes(e.target.value)}
            className="w-full text-sm rounded-md border border-input bg-background p-3 resize-y focus:ring-1 focus:ring-primary outline-none"
          />
          <button onClick={saveDiscoveryConsole} className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity mt-4">
            Save Discovery Workspace
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      
      {/* Detail View Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </button>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-muted-foreground">Pipeline Status:</span>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="bg-muted border-none rounded-md px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none text-foreground"
          >
            <option className="bg-background text-foreground" value="New">New</option>
            <option className="bg-background text-foreground" value="Contacted">Contacted</option>
            <option className="bg-background text-foreground" value="Discovery Scheduled">Discovery Scheduled</option>
            <option className="bg-background text-foreground" value="Discovery Completed">Discovery Completed</option>
            <option className="bg-background text-foreground" value="Qualified">Qualified</option>
            <option className="bg-background text-foreground" value="Passed">Passed</option>
            <option className="bg-background text-foreground" value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* Left Panel: Contact & Context */}
        <div className="w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
          
          <Card className="border-border shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{prospectName}</h2>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Enter Organization..." 
                        value={prospectOrg} 
                        onChange={(e) => setProspectOrg(e.target.value)}
                        className="text-sm font-medium bg-transparent border-b border-dashed border-muted-foreground/50 hover:border-primary focus:border-primary outline-none px-1 w-full max-w-[150px]"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{prospectEmail} • {prospectPhone}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${tierConfig.color}`}>
                {tierConfig.icon}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Risk Profile Assessed</p>
                  <p className="font-medium text-sm">{tierConfig.label}</p>
                </div>
              </div>

              {/* BANT SCORE */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">BANT Score</span>
                  <span className="text-xs font-bold text-primary">{bantScore}/4</span>
                </div>
                <div className="flex gap-1 h-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 rounded-full ${i <= bantScore ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-muted/30">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Marketing Alignment
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Expected Persona</span>
                  <span className="font-medium">{tierConfig.persona}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Recommended Pitch</span>
                  <span className="font-medium">{tierConfig.packages}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <button 
              onClick={handleLogMeeting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" /> Start Live Meeting Journal
            </button>
          </div>
        </div>

        {/* Right Panel: Guided Call Script */}
        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500" /> Live Discovery Script
            </h2>
            <span className="text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Call Console Active
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {scriptSteps.map((step, index) => (
              <div 
                key={index} 
                className={`transition-all duration-300 ${activeStep === index ? 'opacity-100 scale-100' : 'opacity-50 scale-95 hover:opacity-80'}`}
                onClick={() => setActiveStep(index)}
              >
                <h3 className={`font-bold mb-4 ${activeStep === index ? 'text-primary' : 'text-muted-foreground'} flex items-center gap-2 cursor-pointer`}>
                  {activeStep === index && <CheckCircle2 className="w-4 h-4 text-primary" />} {step.title}
                </h3>
                <div className={activeStep === index ? 'block' : 'hidden md:block'}>
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
