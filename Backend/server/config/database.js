const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT), // ← importante convertir a número
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};


let pool;

async function connectToDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Conectado a SQL Server');
    return pool;
  } catch (err) {
    console.error('Error de conexión a la base de datos:', err);
    throw err;
  }
}

function getDb() {
  if (!pool) throw new Error('No se ha establecido conexión a la base de datos');
  return pool;
}

module.exports = { connectToDatabase, getDb };