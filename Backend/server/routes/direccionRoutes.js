const express = require('express');
const router = express.Router();
const direccionController = require('../controllers/direccionController');
const { authenticateJWT } = require('../middleware/auth');

// Rutas para manejar operaciones CRUD de direcciones
// Todas las rutas requieren autenticación mediante JWT

// Obtener todas las direcciones
router.get('/', authenticateJWT, direccionController.obtenerTodasDirecciones);

// Obtener una dirección específica por ID
router.get('/:id', authenticateJWT, direccionController.obtenerDireccionPorId);

// Crear una nueva dirección
router.post('/', authenticateJWT, direccionController.crearDireccion);

// Actualizar una dirección existente
router.put('/:id', authenticateJWT, direccionController.actualizarDireccion);

// Eliminar una dirección
router.delete('/:id', authenticateJWT, direccionController.eliminarDireccion);

module.exports = router;