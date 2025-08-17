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

// Função para validar dados do agendamento
function validateAppointment(data) {
  const errors = [];
  
  if (!data.plate || typeof data.plate !== 'string' || data.plate.trim().length === 0) {
    errors.push('Matrícula é obrigatória');
  }
  
  if (!data.car || typeof data.car !== 'string' || data.car.trim().length === 0) {
    errors.push('Modelo do carro é obrigatório');
  }
  
  if (!data.service || !['PB', 'LT', 'OC', 'REP', 'POL'].includes(data.service)) {
    errors.push('Tipo de serviço inválido');
  }
  
  if (!data.locality || typeof data.locality !== 'string' || data.locality.trim().length === 0) {
    errors.push('Localidade é obrigatória');
  }
  
  if (!data.status || !['NE', 'VE', 'ST'].includes(data.status)) {
    errors.push('Status inválido');
  }
  
  if (data.period && !['Manhã', 'Tarde'].includes(data.period)) {
    errors.push('Período inválido');
  }
  
  return errors;
}

// Função para transformar dados do frontend para backend
function transformToBackend(data) {
  return {
    date: data.date || null,
    period: data.period || null,
    plate: data.plate?.toUpperCase().trim(),
    car: data.car?.trim(),
    service: data.service,
    locality: data.locality?.trim(),
    status: data.status || 'NE',
    notes: data.notes?.trim() || null,
    extra: data.extra?.trim() || null,
    sort_index: data.sortIndex || data.sort_index || 1
  };
}

// Função para transformar dados do backend para frontend
function transformToFrontend(row) {
  return {
    id: row.id,
    date: row.date ? row.date.toISOString().split('T')[0] : null,
    period: row.period,
    plate: row.plate,
    car: row.car,
    service: row.service,
    locality: row.locality,
    status: row.status,
    notes: row.notes,
    extra: row.extra,
    sortIndex: row.sort_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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
    const path = event.path;
    const pathParts = path.split('/');
    const appointmentId = pathParts[pathParts.length - 1];
    
    switch (method) {
      case 'GET':
        // Listar todos os agendamentos
        const result = await client.query(`
          SELECT * FROM appointments 
          ORDER BY 
            CASE WHEN date IS NULL THEN 1 ELSE 0 END,
            date ASC, 
            period ASC, 
            sort_index ASC
        `);
        
        const appointments = result.rows.map(transformToFrontend);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: appointments
          })
        };
        
      case 'POST':
        // Criar novo agendamento
        const newData = JSON.parse(event.body);
        const validationErrors = validateAppointment(newData);
        
        if (validationErrors.length > 0) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Dados inválidos',
              details: validationErrors
            })
          };
        }
        
        const transformedData = transformToBackend(newData);
        
        const insertResult = await client.query(`
          INSERT INTO appointments (date, period, plate, car, service, locality, status, notes, extra, sort_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          transformedData.date,
          transformedData.period,
          transformedData.plate,
          transformedData.car,
          transformedData.service,
          transformedData.locality,
          transformedData.status,
          transformedData.notes,
          transformedData.extra,
          transformedData.sort_index
        ]);
        
        const newAppointment = transformToFrontend(insertResult.rows[0]);
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: newAppointment,
            message: 'Agendamento criado com sucesso'
          })
        };
        
      case 'PUT':
        // Atualizar agendamento existente
        if (!appointmentId || appointmentId === 'appointments') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'ID do agendamento é obrigatório'
            })
          };
        }
        
        const updateData = JSON.parse(event.body);
        const updateValidationErrors = validateAppointment(updateData);
        
        if (updateValidationErrors.length > 0) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Dados inválidos',
              details: updateValidationErrors
            })
          };
        }
        
        const transformedUpdateData = transformToBackend(updateData);
        
        const updateResult = await client.query(`
          UPDATE appointments 
          SET date = $1, period = $2, plate = $3, car = $4, service = $5, 
              locality = $6, status = $7, notes = $8, extra = $9, sort_index = $10,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          RETURNING *
        `, [
          transformedUpdateData.date,
          transformedUpdateData.period,
          transformedUpdateData.plate,
          transformedUpdateData.car,
          transformedUpdateData.service,
          transformedUpdateData.locality,
          transformedUpdateData.status,
          transformedUpdateData.notes,
          transformedUpdateData.extra,
          transformedUpdateData.sort_index,
          appointmentId
        ]);
        
        if (updateResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Agendamento não encontrado'
            })
          };
        }
        
        const updatedAppointment = transformToFrontend(updateResult.rows[0]);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: updatedAppointment,
            message: 'Agendamento atualizado com sucesso'
          })
        };
        
      case 'DELETE':
        // Eliminar agendamento
        if (!appointmentId || appointmentId === 'appointments') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'ID do agendamento é obrigatório'
            })
          };
        }
        
        const deleteResult = await client.query(
          'DELETE FROM appointments WHERE id = $1 RETURNING *',
          [appointmentId]
        );
        
        if (deleteResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'Agendamento não encontrado'
            })
          };
        }
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento eliminado com sucesso'
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
    console.error('Erro na API de agendamentos:', error);
    
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

