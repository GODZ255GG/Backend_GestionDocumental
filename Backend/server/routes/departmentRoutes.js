const express = require('express');
const { check } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

// Common validations
const validateDepartment = [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').optional(),
  check('headId').optional().isInt().withMessage('Head ID must be a number'),
  check('secretariat').optional()
];

// Existing routes
router.get('/', authenticateJWT, departmentController.getAll);
router.get('/:id', authenticateJWT, departmentController.getById);
router.post('/', authenticateJWT, validateDepartment, departmentController.create);
router.put('/:id', authenticateJWT, validateDepartment, departmentController.update);
router.delete('/:id', authenticateJWT, departmentController.delete);

// New stats routes
router.get('/stats/totals', authenticateJWT, departmentController.getOverallStats);
router.get('/stats/detailed', authenticateJWT, departmentController.getDetailedStats);

module.exports = router;