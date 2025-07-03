const express = require('express');
const { check } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const subprocessController = require('../controllers/subprocessController');

const router = express.Router();

// Validaciones comunes
const validateSubprocess = [
    check('name').notEmpty().withMessage('Name is required'),
    check('description').optional(),
    check('departmentId').isInt().withMessage('Department ID must be a number')
];

// Rutas CRUD
router.get('/', authenticateJWT, subprocessController.getAll);
router.get('/department/:departmentId', authenticateJWT, subprocessController.getByDepartment);
router.get('/:id', authenticateJWT, subprocessController.getById);
router.post('/', authenticateJWT, validateSubprocess, subprocessController.create);
router.put('/:id', authenticateJWT, validateSubprocess, subprocessController.update);
router.delete('/:id', authenticateJWT, subprocessController.delete);

module.exports = router;