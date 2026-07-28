import { Capsule, Objective, Journal, Stakeholder } from './types';

export function compileDeliverableMarkdown(
  title: string,
  selectedCapsules: Capsule[],
  selectedObjectives: Objective[],
  journals: Journal[],
  sponsor?: Stakeholder,
  reviewers?: Stakeholder[]
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let md = `# ${title}\n\n`;
  md += `**Generated:** ${currentDate}\n`;
  md += `**Engine:** CPOS Deterministic Compiler (v4)\n\n`;
  
  if (sponsor || (reviewers && reviewers.length > 0)) {
    md += `## 👥 Stakeholder Sign-Off\n\n`;
    if (sponsor) {
      md += `- **Executive Sponsor:** ${sponsor.name} (${sponsor.role_title}, ${sponsor.organization})\n`;
    }
    if (reviewers && reviewers.length > 0) {
      md += `- **Reviewers:**\n`;
      reviewers.forEach(r => {
        md += `  - ${r.name} (${r.role_title})\n`;
      });
    }
    md += `\n`;
  }
  
  md += `---\n\n`;

  // 1. Objectives Section
  if (selectedObjectives.length > 0) {
    md += `## 🎯 Engagement Objectives\n\n`;
    selectedObjectives.forEach((obj, index) => {
      md += `### ${index + 1}. ${obj.title}\n`;
      md += `> *${obj.description}*\n\n`;
      
      md += `| Status | Success Criteria |\n`;
      md += `| :---: | :--- |\n`;
      
      obj.success_criteria.forEach(sc => {
        const icon = sc.is_completed ? '✅' : '⬜';
        md += `| ${icon} | ${sc.text} |\n`;
      });
      md += `\n\n`;
    });
    md += `---\n\n`;
  }

  // Group Capsules by Type
  const categorized: Record<string, Capsule[]> = {};
  selectedCapsules.forEach(cap => {
    if (!categorized[cap.capsule_type]) {
      categorized[cap.capsule_type] = [];
    }
    categorized[cap.capsule_type].push(cap);
  });

  // 2. Ordered Sections for Capsules
  const sectionOrder = [
    { type: 'Deliverable', title: '📦 Deliverables', icon: '📦' },
    { type: 'Finding', title: '🔍 Key Findings', icon: '📌' },
    { type: 'Observation', title: '👀 Observations', icon: '📝' },
    { type: 'Issue', title: '⚠️ Active Issues', icon: '🛑' },
    { type: 'Risk', title: '🔴 Risk Register', icon: '☢️' },
    { type: 'Recommendation', title: '💡 Recommendations', icon: '🎯' },
    { type: 'Decision', title: '⚖️ Decisions Log', icon: '🔨' },
    { type: 'Evidence', title: '🧾 Cryptographic Evidence', icon: '🔐' },
  ];

  sectionOrder.forEach(sec => {
    if (categorized[sec.type] && categorized[sec.type].length > 0) {
      md += `## ${sec.title}\n\n`;
      categorized[sec.type].forEach(cap => {
        md += `### ${sec.icon} ${cap.title}\n`;
        md += `${cap.summary}\n\n`;
        
        // Audit Metadata
        const sourceJournal = journals.find(j => j.id === cap.source_journal_id);
        const sourceName = sourceJournal ? sourceJournal.title : 'External / Unknown';
        
        md += `**Context & Evidentiary Lineage:**\n`;
        md += `> *${cap.supporting_context}*\n>`
        md += `> 🔗 **Source:** Journal [ *${sourceName}* ] | **Capsule:** \`${cap.id}\`\n\n`;
      });
    }
  });

  return md;
}
