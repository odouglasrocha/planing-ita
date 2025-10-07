// Script de teste para autenticação MongoDB
import { mongoAuth } from './mongodb-auth';

export async function testMongoDBAuth() {
  console.log('🧪 Iniciando testes de autenticação MongoDB...');
  
  // Teste 1: Verificar se a API key está sendo carregada do .env
  console.log('📋 Teste 1: Verificando configuração da API key');
  const apiKey = import.meta.env.VITE_MONGODB_API_KEY;
  console.log('API Key do .env:', apiKey ? '✅ Carregada' : '❌ Não encontrada');
  
  // Teste 2: Verificar se o cliente está inicializado
  console.log('📋 Teste 2: Verificando inicialização do cliente');
  const isInitialized = mongoAuth ? '✅ Inicializado' : '❌ Não inicializado';
  console.log('Cliente MongoDB:', isInitialized);
  
  // Teste 3: Testar login com usuário demo
  console.log('📋 Teste 3: Testando login com usuário admin');
  try {
    const result = await mongoAuth.signInWithNotification('admin@oee.com', 'admin123');
    if (result) {
      console.log('✅ Login bem-sucedido:', result.user.email);
      
      // Teste 4: Verificar sessão
      console.log('📋 Teste 4: Verificando sessão');
      const session = mongoAuth.getSession();
      console.log('Sessão ativa:', session ? '✅ Ativa' : '❌ Inativa');
      
      // Teste 5: Testar logout
      console.log('📋 Teste 5: Testando logout');
      await mongoAuth.signOutWithNotification();
      const sessionAfterLogout = mongoAuth.getSession();
      console.log('Logout:', sessionAfterLogout ? '❌ Falhou' : '✅ Bem-sucedido');
      
    } else {
      console.log('❌ Falha no login');
    }
  } catch (error) {
    console.error('❌ Erro no teste de login:', error);
  }
  
  console.log('🏁 Testes concluídos!');
}

// Executar testes automaticamente em desenvolvimento
if (import.meta.env.DEV) {
  // Aguardar um pouco para garantir que tudo está carregado
  setTimeout(() => {
    testMongoDBAuth();
  }, 1000);
}