// validators/procedureValidator.js
const { body, validationResult } = require('express-validator');

const createProcedureValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('subprocessId').isInt().withMessage('Subprocess ID must be an integer'),
  body('status').isIn(['Draft', 'Active', 'Pending', 'Archived']).withMessage('Invalid status'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { createProcedureValidator };