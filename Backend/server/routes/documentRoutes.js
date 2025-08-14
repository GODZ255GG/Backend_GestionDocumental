const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { getDb } = require('../config/database');

const router = express.Router();

// Configuración de multer
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const db = await getDb();

    const archivoBuffer = fs.readFileSync(req.file.path);

    const [result] = await db.query(
      'INSERT INTO Documents (Name, File) VALUES (?, ?)',
      [req.file.originalname, archivoBuffer]
    );

    fs.unlinkSync(req.file.path);

    res.json({ message: 'Archivo Word guardado como BLOB!', documentId: result.insertId });
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
      'SELECT Name, File FROM Documents WHERE DocumentID = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Archivo no encontrado');
    }

    const doc = rows[0];

    res.setHeader('Content-Disposition', `attachment; filename=${doc.Name}`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    res.send(doc.File);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al descargar archivo');
  }
});

router.post('/upload-version/:documentId', upload.single('file'), async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const db = await getDb();

    const [docRows] = await db.query('SELECT DocumentID FROM Documents WHERE DocumentID = ?', [documentId]);
    if (!docRows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(404).send('Documento no encontrado');
    }

    const [versionRows] = await db.query(
      `SELECT MAX(VersionNumber) AS lastVersion FROM DocumentVersions WHERE DocumentID = ?`,
      [documentId]
    );
    const lastVersion = versionRows[0].lastVersion || 0;

    const archivoBuffer = fs.readFileSync(req.file.path);

    await db.query(
      `INSERT INTO DocumentVersions (DocumentID, File, VersionNumber)
       VALUES (?, ?, ?)`,
      [documentId, archivoBuffer, lastVersion + 1]
    );

    fs.unlinkSync(req.file.path);

    res.json({ message: 'Nueva versión guardada', version: lastVersion + 1 });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al subir nueva versión');
  }
});

router.get('/document/:documentId/versions', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const db = await getDb();

    const [rows] = await db.query(
      `SELECT VersionID, VersionNumber, UploadedAt
       FROM DocumentVersions
       WHERE DocumentID = ?
       ORDER BY VersionNumber DESC`,
      [documentId]
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
      `SELECT d.Name, dv.File, dv.VersionNumber
       FROM DocumentVersions dv
       JOIN Documents d ON dv.DocumentID = d.DocumentID
       WHERE dv.VersionID = ?`,
      [versionId]
    );

    if (!rows.length) {
      return res.status(404).send
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