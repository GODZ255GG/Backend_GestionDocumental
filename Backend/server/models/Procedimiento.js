const sql = require('mssql');
const { getDb } = require('../config/database');

class Procedimiento {
  /**
   * Crea un nuevo procedimiento en la base de datos.
   * @param {string} titulo - Título del procedimiento.
   * @param {string} descripcion - Descripción del procedimiento.
   * @param {number} subprocesoId - ID del subproceso al que pertenece.
   * @param {number} responsableId - ID del usuario responsable.
   * @returns {number} - ID del procedimiento creado.
   */
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

  /**
   * Obtiene un procedimiento por su ID.
   * @param {number} id - ID del procedimiento.
   * @returns {object} - Datos del procedimiento o undefined si no existe.
   */
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

  /**
   * Obtiene todos los procedimientos.
   * @returns {array} - Lista de procedimientos.
   */
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

  /**
   * Actualiza un procedimiento existente.
   * @param {number} id - ID del procedimiento a actualizar.
   * @param {string} titulo - Nuevo título.
   * @param {string} descripcion - Nueva descripción.
   * @param {number} subprocesoId - Nuevo ID del subproceso.
   */
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

  /**
   * Elimina un procedimiento por su ID.
   * @param {number} id - ID del procedimiento a eliminar.
   */
  static async eliminar(id) {
    const db = getDb();
    await db.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Procedimientos WHERE ProcedimientoID = @id');
  }
}

module.exports = Procedimiento;