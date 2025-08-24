const { getDb } = require('../config/database');
const Procedure = require('../models/Procedure');

async function getUserDepartment(userId) {
  const db = await getDb();
  const [rows] = await db.query(
    `SELECT 
      u.DepartmentID,
      d.Name AS DepartmentName
    FROM Users u
    LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
    WHERE u.UserID = ?`,
    [userId]
  );
  return rows[0];
}

const procedureController = {
  createProcedure: async (req, res) => {
    try {
      const { title, description, subprocessId } = req.body;
      const responsibleId = req.user.userId;
      const id = await Procedure.create(title, description, subprocessId, responsibleId, responsibleId);
      res.status(201).json({ id, message: 'Procedure created successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getProcedureById: async (req, res) => {
    try {
      const procedure = await Procedure.getById(req.params.id);
      if (!procedure) {
        return res.status(404).json({ message: 'Procedure not found' });
      }
      res.json(procedure);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAllProcedures: async (req, res) => {
    try {
      const procedures = await Procedure.getAll();
      res.json(procedures);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addDocumentToProcedure: async (req, res) => {
    try {
      const { id: procedureId } = req.params;
      const { documentId } = req.body;
      const procedure = await Procedure.getById(procedureId);
      if (!procedure) return res.status(404).json({ message: 'Procedure not found' });
      if (procedure.ResponsibleID !== req.user.userId) {
        return res.status(403).json({ message: 'Unauthorized to modify this procedure' });
      }
      await Document.addToProcedure(procedureId, documentId);
      res.json({ message: 'Document added to procedure successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding document' });
    }
  },

  getDocumentsByProcedure: async (req, res) => {
    try {
      const { id: procedureId } = req.params;
      const procedure = await Procedure.getById(procedureId);
      if (!procedure) return res.status(404).json({ message: 'Procedure not found' });
      // Check auth: permite si es responsible o mismo dept (ajusta si necesitas)
      const userDept = await getUserDepartment(req.user.userId);
      if (procedure.ResponsibleID !== req.user.userId && userDept.DepartmentID !== procedure.DepartmentID) {
        return res.status(403).json({ message: 'Unauthorized to view documents' });
      }
      const documents = await Document.getByProcedure(procedureId);
      res.json(documents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error getting documents' });
    }
  },

  updateProcedure: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, subprocessId, status } = req.body;
      await Procedure.update(
        id,
        title,
        description,
        subprocessId,
        req.user.userId,  // ResponsibleID
        req.user.userId,  // ModifiedBy  (quien está editando)
        status            // Status
      );
      res.json({ message: 'Procedure updated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteProcedure: async (req, res) => {
    try {
      const { id } = req.params;
      await Procedure.delete(id);
      res.json({ message: 'Procedure deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getProceduresByDepartment: async (req, res) => {
    try {
      const departmentId = Number(req.params.id);

      if (isNaN(departmentId) || !Number.isInteger(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID. Must be an integer.'
        });
      }

      const userDepartment = await getUserDepartment(req.user.userId);
      if (!userDepartment || userDepartment.DepartmentID !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access procedures from this department'
        });
      }

      const procedures = await Procedure.getByDepartment(departmentId);

      res.json({
        success: true,
        data: procedures,
        department: {
          id: departmentId,
          name: userDepartment.DepartmentName || 'Unknown'
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting procedures',
        error: error.message
      });
    }
  },

  getProceduresByUser: async (req, res) => {
    try {
      const userId = req.user.userId;
      const procedures = await Procedure.getByUser(userId);

      res.json({
        success: true,
        data: procedures,
        count: procedures.length
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user procedures',
        error: error.message
      });
    }
  }
};

module.exports = procedureController;