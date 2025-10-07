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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { machineId, recentData } = await req.json();

    console.log('Generating AI recommendations for machine:', machineId);

    // Fetch machine and recent production data
    const { data: machine } = await supabase
      .from('machines')
      .select('*')
      .eq('id', machineId)
      .single();

    const { data: recentRecords } = await supabase
      .from('production_records')
      .select('*')
      .eq('machine_id', machineId)
      .order('recorded_at', { ascending: false })
      .limit(20);

    const { data: recentLosses } = await supabase
      .from('material_losses')
      .select('*, loss_types(*)')
      .eq('machine_id', machineId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    // Calculate metrics
    const avgEfficiency = recentRecords?.length > 0
      ? recentRecords.reduce((sum, r) => sum + (r.efficiency_percentage || 0), 0) / recentRecords.length
      : 0;

    const totalDowntime = recentRecords?.reduce((sum, r) => sum + r.downtime_minutes, 0) || 0;
    const totalLosses = recentLosses?.reduce((sum, l) => sum + Number(l.amount), 0) || 0;

    const context = {
      machine: machine?.name,
      model: machine?.model,
      status: machine?.status,
      avgEfficiency: Math.round(avgEfficiency * 100) / 100,
      totalDowntime,
      totalLosses,
      recentProblems: recentRecords?.filter(r => r.downtime_minutes > 10).length || 0
    };

    // Use Lovable AI if available, otherwise use rule-based system
    let recommendations = [];

    if (lovableApiKey) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'system',
            content: `Você é um especialista em otimização de produção industrial para máquinas Masipack VS 340. 
Analise os dados e forneça 3-5 recomendações específicas e práticas em português brasileiro.
Retorne apenas um array JSON com objetos contendo: title (string), description (string), priority (urgente|alta|media|baixa), category (configuracao|qualidade|manutencao|otimizacao_filme|reducao_perdas).`
          }, {
            role: 'user',
            content: `Dados da máquina: ${JSON.stringify(context)}. 
Forneça recomendações específicas para melhorar a eficiência.`
          }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiText = aiData.choices[0].message.content;
        
        try {
          const jsonMatch = aiText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            recommendations = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Error parsing AI response:', e);
        }
      }
    }

    // Fallback to rule-based recommendations
    if (recommendations.length === 0) {
      if (avgEfficiency < 60) {
        recommendations.push({
          title: 'Ajuste urgente de configuração',
          description: `Eficiência muito baixa (${avgEfficiency.toFixed(1)}%). Revise configurações de temperatura e velocidade.`,
          priority: 'urgente',
          category: 'configuracao'
        });
      }

      if (totalDowntime > 60) {
        recommendations.push({
          title: 'Redução de tempo de parada',
          description: `${totalDowntime} minutos de parada registrados. Identifique causas principais.`,
          priority: 'alta',
          category: 'manutencao'
        });
      }

      if (totalLosses > 100) {
        recommendations.push({
          title: 'Controle de perdas de material',
          description: `${totalLosses}kg de perdas registradas. Implemente controle de qualidade.`,
          priority: 'alta',
          category: 'reducao_perdas'
        });
      }
    }

    console.log('Generated recommendations:', recommendations.length);

    return new Response(JSON.stringify({ 
      recommendations,
      context 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
