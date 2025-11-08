const express = require('express');
const router = express.Router();
const { getUsuarioByUsername } = require('../database');

// Ruta para login
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  console.log('🔐 Intento de login:', { usuario, tienePassword: !!password });

  if (!usuario || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    });
  }

  // Buscar usuario en la base de datos
  getUsuarioByUsername(usuario, (err, user) => {
    if (err) {
      console.error('❌ Error al buscar usuario:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al autenticar usuario'
      });
    }

    console.log('👤 Usuario encontrado:', user ? { id: user.id, usuario: user.usuario, rol: user.rol } : 'No encontrado');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Validar contraseña (simple - en producción usar bcrypt)
    console.log('🔑 Comparando contraseñas:', { recibida: password, almacenada: user.password, coinciden: user.password === password });
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Crear sesión
    req.session.usuario = user.usuario;
    req.session.rol = user.rol;
    req.session.userId = user.id;

    console.log('✅ Sesión creada:', { usuario: req.session.usuario, rol: req.session.rol, sessionId: req.sessionID });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: user.usuario,
        rol: user.rol,
        id: user.id
      }
    });
  });
});

// Ruta para logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al destruir sesión:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  });
});

// Ruta para verificar sesión actual
router.get('/session', (req, res) => {
  if (req.session && req.session.usuario) {
    res.json({
      success: true,
      data: {
        usuario: req.session.usuario,
        rol: req.session.rol,
        id: req.session.userId
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No hay sesión activa'
    });
  }
});

module.exports = router;

