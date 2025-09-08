const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const procedureController = require('../controllers/procedureController');
const { authenticateJWT } = require('../middleware/auth');
const { createProcedureValidator, updateProcedureValidator } = require('../validators/procedureValidator');

// La ruta POST ahora usa el validador
router.post('/', authenticateJWT, createProcedureValidator, procedureController.createProcedure);
router.get('/:id', authenticateJWT, procedureController.getProcedureById);
router.get('/', authenticateJWT, procedureController.getAllProcedures);
// La ruta PUT ahora usa el validador corregido
router.put('/:id', authenticateJWT, updateProcedureValidator, procedureController.updateProcedure);
router.delete('/:id', authenticateJWT, procedureController.deleteProcedure);
router.get('/by-department/:id', authenticateJWT, procedureController.getProceduresByDepartment);
router.get('/by-user/me', authenticateJWT, procedureController.getProceduresByUser);
router.post('/:id/documents', authenticateJWT, procedureController.addDocumentToProcedure);
router.get('/:id/documents', authenticateJWT, procedureController.getDocumentsByProcedure);
router.post('/procedimientos/:procedureId/documents', authenticateJWT, procedureController.addDocument);

module.exports = router;