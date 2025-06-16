const { getDb } = require('../config/database');

class Procedimiento {
  static async crear(titulo, descripcion, subprocesoId, responsableId) {
    const db = getDb();
    const result = await db.request()
      .input('titulo', sql.NVarChar, titulo)
      .input('descripcion', sql.NVarChar, descripcion)
      .input('subprocesoId', sql.Int, subprocesoId)
      .input('responsableId', sql.Int, responsableId)
      .query(`
        INSERT INTO Procedimientos (Titulo, Descripcion, SubprocesoID, ResponsableID)
        VALUES (@titulo, @descripcion, @subprocesoId, @responsableId);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    
    return result.recordset[0].id;
  }

  static async obtenerPorId(id) {
    const db = getDb();
    const result = await db.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, u.Nombre AS ResponsableNombre 
        FROM Procedimientos p
        JOIN Usuarios u ON p.ResponsableID = u.UsuarioID
        WHERE p.ProcedimientoID = @id
      `);
    
    return result.recordset[0];
  }

  // Más métodos según necesites...
}

module.exports = Procedimiento;