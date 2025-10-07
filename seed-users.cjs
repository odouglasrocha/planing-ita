const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configurações do MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://orlanddouglas:KxUZTcs4cPIaNZsY@cluster0.gac2k0p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'Cluster0';

// Usuários demo para seed
const demoUsers = [
  {
    id: 'admin-001',
    email: 'admin@fabrica.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    department: 'TI',
    active: true
  },
  {
    id: 'supervisor-001',
    email: 'supervisor@fabrica.com',
    password: 'supervisor123',
    name: 'Supervisor',
    role: 'supervisor',
    department: 'Produção',
    active: true
  },
  {
    id: 'operador-001',
    email: 'operador@fabrica.com',
    password: 'operador123',
    name: 'Operador',
    role: 'operador',
    department: 'Produção',
    active: true
  }
];

async function seedUsers() {
  let client;
  
  try {
    console.log('🔗 Conectando ao MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    
    console.log('📊 Verificando usuários existentes...');
    const existingUsers = await usersCollection.find({}).toArray();
    console.log(`Usuários existentes: ${existingUsers.length}`);
    
    console.log('👥 Inserindo usuários demo...');
    
    for (const user of demoUsers) {
      // Verificar se o usuário já existe
      const existingUser = await usersCollection.findOne({ 
        $or: [{ email: user.email }, { id: user.id }] 
      });
      
      if (existingUser) {
        console.log(`⚠️  Usuário ${user.email} já existe, atualizando...`);
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await usersCollection.updateOne(
          { $or: [{ email: user.email }, { id: user.id }] },
          {
            $set: {
              ...user,
              password: hashedPassword,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`✅ Usuário ${user.email} atualizado com sucesso`);
      } else {
        console.log(`➕ Criando novo usuário ${user.email}...`);
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await usersCollection.insertOne({
          ...user,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Usuário ${user.email} criado com sucesso`);
      }
    }
    
    // Verificar resultado final
    const finalUsers = await usersCollection.find({}).toArray();
    console.log(`\n📈 Total de usuários no banco: ${finalUsers.length}`);
    
    console.log('\n🎯 Usuários disponíveis para login:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                    CREDENCIAIS DE LOGIN                 │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ Admin:      admin@fabrica.com / admin123               │');
    console.log('│ Supervisor: supervisor@fabrica.com / supervisor123     │');
    console.log('│ Operador:   operador@fabrica.com / operador123         │');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    console.log('\n🎉 Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexão com MongoDB fechada');
    }
  }
}

// Executar o seed
seedUsers().catch(console.error);