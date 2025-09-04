// routes/documentRoutes.js
const express = require('express');
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

const router = express.Router();

const storage = multer.memoryStorage();

// Tipos permitidos
const ALLOWED_MIMES = new Set([
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'image/jpeg',
    'image/png',
    'image/bmp',
    'image/webp'
]);

const EXT_OK = /\.(pdf|docx?|jpe?g|png|bmp|webp)$/i;

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Algunos navegadores suben DOCX como octet-stream: validamos por extensión como fallback
        const ok = ALLOWED_MIMES.has(file.mimetype) || EXT_OK.test(file.originalname);
        if (ok) return cb(null, true);
        const err = new Error('INVALID_FILE_TYPE');
        err.statusCode = 400;
        return cb(err);
    },
});

// Crear documento base
router.post('/documents', authenticateJWT, documentController.create);

// Subir versión (con file) — con validación y límite
router.post('/documents/:documentoId/versions',
    authenticateJWT,
    upload.single('file'),
    documentController.uploadVersion
);


// Para visualizar el documento en el navegador
router.get('/documents/:documentoId/view', authenticateJWT, documentController.viewDocument);

// Mantiene la ruta de descarga para el botón "Descargar"
router.get('/documents/:documentoId/download', authenticateJWT, documentController.downloadLatestVersion);

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
