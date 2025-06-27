const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });

    req.user = {
      userId: user.userId,
      email: user.email,
      rol: user.rol,
      direccionId: user.direccionId !== null ? Number(user.direccionId) : null,
      direccionNombre: user.direccionNombre
    };

    console.log('User after auth:', req.user); // Debug
    next();
  });
}

module.exports = { authenticateJWT};