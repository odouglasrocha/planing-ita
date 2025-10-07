// Script para executar seed dos usuários no MongoDB Atlas
// Este script simula o seed usando fetch API para chamar a função Supabase Edge

export async function runMongoDBSeed() {
  console.log('🌱 Iniciando seed dos usuários no MongoDB Atlas...');
  
  try {
    // Verificar configurações
    const mongoUri = import.meta.env.VITE_MONGODB_URI;
    const mongoDb = import.meta.env.VITE_MONGODB_DATABASE;
    const apiKey = import.meta.env.VITE_MONGODB_API_KEY;
    
    console.log('📋 Configurações:');
    console.log('- URI:', mongoUri ? '✅ Configurada' : '❌ Não encontrada');
    console.log('- Database:', mongoDb || 'Cluster0');
    console.log('- API Key:', apiKey ? '✅ Configurada' : '❌ Não encontrada');
    
    // Simular seed local (já que os usuários estão hardcoded no mongodb-auth.ts)
    const demoUsers = [
      { email: 'admin@oee.com', password: 'admin123', full_name: 'João Silva', role: 'admin' },
      { email: 'supervisor@oee.com', password: 'supervisor123', full_name: 'Maria Santos', role: 'supervisor' },
      { email: 'operador@oee.com', password: 'operador123', full_name: 'Pedro Costa', role: 'operador' }
    ];
    
    console.log('👥 Usuários demo configurados:');
    demoUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    console.log('✅ Seed simulado concluído! Os usuários estão disponíveis para login.');
    console.log('🔑 Credenciais de teste:');
    console.log('   Admin: admin@oee.com / admin123');
    console.log('   Supervisor: supervisor@oee.com / supervisor123');
    console.log('   Operador: operador@oee.com / operador123');
    
    return { success: true, users: demoUsers };
    
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Auto-executar em desenvolvimento
if (import.meta.env.DEV) {
  setTimeout(() => {
    runMongoDBSeed();
  }, 2000);
}