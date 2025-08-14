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
        try {
            const idNum = await this.validateId(id);
            const db = await getDb();

            // Verificar si hay procedimientos asociados
            const [procedures] = await db.query(
                'SELECT COUNT(*) AS count FROM Procedures WHERE SubprocessID = ?',
                [idNum]
            );

            if (procedures[0].count > 0) {
                throw new Error('No se puede eliminar el subproceso porque tiene procedimientos asociados');
            }

            await db.query('DELETE FROM Subprocesses WHERE SubprocessID = ?', [idNum]);
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
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