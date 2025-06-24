const express = require('express');
const { check } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const direccionController = require('../controllers/direccionController');

const router = express.Router();
const validarDireccion = [
  check('nombre').notEmpty().withMessage('El nombre es requerido'),
  check('descripcion').optional(),
  check('jefeId').optional().isInt().withMessage('El jefeId debe ser un número'),
  check('secretaria').optional()
];

// Rutas
router.get('/', authenticateJWT, direccionController.obtenerTodas);
router.get('/:id', authenticateJWT, direccionController.obtenerPorId);
router.post('/', authenticateJWT, validarDireccion, direccionController.crear);
router.put('/:id', authenticateJWT, validarDireccion, direccionController.actualizar);
router.delete('/:id', authenticateJWT, direccionController.eliminar);

module.exports = router;