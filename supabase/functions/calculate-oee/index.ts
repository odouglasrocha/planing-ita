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

    const { machineId, orderId, startDate, endDate } = await req.json();

    console.log('Calculating OEE for:', { machineId, orderId, startDate, endDate });

    // Fetch production records
    let query = supabase
      .from('production_records')
      .select('*')
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate);

    if (machineId) query = query.eq('machine_id', machineId);
    if (orderId) query = query.eq('order_id', orderId);

    const { data: records, error } = await query;

    if (error) throw error;

    // Calculate OEE components
    const totalMinutes = records.reduce((sum, r) => sum + (r.time_elapsed_minutes || 0), 0);
    const downtimeMinutes = records.reduce((sum, r) => sum + r.downtime_minutes, 0);
    const operatingTime = totalMinutes - downtimeMinutes;
    
    const totalProduced = records.reduce((sum, r) => sum + r.produced_quantity, 0);
    const totalRejects = records.reduce((sum, r) => sum + r.reject_quantity, 0);
    const goodUnits = totalProduced - totalRejects;

    // Availability = Operating Time / Planned Production Time
    const availability = totalMinutes > 0 ? (operatingTime / totalMinutes) * 100 : 0;

    // Performance = Actual Production / Theoretical Production
    const avgCycleTime = records.length > 0 
      ? records.reduce((sum, r) => sum + (r.cycle_time_minutes || 0), 0) / records.length 
      : 0;
    const theoreticalProduction = avgCycleTime > 0 ? operatingTime / avgCycleTime : totalProduced;
    const performance = theoreticalProduction > 0 ? (totalProduced / theoreticalProduction) * 100 : 0;

    // Quality = Good Units / Total Units
    const quality = totalProduced > 0 ? (goodUnits / totalProduced) * 100 : 0;

    // OEE = Availability × Performance × Quality
    const oee = (availability * performance * quality) / 10000;

    const result = {
      oee: Math.round(oee * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      performance: Math.round(performance * 100) / 100,
      quality: Math.round(quality * 100) / 100,
      metrics: {
        totalMinutes,
        downtimeMinutes,
        operatingTime,
        totalProduced,
        totalRejects,
        goodUnits,
        avgCycleTime: Math.round(avgCycleTime * 100) / 100
      }
    };

    console.log('OEE calculated:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating OEE:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
