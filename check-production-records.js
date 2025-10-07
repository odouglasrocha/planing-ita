// Script para verificar registros de produção órfãos no MongoDB
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const MONGODB_DATABASE = process.env.VITE_MONGODB_DATABASE;

async function checkProductionRecords() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db(MONGODB_DATABASE);
    
    // 1. Verificar todas as máquinas existentes
    console.log('\n📋 Máquinas existentes no MongoDB:');
    const machines = await db.collection('machines').find({}).toArray();
    const machineIds = machines.map(m => m._id.toString());
    
    machines.forEach(machine => {
      console.log(`- ${machine.name} (${machine.code}) - ID: ${machine._id}`);
    });
    
    // 2. Verificar registros de produção
    console.log('\n📊 Verificando registros de produção...');
    const productionRecords = await db.collection('production_records').find({}).toArray();
    
    if (productionRecords.length === 0) {
      console.log('✅ Nenhum registro de produção encontrado no MongoDB');
      return;
    }
    
    console.log(`📈 Total de registros de produção: ${productionRecords.length}`);
    
    // 3. Verificar registros órfãos (que referenciam máquinas inexistentes)
    const orphanedRecords = [];
    const uniqueMachineIdsInRecords = new Set();
    
    productionRecords.forEach(record => {
      if (record.machine_id) {
        uniqueMachineIdsInRecords.add(record.machine_id.toString());
        
        if (!machineIds.includes(record.machine_id.toString())) {
          orphanedRecords.push(record);
        }
      }
    });
    
    console.log('\n🔍 Machine IDs únicos nos registros de produção:');
    uniqueMachineIdsInRecords.forEach(id => {
      const exists = machineIds.includes(id);
      console.log(`- ${id} ${exists ? '✅' : '❌ (ÓRFÃO)'}`);
    });
    
    if (orphanedRecords.length > 0) {
      console.log(`\n⚠️  Encontrados ${orphanedRecords.length} registros órfãos:`);
      orphanedRecords.forEach(record => {
        console.log(`- Registro ID: ${record._id}, Machine ID: ${record.machine_id}, Data: ${record.recorded_at || record.created_at}`);
      });
    } else {
      console.log('\n✅ Nenhum registro órfão encontrado');
    }
    
    // 4. Verificar ordens de produção
    console.log('\n📋 Verificando ordens de produção...');
    const productionOrders = await db.collection('production_orders').find({}).toArray();
    
    if (productionOrders.length === 0) {
      console.log('✅ Nenhuma ordem de produção encontrada no MongoDB');
    } else {
      console.log(`📈 Total de ordens de produção: ${productionOrders.length}`);
      
      const orphanedOrders = [];
      const uniqueMachineIdsInOrders = new Set();
      
      productionOrders.forEach(order => {
        if (order.machine_id) {
          uniqueMachineIdsInOrders.add(order.machine_id.toString());
          
          if (!machineIds.includes(order.machine_id.toString())) {
            orphanedOrders.push(order);
          }
        }
      });
      
      console.log('\n🔍 Machine IDs únicos nas ordens de produção:');
      uniqueMachineIdsInOrders.forEach(id => {
        const exists = machineIds.includes(id);
        console.log(`- ${id} ${exists ? '✅' : '❌ (ÓRFÃO)'}`);
      });
      
      if (orphanedOrders.length > 0) {
        console.log(`\n⚠️  Encontradas ${orphanedOrders.length} ordens órfãs:`);
        orphanedOrders.forEach(order => {
          console.log(`- Ordem ID: ${order._id}, Code: ${order.code}, Machine ID: ${order.machine_id}`);
        });
      } else {
        console.log('\n✅ Nenhuma ordem órfã encontrada');
      }
    }
    
    // 5. Resumo
    console.log('\n📊 RESUMO:');
    console.log(`- Máquinas no MongoDB: ${machines.length}`);
    console.log(`- Registros de produção: ${productionRecords.length}`);
    console.log(`- Registros órfãos: ${orphanedRecords.length}`);
    console.log(`- Ordens de produção: ${productionOrders.length}`);
    console.log(`- Ordens órfãs: ${orphanedOrders ? orphanedOrders.length : 0}`);
    
    if (orphanedRecords.length > 0 || (orphanedOrders && orphanedOrders.length > 0)) {
      console.log('\n🔧 Para limpar os dados órfãos, execute: node clean-orphaned-records.js');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar registros:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

checkProductionRecords();