const { getDb } = require('../config/database');

class Procedure {
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

  static async update(id, title, description, subprocessId, modifiedBy, status) {
    const db = await getDb();
    await db.query(
      `UPDATE Procedures 
     SET Title = ?, Description = ?, SubprocessID = ?, ModifiedBy = ?, Status = ?
     WHERE ProcedureID = ?`,
      [title, description, subprocessId, modifiedBy, status, id]
    );
  }

  static async delete(id) {
    const db = await getDb();
    await db.query('DELETE FROM Procedures WHERE ProcedureID = ?', [id]);
  }
}

module.exports = Procedure;