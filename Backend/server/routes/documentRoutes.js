const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const authenticateJWT = require('../middleware/auth'); // Asume middleware auth existe

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Crear documento base
router.post('/documents', authenticateJWT, documentController.create);

// Subir versión (con file)
router.post('/documents/:documentoId/versions', authenticateJWT, upload.single('file'), documentController.uploadVersion);

// Get all docs
router.get('/documents', authenticateJWT, documentController.getAll);

// Get by ID
router.get('/documents/:id', authenticateJWT, documentController.getById);

// Get versions
router.get('/documents/:documentoId/versions', authenticateJWT, documentController.getVersions);

// Download version
router.get('/documents/versions/:versionId/download', authenticateJWT, documentController.downloadVersion);

// Delete doc
router.delete('/documents/:id', authenticateJWT, documentController.delete);

module.exports = router;