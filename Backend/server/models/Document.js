const { getDb } = require('../config/database');

class Document {
  static async create(name, fileBuffer) {
    try {
      const db = await getDb();
      const [result] = await db.query(
        `INSERT INTO documentos (nombre, archivo)
         VALUES (?, ?)`,
        [name, fileBuffer]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('ID must be a valid number');

      const db = await getDb();
      const [rows] = await db.query(
        `SELECT id, nombre, updated_at 
         FROM documentos
         WHERE id = ?`,
        [idNum]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async getFileById(id) {
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('ID must be a valid number');

      const db = await getDb();
      const [rows] = await db.query(
        `SELECT nombre, archivo
         FROM documentos
         WHERE id = ?`,
        [idNum]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in getFileById:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('ID must be a valid number');

      const db = await getDb();
      await db.query(
        `DELETE FROM documentos WHERE id = ?`,
        [idNum]
      );
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const db = await getDb();
      const [rows] = await db.query(
        `SELECT id, nombre, updated_at FROM documentos`
      );
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }
}

module.exports = Document;