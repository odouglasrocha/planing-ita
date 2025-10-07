require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugFrontendAuth() {
  try {
    console.log('🔍 Verificando dados no Supabase...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Variáveis do Supabase não encontradas no .env');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseKey ? 'Presente' : 'Ausente');
      return;
    }
    
    console.log('✅ Conectando ao Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar ordens de produção no Supabase
    console.log('📋 Buscando ordens de produção no Supabase...');
    const { data: orders, error } = await supabase
      .from('production_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar ordens no Supabase:', error);
      return;
    }
    
    console.log(`📊 Total de ordens no Supabase: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 Primeiras 3 ordens do Supabase:');
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`${index + 1}. ${order.code} - ${order.product_name} (Status: ${order.status})`);
      });
      
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: O frontend está usando dados do Supabase!');
      console.log('💡 Solução: Limpar cache do navegador ou verificar autenticação MongoDB');
    } else {
      console.log('✅ Nenhuma ordem encontrada no Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugFrontendAuth();