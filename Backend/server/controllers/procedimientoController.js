const Procedimiento = require('../models/Procedimiento');
const sql = require('mssql'); // Asegúrate de que sql esté importado
const { getDb } = require('../config/database'); // Asegúrate de que getDb esté importado

async function obtenerDireccionUsuario(usuarioId) {
  const db = getDb();
  const result = await db.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT 
        u.DireccionID,
        d.Nombre AS DireccionNombre
      FROM Usuarios u
      LEFT JOIN Direcciones d ON u.DireccionID = d.DireccionID
      WHERE u.UsuarioID = @usuarioId
    `);
  console.log('obtenerDireccionUsuario result:', result.recordset[0]); // Para depuración
  return result.recordset[0];
}

const procedimientoController = {
  // Crear un nuevo procedimiento
  crearProcedimiento: async (req, res) => {
    try {
      const { titulo, descripcion, subprocesoId } = req.body;
      const responsableId = req.user.userId;
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
  },

  obtenerProcedimientosPorDireccion: async (req, res) => {
    try {
      // 1. Obtener el direccionId desde los parámetros de la ruta
      const direccionId = Number(req.params.id);

      // Validar que direccionId sea un número entero válido
      if (isNaN(direccionId) || !Number.isInteger(direccionId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de dirección inválido. Debe ser un número entero.'
        });
      }

      // 2. Opcional: Verificar que el usuario tenga permiso para acceder a esta dirección
      const usuarioConDireccion = await obtenerDireccionUsuario(req.user.userId);
      if (!usuarioConDireccion || usuarioConDireccion.DireccionID !== direccionId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a los procedimientos de esta dirección'
        });
      }

      // 3. Obtener procedimientos
      const procedimientos = await Procedimiento.obtenerPorDireccion(direccionId);

      res.json({
        success: true,
        data: procedimientos,
        direccion: {
          id: direccionId,
          nombre: usuarioConDireccion.DireccionNombre || 'Desconocida'
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener procedimientos',
        error: error.message
      });
    }
  }
};

module.exports = procedimientoController;