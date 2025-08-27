const { getDb } = require('../config/database');

const Document = {
  create: async (name, description = '') => {
    const db = await getDb();
    const sql = `
      INSERT INTO Documents (Name, Description)
      VALUES (?, ?)
    `;
    const [result] = await db.query(sql, [name, description]);
    return result.insertId;
  },

  getById: async (id) => {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM Documents WHERE DocumentID = ?', [id]);
    return rows[0] || null;
  },

  getAll: async () => {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM Documents ORDER BY DocumentID DESC');
    return rows;
  },

  addToProcedure: async (procedureId, documentId) => {
    const db = await getDb();

    // evitar duplicados
    const [exists] = await db.query(
      'SELECT 1 FROM ProcedureDocuments WHERE ProcedureID = ? AND DocumentID = ? LIMIT 1',
      [procedureId, documentId]
    );
    if (exists.length) return;

    const sql = `
      INSERT INTO ProcedureDocuments (ProcedureID, DocumentID)
      VALUES (?, ?)
    `;
    await db.query(sql, [procedureId, documentId]);
    console.log('Associated documentId:', documentId, 'to procedureId:', procedureId);  // Log para debug
    return;
  },

  getByProcedure: async (procedureId) => {
    const db = await getDb();
    const sql = `
      SELECT d.*, MAX(dv.VersionNumber) AS VersionNumber, MAX(dv.UploadedAt) AS UpdatedAt
      FROM Documents d
      JOIN ProcedureDocuments pd ON pd.DocumentID = d.DocumentID
      LEFT JOIN DocumentVersions dv ON dv.DocumentID = d.DocumentID
      WHERE pd.ProcedureID = ?
      GROUP BY d.DocumentID
      ORDER BY pd.AddedAt DESC
    `;
    const [rows] = await db.query(sql, [procedureId]);
    return rows;
  },

  addVersion: async (documentId, fileBuffer, versionNumber) => {
    const db = await getDb();
    const sql = `
      INSERT INTO DocumentVersions (DocumentID, File, VersionNumber, UploadedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    const [result] = await db.query(sql, [documentId, fileBuffer, versionNumber]);
    return result.insertId;
  },

  getVersions: async (documentId) => {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM DocumentVersions WHERE DocumentID = ? ORDER BY UploadedAt DESC', [documentId]);
    return rows;
  },

  getVersionById: async (versionId) => {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM DocumentVersions WHERE VersionID = ?', [versionId]);
    return rows[0] || null;
  },

  delete: async (id) => {
    const db = await getDb();
    await db.query('DELETE FROM DocumentVersions WHERE DocumentID = ?', [id]);
    await db.query('DELETE FROM ProcedureDocuments WHERE DocumentID = ?', [id]);
    await db.query('DELETE FROM Documents WHERE DocumentID = ?', [id]);
    return;
  }
};

module.exports = Document;