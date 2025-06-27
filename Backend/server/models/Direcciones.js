const sql = require('mssql');
const { getDb } = require('../config/database');

class Direccion {
  /**
   * Valida que el ID sea un número válido
   * @param {any} id - ID a validar
   * @returns {number} - ID validado
   * @throws {Error} - Si el ID no es válido
   */
  static validarId(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new Error('ID debe ser un número válido');
    }
    return idNum;
  }

  /**
   * Crea una nueva dirección en la base de datos.
   * @param {string} nombre - Nombre de la dirección.
   * @param {string} descripcion - Descripción de la dirección.
   * @param {number} jefeId - ID del jefe de la dirección.
   * @param {string} secretaria - Nombre de la secretaría.
   * @returns {number} - ID de la dirección creada.
   */
  static async crear(nombre, descripcion, jefeId, secretaria) {
    const db = getDb();
    const result = await db.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('descripcion', sql.NVarChar, descripcion)
      .input('jefeId', jefeId ? sql.Int : sql.Null, jefeId || null)
      .input('secretaria', sql.NVarChar, secretaria)
      .query(`
        INSERT INTO Direcciones (Nombre, Descripcion, JefeID, Secretaria)
        VALUES (@nombre, @descripcion, @jefeId, @secretaria);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0].id;
  }

  /**
   * Obtiene una dirección por su ID.
   * @param {number} id - ID de la dirección.
   * @returns {object} - Datos de la dirección o undefined si no existe.
   */
  static async obtenerPorId(id) {
    try {
      const idNum = this.validarId(id);
      const db = getDb();
      const result = await db.request()
        .input('id', sql.Int, idNum)
        .query(`
          SELECT d.*, u.Nombre AS JefeNombre 
          FROM Direcciones d
          LEFT JOIN Usuarios u ON d.JefeID = u.UsuarioID
          WHERE d.DireccionID = @id
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las direcciones.
   * @returns {array} - Lista de direcciones.
   */
  static async obtenerTodos() {
    try {
      const db = getDb();
      const result = await db.request()
        .query(`
          SELECT 
            d.*, 
            u.Nombre AS JefeNombre,
            (SELECT COUNT(*) FROM Usuarios WHERE DireccionID = d.DireccionID) AS miembros,
            (SELECT COUNT(*) FROM Subprocesos WHERE DireccionID = d.DireccionID) AS totalSubprocesos,
            (SELECT COUNT(*) FROM Procedimientos p 
             JOIN Subprocesos s ON p.SubprocesoID = s.SubprocesoID 
             WHERE s.DireccionID = d.DireccionID) AS totalProcedimientos
          FROM Direcciones d
          LEFT JOIN Usuarios u ON d.JefeID = u.UsuarioID
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      throw error;
    }
  }

  /**
   * Actualiza una dirección existente.
   * @param {number} id - ID de la dirección a actualizar.
   * @param {string} nombre - Nuevo nombre.
   * @param {string} descripcion - Nueva descripción.
   * @param {number} jefeId - Nuevo ID del jefe.
   * @param {string} secretaria - Nueva secretaría.
   */
  static async actualizar(id, nombre, descripcion, jefeId, secretaria) {
    try {
      const idNum = this.validarId(id);
      const db = getDb();
      await db.request()
        .input('id', sql.Int, idNum)
        .input('nombre', sql.NVarChar, nombre)
        .input('descripcion', sql.NVarChar, descripcion)
        .input('jefeId', jefeId ? sql.Int : sql.Null, jefeId || null)
        .input('secretaria', sql.NVarChar, secretaria)
        .query(`
          UPDATE Direcciones
          SET 
            Nombre = @nombre, 
            Descripcion = @descripcion, 
            JefeID = @jefeId, 
            Secretaria = @secretaria,
            UltimaModificacion = GETDATE()
          WHERE DireccionID = @id
        `);
    } catch (error) {
      console.error('Error en actualizar:', error);
      throw error;
    }
  }

  /**
   * Elimina una dirección por su ID.
   * @param {number} id - ID de la dirección a eliminar.
   */
  static async eliminar(id) {
    try {
      const idNum = this.validarId(id);
      const db = getDb();
      await db.request()
        .input('id', sql.Int, idNum)
        .query('DELETE FROM Direcciones WHERE DireccionID = @id');
    } catch (error) {
      console.error('Error en eliminar:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de direcciones
   * @returns {object} - Objeto con estadísticas
   */
  static async obtenerStats() {
    try {
      const db = getDb();

      const totalResult = await db.request()
        .query('SELECT COUNT(*) AS total FROM Direcciones');

      const activasResult = await db.request()
        .query('SELECT COUNT(*) AS activas FROM Direcciones WHERE Activo = 1');

      const jefesResult = await db.request()
        .query('SELECT COUNT(*) AS jefes FROM Direcciones WHERE JefeID IS NOT NULL');

      const procedimientosResult = await db.request()
        .query(`
          SELECT COUNT(*) AS procedimientos 
          FROM Procedimientos p
          JOIN Subprocesos s ON p.SubprocesoID = s.SubprocesoID
        `);

      return {
        totalDirecciones: totalResult.recordset[0].total,
        direccionesActivas: activasResult.recordset[0].activas,
        totalJefes: jefesResult.recordset[0].jefes,
        totalProcedimientos: procedimientosResult.recordset[0].procedimientos
      };
    } catch (error) {
      console.error('Error en obtenerStats:', error);
      throw error;
    }
  }
}

module.exports = Direccion;