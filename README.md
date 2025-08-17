# 🚀 Expressglass Backend API

API backend para o Portal de Agendamento Expressglass usando Netlify Functions e PostgreSQL (Neon).

## 📋 **Funcionalidades**

### **🗓️ API de Agendamentos (`/api/appointments`)**
- **GET** `/api/appointments` - Listar todos os agendamentos
- **POST** `/api/appointments` - Criar novo agendamento
- **PUT** `/api/appointments/{id}` - Atualizar agendamento
- **DELETE** `/api/appointments/{id}` - Eliminar agendamento

### **📍 API de Localidades (`/api/localities`)**
- **GET** `/api/localities` - Listar todas as localidades
- **POST** `/api/localities` - Criar nova localidade

## 🛠️ **Tecnologias**

- **Netlify Functions** - Serverless backend
- **PostgreSQL (Neon)** - Base de dados na cloud
- **Node.js** - Runtime
- **pg** - Driver PostgreSQL

## ⚙️ **Configuração**

### **1. Variáveis de Ambiente**
```bash
DATABASE_URL=postgresql://neondb_owner:SENHA@ep-XXXXX-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### **2. Deploy no Netlify**
1. Conectar repositório GitHub
2. Configurar variável `DATABASE_URL`
3. Deploy automático

## 📊 **Estrutura de Dados**

### **Agendamento**
```javascript
{
  id: 123,
  date: "2025-08-19",           // YYYY-MM-DD ou null
  period: "Manhã",              // "Manhã" | "Tarde" ou null
  plate: "12-AB-34",            // Matrícula (obrigatório)
  car: "BMW X5",                // Modelo do carro (obrigatório)
  service: "PB",                // "PB" | "LT" | "OC" | "REP" | "POL"
  locality: "Braga",            // Localidade (obrigatório)
  status: "NE",                 // "NE" | "VE" | "ST"
  notes: "Observações...",      // Texto livre
  extra: "Dados extra...",      // Texto livre
  sortIndex: 1,                 // Ordem de exibição
  createdAt: "2025-08-17T...",  // Timestamp de criação
  updatedAt: "2025-08-17T..."   // Timestamp de atualização
}
```

### **Localidade**
```javascript
{
  id: 1,
  name: "Braga",
  color: "#34D399",
  created_at: "2025-08-17T..."
}
```

## 🔒 **Segurança**

- **CORS** configurado para aceitar qualquer origem
- **Validação** de dados obrigatórios
- **SSL** obrigatório para conexão à base de dados
- **Sanitização** de inputs (trim, uppercase)

## 🐛 **Tratamento de Erros**

### **Códigos de Status**
- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Dados inválidos
- **404** - Não encontrado
- **405** - Método não permitido
- **409** - Conflito (duplicado)
- **500** - Erro interno

### **Formato de Resposta**
```javascript
// Sucesso
{
  success: true,
  data: {...},
  message: "Operação realizada com sucesso"
}

// Erro
{
  success: false,
  error: "Descrição do erro",
  details: ["Lista de detalhes..."]
}
```

## 🧪 **Testes**

### **Testar Localmente**
```bash
npm install
netlify dev
```

### **Endpoints de Teste**
- `http://localhost:8888/api/appointments`
- `http://localhost:8888/api/localities`

## 📈 **Performance**

- **Connection Pooling** ativado no Neon
- **Índices** otimizados na base de dados
- **Queries** eficientes com ORDER BY
- **Transformação** de dados otimizada

## 🔄 **Sincronização**

A API garante sincronização em tempo real entre dispositivos:
- **Timestamps** automáticos (created_at, updated_at)
- **Dados consistentes** entre frontend e backend
- **Validação** rigorosa de integridade

---

**Desenvolvido para Expressglass** 🚗💎

