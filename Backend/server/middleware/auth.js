const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado o formato incorrecto'
    });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
    if (err) {
      console.error('JWT Error:', err.name);
      const message = err.name === 'TokenExpiredError'
        ? 'Token expirado'
        : 'Token inválido';
      return res.status(403).json({
        success: false,
        message
      });
    }

    const role = decoded.rol || decoded.role;

    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      rol: decoded.rol || decoded.role,
      direccionId: decoded.direccionId
        ? Number(decoded.direccionId)
        : null,
      direccionNombre: decoded.direccionNombre,
      // LEEMOS DIRECTO del token:
      canManageProcedures: Boolean(decoded.canManageProcedures),
      isDepartmentHead: Boolean(decoded.isDepartmentHead)
    };

    next();
  });
}

module.exports = { authenticateJWT };