// Exemplo de como será a migração futura para MongoDB
// Este arquivo é apenas para referência e não está sendo usado atualmente

import { connectToDatabase, Collections, MongoProductionRecord } from './mongodb';
import { ObjectId } from 'mongodb';

// Exemplo de hook que pode ser usado no futuro com MongoDB
export const useMongoProductionRecords = () => {
  
  const createDowntimeRecordMongo = async (downtimeData: {
    order_id: string;
    operator_id?: string | null;
    machine_id: string;
    downtime_type_id: string;
    downtime_start_time: string;
    downtime_end_time: string;
    downtime_description?: string;
  }) => {
    try {
      const { db } = await connectToDatabase();
      
      // Calculate downtime minutes
      const startTime = new Date(downtimeData.downtime_start_time);
      const endTime = new Date(downtimeData.downtime_end_time);
      const downtimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      const recordData: MongoProductionRecord = {
        order_id: downtimeData.order_id,
        operator_id: downtimeData.operator_id || null,
        machine_id: downtimeData.machine_id,
        produced_quantity: 0,
        reject_quantity: 0,
        downtime_minutes: downtimeMinutes,
        recorded_at: new Date(),
        created_at: new Date(),
        downtime_type_id: downtimeData.downtime_type_id,
        downtime_description: downtimeData.downtime_description || null,
      };

      const result = await db.collection(Collections.PRODUCTION_RECORDS).insertOne(recordData);
      
      return {
        ...recordData,
        _id: result.insertedId.toString()
      };
    } catch (error) {
      console.error('Error creating downtime record in MongoDB:', error);
      throw error;
    }
  };

  const fetchRecordsMongo = async (orderId?: string) => {
    try {
      const { db } = await connectToDatabase();
      
      let query = {};
      if (orderId) {
        query = { order_id: orderId };
      }

      const records = await db.collection(Collections.PRODUCTION_RECORDS)
        .find(query)
        .sort({ recorded_at: -1 })
        .toArray();

      return records.map(record => ({
        ...record,
        id: record._id.toString(),
      }));
    } catch (error) {
      console.error('Error fetching production records from MongoDB:', error);
      throw error;
    }
  };

  return {
    createDowntimeRecordMongo,
    fetchRecordsMongo
  };
};

// Funções utilitárias para migração de dados
export const migrateFromSupabaseToMongo = {
  
  // Migrar registros de produção
  migrateProductionRecords: async (supabaseRecords: any[]) => {
    const { db } = await connectToDatabase();
    
    const mongoRecords = supabaseRecords.map(record => ({
      order_id: record.order_id,
      operator_id: record.operator_id,
      machine_id: record.machine_id,
      produced_quantity: record.produced_quantity,
      reject_quantity: record.reject_quantity,
      downtime_minutes: record.downtime_minutes,
      recorded_at: new Date(record.recorded_at),
      created_at: new Date(record.created_at),
      downtime_type_id: record.downtime_type_id,
      downtime_start_time: record.downtime_start_time ? new Date(record.downtime_start_time) : null,
      downtime_end_time: record.downtime_end_time ? new Date(record.downtime_end_time) : null,
      downtime_description: record.downtime_description,
    }));

    await db.collection(Collections.PRODUCTION_RECORDS).insertMany(mongoRecords);
  },

  // Migrar máquinas
  migrateMachines: async (supabaseMachines: any[]) => {
    const { db } = await connectToDatabase();
    
    const mongoMachines = supabaseMachines.map(machine => ({
      name: machine.name,
      code: machine.code,
      model: machine.model,
      location: machine.location,
      status: machine.status,
      created_at: new Date(machine.created_at),
      updated_at: new Date(machine.updated_at),
    }));

    await db.collection(Collections.MACHINES).insertMany(mongoMachines);
  },

  // Migrar ordens de produção
  migrateProductionOrders: async (supabaseOrders: any[]) => {
    const { db } = await connectToDatabase();
    
    const mongoOrders = supabaseOrders.map(order => ({
      code: order.code,
      product_name: order.product_name,
      planned_quantity: order.planned_quantity,
      machine_id: order.machine_id,
      status: order.status,
      shift: order.shift,
      pallet_quantity: order.pallet_quantity,
      created_at: new Date(order.created_at),
      updated_at: new Date(order.updated_at),
    }));

    await db.collection(Collections.PRODUCTION_ORDERS).insertMany(mongoOrders);
  }
};