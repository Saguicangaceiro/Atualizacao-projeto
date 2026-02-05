const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do banco vinda das variáveis de ambiente do Docker
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dutyfinder'
};

let pool;

async function initDb() {
  pool = await mysql.createPool(dbConfig);
}

// Rota principal para carregar todo o estado da aplicação
app.get('/api/data', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, name, role, hasPortalAccess, extension, sectorId FROM users');
    const [inventory] = await pool.query('SELECT * FROM inventory');
    const [sectors] = await pool.query('SELECT * FROM sectors');
    const [extensions] = await pool.query('SELECT * FROM extensions');
    const [workOrders] = await pool.query('SELECT * FROM work_orders ORDER BY createdAt DESC');
    
    // Simplificando: Retornamos as principais entidades. O frontend mapeia o resto.
    res.json({
      users, inventory, sectors, extensions, workOrders,
      materialRequests: [], // Seria necessário queries complexas ou joins para cada
      resourceRequests: [],
      purchaseOrders: [],
      usageLogs: [],
      stockEntries: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemplo de CRUD: Usuários
app.post('/api/users', async (req, res) => {
  const { name, username, password, role, hasPortalAccess, extension, sectorId } = req.body;
  const id = require('crypto').randomUUID();
  try {
    await pool.query(
      'INSERT INTO users (id, name, username, password, role, hasPortalAccess, extension, sectorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, username, password, role, hasPortalAccess, extension, sectorId]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemplo de CRUD: Ordens de Serviço
app.post('/api/work-orders', async (req, res) => {
  const { title, description, priority, requesterName, needsMaterials } = req.body;
  const id = require('crypto').randomUUID();
  const status = needsMaterials ? 'PREPARAÇÃO' : 'EM ANDAMENTO';
  try {
    await pool.query(
      'INSERT INTO work_orders (id, title, description, priority, status, requesterName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, priority, status, requesterName, Date.now()]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
});
