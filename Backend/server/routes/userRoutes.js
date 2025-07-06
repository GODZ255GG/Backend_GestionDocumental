const express = require('express');
const { check } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Validations
const validateUser = [
    check('name').notEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Invalid email'),
    check('role').notEmpty().withMessage('Role is required'),
    check('password')
        .if((value, { req }) => req.method === 'POST' || (req.method === 'PUT' && value))
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.get('/', authenticateJWT, userController.getAll);
router.get('/department-heads', authenticateJWT, validateUser, userController.getDepartmentHeads);
router.get('/:id', authenticateJWT, userController.getById);
router.get('/available-for-assignment', authenticateJWT, userController.getAvailableUsers);
router.post('/', authenticateJWT, validateUser, userController.create);
router.put('/:id', authenticateJWT, validateUser, userController.update);
router.delete('/:id', authenticateJWT, userController.deactivate);

module.exports = router;