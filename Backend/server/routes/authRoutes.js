const express = require('express');


const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    const [user] = await db.query(
      `SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.PasswordHash,
        u.Role,
        u.DepartmentID,
        d.Name AS DepartmentName 
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.Email = ?`,
      [email]
    );

    if (!user){
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.UserID,
        email: user.Email,
        role: user.Role,
        departmentId: user.DepartmentID || null,
        departmentName: user.DepartmentName
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        name: user.Name,
        email: user.Email,
        role: user.Role,
        departmentId: user.DepartmentID || null,
        departmentName: user.DepartmentName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;