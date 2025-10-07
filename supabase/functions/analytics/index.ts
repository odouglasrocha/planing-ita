import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { period = '7d', machineId } = await req.json();

    console.log('Calculating analytics for period:', period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Fetch production records
    let query = supabase
      .from('production_records')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    if (machineId) {
      query = query.eq('machine_id', machineId);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Fetch material losses
    let lossQuery = supabase
      .from('material_losses')
      .select('*, loss_types(*)')
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    if (machineId) {
      lossQuery = lossQuery.eq('machine_id', machineId);
    }

    const { data: losses } = await lossQuery;

    // Calculate comprehensive analytics
    const totalProduced = records?.reduce((sum, r) => sum + r.produced_quantity, 0) || 0;
    const totalRejects = records?.reduce((sum, r) => sum + r.reject_quantity, 0) || 0;
    const totalDowntime = records?.reduce((sum, r) => sum + r.downtime_minutes, 0) || 0;
    const avgEfficiency = records?.length > 0
      ? records.reduce((sum, r) => sum + (r.efficiency_percentage || 0), 0) / records.length
      : 0;

    // Calculate daily trends
    const dailyData = records?.reduce((acc, record) => {
      const date = new Date(record.recorded_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          produced: 0,
          rejects: 0,
          downtime: 0,
          efficiency: [],
        };
      }
      acc[date].produced += record.produced_quantity;
      acc[date].rejects += record.reject_quantity;
      acc[date].downtime += record.downtime_minutes;
      if (record.efficiency_percentage) {
        acc[date].efficiency.push(record.efficiency_percentage);
      }
      return acc;
    }, {} as Record<string, any>);

    const trends = Object.values(dailyData || {}).map((day: any) => ({
      date: day.date,
      produced: day.produced,
      rejects: day.rejects,
      downtime: day.downtime,
      avgEfficiency: day.efficiency.length > 0
        ? day.efficiency.reduce((a: number, b: number) => a + b, 0) / day.efficiency.length
        : 0
    }));

    // Loss analytics
    const lossesByType = losses?.reduce((acc, loss) => {
      const type = loss.loss_types?.name || 'Unknown';
      acc[type] = (acc[type] || 0) + Number(loss.amount);
      return acc;
    }, {} as Record<string, number>);

    // Downtime by type
    const downtimeByType = records?.reduce((acc, record) => {
      if (record.downtime_type_id && record.downtime_minutes > 0) {
        acc[record.downtime_type_id] = (acc[record.downtime_type_id] || 0) + record.downtime_minutes;
      }
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      period,
      summary: {
        totalProduced,
        totalRejects,
        totalDowntime,
        avgEfficiency: Math.round(avgEfficiency * 100) / 100,
        qualityRate: totalProduced > 0 ? ((totalProduced - totalRejects) / totalProduced) * 100 : 0,
        totalLosses: losses?.reduce((sum, l) => sum + Number(l.amount), 0) || 0
      },
      trends,
      lossesByType,
      downtimeByType,
      recordCount: records?.length || 0
    };

    console.log('Analytics calculated successfully');

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
