import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoUser {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'operador';
}

const demoUsers: DemoUser[] = [
  { email: 'admin@fabrica.com', password: 'admin123', full_name: 'Administrador', role: 'admin' },
  { email: 'supervisor@fabrica.com', password: 'supervisor123', full_name: 'Supervisor', role: 'supervisor' },
  { email: 'operador@fabrica.com', password: 'operador123', full_name: 'Operador', role: 'operador' }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: MongoClient | null = null;
  
  try {
    console.log('🔍 Edge Function called, parsing request...');
    const requestBody = await req.json();
    console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
    
    const { action, email, password } = requestBody;
    
    // Get MongoDB configuration from environment variables
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    const MONGODB_DATABASE = Deno.env.get('MONGODB_DATABASE') || 'fabrica_ita';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 Database: ${MONGODB_DATABASE}`);
    client = new MongoClient();
    await client.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    const db = client.database(MONGODB_DATABASE);
    const usersCollection = db.collection('users');
    console.log('📊 Database and collection accessed');

    // Handle authentication request
    if (action === 'authenticate') {
      console.log(`🔐 Authenticating user: ${email}`);
      
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
      
      console.log('✅ Authentication successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Login realizado com sucesso',
          user: {
            _id: user._id,
            email: user.email,
            full_name: user.full_name,
            name: user.full_name,
            role: user.role,
            department: user.department,
            active: user.active !== false,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle seeding request (default action)
    console.log('🌱 Starting user seeding process...');
    
    const results: Array<{ email: string; action: string }> = [];
    
    for (const user of demoUsers) {
      const existingUser = await usersCollection.findOne({ email: user.email });
      
      if (existingUser) {
        console.log(`👤 User ${user.email} already exists, skipping...`);
        results.push({ email: user.email, action: 'skipped' });
      } else {
        console.log(`➕ Creating user: ${user.email}`);
        const hashedPassword = await bcrypt.hash(user.password);
        
        await usersCollection.insertOne({
          email: user.email,
          password: hashedPassword,
          full_name: user.full_name,
          role: user.role,
          department: 'Produção',
          active: true,
          name: user.full_name,
          created_at: new Date(),
          updated_at: new Date()
        });
        results.push({ email: user.email, action: 'created' });
      }
    }

    console.log('✅ User seed completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo users seeded successfully',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error in Edge Function:', error);
    console.error('📋 Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred',
        details: 'Failed to process request in MongoDB Edge Function',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  } finally {
    if (client) {
      console.log('🔌 Closing MongoDB connection...');
      try {
        client.close();
        console.log('✅ MongoDB connection closed');
      } catch (closeError) {
        console.error('⚠️ Error closing MongoDB connection:', closeError);
      }
    }
  }
});
