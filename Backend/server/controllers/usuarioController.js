const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuarios');

const usuarioController = {
    /**
     * Obtiene todos los usuarios
     */
    obtenerTodos: async (req, res) => {
        try {
            const usuarios = await Usuario.obtenerTodos();
            res.json(usuarios);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener los usuarios' });
        }
    },

    /**
     * Obtiene un usuario por su ID
     */
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const usuario = await Usuario.obtenerPorId(id);

            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            // No devolver el password hash
            delete usuario.PasswordHash;
            res.json(usuario);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener el usuario' });
        }
    },

    /**
     * Obtiene usuarios con rol de jefe
     */
    obtenerJefes: async (req, res) => {
        try {
            const jefes = await Usuario.obtenerJefes();
            res.json(jefes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener los jefes' });
        }
    },

    /**
     * Crea un nuevo usuario
     */
    crear: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { nombre, email, password, rol, direccionId } = req.body;

            // Verificar si el email ya existe
            const usuarioExistente = await Usuario.obtenerPorEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({ message: 'El email ya está registrado' });
            }

            const id = await Usuario.crear({ nombre, email, password, rol, direccionId });
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                usuarioId: id
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al crear el usuario' });
        }
    },

    /**
     * Actualiza un usuario
     */
    actualizar: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { nombre, email, password, rol, direccionId, activo } = req.body;

            // Verificar si el usuario existe
            const usuarioExistente = await Usuario.obtenerPorId(id);
            if (!usuarioExistente) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            // Verificar si el email ya está en uso por otro usuario
            if (email && email !== usuarioExistente.Email) {
                const usuarioConEmail = await Usuario.obtenerPorEmail(email);
                if (usuarioConEmail && usuarioConEmail.UsuarioID !== parseInt(id)) {
                    return res.status(400).json({ message: 'El email ya está en uso' });
                }
            }

            await Usuario.actualizar(id, { nombre, email, password, rol, direccionId, activo });
            res.json({ message: 'Usuario actualizado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar el usuario' });
        }
    },

    /**
     * Elimina un usuario (marcar como inactivo)
     */
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si el usuario existe
            const usuarioExistente = await Usuario.obtenerPorId(id);
            if (!usuarioExistente) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            await Usuario.eliminar(id);
            res.json({ message: 'Usuario desactivado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al desactivar el usuario' });
        }
    }
};

module.exports = usuarioController;