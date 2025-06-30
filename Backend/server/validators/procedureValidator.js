const { body } = require('express-validator');

const crearProcedimientoValidator = [
  body('title').notEmpty().withMessage('El título es requerido'),
  body('subprocessId').isInt().withMessage('Subproceso inválido'),
  body('description').optional().isString()
];

module.exports = { crearProcedimientoValidator };