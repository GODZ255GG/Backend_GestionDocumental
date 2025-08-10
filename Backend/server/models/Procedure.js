const { getDb } = require('../config/database');

class Procedure {

  static async validateId(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new Error('ID must be a valid number');
    }
    return idNum;
  }

  static async create(title, description, subprocessId, responsibleId, createdBy) {
    const db = await getDb();
    const [result] = await db.query(
      `INSERT INTO Procedures 
        (Title, Description, SubprocessID, ResponsibleID, Status, CreatedBy) 
        VALUES (?, ?, ?, ?, 'Draft', ?)`,
      [title, description, subprocessId, responsibleId, createdBy]
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
    await db.query(
      `UPDATE Procedures 
        SET Title = ?, 
            Description = ?, 
            SubprocessID = ?, 
            ResponsibleID = ?,
            ModifiedBy = ?, 
            Status = ?,
            LastModified = CURRENT_TIMESTAMP()
        WHERE ProcedureID = ?`,
      [title, description, subprocessId, responsibleId, modifiedBy, status, idNum]
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