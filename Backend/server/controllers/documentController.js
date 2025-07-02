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
      const [docs] = await db.query('SELECT * FROM documentos');
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
      const [rows] = await db.query('SELECT * FROM documentos WHERE id = ?', [id]);

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
      const { nombre, descripcion } = req.body;
      const db = await getDb();

      const [result] = await db.query(
        'INSERT INTO documentos (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion || null]
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
      const [rows] = await db.query('SELECT id FROM documentos WHERE id = ?', [documentoId]);
      if (!rows.length) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Document not found' });
      }

      // Último número de versión
      const [versionRows] = await db.query(
        'SELECT MAX(version_number) AS lastVersion FROM document_versions WHERE documento_id = ?',
        [documentoId]
      );
      const lastVersion = versionRows[0].lastVersion || 0;

      // Lee archivo y guarda
      const archivoBuffer = fs.readFileSync(req.file.path);

      await db.query(
        `INSERT INTO document_versions (documento_id, archivo, version_number)
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
        `SELECT version_id, version_number, uploaded_at
         FROM document_versions
         WHERE documento_id = ?
         ORDER BY version_number DESC`,
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
        `SELECT d.nombre, dv.archivo, dv.version_number
         FROM document_versions dv
         JOIN documentos d ON dv.documento_id = d.id
         WHERE dv.version_id = ?`,
        [versionId]
      );

      if (!rows.length) {
        return res.status(404).json({ message: 'Version not found' });
      }

      const version = rows[0];
      res.setHeader('Content-Disposition', `attachment; filename=V${version.version_number}_${version.nombre}.docx`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      res.send(version.archivo);
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

      const [rows] = await db.query('SELECT * FROM documentos WHERE id = ?', [id]);
      if (!rows.length) {
        return res.status(404).json({ message: 'Document not found' });
      }

      await db.query('DELETE FROM documentos WHERE id = ?', [id]);
      res.json({ message: 'Document and all versions deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
};

module.exports = documentController;