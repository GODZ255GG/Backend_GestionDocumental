const sql = require('mssql');
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

  static async obtenerTodos() {
    const db = getDb();
    const result = await db.request()
      .query(`
        SELECT p.*, u.Nombre AS ResponsableNombre 
        FROM Procedimientos p
        JOIN Usuarios u ON p.ResponsableID = u.UsuarioID
      `);
    return result.recordset;
  }

  static async actualizar(id, titulo, descripcion, subprocesoId) {
    const db = getDb();
    await db.request()
      .input('id', sql.Int, id)
      .input('titulo', sql.NVarChar, titulo)
      .input('descripcion', sql.NVarChar, descripcion)
      .input('subprocesoId', sql.Int, subprocesoId)
      .query(`
        UPDATE Procedimientos
        SET Titulo = @titulo, Descripcion = @descripcion, SubprocesoID = @subprocesoId
        WHERE ProcedimientoID = @id
      `);
  }

  static async eliminar(id) {
    const db = getDb();
    await db.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Procedimientos WHERE ProcedimientoID = @id');
  }

  static async obtenerPorDireccion(direccionId) {
    if (!direccionId || isNaN(direccionId) || !Number.isInteger(Number(direccionId))) {
      throw new Error('ID de dirección inválido');
    }
    const db = getDb();
    const result = await db.request()
      .input('direccionId', sql.Int, direccionId)
      .query(`
      SELECT 
        p.*,
        u.Nombre AS ResponsableNombre,
        s.Nombre AS SubprocesoNombre
      FROM Procedimientos p
      JOIN Usuarios u ON p.ResponsableID = u.UsuarioID
      JOIN Subprocesos s ON p.SubprocesoID = s.SubprocesoID
      WHERE s.DireccionID = @direccionId
    `);
    return result.recordset;
  }
}

module.exports = Procedimiento;