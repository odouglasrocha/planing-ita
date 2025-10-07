// MongoDB User Seeding Script for Local Development
import { MongoClient } from 'mongodb';

interface DemoUser {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'operador';
  created_at?: Date;
  updated_at?: Date;
}

const demoUsers: DemoUser[] = [
  { email: 'admin@oee.com', password: 'admin123', full_name: 'João Silva', role: 'admin' },
  { email: 'supervisor@oee.com', password: 'supervisor123', full_name: 'Maria Santos', role: 'supervisor' },
  { email: 'operador@oee.com', password: 'operador123', full_name: 'Pedro Costa', role: 'operador' }
];

export async function seedUsers(): Promise<{ success: boolean; results: any[]; error?: string }> {
  const client = new MongoClient(import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log('Conectando ao MongoDB Atlas para seed dos usuários...');
    await client.connect();
    
    const db = client.db(import.meta.env.VITE_MONGODB_DATABASE || 'Cluster0');
    const usersCollection = db.collection('users');

    console.log('Fazendo seed dos usuários demo...');
    
    // Inserir ou atualizar usuários demo
    const results = [];
    for (const user of demoUsers) {
      const existingUser = await usersCollection.findOne({ email: user.email });
      
      if (existingUser) {
        console.log(`Usuário ${user.email} já existe, atualizando...`);
        await usersCollection.updateOne(
          { email: user.email },
          { 
            $set: { 
              full_name: user.full_name,
              role: user.role,
              password: user.password,
              updated_at: new Date()
            } 
          }
        );
        results.push({ email: user.email, action: 'updated' });
      } else {
        console.log(`Criando usuário ${user.email}...`);
        await usersCollection.insertOne({
          ...user,
          created_at: new Date(),
          updated_at: new Date()
        });
        results.push({ email: user.email, action: 'created' });
      }
    }

    console.log('Seed dos usuários concluído com sucesso');
    return { success: true, results };

  } catch (error) {
    console.error('Erro ao fazer seed dos usuários:', error);
    return { 
      success: false, 
      results: [], 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  } finally {
    await client.close();
  }
}

// Função para executar o seed manualmente
export async function runSeed() {
  const result = await seedUsers();
  if (result.success) {
    console.log('✅ Seed concluído:', result.results);
  } else {
    console.error('❌ Erro no seed:', result.error);
  }
  return result;
}