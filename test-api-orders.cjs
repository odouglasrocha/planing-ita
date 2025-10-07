require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testOrdersAPI() {
  try {
    console.log('🧪 Testando API de ordens de produção...');
    
    // Usar JWT do arquivo .env
    const JWT_SECRET = process.env.JWT_SECRET;
    console.log('🔐 Usando JWT do arquivo .env...');
    
    // Criar token JWT válido
    const token = jwt.sign(
      { 
        userId: 'test-user-id',
        email: 'admin@fabrica.com',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ Token JWT criado com sucesso');
    
    // Agora testar a API de ordens
    console.log('📋 Buscando ordens de produção...');
    
    // Usar fetch nativo (Node.js 18+) ou implementar uma alternativa
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    function makeRequest(requestUrl, options = {}) {
      return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(requestUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const requestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.path,
          method: options.method || 'GET',
          headers: options.headers || {}
        };
        
        const req = protocol.request(requestOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            });
          });
        });
        
        req.on('error', reject);
        
        if (options.body) {
          req.write(options.body);
        }
        
        req.end();
      });
    }
    
    const ordersResponse = await makeRequest('http://localhost:3001/api/production-orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Orders API failed: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    console.log('📊 Resposta da API:');
    console.log(`- Success: ${ordersData.success}`);
    console.log(`- Total de ordens: ${ordersData.data ? ordersData.data.length : 0}`);
    
    if (ordersData.data && ordersData.data.length > 0) {
      console.log('\n📋 Primeiras 3 ordens:');
      ordersData.data.slice(0, 3).forEach((order, index) => {
        console.log(`${index + 1}. ${order.code || order.id} - ${order.product_name || 'Sem nome'} (Machine: ${order.machine_id || 'N/A'})`);
      });
    } else {
      console.log('❌ Nenhuma ordem encontrada na resposta da API');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testOrdersAPI();