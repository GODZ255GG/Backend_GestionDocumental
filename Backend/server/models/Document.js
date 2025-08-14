const { getDb } = require('../config/database');

class Document {
  static async create(name, fileBuffer) {
    const db = await getDb();
    const [result] = await db.query(
      `INSERT INTO Documents (Name, File)
        VALUES (?, ?)`,
      [name, fileBuffer]
    );
    return result.insertId;
  }

  static async createVersion(documentId, fileBuffer) {
    const db = await getDb();
    const [versionRows] = await db.query(
      `SELECT MAX(VersionNumber) as maxVersion 
        FROM DocumentVersions 
        WHERE DocumentID = ?`,
      [documentId]
    );

    const newVersion = (versionRows[0].maxVersion || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO DocumentVersions (DocumentID, File, VersionNumber)
        VALUES (?, ?, ?)`,
      [documentId, fileBuffer, newVersion]
    );
    return newVersion;
  }

  static async getById(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) throw new Error('ID must be a valid number');

    const db = await getDb();
    const [rows] = await db.query(
      `SELECT DocumentID, Name, UpdatedAt 
        FROM Documents
        WHERE DocumentID = ?`,
      [idNum]
    );
    return rows[0];
  }

  static async getFileById(id) {
    try {
      const idNum = Number(id);
      if (isNaN(idNum)) throw new Error('ID must be a valid number');

      const db = await getDb();
      const [rows] = await db.query(
        `SELECT Name, File
          FROM Documents
          WHERE DocumentID = ?`,
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
        `DELETE FROM Documents WHERE DocumentID = ?`,
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
        `SELECT DocumentID, Name, UpdatedAt FROM Documents`
      );
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }
}

module.exports = Document;