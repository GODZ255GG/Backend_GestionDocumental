const { getDb } = require('../config/database');

class Subprocess {
    static async validateId(id) {
        const idNum = Number(id);
        if (isNaN(idNum)) {
            throw new Error('ID must be a valid number');
        }
        return idNum;
    }

    static async create(name, description, departmentId) {
        const db = await getDb();
        const [result] = await db.query(
            `INSERT INTO Subprocesses (Name, Description, DepartmentID)
       VALUES (?, ?, ?)`,
            [name, description, departmentId]
        );
        return result.insertId;
    }

    static async getById(id) {
        try {
            const idNum = await this.validateId(id);
            const db = await getDb();
            const [rows] = await db.query(
                `SELECT s.*, d.Name AS DepartmentName 
         FROM Subprocesses s
         JOIN Departments d ON s.DepartmentID = d.DepartmentID
         WHERE s.SubprocessID = ?`,
                [idNum]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in getById:', error);
            throw error;
        }
    }

    static async getByDepartment(departmentId) {
        try {
            const idNum = await this.validateId(departmentId);
            const db = await getDb();
            const [rows] = await db.query(
                `SELECT s.*, 
                (SELECT COUNT(*) FROM Procedures WHERE SubprocessID = s.SubprocessID) AS procedureCount
                FROM Subprocesses s
                WHERE s.DepartmentID = ?`,
                [idNum]
            );
            return rows;
        } catch (error) {
            console.error('Error in getByDepartment:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const db = await getDb();
            const [rows] = await db.query(
                `SELECT s.*, d.Name AS DepartmentName,
                (SELECT COUNT(*) FROM Procedures WHERE SubprocessID = s.SubprocessID) AS procedureCount
         FROM Subprocesses s
         JOIN Departments d ON s.DepartmentID = d.DepartmentID`
            );
            return rows;
        } catch (error) {
            console.error('Error in getAll:', error);
            throw error;
        }
    }

    static async update(id, name, description, departmentId) {
        try {
            const idNum = await this.validateId(id);
            const db = await getDb();
            await db.query(
                `UPDATE Subprocesses
         SET 
           Name = ?, 
           Description = ?, 
           DepartmentID = ?
         WHERE SubprocessID = ?`,
                [name, description, departmentId, idNum]
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

        // 1. Obtener los procedimientos asociados al subproceso
        const [procedures] = await connection.query(
            'SELECT ProcedureID FROM Procedures WHERE SubprocessID = ?',
            [idNum]
        );

        // 2. Eliminar referencias en ProcedureDocuments para esos procedimientos
        if (procedures.length > 0) {
            const procedureIds = procedures.map(p => p.ProcedureID);
            await connection.query('DELETE FROM ProcedureDocuments WHERE ProcedureID IN (?)', [procedureIds]);
        }
        
        // 3. Eliminar los procedimientos asociados
        await connection.query('DELETE FROM Procedures WHERE SubprocessID = ?', [idNum]);
        
        // 4. Eliminar el subproceso
        await connection.query('DELETE FROM Subprocesses WHERE SubprocessID = ?', [idNum]);

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

    static async getProceduresBySubprocess(subprocessId) {
        try {
            const idNum = await this.validateId(subprocessId);
            const db = await getDb();
            const [rows] = await db.query(
                `SELECT p.*, u.Name AS ResponsibleName 
             FROM Procedures p
             JOIN Users u ON p.ResponsibleID = u.UserID
             WHERE p.SubprocessID = ?`,
                [idNum]
            );
            return rows;
        } catch (error) {
            console.error('Error in getProceduresBySubprocess:', error);
            throw error;
        }
    }
}

module.exports = Subprocess;