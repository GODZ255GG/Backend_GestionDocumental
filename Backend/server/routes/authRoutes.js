const sql = require('mssql');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const result = await db.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT 
          u.UsuarioID,
          u.Nombre,
          u.Email,
          u.PasswordHash,
          u.Rol,
          u.DireccionID,
          d.Nombre AS DireccionNombre 
        FROM Usuarios u
        LEFT JOIN Direcciones d ON u.DireccionID = d.DireccionID
        WHERE u.Email = @email
      `);

    const user = result.recordset[0];
    console.log('User from DB:', user); // Depuración

    if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        userId: user.UsuarioID,
        email: user.Email,
        rol: user.Rol,
        direccionId: user.DireccionID || null,
        direccionNombre: user.DireccionNombre
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        nombre: user.Nombre,
        email: user.Email,
        rol: user.Rol,
        direccionId: user.DireccionID || null,
        direccionNombre: user.DireccionNombre
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;