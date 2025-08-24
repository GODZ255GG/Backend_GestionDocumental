const { validationResult } = require('express-validator');
const Document = require('../models/Document'); // Usa model para queries

const documentController = {
  getAll: async (req, res) => {
    try {
      const docs = await Document.getAll();
      res.json(docs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting documents' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Document.getById(id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      res.json(doc);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting document' });
    }
  },

  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;
      const id = await Document.create(name, description);
      res.status(201).json({ message: 'Document created successfully', documentId: id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating document' });
    }
  },

  // controllers/documentController.js
  uploadVersion: async (req, res) => {
    try {
      const { documentoId } = req.params;
      const doc = await Document.getById(documentoId);
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      if (!req.file) {
        return res.status(400).json({ message: 'File is required and must be Word, PDF or image (≤10MB).' });
      }

      const fileBuffer = req.file.buffer;

      const versions = await Document.getVersions(documentoId);
      const lastVersion = versions.length ? versions[0].VersionNumber : 0;

      await Document.uploadVersion(documentoId, fileBuffer, lastVersion + 1);
      res.status(201).json({ message: 'New version uploaded', version: lastVersion + 1 });
    } catch (error) {
      // Si Multer pasó un error custom de tipo de archivo
      if (error?.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'Only Word, PDF and image files are allowed (≤10MB).' });
      }
      // Si excede tamaño, Multer lanza MulterError con code=LIMIT_FILE_SIZE
      if (error?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Max file size is 10MB.' });
      }

      console.error(error);
      res.status(500).json({ message: 'Error uploading version' });
    }
  },


  getVersions: async (req, res) => {
    try {
      const { documentoId } = req.params;
      const versions = await Document.getVersions(documentoId);
      res.json({ historial: versions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting versions' });
    }
  },

  downloadVersion: async (req, res) => {
    try {
      const { versionId } = req.params;
      const version = await Document.getVersionById(versionId);
      if (!version) return res.status(404).json({ message: 'Version not found' });

      res.setHeader('Content-Disposition', `attachment; filename=V${version.VersionNumber}_${version.Name}.docx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(version.File);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error downloading version' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Document.getById(id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      await Document.delete(id);
      res.json({ message: 'Document and all versions deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
};

module.exports = documentController;