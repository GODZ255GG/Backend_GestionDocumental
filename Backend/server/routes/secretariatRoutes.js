const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.query('SELECT SecretariatID, Name FROM Secretariats');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching secretariats' });
  }
});

module.exports = router;