'use server';

import { createClient } from '@/utils/supabase/server';

export async function getDashboardMetrics(organizationId: string) {
  try {
    const supabase = await createClient();

    // 1. Fetch primary engagement data
    const { data: engagement, error: engErr } = await supabase
      .from('engagements')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (engErr || !engagement) throw new Error('Active engagement not found for this organization.');

    // 2. Aggregate deployment tracking
    const { data: deployments } = await supabase
      .from('software_deployments')
      .select('*')
      .eq('engagement_id', engagement.id);

    // 3. Query UAT testing metrics
    const { data: uatSessions } = await supabase
      .from('uat_sessions')
      .select('status')
      .eq('engagement_id', engagement.id);

    // 4. Fetch the latest weekly AI adoption metrics
    const { data: adoption } = await supabase
      .from('adoption_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('reporting_week', { ascending: false })
      .limit(1)
      .single();

    // 5. Retrieve next communication plan touchpoint
    const { data: communications } = await supabase
      .from('communication_plans')
      .select('*')
      .eq('engagement_id', engagement.id)
      .order('next_scheduled_at', { ascending: true })
      .limit(1);

    return {
      success: true,
      engagement: {
        phase: engagement.current_phase,
        budget: engagement.total_budget,
        health: engagement.health_status,
        target_end_date: engagement.target_end_date
      },
      deployments: deployments || [],
      uat_summary: uatSessions || [],
      adoption_snapshot: adoption || {
        total_active_models: 0,
        governed_models_count: 0,
        governed_api_throughput_pct: 0
      },
      next_communication: communications?.[0] || null
    };

  } catch (error: any) {
    return { error: error.message };
  }
}
