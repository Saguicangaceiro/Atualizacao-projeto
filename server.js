const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos do Frontend (se houver build)
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dutyfinder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDb() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Conectado ao MySQL com sucesso!');
  } catch (err) {
    console.error('Falha ao conectar ao MySQL. Rodando em modo de espera...', err.message);
  }
}

// API: Health Check
app.get('/api/status', (req, res) => {
  res.json({ status: pool ? 'connected' : 'disconnected' });
});

// API: Get All Data
app.get('/api/data', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not available' });
  try {
    const [users] = await pool.query('SELECT id, username, name, role, hasPortalAccess, extension, sectorId FROM users');
    const [inventory] = await pool.query('SELECT * FROM inventory');
    const [sectors] = await pool.query('SELECT * FROM sectors');
    const [extensions] = await pool.query('SELECT * FROM extensions');
    const [workOrders] = await pool.query('SELECT * FROM work_orders ORDER BY createdAt DESC');
    
    res.json({
      users, inventory, sectors, extensions, workOrders,
      materialRequests: [], 
      resourceRequests: [],
      purchaseOrders: [],
      usageLogs: [],
      stockEntries: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Outras rotas permanecem iguais...

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor DutyFinder rodando na porta ${PORT}`);
  });
});
