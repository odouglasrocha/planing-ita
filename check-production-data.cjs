const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkProductionData() {
  const client = new MongoClient(process.env.VITE_MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db('Cluster0');
    
    console.log('\n📊 Verificando registros de produção:');
    const records = await db.collection('production_records').find({}).toArray();
    
    console.log(`Total de registros: ${records.length}`);
    
    if (records.length > 0) {
      console.log('\n📋 Detalhes dos registros:');
      records.forEach((record, index) => {
        console.log(`${index + 1}. Order: ${record.order_id}, Quantity: ${record.produced_quantity}, Date: ${record.recorded_at}`);
      });
    }
    
    console.log('\n📋 Verificando ordens de produção:');
    const orders = await db.collection('production_orders').find({}).toArray();
    
    console.log(`Total de ordens: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\n📋 Detalhes das ordens:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. Code: ${order.code}, Product: ${order.product_name}, Planned: ${order.planned_quantity}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

checkProductionData();