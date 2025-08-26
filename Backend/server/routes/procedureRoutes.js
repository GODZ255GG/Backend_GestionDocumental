const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const procedureController = require('../controllers/procedureController');
const { authenticateJWT } = require('../middleware/auth');

const updateProcedureValidator = [
    check('title').optional().notEmpty(),
    check('description').optional(),
    check('subprocessId').optional().isInt(),
    check('status').optional().isIn(['Draft', 'Active', 'Pending', 'Archived']),

    // Añade el middleware de manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

router.post('/', authenticateJWT, procedureController.createProcedure);
router.get('/:id', authenticateJWT, procedureController.getProcedureById);
router.get('/', authenticateJWT, procedureController.getAllProcedures);
router.put('/:id', authenticateJWT, updateProcedureValidator, procedureController.updateProcedure);
router.delete('/:id', authenticateJWT, procedureController.deleteProcedure);
router.get('/by-department/:id', authenticateJWT, procedureController.getProceduresByDepartment);
router.get('/by-user/me', authenticateJWT, procedureController.getProceduresByUser);
router.post('/:id/documents', authenticateJWT, procedureController.addDocumentToProcedure);
router.get('/:id/documents', authenticateJWT, procedureController.getDocumentsByProcedure);
router.post('/procedimientos/:procedureId/documents', authenticateJWT, procedureController.addDocument);

module.exports = router;