const { getDb } = require('../config/database');

// Map de status para normalizar (EN a EN)
const statusMap = {
    'created': 'Created',
    'in progress': 'In progress',
    'under review': 'Under review',
    'published': 'Published',
    'archived': 'Archived'
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

    static async create(title, description, subprocessId, responsibleId, createdBy, status) {
    // Usa 'Created' como valor por defecto si el estado no se proporciona
    const finalStatus = status || 'Created';

    // Verifica que el estado es válido
    const validStatuses = ['Created', 'In progress', 'Under review', 'Published', 'Archived'];
    if (!validStatuses.includes(finalStatus)) {
        throw new Error('Invalid status value');
    }

    const db = await getDb();
    const [result] = await db.query(
        `INSERT INTO Procedures 
        (Title, Description, SubprocessID, ResponsibleID, Status, CreatedBy) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, subprocessId, responsibleId, finalStatus, createdBy]
    );
    return result.insertId;
}

    static async getById(id) {
        const db = await getDb();
        const [rows] = await db.query(
            `SELECT p.*, u.Name AS ResponsibleName
             FROM Procedures p
             LEFT JOIN Users u ON p.ResponsibleID = u.UserID
             WHERE p.ProcedureID = ?`,
            [id]
        );
        return rows[0];
    }

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
        const normalizedStatus = statusMap[status.toLowerCase()] || 'In progress';
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
            [title, description, subprocessId, responsibleId, modifiedBy, normalizedStatus || status, idNum]
        );
    }

    static async delete(id) {
        let connection;
        try {
            const idNum = await this.validateId(id);
            connection = await getDb().getConnection();

            await connection.beginTransaction();

            await connection.query('DELETE FROM ProcedureDocuments WHERE ProcedureID = ?', [idNum]);
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
             LEFT JOIN Users u ON p.ResponsibleID = u.UserID
             WHERE p.ResponsibleID = ? OR p.CreatedBy = ? OR p.ModifiedBy = ?`,
            [userId, userId, userId]
        );
        return rows;
    }
}

module.exports = Procedure;