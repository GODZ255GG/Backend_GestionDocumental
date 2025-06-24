const { validationResult } = require('express-validator');
const Direccion = require('../models/Direcciones');

const direccionesController = {
  /**
   * Obtiene todas las direcciones
   */
  obtenerTodas: async (req, res) => {
    try {
      const direcciones = await Direccion.obtenerTodos();
      res.json(direcciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener las direcciones' });
    }
  },

  /**
   * Obtiene una dirección por su ID
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const direccion = await Direccion.obtenerPorId(id);

      if (!direccion) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      res.json(direccion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener la dirección' });
    }
  },

  /**
   * Crea una nueva dirección
   */
  crear: async (req, res) => {
    const errors = validationResult(req); // <-- Aquí está el cambio
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { nombre, descripcion, jefeId, secretaria } = req.body;
      const id = await Direccion.crear(nombre, descripcion, jefeId, secretaria);
      
      res.status(201).json({ 
        message: 'Dirección creada exitosamente',
        direccionId: id 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear la dirección' });
    }
  },

  /**
   * Actualiza una dirección existente
   */
  actualizar: async (req, res) => {
    const errors = validationResult(req); // <-- Aquí está el cambio
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { nombre, descripcion, jefeId, secretaria } = req.body;

      // Verificar si la dirección existe
      const direccionExistente = await Direccion.obtenerPorId(id);
      if (!direccionExistente) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      await Direccion.actualizar(id, nombre, descripcion, jefeId, secretaria);
      res.json({ message: 'Dirección actualizada exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar la dirección' });
    }
  },

  /**
   * Elimina una dirección
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si la dirección existe
      const direccionExistente = await Direccion.obtenerPorId(id);
      if (!direccionExistente) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      await Direccion.eliminar(id);
      res.json({ message: 'Dirección eliminada exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar la dirección' });
    }
  }
};

module.exports = direccionesController;