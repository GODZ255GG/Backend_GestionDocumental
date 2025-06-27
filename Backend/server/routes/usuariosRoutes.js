const express = require('express');
const { check } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

// Validaciones
const validarUsuario = [
    check('nombre').notEmpty().withMessage('El nombre es requerido'),
    check('email').isEmail().withMessage('Email no válido'),
    check('rol').notEmpty().withMessage('El rol es requerido'),
    check('password')
        .if((value, { req }) => req.method === 'POST' || (req.method === 'PUT' && value))
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Rutas
router.get('/', authenticateJWT, usuarioController.obtenerTodos);
router.get('/jefes', authenticateJWT, usuarioController.obtenerJefes);
router.get('/:id', authenticateJWT, usuarioController.obtenerPorId);
router.post('/', authenticateJWT, validarUsuario, usuarioController.crear);
router.put('/:id', authenticateJWT, validarUsuario, usuarioController.actualizar);
router.delete('/:id', authenticateJWT, usuarioController.eliminar);

module.exports = router;