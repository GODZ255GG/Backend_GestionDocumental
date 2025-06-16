const express = require('express');
const Procedimiento = require('../models/Procedimiento');
const { authenticateJWT } = require('../middleware/auth');
const router = express.Router();

// Obtener todos los procedimientos
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const procedimientos = await Procedimiento.obtenerTodos();
    res.json(procedimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear nuevo procedimiento
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { titulo, descripcion, subprocesoId } = req.body;
    const responsableId = req.user.userId;
    
    const id = await Procedimiento.crear(titulo, descripcion, subprocesoId, responsableId);
    res.status(201).json({ id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener un procedimiento específico
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const procedimiento = await Procedimiento.obtenerPorId(req.params.id);
    if (!procedimiento) {
      return res.status(404).json({ message: 'Procedimiento no encontrado' });
    }
    res.json(procedimiento);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;