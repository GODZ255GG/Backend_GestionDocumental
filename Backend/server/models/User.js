const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async getById(id) {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM Users WHERE UserID = ?', [id]);
    return rows[0];
  }

  static async getByEmail(email) {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM Users WHERE Email = ?', [email]);
    return rows[0];
  }

  static async getAll() {
    const db = await getDb();
    const [rows] = await db.query(
      'SELECT UserID, Name, Email, Role, DepartmentID, IsActive FROM Users'
    );
    return rows;
  }

  static async getDepartmentHeads() {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT UserID, Name 
       FROM Users 
       WHERE Role IN ('Director', 'Head', 'Administrator') 
       AND IsActive = TRUE
       ORDER BY Name`
    );
    return rows;
  }

  static async create(userData) {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [result] = await db.query(
      `INSERT INTO Users (Name, Email, PasswordHash, Role, DepartmentID)
       VALUES (?, ?, ?, ?, ?)`,
      [userData.name, userData.email, hashedPassword, userData.role, userData.departmentId || null]
    );

    return result.insertId;
  }

  static async update(id, data) {
    const db = await getDb();
    let query = 'UPDATE Users SET ';
    const params = [];
    const updates = [];

    if (data.name) {
      updates.push('Name = ?');
      params.push(data.name);
    }

    if (data.email) {
      updates.push('Email = ?');
      params.push(data.email);
    }

    if (data.role) {
      updates.push('Role = ?');
      params.push(data.role);
    }

    if (data.hasOwnProperty('departmentId')) {
      updates.push('DepartmentID = ?');
      params.push(data.departmentId || null);
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push('PasswordHash = ?');
      params.push(hashedPassword);
    }

    if (data.hasOwnProperty('isActive')) {
      updates.push('IsActive = ?');
      params.push(data.isActive);
    }

    query += updates.join(', ') + ' WHERE UserID = ?';
    params.push(id);

    await db.query(query, params);
  }

  static async deactivate(id) {
    const db = await getDb();
    await db.query('UPDATE Users SET IsActive = FALSE WHERE UserID = ?', [id]);
  }

  static async verifyCredentials(email, password) {
    const user = await this.getByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.PasswordHash);
    return isValid ? user : null;
  }

  static async getAll() {
    const db = await getDb();
    const [rows] = await db.query(
      'SELECT UserID, Name, Email, Role, DepartmentID, IsActive FROM Users WHERE IsActive = TRUE'
    );
    return rows;
  }
}

module.exports = User;