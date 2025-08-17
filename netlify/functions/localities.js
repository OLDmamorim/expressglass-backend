const { Client } = require('pg');

// Configuração CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Função para conectar à base de dados
async function connectDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  await client.connect();
  return client;
}

exports.handler = async (event, context) => {
  // Tratar OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  let client;
  
  try {
    client = await connectDB();
    
    const method = event.httpMethod;
    
    switch (method) {
      case 'GET':
        // Listar todas as localidades
        const result = await client.query(`
          SELECT id, name, color, created_at
          FROM localities 
          ORDER BY name ASC
        `);
        
        // Transformar para formato esperado pelo frontend
        const localities = {};
        result.rows.forEach(row => {
          localities[row.name] = row.color;
        });
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: localities,
            list: result.rows
          })
        };
        
      case 'POST':
        // Criar nova localidade
        const newData = JSON.parse(event.body);
        
        if (!newData.name || !newData.color) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Nome e cor são obrigatórios'
            })
          };
        }
        
        // Verificar se já existe
        const existingResult = await client.query(
          'SELECT id FROM localities WHERE name = $1',
          [newData.name.trim()]
        );
        
        if (existingResult.rows.length > 0) {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Localidade já existe'
            })
          };
        }
        
        const insertResult = await client.query(`
          INSERT INTO localities (name, color)
          VALUES ($1, $2)
          RETURNING *
        `, [newData.name.trim(), newData.color]);
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: insertResult.rows[0],
            message: 'Localidade criada com sucesso'
          })
        };
        
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Método não permitido'
          })
        };
    }
    
  } catch (error) {
    console.error('Erro na API de localidades:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
    
  } finally {
    if (client) {
      await client.end();
    }
  }
};

