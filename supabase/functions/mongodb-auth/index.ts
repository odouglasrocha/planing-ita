import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const client = new MongoClient();
  
  try {
    console.log('🔍 Authentication Edge Function called');
    const { email, password } = await req.json();
    console.log(`🔐 Authenticating user: ${email}`);
    
    // Get MongoDB configuration from environment variables
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    const MONGODB_DATABASE = Deno.env.get('MONGODB_DATABASE') || 'fabrica_ita';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 Database: ${MONGODB_DATABASE}`);
    await client.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    const db = client.database(MONGODB_DATABASE);
    const usersCollection = db.collection('users');
    console.log('📊 Database and collection accessed');

    // Find user by email
    const user = await usersCollection.findOne({ email });
    console.log(`👤 User found: ${user ? 'Yes' : 'No'}`);
    
    if (!user) {
      console.log('❌ User not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Credenciais inválidas' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    console.log('🔑 Verifying password...');
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔓 Password valid: ${isPasswordValid ? 'Yes' : 'No'}`);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Credenciais inválidas' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Authentication successful');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Autenticação realizada com sucesso',
        user: userWithoutPassword
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error in Authentication Function:', error);
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Failed to authenticate user',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  } finally {
    console.log('🔌 Closing MongoDB connection...');
    try {
      client.close();
      console.log('✅ MongoDB connection closed');
    } catch (closeError) {
      console.error('⚠️ Error closing MongoDB connection:', closeError);
    }
  }
});