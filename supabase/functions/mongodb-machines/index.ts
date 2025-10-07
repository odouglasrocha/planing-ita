import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const MONGODB_URI = Deno.env.get('MONGODB_URI');
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not configured');
    return new Response(JSON.stringify({ error: 'MongoDB not configured', useFallback: true }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let client: MongoClient | null = null;

  try {
    const { action, data, id } = await req.json();
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('production_system');
    const collection = db.collection('machines');

    let result;

    switch (action) {
      case 'list':
        const machines = await collection.find({}).sort({ name: 1 }).toArray();
        result = machines.map(m => ({
          id: m._id.toString(),
          name: m.name,
          code: m.code,
          model: m.model || null,
          location: m.location || null,
          status: m.status,
          created_at: m.created_at.toISOString(),
          updated_at: m.updated_at.toISOString(),
        }));
        break;

      case 'create':
        const newMachine = {
          name: data.name,
          code: data.code,
          model: data.model || null,
          location: data.location || null,
          status: data.status || 'stopped',
          created_at: new Date(),
          updated_at: new Date(),
        };
        const insertResult = await collection.insertOne(newMachine);
        result = {
          id: insertResult.insertedId.toString(),
          ...newMachine,
          created_at: newMachine.created_at.toISOString(),
          updated_at: newMachine.updated_at.toISOString(),
        };
        break;

      case 'update':
        const updateData = {
          ...data,
          updated_at: new Date(),
        };
        delete updateData.id;
        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        const updated = await collection.findOne({ _id: new ObjectId(id) });
        result = {
          id: updated!._id.toString(),
          name: updated!.name,
          code: updated!.code,
          model: updated!.model || null,
          location: updated!.location || null,
          status: updated!.status,
          created_at: updated!.created_at.toISOString(),
          updated_at: updated!.updated_at.toISOString(),
        };
        break;

      case 'delete':
        await collection.deleteOne({ _id: new ObjectId(id) });
        result = { success: true };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ data: result, source: 'mongodb' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MongoDB error:', error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      useFallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});
