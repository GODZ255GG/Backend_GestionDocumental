const express = require('express');
const router = express.Router();
const procedimientoController = require('../controllers/procedimientoController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/', authenticateJWT, procedimientoController.crearProcedimiento);
router.get('/:id', authenticateJWT, procedimientoController.obtenerProcedimientoPorId);
router.get('/', authenticateJWT, procedimientoController.obtenerTodosProcedimientos);
router.put('/:id', authenticateJWT, procedimientoController.actualizarProcedimiento);
router.delete('/:id', authenticateJWT, procedimientoController.eliminarProcedimiento);

module.exports = router;