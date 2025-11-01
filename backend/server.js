const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Importar rutas
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const analyticsRoutes = require('./routes/analytics');
const categoriasRoutes = require('./routes/categorias');

// Importar configuración de base de datos
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear servidor HTTP para habilitar Socket.IO
const server = http.createServer(app);

// Configurar Socket.IO con CORS abierto (se controla abajo en Express)
const io = new Server(server, {
  cors: {
    origin:
    [
     'http://localhost:4200'
      ,        // para desarrollo local
      'http://192.168.100.75:4200'
      ,   // si accedes por IP local
      'https://robertogroup.org'
      ,    // dominio del túnel Cloudflare
      'https://*.trycloudflare.com'   // si usas túnel temporal
      ,'http://127.0.0.1:4200'
    ]
    ,
    methods: ['GET', 'POST'],
    credentials: true
  }
});


// Exponer io a través de app para que las rutas puedan emitir eventos
app.set('io', io);

// Eventos de conexión de Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Socket conectado:', socket.id);

  socket.on('joinSeguimiento', (codigo) => {
    try {
      const room = `seguimiento:${codigo}`;
      socket.join(room);
      console.log(`📡 Socket ${socket.id} se unió a la sala ${room}`);
    } catch (err) {
      console.error('Error al unir a sala de seguimiento:', err);
    }
  });

  socket.on('leaveSeguimiento', (codigo) => {
    try {
      const room = `seguimiento:${codigo}`;
      socket.leave(room);
      console.log(`🚪 Socket ${socket.id} salió de la sala ${room}`);
    } catch (err) {
      console.error('Error al salir de sala de seguimiento:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket desconectado:', socket.id);
  });
});

// ------------------------------------------------------
// 🧩 MIDDLEWARES GLOBALES
// ------------------------------------------------------

// Middleware para desactivar caché en desarrollo
// Detecta si es desarrollo: si no hay NODE_ENV o si es diferente de 'production'
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  console.log('🔧 Modo desarrollo: Caché desactivado');
  app.use((req, res, next) => {
    // Desactivar caché para todas las peticiones en desarrollo
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------
// 🧠 CONFIGURACIÓN CORS DINÁMICA
// ------------------------------------------------------
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Patrones permitidos
    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/192\.168\.100\.75(:\d+)?$/,
      /^https:\/\/.*\.trycloudflare\.com$/,
      /^https:\/\/robertogroup\.org$/   // 👈 AGREGA ESTA LÍNEA
    ];

    // Verificar si el origen cumple con alguno
    const allowed = allowedPatterns.some((pattern) => pattern.test(origin));
    if (allowed) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS bloqueado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ------------------------------------------------------

// 🚀 RUTAS PRINCIPALES (con prefijo /api para evitar conflicto con rutas del frontend)
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categorias', categoriasRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.json({
    message: '✅ API PedidosLocal funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      productos: 'api/productos',
      pedidos: 'api/pedidos',
      categorias: 'api/categorias'
    }
  });
});

// ------------------------------------------------------
// 🌐 SERVIR ANGULAR EN PRODUCCIÓN (SPA Fallback)
// ------------------------------------------------------
const path = require('path');
const angularDistPath = path.join(__dirname, '../frontend/pedidos-local/dist/pedidos-local');

// Servir archivos subidos (imágenes)
const uploadsPath = path.join(__dirname, 'uploads');

// Configurar opciones de static files con headers de no-cache en desarrollo
const staticOptions = isDevelopment ? {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
} : {};

app.use(express.static(angularDistPath, staticOptions));

// Servir archivos subidos (imágenes) - solo cache para imágenes en producción
const uploadsOptions = isDevelopment ? {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
} : { maxAge: '1y' }; // Cache imágenes por 1 año en producción
app.use('/uploads', express.static(uploadsPath, uploadsOptions));

// Catch-all: devolver index.html para rutas no API
app.get('*', (req, res) => {
  if (isDevelopment) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

// ------------------------------------------------------
// 🗄️ INICIALIZAR BASE DE DATOS Y SERVIDOR
// ------------------------------------------------------
initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Servidor PedidosLocal ejecutándose en puerto ${PORT}`);
      console.log(`🌐 Accesible localmente en: http://localhost:${PORT}`);
      console.log(`🔗 Cloudflare Tunnel disponible si está corriendo.`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar la base de datos:', err);
    process.exit(1);
  });

module.exports = app;
