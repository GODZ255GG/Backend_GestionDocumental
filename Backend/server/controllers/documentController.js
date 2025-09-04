const { validationResult } = require('express-validator');
const Document = require('../models/Document');

const documentController = {
  getAll: async (req, res) => {
    try {
      const docs = await Document.getAll();
      res.json(docs);
    } catch (error) {
      console.error('getAll error:', error);
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
      console.error('getById error:', error);
      res.status(500).json({ message: 'Error getting document' });
    }
  },

  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;
      const id = await Document.create(name, description || null);
      res.status(201).json({ message: 'Document created successfully', documentId: id });
    } catch (error) {
      console.error('create error:', error);
      res.status(500).json({ message: 'Error creating document' });
    }
  },


viewDocument: async (req, res) => {
    try {
        const { documentoId } = req.params;
        const latestVersion = await Document.getLatestVersion(documentoId);

        if (!latestVersion) {
            return res.status(404).json({ message: 'Documento o versión no encontrada' });
        }

        // Configura la cabecera para que el navegador lo muestre (inline)
        res.setHeader('Content-Type', latestVersion.MimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${latestVersion.Name}"`);
        res.send(latestVersion.File);

    } catch (error) {
        console.error('Error viewing document:', error);
        res.status(500).json({ message: 'Error del servidor al visualizar el documento' });
    }
},


  uploadVersion: async (req, res) => {
  try {
    const { documentoId } = req.params;
    const doc = await Document.getById(documentoId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!req.file) return res.status(400).json({ message: 'File is required...' });

    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype; // Get the mimetype from the request

    const versions = await Document.getVersions(documentoId);
    const lastVersion = versions.length ? versions[0].VersionNumber : 0;
    const nextVersion = lastVersion + 1;

    await Document.addVersion(documentoId, fileBuffer, nextVersion, mimetype); // Pass the mimetype

    res.status(201).json({ message: 'New version uploaded', version: nextVersion });
  } catch (error) {
      if (error.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'Only Word, PDF and image files are allowed (≤10MB).' });
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Max file size is 10MB.' });
      }
      console.error('uploadVersion error:', error);
      res.status(500).json({ message: 'Error uploading version' });
    }
  },

  getVersions: async (req, res) => {
    try {
      const { documentoId } = req.params;
      const versions = await Document.getVersions(documentoId);
      res.json({ historial: versions });
    } catch (error) {
      console.error('getVersions error:', error);
      res.status(500).json({ message: 'Error getting versions' });
    }
  },

  downloadLatestVersion: async (req, res) => {
    try {
        const { documentoId } = req.params;
        const latestVersion = await Document.getLatestVersion(documentoId);

        if (!latestVersion) {
            return res.status(404).json({ message: 'Documento o versión no encontrada' });
        }

        res.setHeader('Content-Type', latestVersion.MimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${latestVersion.Name}"`);
        res.send(latestVersion.File);

    } catch (error) {
        console.error('Error downloading latest version:', error);
        res.status(500).json({ message: 'Error del servidor al descargar el documento' });
    }
},

  downloadVersion: async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await Document.getVersionById(versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    // 1) MimeType real (si falta, usa octet-stream)
    const mime = version.MimeType || 'application/octet-stream';

    // 2) Extensión por mimetype (si no se reconoce, sin extensión)
    const ext = (() => {
      switch ((mime || '').toLowerCase()) {
        case 'application/pdf': return '.pdf';
        case 'application/msword': return '.doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '.docx';
        case 'image/jpeg':
        case 'image/jpg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/bmp': return '.bmp';
        case 'image/webp': return '.webp';
        default: return '';
      }
    })();

    // 3) Nombre base: intenta usar version.Name si existiera; si no, algo genérico
    const rawBase = version.Name || `documento_v${version.VersionNumber || ''}`;
    // Sanea caracteres problemáticos para cabecera HTTP
    const safeBase = String(rawBase).replace(/[\\\/:*?"<>|\r\n]+/g, '').trim() || 'archivo';

    // 4) Filename final
    const filename = `${safeBase}${ext}`;

    // 5) Cabeceras
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    // Exponer cabeceras no simples para que el front pueda leer filename/mime si usa fetch+blob
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');

    // (Opcional) Content-Length si tienes un Buffer
    if (version.File && Buffer.isBuffer(version.File)) {
      res.setHeader('Content-Length', version.File.length);
    }

    // 6) Enviar binario
    res.send(version.File);
  } catch (error) {
    console.error('downloadVersion error:', error);
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
      console.error('delete error:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
};

module.exports = documentController;