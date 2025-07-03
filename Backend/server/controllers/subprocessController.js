const { validationResult } = require('express-validator');
const Subprocess = require('../models/Subprocess');

const subprocessController = {
    getAll: async (req, res) => {
        try {
            const subprocesses = await Subprocess.getAll();
            res.json(subprocesses);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error getting subprocesses',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getByDepartment: async (req, res) => {
        try {
            const { departmentId } = req.params;
            const subprocesses = await Subprocess.getByDepartment(departmentId);
            res.json(subprocesses);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error getting subprocesses by department',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const subprocess = await Subprocess.getById(id);

            if (!subprocess) {
                return res.status(404).json({ message: 'Subprocess not found' });
            }

            res.json(subprocess);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error getting subprocess',
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
            const { name, description, departmentId } = req.body;
            const id = await Subprocess.create(name, description, departmentId);

            res.status(201).json({
                message: 'Subprocess created successfully',
                subprocessId: id
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error creating subprocess',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    update: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { name, description, departmentId } = req.body;

            await Subprocess.update(id, name, description, departmentId);
            res.json({ message: 'Subprocess updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error updating subprocess',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await Subprocess.delete(id);
            res.json({ message: 'Subprocess deleted successfully' });
        } catch (error) {
            console.error(error);
            const status = error.message.includes('procedimientos asociados') ? 400 : 500;
            res.status(status).json({
                message: error.message || 'Error deleting subprocess',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = subprocessController;