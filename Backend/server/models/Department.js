const { getDb } = require('../config/database');

class Department {
  static async validateId(id) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new Error('ID must be a valid number');
    }
    return idNum;
  }

  static async create(name, description, headId, secretariatId) {
    const db = await getDb();
    const [result] = await db.query(
      `INSERT INTO Departments (Name, Description, HeadID, SecretariatID)
      VALUES (?, ?, ?, ?)`,
      [name, description, headId || null, secretariatId]
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

  static async update(id, name, description, headId, secretariatId, isActive) {
    try {
      const idNum = await this.validateId(id);
      const db = await getDb();
      await db.query(
        `UPDATE Departments
      SET 
        Name = ?, 
        Description = ?, 
        HeadID = ?, 
        SecretariatID = ?,
        IsActive = ?,
        LastModified = CURRENT_TIMESTAMP()
      WHERE DepartmentID = ?`,
        [name, description, headId || null, secretariatId, isActive, idNum]
      );
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    let connection;
    try {
      const idNum = await this.validateId(id);
      connection = await getDb().getConnection();

      await connection.beginTransaction();

      // 1. Verificar si el departamento existe
      const [departmentRows] = await connection.query(
        'SELECT * FROM Departments WHERE DepartmentID = ?',
        [idNum]
      );

      if (departmentRows.length === 0) {
        throw new Error('Department not found');
      }

      // 2. Obtener todos los subprocesos del departamento
      const [subprocesses] = await connection.query(
        'SELECT SubprocessID FROM Subprocesses WHERE DepartmentID = ?',
        [idNum]
      );

      // 3. Eliminar procedimientos relacionados
      if (subprocesses.length > 0) {
        const subprocessIds = subprocesses.map(s => s.SubprocessID);
        await connection.query(
          'DELETE FROM Procedures WHERE SubprocessID IN (?)',
          [subprocessIds]
        );
      }

      // 4. Eliminar subprocesos
      await connection.query(
        'DELETE FROM Subprocesses WHERE DepartmentID = ?',
        [idNum]
      );

      // 5. Quitar referencia a usuarios
      await connection.query(
        'UPDATE Users SET DepartmentID = NULL WHERE DepartmentID = ?',
        [idNum]
      );

      // 6. Quitar referencia al jefe
      await connection.query(
        'UPDATE Departments SET HeadID = NULL WHERE DepartmentID = ?',
        [idNum]
      );

      // 7. Finalmente eliminar el departamento
      await connection.query(
        'DELETE FROM Departments WHERE DepartmentID = ?',
        [idNum]
      );

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error in delete:', error);
      throw error;
    } finally {
      if (connection) connection.release();
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

  static async updateUserDepartment(userId, departmentId) {
    try {
      const db = await getDb();
      await db.query(
        'UPDATE Users SET DepartmentID = ? WHERE UserID = ?',
        [departmentId, userId]
      );
    } catch (error) {
      console.error('Error updating user department:', error);
      throw error;
    }
  }
}

module.exports = Department;