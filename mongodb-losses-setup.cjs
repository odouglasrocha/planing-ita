// MongoDB Losses Setup Script
// Este script cria as coleções e dados iniciais para o sistema de perdas no MongoDB

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const MONGODB_DATABASE = process.env.VITE_MONGODB_DATABASE;

async function setupLossesCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB Atlas');
    
    const db = client.db(MONGODB_DATABASE);
    
    // Criar coleção loss_types se não existir
    const lossTypesCollection = db.collection('loss_types');
    
    // Verificar se já existem tipos de perdas
    const existingTypes = await lossTypesCollection.countDocuments();
    
    if (existingTypes === 0) {
      console.log('📝 Criando tipos de perdas padrão...');
      
      const defaultLossTypes = [
        {
          name: 'Embalagem (Filme)',
          unit: 'und',
          color: 'bg-red-500',
          icon: '🎞️',
          description: 'Perdas de filme de embalagem',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Orgânico',
          unit: 'kg',
          color: 'bg-orange-500',
          icon: '🌿',
          description: 'Perdas de material orgânico',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Setup/Troca',
          unit: 'kg',
          color: 'bg-yellow-500',
          icon: '🔧',
          description: 'Perdas durante setup ou troca de produto',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Qualidade',
          unit: 'kg',
          color: 'bg-purple-500',
          icon: '❌',
          description: 'Perdas por problemas de qualidade',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Manutenção',
          unit: 'kg',
          color: 'bg-blue-500',
          icon: '⚙️',
          description: 'Perdas durante manutenção',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Outro',
          unit: 'kg',
          color: 'bg-gray-500',
          icon: '❓',
          description: 'Outras perdas',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      const result = await lossTypesCollection.insertMany(defaultLossTypes);
      console.log(`✅ ${result.insertedCount} tipos de perdas criados`);
    } else {
      console.log(`ℹ️ ${existingTypes} tipos de perdas já existem`);
    }
    
    // Criar coleção material_losses se não existir
    const materialLossesCollection = db.collection('material_losses');
    
    // Criar índices para melhor performance
    console.log('📊 Criando índices...');
    
    await lossTypesCollection.createIndex({ name: 1 }, { unique: true });
    await materialLossesCollection.createIndex({ recorded_at: -1 });
    await materialLossesCollection.createIndex({ machine_id: 1 });
    await materialLossesCollection.createIndex({ loss_type_id: 1 });
    await materialLossesCollection.createIndex({ order_id: 1 });
    
    console.log('✅ Índices criados com sucesso');
    
    // Verificar estrutura das coleções
    const lossTypesCount = await lossTypesCollection.countDocuments();
    const materialLossesCount = await materialLossesCollection.countDocuments();
    
    console.log('\n📈 Resumo das coleções:');
    console.log(`- loss_types: ${lossTypesCount} documentos`);
    console.log(`- material_losses: ${materialLossesCount} documentos`);
    
    console.log('\n🎉 Setup das coleções de perdas concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executar o setup
if (require.main === module) {
  setupLossesCollections()
    .then(() => {
      console.log('✅ Setup concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no setup:', error);
      process.exit(1);
    });
}

module.exports = { setupLossesCollections };