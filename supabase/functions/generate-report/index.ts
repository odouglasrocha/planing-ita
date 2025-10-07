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

    const { reportType, startDate, endDate, machineId, userId } = await req.json();

    console.log('Generating report:', { reportType, startDate, endDate, machineId });

    // Create report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        type: reportType,
        name: `${reportType} - ${new Date().toLocaleDateString('pt-BR')}`,
        status: 'generating',
        created_by: userId,
        parameters: { startDate, endDate, machineId }
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Fetch data based on report type
    let reportData: any = {};

    if (reportType === 'production') {
      const { data: records } = await supabase
        .from('production_records')
        .select(`
          *,
          production_orders (code, product_name),
          machines (name, code),
          operators (name)
        `)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .eq(machineId ? 'machine_id' : 'id', machineId || 'id');

      reportData.records = records;
      reportData.summary = {
        totalProduced: records?.reduce((sum, r) => sum + r.produced_quantity, 0) || 0,
        totalRejects: records?.reduce((sum, r) => sum + r.reject_quantity, 0) || 0,
        totalDowntime: records?.reduce((sum, r) => sum + r.downtime_minutes, 0) || 0,
        avgEfficiency: records?.length > 0 
          ? records.reduce((sum, r) => sum + (r.efficiency_percentage || 0), 0) / records.length 
          : 0
      };
    } else if (reportType === 'oee') {
      // Call OEE calculation function
      const oeeResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-oee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ machineId, startDate, endDate })
      });
      reportData = await oeeResponse.json();
    } else if (reportType === 'losses') {
      const { data: losses } = await supabase
        .from('material_losses')
        .select(`
          *,
          loss_types (name, unit),
          machines (name, code),
          operators (name)
        `)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate);

      reportData.losses = losses;
      reportData.summary = {
        totalAmount: losses?.reduce((sum, l) => sum + Number(l.amount), 0) || 0,
        byType: losses?.reduce((acc, l) => {
          const typeName = l.loss_types?.name || 'Unknown';
          acc[typeName] = (acc[typeName] || 0) + Number(l.amount);
          return acc;
        }, {} as Record<string, number>)
      };
    }

    // Update report with data
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_path: JSON.stringify(reportData)
      })
      .eq('id', report.id);

    if (updateError) throw updateError;

    console.log('Report generated successfully:', report.id);

    return new Response(JSON.stringify({ 
      reportId: report.id,
      data: reportData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
