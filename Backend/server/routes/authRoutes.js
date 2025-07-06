const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Intento de login con:', email); // Log para depuración

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const db = await getDb();
    const [users] = await db.query(
      `SELECT 
        u.UserID AS id,
        u.Name AS nombre,
        u.Email AS email,
        u.PasswordHash,
        GROUP_CONCAT(r.RoleName) AS rol,
        u.DepartmentID AS direccionId,
        d.Name AS direccionNombre,
        u.IsActive,
        MAX(r.CanDeleteDepartment) AS CanDeleteDepartment,
        MAX(r.CanDeleteSubprocess) AS CanDeleteSubprocess,
        MAX(r.CanManageProcedures) AS CanManageProcedures,
        CASE WHEN d.HeadID = u.UserID THEN TRUE ELSE FALSE END AS IsDepartmentHead
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
      LEFT JOIN Roles r ON ur.RoleID = r.RoleID
      WHERE u.Email = ? AND u.IsActive = TRUE
      GROUP BY u.UserID, u.Name, u.Email, u.PasswordHash, u.DepartmentID, d.Name, u.IsActive, d.HeadID`,
      [email]
    );

    console.log('Usuario encontrado:', users[0]); // Log para depuración

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    console.log('Resultado de comparación de contraseña:', passwordMatch); // Log para depuración

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Eliminar campos sensibles antes de responder
    delete user.PasswordHash;
    delete user.IsActive;

    // Generar JWT con información de roles y permisos
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        rol: user.rol ? user.rol.split(',') : [], // Convertir rol a array
        direccionId: user.direccionId,
        direccionNombre: user.direccionNombre,
        canDeleteDepartment: user.CanDeleteDepartment,
        canDeleteSubprocess: user.CanDeleteSubprocess,
        canManageProcedures: user.CanManageProcedures,
        isDepartmentHead: user.IsDepartmentHead
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;