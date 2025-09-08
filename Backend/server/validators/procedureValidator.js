// validators/procedureValidator.js
const { body, check, validationResult } = require('express-validator');

const validStatuses = ['Created', 'In progress', 'Under review', 'Published', 'Archived'];

const createProcedureValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('subprocessId').isInt().withMessage('Subprocess ID must be an integer'),
  body('status').isIn(validStatuses).withMessage('Invalid status'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const updateProcedureValidator = [
  check('title').optional().notEmpty(),
  check('description').optional(),
  check('subprocessId').optional().isInt(),
  check('status').optional().isIn(validStatuses).withMessage('Invalid status'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { createProcedureValidator, updateProcedureValidator };