const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');

const router = express.Router();

// Configuración de multer
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const db = await getDb();

    const archivoBuffer = fs.readFileSync(req.file.path);

    await db.query(
      'INSERT INTO documentos (nombre, archivo) VALUES (?, ?)',
      [req.file.originalname, archivoBuffer]
    );

    fs.unlinkSync(req.file.path);

    res.json({ message: 'Archivo Word guardado como BLOB!' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al guardar archivo');
  }
});

// Ruta: descargar archivo por ID
router.get('/download/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const db = await getDb();
    const [rows] = await db.query(
      'SELECT nombre, archivo FROM documentos WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Archivo no encontrado');
    }

    const doc = rows[0];

    res.setHeader('Content-Disposition', `attachment; filename=${doc.nombre}`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    res.send(doc.archivo);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al descargar archivo');
  }
});

router.post('/upload-version/:documentoId', upload.single('file'), async (req, res) => {
  try {
    const documentoId = req.params.documentoId;
    const db = await getDb();

    const [docRows] = await db.query('SELECT id FROM documentos WHERE id = ?', [documentoId]);
    if (!docRows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(404).send('Documento no encontrado');
    }

    const [versionRows] = await db.query(
      `SELECT MAX(version_number) AS lastVersion FROM document_versions WHERE documento_id = ?`,
      [documentoId]
    );
    const lastVersion = versionRows[0].lastVersion || 0;

    const archivoBuffer = fs.readFileSync(req.file.path);

    await db.query(
      `INSERT INTO document_versions (documento_id, archivo, version_number)
       VALUES (?, ?, ?)`,
      [documentoId, archivoBuffer, lastVersion + 1]
    );

    fs.unlinkSync(req.file.path);

    res.json({ message: 'Nueva versión guardada', version: lastVersion + 1 });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al subir nueva versión');
  }
});

router.get('/document/:documentoId/versions', async (req, res) => {
  try {
    const documentoId = req.params.documentoId;
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
    res.status(500).send('Error al obtener historial');
  }
});

router.get('/download-version/:versionId', async (req, res) => {
  try {
    const versionId = req.params.versionId;
    const db = await getDb();

    const [rows] = await db.query(
      `SELECT d.nombre, dv.archivo, dv.version_number
       FROM document_versions dv
       JOIN documentos d ON dv.documento_id = d.id
       WHERE dv.version_id = ?`,
      [versionId]
    );

    if (!rows.length) {
      return res.status(404).send('Versión no encontrada');
    }

    const version = rows[0];
    res.setHeader('Content-Disposition', `attachment; filename=V${version.version_number}_${version.nombre}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(version.archivo);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al descargar versión');
  }
});

module.exports = router;