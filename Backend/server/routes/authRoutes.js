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
        u.UserID as id,
        u.Name as nombre,
        u.Email as email,
        u.PasswordHash,
        u.Role as rol,
        u.DepartmentID as direccionId,
        d.Name as direccionNombre,
        u.IsActive
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.Email = ?`,
      [email]
    );

    console.log('Usuario encontrado:', users[0]); // Log para depuración

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    
    if (!user.IsActive) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    console.log('Resultado de comparación de contraseña:', passwordMatch); // Log para depuración
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Eliminar campos sensibles antes de responder
    delete user.PasswordHash;
    delete user.IsActive;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        rol: user.rol,
        direccionId: user.direccionId,
        direccionNombre: user.direccionNombre
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