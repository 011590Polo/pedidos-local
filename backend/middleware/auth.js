// Middleware para verificar si el usuario está autenticado
function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'No autorizado. Debe iniciar sesión.'
  });
}

// Middleware para verificar rol de administrador
function requireAdmin(req, res, next) {
  if (req.session && req.session.rol === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.'
  });
}

// Middleware para verificar rol de cliente
function requireCliente(req, res, next) {
  if (req.session && req.session.rol === 'cliente') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de cliente.'
  });
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireCliente
};

