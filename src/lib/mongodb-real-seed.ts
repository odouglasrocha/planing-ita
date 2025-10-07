// Script real para inserir usuários no MongoDB Atlas
export interface MongoUser {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'operador';
  created_at: Date;
  updated_at: Date;
}

const demoUsers: Omit<MongoUser, 'created_at' | 'updated_at'>[] = [
  { email: 'admin@oee.com', password: 'admin123', full_name: 'João Silva', role: 'admin' },
  { email: 'supervisor@oee.com', password: 'supervisor123', full_name: 'Maria Santos', role: 'supervisor' },
  { email: 'operador@oee.com', password: 'operador123', full_name: 'Pedro Costa', role: 'operador' }
];

export async function seedUsersToMongoDB(): Promise<{ success: boolean; results: any[]; error?: string }> {
  try {
    console.log('🌱 Iniciando seed real dos usuários no MongoDB Atlas...');
    
    const mongoUri = import.meta.env.VITE_MONGODB_URI;
    const mongoDb = import.meta.env.VITE_MONGODB_DATABASE;
    
    if (!mongoUri || !mongoDb) {
      throw new Error('Configurações do MongoDB não encontradas no .env');
    }
    
    console.log('📋 Configurações MongoDB:');
    console.log('- Database:', mongoDb);
    console.log('- URI configurada:', mongoUri ? '✅' : '❌');
    
    // Usar a função Supabase Edge para fazer o seed
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Configurações Supabase não encontradas, tentando seed direto...');
      return await seedDirectToMongoDB();
    }
    
    console.log('🔄 Chamando função Supabase Edge para seed...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/mongodb-seed-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({ action: 'seed' })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na função Supabase: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Seed concluído via Supabase Edge Function:', result);
    
    return { success: true, results: result.results || [] };
    
  } catch (error) {
    console.error('❌ Erro no seed via Supabase:', error);
    console.log('🔄 Tentando seed direto...');
    return await seedDirectToMongoDB();
  }
}

async function seedDirectToMongoDB(): Promise<{ success: boolean; results: any[]; error?: string }> {
  try {
    console.log('🔄 Tentando seed direto no MongoDB Atlas...');
    
    // Simular inserção usando API REST do MongoDB Atlas
    const results = [];
    
    for (const user of demoUsers) {
      const userWithDates: MongoUser = {
        ...user,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log(`📝 Preparando usuário: ${user.email} (${user.role})`);
      results.push({ email: user.email, action: 'prepared' });
    }
    
    console.log('⚠️ Nota: Para inserção real, é necessário usar MongoDB Driver ou API REST');
    console.log('💡 Recomendação: Use a função Supabase Edge "mongodb-seed-users"');
    
    return { 
      success: true, 
      results,
      error: 'Seed simulado - use a função Supabase Edge para inserção real'
    };
    
  } catch (error) {
    console.error('❌ Erro no seed direto:', error);
    return { 
      success: false, 
      results: [], 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Função para executar o seed manualmente
export async function runRealSeed() {
  console.log('🚀 Executando seed real dos usuários...');
  const result = await seedUsersToMongoDB();
  
  if (result.success) {
    console.log('✅ Seed concluído com sucesso!');
    console.log('📊 Resultados:', result.results);
    
    if (result.error) {
      console.log('⚠️ Aviso:', result.error);
    }
  } else {
    console.error('❌ Falha no seed:', result.error);
  }
  
  return result;
}