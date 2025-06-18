// direccionController.js
const Direccion = require('../models/Direcciones');

const direccionController = {
  // Crear una nueva dirección
  crearDireccion: async (req, res) => {
    try {
      const { nombre, descripcion, jefeId, secretaria } = req.body;
      const id = await Direccion.crear(nombre, descripcion, jefeId, secretaria);
      res.status(201).json({ id, message: 'Dirección creada exitosamente' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Obtener una dirección por ID
  obtenerDireccionPorId: async (req, res) => {
    try {
      const direccion = await Direccion.obtenerPorId(req.params.id);
      if (!direccion) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }
      res.json(direccion);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Obtener todas las direcciones
  obtenerTodasDirecciones: async (req, res) => {
    try {
      const direcciones = await Direccion.obtenerTodos();
      res.json(direcciones);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Actualizar una dirección
  actualizarDireccion: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, jefeId, secretaria } = req.body;
      await Direccion.actualizar(id, nombre, descripcion, jefeId, secretaria);
      res.json({ message: 'Dirección actualizada exitosamente' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Eliminar una dirección
  eliminarDireccion: async (req, res) => {
    try {
      const { id } = req.params;
      await Direccion.eliminar(id);
      res.json({ message: 'Dirección eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = direccionController;