const express = require('express');
const router = express.Router();
const procedureController = require('../controllers/procedureController');
const { authenticateJWT } = require('../middleware/auth');
const { createProcedureValidator } = require('../validators/procedureValidator');


router.post('/', authenticateJWT, procedureController.createProcedure);
router.get('/:id', authenticateJWT, procedureController.getProcedureById);
router.get('/', authenticateJWT, procedureController.getAllProcedures);
router.put('/:id', authenticateJWT, procedureController.updateProcedure);
router.delete('/:id', authenticateJWT, procedureController.deleteProcedure);
router.get('/by-department/:id', authenticateJWT, procedureController.getProceduresByDepartment);

module.exports = router;