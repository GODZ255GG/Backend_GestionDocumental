const { getDb } = require('../config/database');

class Department {
  static async validateId(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new Error('ID must be a valid number');
    }
    return idNum;
  }

  static async create(name, description, headId, secretariat) {
    const db = await getDb();
    const [result] = await db.query(
      `INSERT INTO Departments (Name, Description, HeadID, Secretariat)
       VALUES (?, ?, ?, ?)`,
      [name, description, headId || null, secretariat]
    );
    return result.insertId;
  }

  static async getById(id) {
    try {
      const idNum = await this.validateId(id);
      const db = await getDb();
      const [rows] = await db.query(
        `SELECT d.*, u.Name AS HeadName 
         FROM Departments d
         LEFT JOIN Users u ON d.HeadID = u.UserID
         WHERE d.DepartmentID = ?`,
        [idNum]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const db = await getDb();
      const [rows] = await db.query(
        `SELECT 
          d.*, 
          u.Name AS HeadName,
          (SELECT COUNT(*) FROM Users WHERE DepartmentID = d.DepartmentID) AS memberCount,
          (SELECT COUNT(*) FROM Subprocesses WHERE DepartmentID = d.DepartmentID) AS subprocessCount,
          (SELECT COUNT(*) FROM Procedures p 
           JOIN Subprocesses s ON p.SubprocessID = s.SubprocessID 
           WHERE s.DepartmentID = d.DepartmentID) AS procedureCount
         FROM Departments d
         LEFT JOIN Users u ON d.HeadID = u.UserID`
      );
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async update(id, name, description, headId, secretariat) {
    try {
      const idNum = await this.validateId(id);
      const db = await getDb();
      await db.query(
        `UPDATE Departments
         SET 
           Name = ?, 
           Description = ?, 
           HeadID = ?, 
           Secretariat = ?,
           LastModified = CURRENT_TIMESTAMP()
         WHERE DepartmentID = ?`,
        [name, description, headId || null, secretariat, idNum]
      );
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const idNum = await this.validateId(id);
      const db = await getDb();
      await db.query('DELETE FROM Departments WHERE DepartmentID = ?', [idNum]);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async getStats() {
    try {
      const db = await getDb();

      const [totalResult] = await db.query('SELECT COUNT(*) AS total FROM Departments');
      const [activeResult] = await db.query('SELECT COUNT(*) AS active FROM Departments WHERE IsActive = TRUE');
      const [headsResult] = await db.query('SELECT COUNT(*) AS heads FROM Departments WHERE HeadID IS NOT NULL');
      const [proceduresResult] = await db.query(
        `SELECT COUNT(*) AS procedures 
         FROM Procedures p
         JOIN Subprocesses s ON p.SubprocessID = s.SubprocessID`
      );

      return {
        totalDepartments: totalResult[0].total,
        activeDepartments: activeResult[0].active,
        totalHeads: headsResult[0].heads,
        totalProcedures: proceduresResult[0].procedures
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }
}

module.exports = Department;