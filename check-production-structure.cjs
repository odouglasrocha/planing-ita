const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkProductionStructure() {
  const client = new MongoClient(process.env.VITE_MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db('Cluster0');
    
    console.log('\n📊 Estrutura dos production_records:');
    const records = await db.collection('production_records').find({}).limit(3).toArray();
    
    if (records.length > 0) {
      console.log('\n📋 Campos existentes no primeiro registro:');
      const firstRecord = records[0];
      Object.keys(firstRecord).forEach(key => {
        console.log(`- ${key}: ${typeof firstRecord[key]} (${firstRecord[key]})`);
      });
      
      console.log('\n📋 Todos os registros:');
      records.forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record._id}`);
        console.log(`   Order: ${record.order_id}`);
        console.log(`   Quantity: ${record.produced_quantity}`);
        console.log(`   Date: ${record.recorded_at}`);
        console.log(`   Shift: ${record.shift || 'NÃO DEFINIDO'}`);
        console.log('');
      });
    }
    
    console.log('\n📋 Estrutura dos production_orders:');
    const orders = await db.collection('production_orders').find({}).limit(2).toArray();
    
    if (orders.length > 0) {
      console.log('\n📋 Campos existentes no primeiro order:');
      const firstOrder = orders[0];
      Object.keys(firstOrder).forEach(key => {
        console.log(`- ${key}: ${typeof firstOrder[key]} (${firstOrder[key]})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

checkProductionStructure();