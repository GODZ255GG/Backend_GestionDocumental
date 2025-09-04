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
}node 

static async getAll() {
  const db = await getDb();
  const [rows] = await db.query(
    `SELECT p.*, u.Name AS ResponsibleName, COUNT(pd.DocumentID) AS documentCount
       FROM Procedures p
       LEFT JOIN Users u ON p.ResponsibleID = u.UserID
       LEFT JOIN ProcedureDocuments pd ON pd.ProcedureID = p.ProcedureID
       GROUP BY p.ProcedureID
       ORDER BY p.CreatedAt DESC`
  );
  return rows;
}


// En tu archivo Procedure.js
static async getByDepartment(departmentId) {
  const db = await getDb();
  const [rows] = await db.query(
    `SELECT p.*,
            u.Name AS ResponsibleName,
            COUNT(pd.DocumentID) AS documentCount
     FROM Procedures p
     LEFT JOIN Users u ON p.ResponsibleID = u.UserID
     JOIN Subprocesses s ON p.SubprocessID = s.SubprocessID
     LEFT JOIN ProcedureDocuments pd ON pd.ProcedureID = p.ProcedureID
     WHERE s.DepartmentID = ?
     GROUP BY p.ProcedureID
     ORDER BY p.CreatedAt DESC`,
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
    let connection;
    try {
        const idNum = await this.validateId(id);
        connection = await getDb().getConnection();

        await connection.beginTransaction();

        // 1. Elimina las referencias en ProcedureDocuments
        await connection.query('DELETE FROM ProcedureDocuments WHERE ProcedureID = ?', [idNum]);
        
        // 2. Elimina el procedimiento principal
        await connection.query('DELETE FROM Procedures WHERE ProcedureID = ?', [idNum]);
        
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