const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function connectToDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database');
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

function getDb() {
  if (!pool) throw new Error('Database connection not established');
  return pool;
}

module.exports = { connectToDatabase, getDb };