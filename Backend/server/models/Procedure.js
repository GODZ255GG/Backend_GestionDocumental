const { getDb } = require('../config/database');

// Map de status para normalizar (español/lowercase a ENUM inglés)
const statusMap = {
  'creado': 'Created',
  'en elaboración': 'In progress',
  'en revisión': 'Under review',
  'publicado': 'Published',
  'archivado': 'Archived'
};

const validStatuses = ['Created', 'In progress', 'Under review', 'Published', 'Archived'];

class Procedure {
  static async validateId(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new Error('ID must be a valid number');
    }
    return idNum;
  }

  static async create(title, description, subprocessId, responsibleId, createdBy, status = 'Created') {
    const db = await getDb();
    const normalizedStatus = statusMap[status.toLowerCase()] || 'Created';  // Normaliza o default
    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error('Invalid status value');
    }
    const [result] = await db.query(
      `INSERT INTO Procedures 
        (Title, Description, SubprocessID, ResponsibleID, Status, CreatedBy) 
        VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, subprocessId, responsibleId, normalizedStatus, createdBy]
    );
    return result.insertId;
  }

  static async getById(id) {
    const db = await getDb();
    const [rows] = await db.query(
        `SELECT p.*, u.Name AS ResponsibleName
         FROM Procedures p
         JOIN Users u ON p.ResponsibleID = u.UserID
         WHERE p.ProcedureID = ?`,
        [id]
    );
    return rows[0];
}

  static async getAll() {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT p.*, u.Name AS ResponsibleName 
        FROM Procedures p
        JOIN Users u ON p.ResponsibleID = u.UserID`
    );
    return rows;
  }

  static async getByDepartment(departmentId) {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT p.*, u.Name AS ResponsibleName 
        FROM Procedures p
        JOIN Users u ON p.ResponsibleID = u.UserID
        JOIN Subprocesses s ON p.SubprocessID = s.SubprocessID
        WHERE s.DepartmentID = ?`,
      [departmentId]
    );
    return rows;
  }

  static async update(id, title, description, subprocessId, responsibleId, modifiedBy, status) {
    const idNum = await this.validateId(id);
    const db = await getDb();
    const normalizedStatus = statusMap[status.toLowerCase()] || 'In progress';  // Normaliza o default para update
    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error('Invalid status value');
    }
    await db.query(
      `UPDATE Procedures 
        SET Title = ?, 
            Description = ?, 
            SubprocessID = ?, 
            ResponsibleID = ?,
            ModifiedBy = ?, 
            Status = ?,
            LastModified = CURRENT_TIMESTAMP
        WHERE ProcedureID = ?`,
      [title, description, subprocessId, responsibleId, modifiedBy, normalizedStatus, idNum]
    );
  }

  static async delete(id) {
    const db = await getDb();
    await db.query('DELETE FROM Procedures WHERE ProcedureID = ?', [id]);
  }

  static async getByUser(userId) {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT DISTINCT p.*, u.Name AS ResponsibleName 
       FROM Procedures p
       JOIN Users u ON p.ResponsibleID = u.UserID
       WHERE p.ResponsibleID = ? OR p.CreatedBy = ? OR p.ModifiedBy = ?`,
      [userId, userId, userId]
    );
    return rows;
  }
}

module.exports = Procedure;