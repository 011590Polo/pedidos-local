const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Soporte de subida de archivos (imágenes)
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const productsUploads = path.join(uploadsRoot, 'products');

// Asegurar carpetas de subida
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
if (!fs.existsSync(productsUploads)) fs.mkdirSync(productsUploads);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsUploads);
  },
  filename: function (req, file, cb) {
    const safeOriginal = (file.originalname || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + safeOriginal);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes permitidas'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /productos - Listar todos los productos
router.get('/', (req, res) => {
  getProductos((err, productos) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los productos'
      });
    }
    
    res.json({
      success: true,
      data: productos,
      count: productos.length
    });
  });
});

// GET /productos/:id - Obtener un producto específico
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  getProductoById(id, (err, producto) => {
    if (err) {
      console.error('Error al obtener producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el producto'
      });
    }
    
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      data: producto
    });
  });
});

// POST /productos - Crear un nuevo producto (solo admin)
router.post('/', requireAuth, requireAdmin, upload.single('imagen'), (req, res) => {
  const { nombre, precio, categoria, descripcion } = req.body;
  const imagenPath = req.file ? `/uploads/products/${req.file.filename}` : (req.body.imagen || null);
  
  // Validaciones
  const precioNum = parseFloat(precio);
  if (!nombre || precio === undefined || precio === null || precio === '') {
    return res.status(400).json({
      error: 'Datos requeridos faltantes',
      message: 'El nombre y precio son obligatorios'
    });
  }
  
  if (Number.isNaN(precioNum) || precioNum <= 0) {
    return res.status(400).json({
      error: 'Precio inválido',
      message: 'El precio debe ser un número mayor a 0'
    });
  }
  
  const producto = {
    nombre: nombre.trim(),
    precio: precioNum,
    categoria: categoria ? categoria.trim() : null,
    imagen: imagenPath,
    descripcion: descripcion ? descripcion.trim() : null
  };
  
  createProducto(producto, (err, productoId) => {
    if (err) {
      console.error('Error al crear producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el producto'
      });
    }
    const nuevoProducto = {
      id: productoId,
      ...producto
    };

    // Responder al cliente que creó el producto
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });

    // Emitir evento a todos los clientes conectados vía Socket.IO
    try {
      const io = req.app.get('io');
      if (io) io.emit('productoCreado', nuevoProducto);
    } catch (emitErr) {
      console.error('Error al emitir evento productoCreado:', emitErr);
    }
  });
});

// PUT /productos/:id - Actualizar un producto (solo admin)
router.put('/:id', requireAuth, requireAdmin, upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, descripcion } = req.body;
  const imagenPath = req.file ? `/uploads/products/${req.file.filename}` : (req.body.imagen || undefined);
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  // Validaciones
  if (precio !== undefined) {
    const precioNum = parseFloat(precio);
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({
        error: 'Precio inválido',
        message: 'El precio debe ser un número mayor a 0'
      });
    }
  }
  
  const producto = {};
  if (nombre !== undefined) producto.nombre = nombre.trim();
  if (precio !== undefined) producto.precio = parseFloat(precio);
  if (categoria !== undefined) producto.categoria = categoria ? categoria.trim() : null;
  if (imagenPath !== undefined) producto.imagen = imagenPath ? imagenPath.trim() : null;
  if (descripcion !== undefined) producto.descripcion = descripcion ? descripcion.trim() : null;
  
  if (Object.keys(producto).length === 0) {
    return res.status(400).json({
      error: 'Datos faltantes',
      message: 'Debe proporcionar al menos un campo para actualizar'
    });
  }
  
  updateProducto(id, producto, (err, changes) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el producto'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        id: parseInt(id),
        ...producto
      }
    });
  });
});

// DELETE /productos/:id - Eliminar un producto (solo admin)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número válido'
    });
  }
  
  deleteProducto(id, (err, changes) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el producto'
      });
    }
    
    if (changes === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'El producto solicitado no existe'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  });
});

module.exports = router;
