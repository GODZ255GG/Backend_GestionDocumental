const { validationResult } = require('express-validator');
const fs = require('fs');
const { getDb } = require('../config/database');

const documentController = {
  /**
   * Obtener todos los documentos
   */
  getAll: async (req, res) => {
    try {
      const db = await getDb();
      const [docs] = await db.query('SELECT DocumentID, Name, UpdatedAt FROM Documents');
      res.json(docs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting documents' });
    }
  },

  /**
   * Obtener un documento por ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDb();
      const [rows] = await db.query('SELECT DocumentID, Name, UpdatedAt FROM Documents WHERE DocumentID = ?', [id]);

      if (!rows.length) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting document' });
    }
  },

  /**
   * Crear un documento base
   */
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;
      const db = await getDb();

      const [result] = await db.query(
        'INSERT INTO Documents (Name, Description) VALUES (?, ?)',
        [name, description || null]
      );

      res.status(201).json({
        message: 'Document created successfully',
        documentId: result.insertId
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating document' });
    }
  },

  /**
   * Subir una nueva versión
   */
  uploadVersion: async (req, res) => {
    try {
      const { documentoId } = req.params;
      const db = await getDb();

      // Verifica que exista
      const [rows] = await db.query('SELECT DocumentID FROM Documents WHERE DocumentID = ?', [documentoId]);
      if (!rows.length) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Document not found' });
      }

      // Último número de versión
      const [versionRows] = await db.query(
        'SELECT MAX(VersionNumber) AS lastVersion FROM DocumentVersions WHERE DocumentID = ?',
        [documentoId]
      );
      const lastVersion = versionRows[0].lastVersion || 0;

      // Lee archivo y guarda
      const archivoBuffer = fs.readFileSync(req.file.path);

      await db.query(
        `INSERT INTO DocumentVersions (DocumentID, File, VersionNumber)
         VALUES (?, ?, ?)`,
        [documentoId, archivoBuffer, lastVersion + 1]
      );

      fs.unlinkSync(req.file.path);

      res.status(201).json({
        message: 'New version uploaded',
        version: lastVersion + 1
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error uploading version' });
    }
  },

  /**
   * Obtener historial de versiones
   */
  getVersions: async (req, res) => {
    try {
      const { documentoId } = req.params;
      const db = await getDb();

      const [rows] = await db.query(
        `SELECT VersionID, VersionNumber, UploadedAt
         FROM DocumentVersions
         WHERE DocumentID = ?
         ORDER BY VersionNumber DESC`,
        [documentoId]
      );

      res.json({ historial: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting versions' });
    }
  },

  /**
   * Descargar versión específica
   */
  downloadVersion: async (req, res) => {
    try {
      const { versionId } = req.params;
      const db = await getDb();

      const [rows] = await db.query(
        `SELECT d.Name, dv.File, dv.VersionNumber
         FROM DocumentVersions dv
         JOIN Documents d ON dv.DocumentID = d.DocumentID
         WHERE dv.VersionID = ?`,
        [versionId]
      );

      if (!rows.length) {
        return res.status(404).json({ message: 'Version not found' });
      }

      const version = rows[0];
      res.setHeader('Content-Disposition', `attachment; filename=V${version.VersionNumber}_${version.Name}.docx`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      res.send(version.File);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error downloading version' });
    }
  },

  /**
   * Eliminar un documento (y sus versiones)
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDb();

      const [rows] = await db.query('SELECT DocumentID FROM Documents WHERE DocumentID = ?', [id]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Document not found' });
      }

      await db.query('DELETE FROM Documents WHERE DocumentID = ?', [id]);
      res.json({ message: 'Document and all versions deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
};

module.exports = documentController;