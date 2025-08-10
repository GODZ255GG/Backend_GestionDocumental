const { validationResult } = require('express-validator');
const User = require('../models/User');

const userController = {
  getAll: async (req, res) => {
    try {
      const users = await User.getAll();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting users' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.getById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't return password hash
      delete user.PasswordHash;
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting user' });
    }
  },

  getDepartmentHeads: async (req, res) => {
    try {
      const heads = await User.getDepartmentHeads();
      res.json(heads);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting department heads' });
    }
  },

  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role, departmentId } = req.body;

      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const id = await User.create({ name, email, password, role, departmentId });
      res.status(201).json({
        message: 'User created successfully',
        userId: id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating user' });
    }
  },

  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, email, password, role, departmentId, isActive } = req.body;

      const existingUser = await User.getById(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (email && email !== existingUser.Email) {
        const userWithEmail = await User.getByEmail(email);
        if (userWithEmail && userWithEmail.UserID !== parseInt(id)) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      await User.update(id, { name, email, password, role, departmentId, isActive });
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating user' });
    }
  },

  deactivate: async (req, res) => {
    try {
      const { id } = req.params;

      const existingUser = await User.getById(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await User.deactivate(id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deactivating user' });
    }
  },

  getAvailableUsers: async (req, res) => {
    try {
      // Verificar permisos del usuario autenticado
      if (!req.user.canManageProcedures) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a esta información'
        });
      }

      const availableUsers = await User.getAvailableForDepartmentAssignment();

      if (!availableUsers || availableUsers.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No hay usuarios disponibles para asignación'
        });
      }

      res.json({
        success: true,
        data: availableUsers,
        count: availableUsers.length
      });

    } catch (error) {
      console.error('Error getting available users:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios disponibles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = userController;