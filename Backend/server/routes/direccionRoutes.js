const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Implementación temporal
  res.json([{ id: 1, nombre: 'Dirección de prueba' }]);
});

module.exports = router;