const Procedimiento = require('../models/Procedimiento');

const procedimientoController = {
  // Crear un nuevo procedimiento
  crearProcedimiento: async (req, res) => {
    try {
      const { titulo, descripcion, subprocesoId } = req.body;
      const responsableId = req.user.userId; // Asumiendo que el usuario autenticado está en req.user
      const id = await Procedimiento.crear(titulo, descripcion, subprocesoId, responsableId);
      res.status(201).json({ id, message: 'Procedimiento creado exitosamente' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Obtener un procedimiento por ID
  obtenerProcedimientoPorId: async (req, res) => {
    try {
      const procedimiento = await Procedimiento.obtenerPorId(req.params.id);
      if (!procedimiento) {
        return res.status(404).json({ message: 'Procedimiento no encontrado' });
      }
      res.json(procedimiento);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Obtener todos los procedimientos
  obtenerTodosProcedimientos: async (req, res) => {
    try {
      const procedimientos = await Procedimiento.obtenerTodos();
      res.json(procedimientos);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Actualizar un procedimiento
  actualizarProcedimiento: async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descripcion, subprocesoId } = req.body;
      await Procedimiento.actualizar(id, titulo, descripcion, subprocesoId);
      res.json({ message: 'Procedimiento actualizado exitosamente' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Eliminar un procedimiento
  eliminarProcedimiento: async (req, res) => {
    try {
      const { id } = req.params;
      await Procedimiento.eliminar(id);
      res.json({ message: 'Procedimiento eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = procedimientoController;