const { validationResult } = require('express-validator');
const Department = require('../models/Department');

const departmentController = {
  getOverallStats: async (req, res) => {
    try {
      const stats = await Department.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting overall stats:', error);
      res.status(500).json({
        message: 'Error getting statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getDetailedStats: async (req, res) => {
    try {
      const departments = await Department.getAll();
      const stats = await Department.getStats();

      res.json({
        totals: stats,
        details: departments.map(d => ({
          id: d.DepartmentID,
          name: d.Name,
          members: d.memberCount,
          subprocesses: d.subprocessCount,
          procedures: d.procedureCount,
          status: d.IsActive ? 'Active' : 'Inactive'
        }))
      });
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      res.status(500).json({
        message: 'Error getting detailed statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const departments = await Department.getAll();
      res.json(departments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting departments' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }

      const department = await Department.getById(parseInt(id));

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json(department);
    } catch (error) {
      console.error('Error getting department by ID:', error);
      res.status(500).json({
        message: 'Error getting department',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, headId, secretariat } = req.body;
      const id = await Department.create(name, description, headId, secretariat);

      // Si se asignó un jefe, actualizar su departamento
      if (headId) {
        await Department.updateUserDepartment(headId, id);
      }

      res.status(201).json({
        message: 'Department created successfully',
        departmentId: id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating department' });
    }
  },

  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, description, headId, secretariatId, isActive } = req.body;

      const existingDept = await Department.getById(id);
      if (!existingDept) {
        return res.status(404).json({ message: 'Department not found' });
      }

      await Department.update(
        id,
        name,
        description,
        headId,
        secretariatId,  // <-- entero
        isActive
      );

      // Si se asignó un jefe, actualizar su departamento
      if (headId) {
        await Department.updateUserDepartment(headId, id);
      }

      res.json({ message: 'Department updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating department' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const existingDept = await Department.getById(id);
      if (!existingDept) {
        return res.status(404).json({ message: 'Department not found' });
      }

      await Department.delete(id);
      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting department' });
    }
  }
};

module.exports = departmentController;