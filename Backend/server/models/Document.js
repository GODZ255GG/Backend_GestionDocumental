const { getDb } = require('../config/database');

class Document {
  static async getAll() {
    const db = await getDb();
    const [rows] = await db.query('SELECT DocumentID, Name, Description, UpdatedAt FROM Documents');
    return rows;
  }

  static async getById(id) {
    const db = await getDb();
    const [rows] = await db.query('SELECT DocumentID, Name, Description, UpdatedAt FROM Documents WHERE DocumentID = ?', [id]);
    return rows[0];
  }

  static async create(name, description) {
    const db = await getDb();
    const [result] = await db.query(
      'INSERT INTO Documents (Name, Description) VALUES (?, ?)',
      [name, description || null]
    );
    return result.insertId;
  }

  static async uploadVersion(documentId, fileBuffer, versionNumber) {
    const db = await getDb();
    await db.query(
      'INSERT INTO DocumentVersions (DocumentID, File, VersionNumber) VALUES (?, ?, ?)',
      [documentId, fileBuffer, versionNumber]
    );
  }

  static async getVersions(documentId) {
    const db = await getDb();
    const [rows] = await db.query(
      'SELECT VersionID, VersionNumber, UploadedAt FROM DocumentVersions WHERE DocumentID = ? ORDER BY VersionNumber DESC',
      [documentId]
    );
    return rows;
  }

  static async getVersionById(versionId) {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT d.Name, dv.File, dv.VersionNumber
       FROM DocumentVersions dv
       JOIN Documents d ON dv.DocumentID = d.DocumentID
       WHERE dv.VersionID = ?`,
      [versionId]
    );
    return rows[0];
  }

  static async delete(id) {
    const db = await getDb();
    await db.query('DELETE FROM Documents WHERE DocumentID = ?', [id]);
  }

  // Para asociación con procedures
  static async addToProcedure(procedureId, documentId) {
    const db = await getDb();
    await db.query(
      'INSERT IGNORE INTO ProcedureDocuments (ProcedureID, DocumentID) VALUES (?, ?)',
      [procedureId, documentId]
    );
  }

  static async getByProcedure(procedureId) {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT d.DocumentID, d.Name, d.Description, d.UpdatedAt,
       (SELECT MAX(VersionNumber) FROM DocumentVersions WHERE DocumentID = d.DocumentID) AS VersionNumber
       FROM Documents d
       JOIN ProcedureDocuments pd ON d.DocumentID = pd.DocumentID
       WHERE pd.ProcedureID = ?`,
      [procedureId]
    );
    return rows;
  }
}

module.exports = Document;