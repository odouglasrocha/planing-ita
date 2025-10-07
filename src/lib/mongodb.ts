// MongoDB connection setup for future migration
// SECURITY NOTE: This file is for reference only and should NOT be used directly in the frontend.
// All MongoDB operations MUST go through Supabase Edge Functions where the MONGODB_URI 
// secret is securely stored and accessed via Deno.env.get('MONGODB_URI')
import { MongoClient, Db, ObjectId } from 'mongodb';

// NEVER hardcode credentials - always use Supabase Secrets in Edge Functions
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured in Supabase Secrets');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      return {
        client,
        db: client.db('production_system'), // Database name
      };
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// MongoDB collections interfaces (for future migration)
export interface MongoProductionRecord {
  _id?: ObjectId;
  order_id: string;
  operator_id?: string | null;
  machine_id?: string | null;
  produced_quantity: number;
  reject_quantity: number;
  downtime_minutes: number;
  recorded_at: Date;
  created_at: Date;
  downtime_type_id?: string | null;
  downtime_start_time?: Date | null;
  downtime_end_time?: Date | null;
  downtime_description?: string | null;
}

export interface MongoMachine {
  _id?: ObjectId;
  name: string;
  code: string;
  model?: string;
  location?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MongoProductionOrder {
  _id?: ObjectId;
  code: string;
  product_name: string;
  planned_quantity: number;
  machine_id: string;
  status: string;
  shift: string;
  pallet_quantity?: number;
  created_at: Date;
  updated_at: Date;
}

// Collection names
export const Collections = {
  PRODUCTION_RECORDS: 'production_records',
  MACHINES: 'machines',
  PRODUCTION_ORDERS: 'production_orders',
  OPERATORS: 'operators',
  DOWNTIME_TYPES: 'downtime_types',
  MATERIAL_LOSSES: 'material_losses',
  LOSS_TYPES: 'loss_types',
  PROFILES: 'profiles',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;