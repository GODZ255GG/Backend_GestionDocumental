const sql = require('mssql');
const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
    /**
     * Obtiene un usuario por su ID
     * @param {number} id - ID del usuario
     * @returns {object} - Datos del usuario
     */
    static async obtenerPorId(id) {
        const db = getDb();
        const result = await db.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Usuarios WHERE UsuarioID = @id');
        return result.recordset[0];
    }

    /**
     * Obtiene un usuario por su email
     * @param {string} email - Email del usuario
     * @returns {object} - Datos del usuario
     */
    static async obtenerPorEmail(email) {
        const db = getDb();
        const result = await db.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Usuarios WHERE Email = @email');
        return result.recordset[0];
    }

    /**
     * Obtiene todos los usuarios
     * @returns {array} - Lista de usuarios
     */
    static async obtenerTodos() {
        const db = getDb();
        const result = await db.request()
            .query('SELECT UsuarioID, Nombre, Email, Rol, DireccionID, Activo FROM Usuarios');
        return result.recordset;
    }

    /**
     * Obtiene usuarios con rol de jefe
     * @returns {array} - Lista de jefes
     */
    static async obtenerJefes() {
        const db = getDb();
        const result = await db.request()
            .query(`
        SELECT UsuarioID, Nombre 
        FROM Usuarios 
        WHERE Rol IN ('Director', 'Jefe', 'Administrador') 
        AND Activo = 1
        ORDER BY Nombre
      `);
        return result.recordset;
    }

    /**
     * Crea un nuevo usuario
     * @param {object} usuario - Datos del usuario
     * @returns {number} - ID del usuario creado
     */
    static async crear(usuario) {
        const db = getDb();
        const hashedPassword = await bcrypt.hash(usuario.password, 10);

        const result = await db.request()
            .input('nombre', sql.NVarChar, usuario.nombre)
            .input('email', sql.NVarChar, usuario.email)
            .input('passwordHash', sql.NVarChar, hashedPassword)
            .input('rol', sql.NVarChar, usuario.rol)
            .input('direccionId', usuario.direccionId ? sql.Int : sql.Null, usuario.direccionId || null)
            .query(`
        INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol, DireccionID)
        VALUES (@nombre, @email, @passwordHash, @rol, @direccionId);
        SELECT SCOPE_IDENTITY() AS id;
      `);

        return result.recordset[0].id;
    }

    /**
     * Actualiza un usuario
     * @param {number} id - ID del usuario
     * @param {object} datos - Datos a actualizar
     */
    static async actualizar(id, datos) {
        const db = getDb();
        let query = 'UPDATE Usuarios SET ';
        const inputs = [];

        if (datos.nombre) {
            inputs.push('Nombre = @nombre');
            db.input('nombre', sql.NVarChar, datos.nombre);
        }

        if (datos.email) {
            inputs.push('Email = @email');
            db.input('email', sql.NVarChar, datos.email);
        }

        if (datos.rol) {
            inputs.push('Rol = @rol');
            db.input('rol', sql.NVarChar, datos.rol);
        }

        if (datos.hasOwnProperty('direccionId')) {
            inputs.push('DireccionID = @direccionId');
            db.input('direccionId', datos.direccionId ? sql.Int : sql.Null, datos.direccionId || null);
        }

        if (datos.password) {
            const hashedPassword = await bcrypt.hash(datos.password, 10);
            inputs.push('PasswordHash = @passwordHash');
            db.input('passwordHash', sql.NVarChar, hashedPassword);
        }

        if (datos.hasOwnProperty('activo')) {
            inputs.push('Activo = @activo');
            db.input('activo', sql.Bit, datos.activo);
        }

        query += inputs.join(', ') + ' WHERE UsuarioID = @id';
        db.input('id', sql.Int, id);

        await db.request().query(query);
    }

    /**
     * Elimina un usuario (marcar como inactivo)
     * @param {number} id - ID del usuario
     */
    static async eliminar(id) {
        const db = getDb();
        await db.request()
            .input('id', sql.Int, id)
            .query('UPDATE Usuarios SET Activo = 0 WHERE UsuarioID = @id');
    }

    /**
     * Verifica las credenciales de un usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña sin encriptar
     * @returns {object|null} - Datos del usuario si las credenciales son válidas
     */
    static async verificarCredenciales(email, password) {
        const usuario = await this.obtenerPorEmail(email);
        if (!usuario) return null;

        const isValid = await bcrypt.compare(password, usuario.PasswordHash);
        return isValid ? usuario : null;
    }
}

module.exports = Usuario;