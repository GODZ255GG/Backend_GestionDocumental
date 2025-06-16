const express = require('express');
const router = express.Router();
const {
    obtenerProcedimientos,
    crearProcedimiento,
    actualizarProcedimiento,
    eliminarProcedimiento,
    obtenerSubprocesos
} = require('../controllers/procedimientos.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', obtenerProcedimientos);
router.post('/', crearProcedimiento);
router.get('/subprocesos', obtenerSubprocesos);
router.put('/:id', actualizarProcedimiento);
router.delete('/:id', eliminarProcedimiento);

module.exports = router;