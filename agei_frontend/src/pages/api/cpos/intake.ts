import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    organizationId,
    submittedBy,
    privilegeModelScore, privilegeModelNotes,
    enforcementFidelityScore, enforcementFidelityNotes,
    evidentiaryIntegrityScore, evidentiaryIntegrityNotes,
    downstreamProvenanceScore, downstreamProvenanceNotes,
    perimeterPrivacyScore, perimeterPrivacyNotes
  } = req.body;

  try {
    // 1. Insert survey submission under strict tenant isolation
    const { data: submission, error: insertErr } = await supabase
      .from('cpos_strategic_surveys')
      .insert({
        organization_id: organizationId,
        submitted_by: submittedBy,
        privilege_model_score: privilegeModelScore,
        privilege_model_notes: privilegeModelNotes,
        enforcement_fidelity_score: enforcementFidelityScore,
        enforcement_fidelity_notes: enforcementFidelityNotes,
        evidentiary_integrity_score: evidentiaryIntegrityScore,
        evidentiary_integrity_notes: evidentiaryIntegrityNotes,
        downstream_provenance_score: downstreamProvenanceScore,
        downstream_provenance_notes: downstreamProvenanceNotes,
        perimeter_privacy_score: perimeterPrivacyScore,
        perimeter_privacy_notes: perimeterPrivacyNotes
      })
      .select()
      .single();

    if (insertErr || !submission) throw insertErr || new Error('Failed to persist survey submission');

    // 2. Resolve Assurance Profile based on the aggregate maturity score
    const avgScore = parseFloat(submission.aggregate_maturity_score);
    let targetProfile = 'Profile 1: Internal Evidence';
    let nextStepAdvisory = 'Phase 1 Complete - Transitioning to Phase 2: Design & Align ($45,000)';

    if (avgScore >= 1.5 && avgScore < 2.5) {
      targetProfile = 'Profile 2: Regulated Evidence';
    } else if (avgScore >= 2.5) {
      targetProfile = 'Profile 3: Forensic Evidence';
    }

    return res.status(200).json({
      success: true,
      surveyId: submission.id,
      aggregateScore: avgScore,
      resolvedProfile: targetProfile,
      recommendedAction: nextStepAdvisory
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
