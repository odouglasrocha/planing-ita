const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkProductionOrders() {
  const mongoUri = process.env.VITE_MONGODB_URI;
  console.log('🔗 MongoDB URI:', mongoUri ? 'Found' : 'Not found');
  
  if (!mongoUri) {
    console.error('❌ VITE_MONGODB_URI not found in environment variables');
    return;
  }
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const database = client.db('Cluster0');
    
    // Check production_orders collection
    const ordersCollection = database.collection('production_orders');
    const ordersCount = await ordersCollection.countDocuments();
    console.log(`📊 Production Orders count: ${ordersCount}`);
    
    if (ordersCount > 0) {
      const orders = await ordersCollection.find({}).limit(5).toArray();
      console.log('📋 Sample orders:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.code} - ${order.product_name} (Machine: ${order.machine_id})`);
      });
    } else {
      console.log('❌ No production orders found in MongoDB');
    }
    
    // List all collections to see what exists
    const collections = await database.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkProductionOrders();