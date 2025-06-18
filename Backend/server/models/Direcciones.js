const sql = require('mssql');
const { getDb } = require('../config/database');

class Direccion {
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
      .input('jefeId', sql.Int, jefeId)
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
    const db = getDb();
    const result = await db.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT d.*, u.Nombre AS JefeNombre 
        FROM Direcciones d
        LEFT JOIN Usuarios u ON d.JefeID = u.UsuarioID
        WHERE d.DireccionID = @id
      `);
    return result.recordset[0];
  }

  /**
   * Obtiene todas las direcciones.
   * @returns {array} - Lista de direcciones.
   */
  static async obtenerTodos() {
    const db = getDb();
    const result = await db.request()
      .query(`
        SELECT d.*, u.Nombre AS JefeNombre 
        FROM Direcciones d
        LEFT JOIN Usuarios u ON d.JefeID = u.UsuarioID
      `);
    return result.recordset;
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
    const db = getDb();
    await db.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar, nombre)
      .input('descripcion', sql.NVarChar, descripcion)
      .input('jefeId', sql.Int, jefeId)
      .input('secretaria', sql.NVarChar, secretaria)
      .query(`
        UPDATE Direcciones
        SET Nombre = @nombre, Descripcion = @descripcion, JefeID = @jefeId, Secretaria = @secretaria
        WHERE DireccionID = @id
      `);
  }

  /**
   * Elimina una dirección por su ID.
   * @param {number} id - ID de la dirección a eliminar.
   */
  static async eliminar(id) {
    const db = getDb();
    await db.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Direcciones WHERE DireccionID = @id');
  }
}

module.exports = Direccion;