const { body } = require('express-validator');

const crearProcedimientoValidator = [
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('subprocesoId').isInt().withMessage('Subproceso inválido'),
  body('descripcion').optional().isString()
];

module.exports = { crearProcedimientoValidator };