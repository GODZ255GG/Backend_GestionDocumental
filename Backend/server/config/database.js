const mysql = require('mysql2/promise');
require('dotenv').config();  // Asegura dotenv carga aquí también para test

console.log('DB config:', {
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});  // Log para debug creds

const config = {
  host: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'DocumentManagement',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(config);

async function connectToDatabase() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

module.exports = { connectToDatabase, getDb: () => pool };